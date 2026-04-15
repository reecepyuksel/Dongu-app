import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Message, TradeStatus } from './entities/message.entity';
import { Item, ItemStatus } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { MessagesGateway } from './messages.gateway';
import { BlockedUser } from './entities/blocked-user.entity';
import { Report } from './entities/report.entity';
import { AppCacheService } from '../common/redis/app-cache.service';
import { EventMetricsService } from '../common/events/event-metrics.service';

@Injectable()
export class MessagesService {
  private readonly useEventBasedMetrics: boolean;

  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(BlockedUser)
    private blockedUsersRepository: Repository<BlockedUser>,
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private messagesGateway: MessagesGateway,
    private appCacheService: AppCacheService,
    private eventMetricsService: EventMetricsService,
    private configService: ConfigService,
  ) {
    this.useEventBasedMetrics =
      this.configService.get<string>('USE_EVENT_BASED_METRICS', 'false') ===
      'true';
  }

  private async invalidateMessageCaches(userIds: string[]) {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    if (!unique.length) return;

    await Promise.all(
      unique.map((userId) =>
        Promise.all([
          this.appCacheService.invalidateChatUnreadCount(userId),
          this.appCacheService.invalidateConversations(userId),
          this.appCacheService.invalidateTradeOffers(userId),
        ]),
      ),
    );
  }

  private async isBlockedBetween(userAId: string, userBId: string) {
    const blocked = await this.blockedUsersRepository.findOne({
      where: [
        { blocker: { id: userAId }, blocked: { id: userBId } },
        { blocker: { id: userBId }, blocked: { id: userAId } },
      ],
    });
    return Boolean(blocked);
  }

  async blockUser(blockerId: string, blockedId: string) {
    const existing = await this.blockedUsersRepository.findOne({
      where: { blocker: { id: blockerId }, blocked: { id: blockedId } },
      relations: ['blocker', 'blocked'],
    });

    if (existing) {
      return { success: true, alreadyBlocked: true };
    }

    const blocker = await this.usersRepository.findOne({
      where: { id: blockerId },
    });
    const blocked = await this.usersRepository.findOne({
      where: { id: blockedId },
    });
    if (!blocker || !blocked) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const record = this.blockedUsersRepository.create({ blocker, blocked });
    await this.blockedUsersRepository.save(record);
    await this.invalidateMessageCaches([blockerId, blockedId]);
    return { success: true };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    await this.blockedUsersRepository.delete({
      blocker: { id: blockerId },
      blocked: { id: blockedId },
    });
    await this.invalidateMessageCaches([blockerId, blockedId]);
    return { success: true };
  }

  async getBlockedUsers(blockerId: string) {
    const list = await this.blockedUsersRepository.find({
      where: { blocker: { id: blockerId } },
      relations: ['blocked'],
      order: { createdAt: 'DESC' },
    });

    return list.map((entry) => ({
      id: entry.id,
      blockedUser: this.sanitizeUserForClient(entry.blocked),
      createdAt: entry.createdAt,
    }));
  }

  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: string,
    details?: string,
  ) {
    if (!reason?.trim()) {
      throw new BadRequestException('Şikayet nedeni zorunludur.');
    }

    const reporter = await this.usersRepository.findOne({
      where: { id: reporterId },
    });
    const reportedUser = await this.usersRepository.findOne({
      where: { id: reportedUserId },
    });
    if (!reporter || !reportedUser) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const report = this.reportsRepository.create({
      reporter,
      reportedUser,
      reason: reason.trim(),
      details: details?.trim() || undefined,
    });

    await this.reportsRepository.save(report);
    return { success: true };
  }

  private sanitizeUserForClient(user?: User | null) {
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      trustScore: user.trustScore,
      isVerifiedAccount: Boolean(user.isEmailVerified && user.isPhoneVerified),
    };
  }

  private sanitizeMessageForClient(message: any) {
    if (!message) return message;
    return {
      ...message,
      sender: this.sanitizeUserForClient(message.sender),
      receiver: this.sanitizeUserForClient(message.receiver),
    };
  }

  async sendTradeOffer(
    targetItemId: string,
    senderId: string,
    offeredItemId?: string,
    manualOfferText?: string,
    tradeMediaUrls?: string[],
    tradeVideoUrl?: string,
  ): Promise<Message> {
    try {
      console.log('sendTradeOffer input:', {
        targetItemId,
        senderId,
        offeredItemId,
        hasManualOfferText: !!manualOfferText,
        tradeMediaUrls,
        tradeVideoUrl,
      });

      const targetItem = await this.itemsRepository.findOne({
        where: { id: targetItemId },
        relations: ['owner'],
      });
      if (!targetItem)
        throw new NotFoundException('İstenilen ilan bulunamadı.');
      if (targetItem.status !== ItemStatus.AVAILABLE)
        throw new BadRequestException('Bu ilan artık takasa açık değil.');

      if (await this.isBlockedBetween(senderId, targetItem.owner.id)) {
        throw new ForbiddenException('Bu kullanıcıya mesaj gönderemezsiniz');
      }

      let content = '';
      let finalOfferedItemId: string | null = null;
      let offeredItemImageUrl: string | null = null;

      if (offeredItemId) {
        const offeredItem = await this.itemsRepository.findOne({
          where: { id: offeredItemId },
          relations: ['owner'],
        });
        if (!offeredItem)
          throw new NotFoundException('Teklif edilen ilan bulunamadı.');
        if (offeredItem.owner.id !== senderId)
          throw new BadRequestException(
            'Sadece kendi ilanınızı teklif edebilirsiniz.',
          );
        if (offeredItem.status !== ItemStatus.AVAILABLE)
          throw new BadRequestException(
            'Teklif edilen ilan uygun durumda değil (AVAILABLE olmalı).',
          );
        content = `${offeredItem.title} ile takas teklifi`;
        finalOfferedItemId = offeredItem.id;
        offeredItemImageUrl =
          offeredItem.imageUrl ||
          (offeredItem.images && offeredItem.images[0]) ||
          null;
      } else if (manualOfferText) {
        content = manualOfferText;
        finalOfferedItemId = null;
      } else {
        throw new BadRequestException(
          'Lütfen bir eşya veya teklif metni girin.',
        );
      }

      const normalizedTradeMediaUrls = Array.isArray(tradeMediaUrls)
        ? tradeMediaUrls.filter(Boolean)
        : [];
      const finalTradeMediaUrls = normalizedTradeMediaUrls.length
        ? normalizedTradeMediaUrls
        : offeredItemImageUrl
          ? [offeredItemImageUrl]
          : [];
      const finalTradeMediaUrl =
        finalTradeMediaUrls[0] || offeredItemImageUrl || null;

      console.log('DB map edilecek alanlar:', {
        finalOfferedItemId,
        finalTradeMediaUrl,
        finalTradeMediaUrls,
        tradeVideoUrl: tradeVideoUrl || null,
      });

      const message = this.messagesRepository.create({
        item: { id: targetItem.id },
        sender: { id: senderId },
        receiver: { id: targetItem.owner.id },
        content,
        isRead: false,
        isTradeOffer: true,
        tradeOfferedItemId: finalOfferedItemId,
        tradeStatus: TradeStatus.PENDING,
        tradeMediaUrl: finalTradeMediaUrl,
        tradeMediaUrls: finalTradeMediaUrls.length ? finalTradeMediaUrls : null,
        tradeVideoUrl: tradeVideoUrl || null,
      });

      const savedMessage = await this.messagesRepository.save(message);

      console.log('DB kaydedilen trade offer:', {
        id: savedMessage.id,
        tradeMediaUrl: savedMessage.tradeMediaUrl,
        tradeMediaUrls: savedMessage.tradeMediaUrls,
        tradeVideoUrl: savedMessage.tradeVideoUrl,
        tradeOfferedItemId: savedMessage.tradeOfferedItemId,
      });

      const result = await this.messagesRepository.findOne({
        where: { id: savedMessage.id },
        relations: ['sender', 'receiver', 'item'],
      });

      if (result && result.receiver && result.sender) {
        this.messagesGateway.notifyNewMessage(
          result.receiver.id,
          this.sanitizeMessageForClient(result),
        );
        await this.eventMetricsService.recordMessageEvent({
          messageId: result.id,
          senderId: result.sender.id,
          receiverId: result.receiver.id,
          itemId: result.item?.id,
          eventType: 'trade_offer_sent',
          sourceId: result.id,
        });
        await this.notificationsService.createNotification(
          result.receiver.id,
          '🔄 Yeni Takas Teklifi',
          `${result.sender.fullName} sana bir takas teklifi gönderdi!`,
          NotificationType.INFO,
          `${result.item?.id}?chatWith=${result.sender.id}`,
        );
        await this.invalidateMessageCaches([
          result.sender.id,
          result.receiver.id,
        ]);
      }

      return this.sanitizeMessageForClient({
        ...(result as Message),
        photoUrl: result?.tradeMediaUrls?.[0] || result?.tradeMediaUrl || null,
        photos:
          result?.tradeMediaUrls ||
          (result?.tradeMediaUrl ? [result.tradeMediaUrl] : []),
      } as Message);
    } catch (error) {
      console.error('sendTradeOffer service error:', error);
      throw error;
    }
  }

  async respondToTradeOffer(
    messageId: string,
    userId: string,
    status: 'accepted' | 'rejected',
  ): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId, isDeleted: false },
      relations: ['sender', 'receiver', 'item'],
    });

    if (!message) throw new NotFoundException('Mesaj bulunamadı.');
    if (!message.isTradeOffer)
      throw new BadRequestException('Bu mesaj bir takas teklifi değil.');
    if (message.receiver.id !== userId)
      throw new BadRequestException('Bu teklife sadece alıcı yanıt verebilir.');
    if (!message.sender)
      throw new BadRequestException('Bu mesajın göndericisi bulunamadı.');
    if (message.tradeStatus !== TradeStatus.PENDING)
      throw new BadRequestException('Bu teklif zaten yanıtlanmış.');

    if (status === 'rejected') {
      message.tradeStatus = TradeStatus.REJECTED;
      await this.messagesRepository.save(message);

      await this.eventMetricsService.recordMessageEvent({
        messageId: message.id,
        senderId: message.sender?.id,
        receiverId: message.receiver?.id,
        itemId: message.item?.id,
        eventType: 'trade_offer_rejected',
        sourceId: message.id,
      });

      // System message for trade chat
      const rejectedSystem = this.messagesRepository.create({
        item: message.item ? { id: message.item.id } : null,
        sender: null,
        receiver: { id: message.sender!.id },
        content: '❌ Takas teklifi reddedildi.',
        isRead: false,
        isTradeOffer: false,
        tradeOfferId: message.id,
      });
      const savedRejected = await this.messagesRepository.save(rejectedSystem);
      const hydratedRejected = await this.messagesRepository.findOne({
        where: { id: savedRejected.id },
        relations: ['sender', 'receiver', 'item'],
      });
      if (hydratedRejected) {
        this.messagesGateway.notifyNewMessage(message.sender!.id, {
          ...hydratedRejected,
          tradeOfferId: message.id,
        });
        this.messagesGateway.notifyNewMessage(message.receiver.id, {
          ...hydratedRejected,
          tradeOfferId: message.id,
        });
      }

      await this.notificationsService.createNotification(
        message.sender.id,
        '❌ Takas Teklifi Reddedildi',
        `${message.receiver.fullName}, ${message.item?.title} için yaptığınız takas teklifini reddetti.`,
        NotificationType.INFO,
        message.item?.id,
      );
      await this.invalidateMessageCaches([
        message.sender.id,
        message.receiver.id,
      ]);
      return message;
    } else if (status === 'accepted') {
      if (!message.item)
        throw new BadRequestException('Mesaja ait hedef ilan bulunamadı.');

      const targetItem = await this.itemsRepository.findOne({
        where: { id: message.item.id },
        relations: ['owner'],
      });
      if (!targetItem) throw new NotFoundException('Hedef ilan bulunamadı.');
      if (targetItem.status !== ItemStatus.AVAILABLE) {
        message.tradeStatus = TradeStatus.REJECTED;
        await this.messagesRepository.save(message);
        throw new BadRequestException('İlan artık uygun değil.');
      }

      let offeredItem: Item | null = null;
      if (message.tradeOfferedItemId) {
        offeredItem = await this.itemsRepository.findOne({
          where: { id: message.tradeOfferedItemId },
          relations: ['owner'],
        });

        if (!offeredItem || offeredItem.status !== ItemStatus.AVAILABLE) {
          message.tradeStatus = TradeStatus.REJECTED;
          await this.messagesRepository.save(message);
          throw new BadRequestException(
            'Teklif edilen eşya artık uygun değil.',
          );
        }
      }

      // 1. Hedef eşyayı Takas Sürecine sok ve kazananı işaretle.
      targetItem.status = ItemStatus.IN_TRADE;
      targetItem.winner = message.sender;
      await this.itemsRepository.save(targetItem);

      // 2. Eğer fiziksel bir eşya sunulduysa onu da Takas Sürecine sok.
      if (offeredItem) {
        offeredItem.status = ItemStatus.IN_TRADE;
        offeredItem.winner = message.receiver;
        await this.itemsRepository.save(offeredItem);
      }

      message.tradeStatus = TradeStatus.ACCEPTED;
      await this.messagesRepository.save(message);

      await this.eventMetricsService.recordMessageEvent({
        messageId: message.id,
        senderId: message.sender?.id,
        receiverId: message.receiver?.id,
        itemId: message.item?.id,
        eventType: 'trade_offer_accepted',
        sourceId: message.id,
      });

      await this.notificationsService.createNotification(
        message.sender.id,
        '🎉 Takas Teklifi Kabul Edildi!',
        `${message.receiver.fullName}, ${targetItem.title} için yaptığınız teklifi onayladı! Teslimat detaylarını sohbet üzerinden netleştirebilirsiniz.`,
        NotificationType.SUCCESS,
        `${targetItem.id}?chatWith=${message.receiver.id}`,
      );

      // Create a system message in the trade chat
      const systemMessage = this.messagesRepository.create({
        item: { id: targetItem.id },
        sender: null,
        receiver: { id: message.sender.id },
        content:
          '🎉 Takas iki tarafça onaylandı. Teslimat detaylarını konuşabilirsiniz.',
        isRead: false,
        isTradeOffer: false,
        tradeOfferId: message.id,
      });
      const savedSystemMessage =
        await this.messagesRepository.save(systemMessage);

      const hydratedSystemMessage = await this.messagesRepository.findOne({
        where: { id: savedSystemMessage.id },
        relations: ['sender', 'receiver', 'item'],
      });

      if (hydratedSystemMessage) {
        this.messagesGateway.notifyNewMessage(message.sender.id, {
          ...hydratedSystemMessage,
          tradeOfferId: message.id,
        });
        this.messagesGateway.notifyNewMessage(message.receiver.id, {
          ...hydratedSystemMessage,
          tradeOfferId: message.id,
        });
      }

      await this.invalidateMessageCaches([
        message.sender.id,
        message.receiver.id,
      ]);
      await this.appCacheService.invalidateItemsList();

      return message;
    }

    return message;
  }

  // Mesaj gönder — herhangi bir kullanıcı ↔ ilan sahibi
  async sendMessage(
    itemId: string,
    senderId: string,
    content: string,
    targetUserId?: string,
    attachmentUrls?: string[],
    attachmentType?: string,
  ): Promise<Message> {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['owner', 'winner'],
    });

    if (!item) throw new NotFoundException('İlan bulunamadı.');

    let receiverId: string;

    if (targetUserId) {
      receiverId = targetUserId;
      if (item.owner.id === senderId && item.winner?.id !== targetUserId) {
      }
    } else {
      if (item.owner.id === senderId) {
        const lastReceived = await this.messagesRepository.findOne({
          where: {
            item: { id: itemId },
            receiver: { id: senderId },
            sender: Not(IsNull()),
          },
          relations: ['sender'],
          order: { createdAt: 'DESC' },
        });

        if (!lastReceived || !lastReceived.sender) {
          throw new BadRequestException(
            'Bu ilana henüz mesaj gelmediği için cevap veremezsiniz. Lütfen "Kazanana Ulaş" butonunu kullanın.',
          );
        }
        receiverId = lastReceived.sender.id;
      } else {
        receiverId = item.owner.id;
      }
    }

    if (await this.isBlockedBetween(senderId, receiverId)) {
      throw new ForbiddenException('Bu kullanıcıya mesaj gönderemezsiniz');
    }

    const normalizedAttachments = Array.isArray(attachmentUrls)
      ? attachmentUrls.filter(Boolean)
      : null;

    const message = this.messagesRepository.create({
      item: { id: itemId },
      sender: { id: senderId },
      receiver: { id: receiverId },
      content: content || '',
      isRead: false,
      attachmentUrls: normalizedAttachments?.length
        ? normalizedAttachments
        : null,
      attachmentType: normalizedAttachments?.length
        ? attachmentType || null
        : null,
    });

    const savedMessage = await this.messagesRepository.save(message);

    const result = await this.messagesRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'receiver', 'item'],
    });

    if (!result) {
      throw new Error('Message saved but could not be retrieved');
    }

    // Notify receiver of new message via WebSocket
    if (result.receiver) {
      this.messagesGateway.notifyNewMessage(
        result.receiver.id,
        this.sanitizeMessageForClient(result),
      );
    }

    // Notify receiver of new message
    if (result.receiver && result.sender) {
      await this.eventMetricsService.recordMessageEvent({
        messageId: result.id,
        senderId: result.sender.id,
        receiverId: result.receiver.id,
        itemId: result.item?.id,
        eventType: 'item_message_sent',
        sourceId: result.id,
      });
      const senderName = result.sender.fullName || 'Biri';
      await this.notificationsService.createNotification(
        result.receiver.id,
        '✉️ Yeni Mesaj',
        `${senderName} size bir mesaj gönderdi: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
        NotificationType.INFO,
        result.item ? result.item.id : undefined,
      );

      await this.invalidateMessageCaches([
        result.sender.id,
        result.receiver.id,
      ]);
    }

    return this.sanitizeMessageForClient(result);
  }

  // İlan bazlı mesaj geçmişi — konuşmada yer alan herkes görebilir
  async getConversation(itemId: string, userId: string): Promise<Message[]> {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['owner'],
    });

    if (!item) throw new NotFoundException('İlan bulunamadı.');

    if (await this.isBlockedBetween(userId, item.owner.id)) {
      throw new ForbiddenException('Bu kullanıcıya mesaj gönderemezsiniz');
    }

    // Kullanıcı bu ilana ait mesajlarda yer alıyorsa gösterebiliriz
    const messages = await this.messagesRepository.find({
      where: [
        {
          item: { id: itemId },
          sender: { id: userId },
          tradeOfferId: IsNull(),
          isDeleted: false,
        },
        {
          item: { id: itemId },
          receiver: { id: userId },
          tradeOfferId: IsNull(),
          isDeleted: false,
        },
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'ASC' },
    });

    return messages.map((msg) => this.sanitizeMessageForClient(msg));
  }

  // Kullanıcı ile olan tüm mesaj geçmişi (WhatsApp style)
  async getChatWithUser(
    currentUserId: string,
    otherUserId: string,
  ): Promise<Message[]> {
    if (await this.isBlockedBetween(currentUserId, otherUserId)) {
      throw new ForbiddenException('Bu kullanıcıya mesaj gönderemezsiniz');
    }

    const messages = await this.messagesRepository.find({
      where: [
        {
          sender: { id: currentUserId },
          receiver: { id: otherUserId },
          tradeOfferId: IsNull(),
          isDeleted: false,
        },
        {
          sender: { id: otherUserId },
          receiver: { id: currentUserId },
          tradeOfferId: IsNull(),
          isDeleted: false,
        },
      ],
      relations: ['sender', 'receiver', 'item'],
      order: { createdAt: 'ASC' },
    });

    return messages.map((msg) => this.sanitizeMessageForClient(msg));
  }

  // Direkt mesaj (İlan bağımsız)
  async sendDirectMessage(
    senderId: string,
    receiverId: string,
    content: string,
    attachmentUrls?: string[],
    attachmentType?: string,
  ): Promise<Message> {
    if (await this.isBlockedBetween(senderId, receiverId)) {
      throw new ForbiddenException('Bu kullanıcıya mesaj gönderemezsiniz');
    }

    const normalizedAttachments = Array.isArray(attachmentUrls)
      ? attachmentUrls.filter(Boolean)
      : null;

    const message = this.messagesRepository.create({
      item: null,
      sender: { id: senderId },
      receiver: { id: receiverId },
      content: content || '',
      isRead: false,
      attachmentUrls: normalizedAttachments?.length
        ? normalizedAttachments
        : null,
      attachmentType: normalizedAttachments?.length
        ? attachmentType || null
        : null,
    });

    const savedMessage = await this.messagesRepository.save(message);

    const result = await this.messagesRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'receiver'],
    });

    if (!result) throw new Error('Message saved but could not be retrieved');

    if (result.receiver) {
      this.messagesGateway.notifyNewMessage(
        result.receiver.id,
        this.sanitizeMessageForClient(result),
      );
    }

    if (result.sender && result.receiver) {
      await this.eventMetricsService.recordMessageEvent({
        messageId: result.id,
        senderId: result.sender.id,
        receiverId: result.receiver.id,
        eventType: 'direct_message_sent',
        sourceId: result.id,
      });
      await this.invalidateMessageCaches([
        result.sender.id,
        result.receiver.id,
      ]);
    }

    return this.sanitizeMessageForClient(result);
  }

  // Tüm aktif konuşmalar (Kişi bazlı gruplama)
  async getMyConversations(userId: string) {
    try {
      const cached = await this.appCacheService.getConversations(userId);
      if (cached) {
        return cached;
      }

      const blockRelations = await this.blockedUsersRepository.find({
        where: [{ blocker: { id: userId } }, { blocked: { id: userId } }],
        relations: ['blocker', 'blocked'],
      });

      const blockedUserIds = new Set(
        blockRelations.map((r) =>
          r.blocker.id === userId ? r.blocked.id : r.blocker.id,
        ),
      );

      const latestPerUser = await this.messagesRepository.query(
        `
        WITH scoped AS (
          SELECT
            msg.id,
            msg.content,
            msg."createdAt",
            msg."itemId",
            CASE
              WHEN msg."senderId" = $1 THEN msg."receiverId"
              ELSE msg."senderId"
            END AS "otherUserId"
          FROM message msg
          WHERE (msg."senderId" = $1 OR msg."receiverId" = $1)
            AND msg."isTradeOffer" = false
            AND msg."tradeOfferId" IS NULL
            AND msg."isDeleted" = false
            AND msg."senderId" IS NOT NULL
        )
        SELECT DISTINCT ON (s."otherUserId")
          s."otherUserId" AS "otherUserId",
          s.content AS "lastMessage",
          s."createdAt" AS "lastMessageAt",
          s."itemId" AS "itemId",
          i.title AS "itemTitle",
          i."imageUrl" AS "itemImageUrl",
          u."fullName" AS "otherUserFullName",
          u."avatarUrl" AS "otherUserAvatarUrl",
          u."trustScore" AS "otherUserTrustScore",
          u."isEmailVerified" AS "otherUserIsEmailVerified",
          u."isPhoneVerified" AS "otherUserIsPhoneVerified"
        FROM scoped s
        LEFT JOIN item i ON i.id = s."itemId"
        LEFT JOIN "user" u ON u.id = s."otherUserId"
        ORDER BY s."otherUserId", s."createdAt" DESC
        `,
        [userId],
      );

      const unreadRows = await this.messagesRepository.query(
        `
        SELECT
          CASE
            WHEN msg."senderId" = $1 THEN msg."receiverId"
            ELSE msg."senderId"
          END AS "otherUserId",
          COUNT(*) FILTER (
            WHERE msg."receiverId" = $1
              AND msg."isRead" = false
          ) AS "unreadCount"
        FROM message msg
        WHERE (msg."senderId" = $1 OR msg."receiverId" = $1)
          AND msg."isTradeOffer" = false
          AND msg."tradeOfferId" IS NULL
          AND msg."isDeleted" = false
          AND msg."senderId" IS NOT NULL
        GROUP BY 1
        `,
        [userId],
      );

      const unreadMap = new Map<string, number>(
        unreadRows.map((row: any) => [
          row.otherUserId,
          parseInt(row.unreadCount, 10) || 0,
        ]),
      );

      const rows = latestPerUser
        .filter(
          (row: any) => row.otherUserId && !blockedUserIds.has(row.otherUserId),
        )
        .map((row: any) => ({
          conversationId: row.otherUserId,
          itemId: row.itemId || 'direct',
          itemTitle: row.itemTitle || 'Direkt Mesaj',
          itemImageUrl: row.itemImageUrl || null,
          lastMessage: row.lastMessage,
          lastMessageAt: row.lastMessageAt,
          unreadCount: unreadMap.get(row.otherUserId) || 0,
          otherUser: {
            id: row.otherUserId,
            fullName: row.otherUserFullName,
            avatarUrl: row.otherUserAvatarUrl,
            trustScore: Number(row.otherUserTrustScore || 0),
            isVerifiedAccount: Boolean(
              row.otherUserIsEmailVerified && row.otherUserIsPhoneVerified,
            ),
          },
        }));

      await this.appCacheService.setConversations(userId, rows, 20);
      return rows;
    } catch (error) {
      console.error('Error in getMyConversations:', error);
      throw error;
    }
  }

  // Yeni: Sadece Takas Teklifleri
  async getMyTradeOffers(userId: string) {
    try {
      const cached = await this.appCacheService.getTradeOffers(userId);
      if (cached) {
        return cached;
      }

      const messages = await this.messagesRepository
        .createQueryBuilder('msg')
        .leftJoinAndSelect('msg.item', 'item')
        .leftJoinAndSelect('msg.sender', 'sender')
        .leftJoinAndSelect('msg.receiver', 'receiver')
        .where('(sender.id = :userId OR receiver.id = :userId)', { userId })
        .andWhere('msg.isTradeOffer = :isTradeOffer', { isTradeOffer: true })
        .andWhere('msg.isDeleted = :isDeleted', { isDeleted: false })
        .orderBy('msg.createdAt', 'DESC')
        .getMany();

      const offeredItemIds = Array.from(
        new Set(
          messages
            .map((msg) => msg.tradeOfferedItemId)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const offeredItems = offeredItemIds.length
        ? await this.itemsRepository.find({
            where: { id: In(offeredItemIds) },
            select: ['id', 'title', 'imageUrl', 'images'],
          })
        : [];

      const offeredItemsMap = new Map(
        offeredItems.map((item) => [
          item.id,
          {
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl || (item.images && item.images[0]) || null,
          },
        ]),
      );

      // Mümkün olan asıl Offered Item bilgilerini zenginleştirelim (Frontend'e kolaylık)
      const enhancedMessages = messages.map((msg) => {
        const offeredItemData = msg.tradeOfferedItemId
          ? offeredItemsMap.get(msg.tradeOfferedItemId) || null
          : null;

        return this.sanitizeMessageForClient({
          ...msg,
          photoUrl:
            msg.tradeMediaUrls?.[0] ||
            msg.tradeMediaUrl ||
            offeredItemData?.imageUrl ||
            null,
          photos:
            msg.tradeMediaUrls ||
            (msg.tradeMediaUrl ? [msg.tradeMediaUrl] : []),
          offeredItem: offeredItemData,
          otherUser: this.sanitizeUserForClient(
            msg.sender?.id === userId ? msg.receiver : msg.sender,
          ),
        });
      });

      console.log(
        'getMyTradeOffers photoUrl kontrolü:',
        enhancedMessages.map((m) => ({
          id: m.id,
          tradeMediaUrl: m.tradeMediaUrl,
          photoUrl: m.photoUrl,
        })),
      );

      await this.appCacheService.setTradeOffers(userId, enhancedMessages, 20);
      return enhancedMessages;
    } catch (error) {
      console.error('Error in getMyTradeOffers:', error);
      throw error;
    }
  }

  // Tek takas teklifi getir
  async getTradeOffer(tradeOfferId: string, userId: string): Promise<any> {
    const offer = await this.messagesRepository.findOne({
      where: { id: tradeOfferId, isTradeOffer: true, isDeleted: false },
      relations: ['sender', 'receiver', 'item'],
    });
    if (!offer) throw new NotFoundException('Takas teklifi bulunamadı.');
    if (offer.sender?.id !== userId && offer.receiver?.id !== userId) {
      throw new ForbiddenException('Bu takasa erişim izniniz yok.');
    }

    let offeredItemData: any = null;
    if (offer.tradeOfferedItemId) {
      const offeredItem = await this.itemsRepository.findOne({
        where: { id: offer.tradeOfferedItemId },
        relations: ['owner'],
      });
      if (offeredItem) {
        offeredItemData = {
          id: offeredItem.id,
          title: offeredItem.title,
          imageUrl:
            offeredItem.imageUrl ||
            (offeredItem.images && offeredItem.images[0]) ||
            null,
        };
      }
    }

    return this.sanitizeMessageForClient({
      ...offer,
      photoUrl:
        offer.tradeMediaUrls?.[0] ||
        offer.tradeMediaUrl ||
        offeredItemData?.imageUrl ||
        null,
      photos:
        offer.tradeMediaUrls ||
        (offer.tradeMediaUrl ? [offer.tradeMediaUrl] : []),
      offeredItem: offeredItemData,
    });
  }

  // Takasa özel mesajları getir
  async getTradeMessages(
    tradeOfferId: string,
    userId: string,
  ): Promise<Message[]> {
    const offer = await this.messagesRepository.findOne({
      where: { id: tradeOfferId, isTradeOffer: true },
      relations: ['sender', 'receiver'],
    });
    if (!offer) throw new NotFoundException('Takas teklifi bulunamadı.');
    if (offer.sender?.id !== userId && offer.receiver?.id !== userId) {
      throw new ForbiddenException('Bu takasa erişim izniniz yok.');
    }

    const messages = await this.messagesRepository.find({
      where: { tradeOfferId, isDeleted: false },
      relations: ['sender', 'receiver', 'item'],
      order: { createdAt: 'ASC' },
    });

    return messages.map((msg) => this.sanitizeMessageForClient(msg));
  }

  // Tek mesajı sil (soft-delete)
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'receiver'],
    });
    if (!message) throw new NotFoundException('Mesaj bulunamadı.');
    if (message.sender?.id !== userId)
      throw new ForbiddenException(
        'Sadece kendi mesajlarınızı silebilirsiniz.',
      );

    await this.messagesRepository.update(messageId, { isDeleted: true });

    // Karşı tarafa anlık bildir (ekrandan kaldırsın)
    const otherId = message.receiver?.id;
    if (otherId) {
      this.messagesGateway.notifyDeleteMessage(otherId, messageId);
    }

    await this.invalidateMessageCaches([userId, otherId || '']);
  }

  // Takasa özel mesaj gönder
  async sendTradeMessage(
    tradeOfferId: string,
    senderId: string,
    content: string,
    attachmentUrls?: string[],
    attachmentType?: string,
  ): Promise<Message> {
    const offer = await this.messagesRepository.findOne({
      where: { id: tradeOfferId, isTradeOffer: true },
      relations: ['sender', 'receiver', 'item'],
    });
    if (!offer) throw new NotFoundException('Takas teklifi bulunamadı.');
    if (offer.sender?.id !== senderId && offer.receiver?.id !== senderId) {
      throw new ForbiddenException('Bu takasa erişim izniniz yok.');
    }

    const receiverId =
      offer.sender?.id === senderId ? offer.receiver?.id : offer.sender?.id;

    if (!receiverId) throw new BadRequestException('Alıcı bulunamadı.');

    if (await this.isBlockedBetween(senderId, receiverId)) {
      throw new ForbiddenException('Bu kullanıcıya mesaj gönderemezsiniz');
    }

    const normalizedAttachments = Array.isArray(attachmentUrls)
      ? attachmentUrls.filter(Boolean)
      : null;

    const message = this.messagesRepository.create({
      item: offer.item ? { id: offer.item.id } : null,
      sender: { id: senderId },
      receiver: { id: receiverId },
      content: content || '',
      isRead: false,
      isTradeOffer: false,
      tradeOfferId,
      attachmentUrls: normalizedAttachments?.length
        ? normalizedAttachments
        : null,
      attachmentType: normalizedAttachments?.length
        ? attachmentType || null
        : null,
    });

    const saved = await this.messagesRepository.save(message);
    const result = await this.messagesRepository.findOne({
      where: { id: saved.id },
      relations: ['sender', 'receiver', 'item'],
    });

    if (result?.receiver) {
      this.messagesGateway.notifyNewMessage(result.receiver.id, {
        ...this.sanitizeMessageForClient(result),
        tradeOfferId,
      });
    }

    if (result?.sender && result?.receiver) {
      await this.eventMetricsService.recordMessageEvent({
        messageId: result.id,
        senderId: result.sender.id,
        receiverId: result.receiver.id,
        itemId: result.item?.id,
        eventType: 'trade_message_sent',
        sourceId: result.id,
      });
      await this.invalidateMessageCaches([
        result.sender.id,
        result.receiver.id,
      ]);
    }

    return this.sanitizeMessageForClient(result!);
  }

  // Yeni: Toplam okunmamış mesaj sayısı (sistem mesajlarını hariç tut)
  async getUnreadTotal(userId: string): Promise<{ totalUnread: number }> {
    const cached = await this.appCacheService.getChatUnreadCount(userId);
    if (cached) {
      return cached;
    }

    const count = await this.messagesRepository.count({
      where: {
        receiver: { id: userId },
        sender: Not(IsNull()),
        isTradeOffer: false,
        tradeOfferId: IsNull(),
        isDeleted: false,
        isRead: false,
      },
    });

    await this.appCacheService.setChatUnreadCount(userId, count, 20);
    return { totalUnread: count };
  }

  // Yeni: Bir konuşmayı okundu olarak işaretle
  async markAsRead(itemId: string, userId: string): Promise<void> {
    // Bu ilana ait ve alıcının ben olduğu tüm mesajları güncelle
    await this.messagesRepository.update(
      {
        item: { id: itemId },
        receiver: { id: userId },
        isRead: false,
        tradeOfferId: IsNull(),
      },
      { isRead: true },
    );

    await this.invalidateMessageCaches([userId]);
  }

  // Kişi bazlı konuşmayı okundu olarak işaretle
  async markAsReadByChat(userId: string, otherUserId: string): Promise<void> {
    await this.messagesRepository.update(
      {
        sender: { id: otherUserId },
        receiver: { id: userId },
        isRead: false,
        tradeOfferId: IsNull(),
      },
      { isRead: true },
    );

    await this.invalidateMessageCaches([userId, otherUserId]);
  }

  // Konuşmayı sil (kullanıcının bu ilandaki tüm mesajlarını siler)
  async deleteConversation(
    itemId: string,
    userId: string,
  ): Promise<{ deleted: number }> {
    // Karşı tarafı bulmak için silmeden önce bir mesaja bak
    const sample = await this.messagesRepository.findOne({
      where: [
        { item: { id: itemId }, sender: { id: userId } },
        { item: { id: itemId }, receiver: { id: userId } },
      ],
      relations: ['sender', 'receiver'],
    });
    const otherUserId =
      sample?.sender?.id === userId ? sample?.receiver?.id : sample?.sender?.id;

    const result = await this.messagesRepository
      .createQueryBuilder()
      .delete()
      .from(Message)
      .where(
        '"itemId" = :itemId AND "tradeOfferId" IS NULL AND ("senderId" = :userId OR "receiverId" = :userId)',
        { itemId, userId },
      )
      .execute();

    // Karşı tarafı gerçek zamanlı bildir
    if (otherUserId) {
      this.messagesGateway.notifyConversationDeleted(otherUserId, userId);
    }

    await this.invalidateMessageCaches([userId, otherUserId || '']);

    return { deleted: result.affected || 0 };
  }

  // Kişi bazlı konuşmayı sil
  async deleteChatConversation(
    userId: string,
    otherUserId: string,
  ): Promise<{ deleted: number }> {
    const result = await this.messagesRepository
      .createQueryBuilder()
      .delete()
      .from(Message)
      .where(
        '"tradeOfferId" IS NULL AND (("senderId" = :userId AND "receiverId" = :otherUserId) OR ("senderId" = :otherUserId AND "receiverId" = :userId))',
        { userId, otherUserId },
      )
      .execute();

    // Karşı tarafı gerçek zamanlı bildir
    this.messagesGateway.notifyConversationDeleted(otherUserId, userId);

    await this.invalidateMessageCaches([userId, otherUserId]);

    return { deleted: result.affected || 0 };
  }

  // Herkese Açık Takas Teklifleri
  async getPublicTradeOffers(itemId: string): Promise<any[]> {
    const offers = await this.messagesRepository.find({
      where: {
        item: { id: itemId },
        isTradeOffer: true,
        isDeleted: false,
      },
      relations: ['sender'], // Only include sender details for public view
      order: { createdAt: 'DESC' },
    });

    const offeredItemIds = offers
      .map((offer) => offer.tradeOfferedItemId)
      .filter((id) => id); // Sadece ID'si olanları al (manual metin tekliflerini atla)

    let itemsMap = new Map<string, Partial<Item>>();

    if (offeredItemIds.length > 0) {
      const items = await this.itemsRepository.find({
        where: { id: In(offeredItemIds) },
        select: ['id', 'title', 'imageUrl', 'images'], // Sadece gizlilik açısından sıkıntısız verileri çek
      });

      items.forEach((item) => itemsMap.set(item.id, item));
    }

    // Orijinal teklif öğelerine `offeredItem` bilgisini dışarı sızmayacak/temizlenmiş şekliyle iliştir
    return offers.map((offer) => {
      let offeredItem: Partial<Item> | null = null;
      if (offer.tradeOfferedItemId && itemsMap.has(offer.tradeOfferedItemId)) {
        offeredItem = itemsMap.get(offer.tradeOfferedItemId) || null;
      }
      return {
        ...offer,
        sender: this.sanitizeUserForClient(offer.sender),
        photoUrl:
          offer.tradeMediaUrls?.[0] ||
          offer.tradeMediaUrl ||
          (offeredItem?.images && offeredItem.images[0]) ||
          offeredItem?.imageUrl ||
          null,
        photos:
          offer.tradeMediaUrls ||
          (offer.tradeMediaUrl ? [offer.tradeMediaUrl] : []),
        offeredItem, // Eğer fiziksel eşya teklif edildiyse bu dolacak, değilse null
      };
    });
  }

  async getMetricsSummary() {
    if (this.useEventBasedMetrics) {
      const [summaryRows, topSenders, topReceivers] = await Promise.all([
        this.messagesRepository.query(`
          SELECT
            COUNT(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS "events24h",
            COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days') AS "events7d",
            COUNT(*) FILTER (
              WHERE event_type = 'trade_offer_sent'
                AND created_at >= now() - interval '24 hours'
            ) AS "tradeOffers24h",
            COUNT(*) FILTER (
              WHERE event_type IN ('item_message_sent', 'direct_message_sent', 'trade_message_sent')
                AND created_at >= now() - interval '24 hours'
            ) AS "messages24h"
          FROM message_event
        `),
        this.messagesRepository.query(`
          SELECT sender_id AS "userId", COUNT(*)::int AS total
          FROM message_event
          WHERE sender_id IS NOT NULL
            AND created_at >= now() - interval '24 hours'
          GROUP BY sender_id
          ORDER BY total DESC
          LIMIT 5
        `),
        this.messagesRepository.query(`
          SELECT receiver_id AS "userId", COUNT(*)::int AS total
          FROM message_event
          WHERE receiver_id IS NOT NULL
            AND created_at >= now() - interval '24 hours'
          GROUP BY receiver_id
          ORDER BY total DESC
          LIMIT 5
        `),
      ]);

      return {
        source: 'message_event',
        summary: {
          events24h: Number(summaryRows[0]?.events24h || 0),
          events7d: Number(summaryRows[0]?.events7d || 0),
          tradeOffers24h: Number(summaryRows[0]?.tradeOffers24h || 0),
          messages24h: Number(summaryRows[0]?.messages24h || 0),
        },
        topSenders,
        topReceivers,
      };
    }

    const [
      messageCount24h,
      messageCount7d,
      tradeOffers24h,
      topSenders,
      topReceivers,
    ] = await Promise.all([
      this.messagesRepository.query(`
          SELECT COUNT(*)::int AS total
          FROM message
          WHERE "createdAt" >= now() - interval '24 hours'
            AND "isDeleted" = false
        `),
      this.messagesRepository.query(`
          SELECT COUNT(*)::int AS total
          FROM message
          WHERE "createdAt" >= now() - interval '7 days'
            AND "isDeleted" = false
        `),
      this.messagesRepository.query(`
          SELECT COUNT(*)::int AS total
          FROM message
          WHERE "createdAt" >= now() - interval '24 hours'
            AND "isDeleted" = false
            AND "isTradeOffer" = true
        `),
      this.messagesRepository.query(`
          SELECT "senderId" AS "userId", COUNT(*)::int AS total
          FROM message
          WHERE "senderId" IS NOT NULL
            AND "createdAt" >= now() - interval '24 hours'
            AND "isDeleted" = false
          GROUP BY "senderId"
          ORDER BY total DESC
          LIMIT 5
        `),
      this.messagesRepository.query(`
          SELECT "receiverId" AS "userId", COUNT(*)::int AS total
          FROM message
          WHERE "receiverId" IS NOT NULL
            AND "createdAt" >= now() - interval '24 hours'
            AND "isDeleted" = false
          GROUP BY "receiverId"
          ORDER BY total DESC
          LIMIT 5
        `),
    ]);

    return {
      source: 'message',
      summary: {
        events24h: Number(messageCount24h[0]?.total || 0),
        events7d: Number(messageCount7d[0]?.total || 0),
        tradeOffers24h: Number(tradeOffers24h[0]?.total || 0),
        messages24h: Number(messageCount24h[0]?.total || 0),
      },
      topSenders,
      topReceivers,
    };
  }
}

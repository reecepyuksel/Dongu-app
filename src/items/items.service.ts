import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Item,
  ItemStatus,
  DeliveryStatus,
  ShareType,
  ItemPostType,
  ItemPhotoAsset,
} from './entities/item.entity';
import { CreateItemDto } from './dto/create-item.dto';
import { FindItemsQueryDto, PaginatedResult } from './dto/find-items-query.dto';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';
import { Message } from '../messages/entities/message.entity';
import { Community } from '../communities/entities/community.entity';
import { CommunityMember } from '../communities/entities/community-member.entity';
import { AppCacheService } from '../common/redis/app-cache.service';
import { EventMetricsService } from '../common/events/event-metrics.service';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Community)
    private communitiesRepository: Repository<Community>,
    @InjectRepository(CommunityMember)
    private communityMembersRepository: Repository<CommunityMember>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
    private appCacheService: AppCacheService,
    private eventMetricsService: EventMetricsService,
  ) {}

  private sanitizePublicUser(user?: User | null) {
    if (!user) return null;
    return {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      karmaPoint: user.karmaPoint,
      badges: user.badges,
      trustScore: user.trustScore,
      isVerifiedAccount: Boolean(user.isEmailVerified && user.isPhoneVerified),
      city: user.city,
      district: user.district,
    };
  }

  private normalizePhotoGallery(item: Item): ItemPhotoAsset[] {
    const rawGallery = Array.isArray(item.photoGallery)
      ? item.photoGallery
      : [];

    if (rawGallery.length > 0) {
      return rawGallery
        .filter(
          (photo) => typeof photo?.url === 'string' && photo.url.length > 0,
        )
        .map((photo) => ({
          url: photo.url,
          width:
            typeof photo.width === 'number' && photo.width > 0
              ? photo.width
              : null,
          height:
            typeof photo.height === 'number' && photo.height > 0
              ? photo.height
              : null,
          photoAspectRatio:
            typeof photo.photoAspectRatio === 'number' &&
            photo.photoAspectRatio > 0
              ? photo.photoAspectRatio
              : null,
        }));
    }

    const legacyUrls = Array.isArray(item.images)
      ? item.images.filter((url): url is string => Boolean(url))
      : [];
    const fallbackUrls = legacyUrls.length
      ? legacyUrls
      : item.imageUrl
        ? [item.imageUrl]
        : [];

    return fallbackUrls.map((url) => ({
      url,
      width: null,
      height: null,
      photoAspectRatio: null,
    }));
  }

  private sanitizePublicItem(item: Item) {
    const raw = item as any;
    const photoGallery = this.normalizePhotoGallery(item);

    return {
      ...raw,
      images: photoGallery.map((photo) => photo.url),
      imageUrl: photoGallery[0]?.url || raw.imageUrl || null,
      photoGallery,
      owner: this.sanitizePublicUser(raw.owner),
      winner: this.sanitizePublicUser(raw.winner),
      community: raw.community
        ? {
            id: raw.community.id,
            name: raw.community.name,
            image: raw.community.image,
            type: raw.community.type,
            isVerified: raw.community.is_verified,
          }
        : null,
    };
  }

  async create(
    createItemDto: CreateItemDto,
    userId: string,
    photoGallery: ItemPhotoAsset[] = [],
  ): Promise<Item> {
    let community: Community | null = null;

    if (createItemDto.communityId) {
      community = await this.communitiesRepository.findOne({
        where: { id: createItemDto.communityId },
      });

      if (!community) {
        throw new NotFoundException('Seçilen topluluk bulunamadı.');
      }

      const membership = await this.communityMembersRepository.findOne({
        where: {
          community: { id: createItemDto.communityId },
          user: { id: userId },
        },
      });

      if (!membership) {
        throw new ForbiddenException(
          'Yalnızca üyesi olduğunuz topluluklarda paylaşım yapabilirsiniz.',
        );
      }
    }

    let methods: string[] = [];
    const rawMethods = createItemDto.deliveryMethods;

    if (rawMethods) {
      if (Array.isArray(rawMethods)) {
        methods = rawMethods;
      } else if (typeof rawMethods === 'string') {
        try {
          methods = JSON.parse(rawMethods);
          if (!Array.isArray(methods)) methods = [rawMethods];
        } catch {
          methods = rawMethods.split(',').map((m) => m.trim());
        }
      }
    }

    const methodAliasMap: Record<string, string> = {
      shipping_buyer: 'shipping',
      shipping_seller: 'shipping',
    };
    const allowedMethods = new Set(['pickup', 'shipping', 'mutual_agreement']);
    const normalizedMethods = methods
      .map((method) => methodAliasMap[method] || method)
      .filter((method) => allowedMethods.has(method));
    const selectedDeliveryMethod =
      normalizedMethods.length > 0 ? normalizedMethods[0] : 'mutual_agreement';

    const uploadedImageUrls = photoGallery.map((photo) => photo.url);

    const item = this.itemsRepository.create({
      title: createItemDto.title,
      description: createItemDto.description,
      city: createItemDto.city,
      district: createItemDto.district,
      neighborhood: createItemDto.neighborhood,
      category: createItemDto.category || 'Diğer',
      selectionType: createItemDto.selectionType,
      shareType: createItemDto.shareType,
      postType: createItemDto.postType || ItemPostType.OFFERING,
      tradePreferences: createItemDto.tradePreferences,
      deliveryMethods: [selectedDeliveryMethod],
      imageUrl:
        uploadedImageUrls.length > 0
          ? uploadedImageUrls[0]
          : createItemDto.postType === ItemPostType.REQUESTING
            ? null
            : 'https://via.placeholder.com/600x400?text=Resim+Yok',
      images: uploadedImageUrls,
      photoGallery,
      status: ItemStatus.AVAILABLE,
      owner: { id: userId } as User,
      community: community ?? undefined,
      drawDate: createItemDto.drawDate
        ? new Date(createItemDto.drawDate)
        : undefined,
      expiresAt:
        createItemDto.postType === ItemPostType.REQUESTING
          ? new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          : undefined,
    } as Partial<Item>) as Item;
    const savedItem = await this.itemsRepository.save(item);

    const scopeCommunityId = community?.id ?? null;

    // --- Smart Matchmaking Logic Start ---
    if (savedItem.postType === ItemPostType.REQUESTING) {
      // Find matching OFFERING in the same visibility scope
      const matchQuery = this.itemsRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.owner', 'owner')
        .leftJoinAndSelect('item.community', 'community')
        .where('item.postType = :postType', {
          postType: ItemPostType.OFFERING,
        })
        .andWhere('item.category = :category', { category: savedItem.category })
        .andWhere('item.status = :status', { status: ItemStatus.AVAILABLE })
        .orderBy('item.createdAt', 'DESC');

      if (scopeCommunityId) {
        matchQuery.andWhere('community.id = :communityId', {
          communityId: scopeCommunityId,
        });
      } else {
        matchQuery.andWhere('community.id IS NULL');
      }

      const match = await matchQuery.getOne();
      if (match && match.owner && match.owner.id !== userId) {
        await this.notificationsService.createNotification(
          userId,
          '🔔 Aradığın ürün bulundu!',
          `Platformda '${match.title}' adlı bir ilan mevcut. Hemen incelemek ister misin?`,
          NotificationType.INFO,
          match.id,
        );
        await this.notificationsService.createNotification(
          match.owner.id,
          '🔔 Senin eşyanı arayan biri var!',
          `Biri '${savedItem.category}' kategorisinde eşya arıyor. Belki eşyanı ona verebilirsin!`,
          NotificationType.INFO,
          savedItem.id,
        );
      }
    } else if (savedItem.postType === ItemPostType.OFFERING) {
      // Find matching REQUESTING in the same visibility scope
      const matchQuery = this.itemsRepository
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.owner', 'owner')
        .leftJoinAndSelect('item.community', 'community')
        .where('item.postType = :postType', {
          postType: ItemPostType.REQUESTING,
        })
        .andWhere('item.category = :category', { category: savedItem.category })
        .andWhere('item.status = :status', { status: ItemStatus.AVAILABLE })
        .orderBy('item.createdAt', 'DESC');

      if (scopeCommunityId) {
        matchQuery.andWhere('community.id = :communityId', {
          communityId: scopeCommunityId,
        });
      } else {
        matchQuery.andWhere('community.id IS NULL');
      }

      const match = await matchQuery.getOne();
      if (match && match.owner && match.owner.id !== userId) {
        await this.notificationsService.createNotification(
          match.owner.id,
          '🔔 Aradığın ürün bulundu!',
          `Platformda '${savedItem.title}' eklendi. Aradığın ürün olabilir, hemen incelemek ister misin?`,
          NotificationType.INFO,
          savedItem.id,
        );
      }
    }
    // --- Smart Matchmaking Logic End ---

    // Atomic karma increment — no race condition
    await this.dataSource
      .createQueryBuilder()
      .update(User)
      .set({ karmaPoint: () => '"karmaPoint" + 50' })
      .where('id = :id', { id: userId })
      .execute();

    await this.eventMetricsService.recordKarmaLedger({
      userId,
      delta: 50,
      reason: 'item_created',
      sourceId: savedItem.id,
    });

    await this.appCacheService.invalidateItemsList();

    return savedItem;
  }

  async findAll(
    query: FindItemsQueryDto,
    userId?: string,
  ): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      city,
      district,
      category,
      shareType,
      postType,
    } = query;
    const cacheKey = this.appCacheService.makeItemsListKey(
      {
        city: city || null,
        district: district || null,
        category: category || null,
        shareType: shareType || null,
        postType: postType || null,
      },
      page,
      limit,
    );

    const cached =
      await this.appCacheService.getItemsList<PaginatedResult<any>>(cacheKey);
    if (cached) {
      return cached;
    }

    const qb = this.itemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.owner', 'owner')
      .leftJoinAndSelect('item.community', 'community')
      .where('item.status = :status', { status: ItemStatus.AVAILABLE })
      .andWhere('community.id IS NULL');

    if (postType && postType !== 'all') {
      qb.andWhere('item.postType = :postType', { postType });
    }
    if (shareType && shareType !== 'all') {
      qb.andWhere('item.shareType = :shareType', { shareType });
    }
    if (city) {
      const cities = city
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (cities.length) qb.andWhere('item.city IN (:...cities)', { cities });
    }
    if (district) {
      const districts = district
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
      if (districts.length)
        qb.andWhere('item.district IN (:...districts)', { districts });
    }
    if (category) {
      const categories = category
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);
      if (categories.length)
        qb.andWhere('item.category IN (:...categories)', { categories });
    }

    const [rawItems, total] = await qb
      .orderBy('item.createdAt', 'DESC')
      .loadRelationCountAndMap('item.applicationsCount', 'item.applications')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const payload = {
      data: rawItems.map((item) => this.sanitizePublicItem(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.appCacheService.setItemsList(cacheKey, payload, 30);
    return payload;
  }

  async findOne(id: string, userId?: string): Promise<any> {
    const item = await this.itemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.owner', 'owner')
      .leftJoinAndSelect('item.winner', 'winner')
      .leftJoinAndSelect('item.community', 'community')
      .loadRelationCountAndMap('item.applicationsCount', 'item.applications')
      .where('item.id = :id', { id })
      .getOne();

    if (!item) {
      throw new NotFoundException(`Bu eşya kaydına (${id}) ulaşılamadı.`);
    }

    if (item.community) {
      if (!userId) {
        throw new ForbiddenException(
          'Bu ilan yalnızca ilgili topluluğun üyelerine açıktır.',
        );
      }

      const membership = await this.communityMembersRepository.findOne({
        where: {
          community: { id: item.community.id },
          user: { id: userId },
        },
      });

      if (!membership) {
        throw new ForbiddenException(
          'Bu ilan yalnızca ilgili topluluğun üyelerine açıktır.',
        );
      }
    }

    await this.eventMetricsService.recordItemViewEvent({
      itemId: item.id,
      viewerId: userId || null,
      source: item.community ? 'community' : 'public',
      sourceId: `${item.id}:${userId || 'anon'}`,
    });

    return this.sanitizePublicItem(item);
  }

  // Teslimat durumu güncelle
  async updateDeliveryStatus(
    itemId: string,
    status: DeliveryStatus,
    userId: string,
  ): Promise<Item> {
    const item = await this.itemsRepository.findOne({
      where: { id: itemId },
      relations: ['owner', 'winner'],
    });

    if (!item) throw new NotFoundException('İlan bulunamadı.');
    if (item.status !== ItemStatus.GIVEN_AWAY) {
      throw new BadRequestException('Bu ilan henüz tamamlanmamış.');
    }

    // Yetki kontrolü
    if (status === DeliveryStatus.SHIPPED) {
      if (item.owner.id !== userId) {
        throw new BadRequestException(
          'Yalnızca ilan sahibi kargo durumunu güncelleyebilir.',
        );
      }
    } else if (status === DeliveryStatus.DELIVERED) {
      if (!item.winner || item.winner.id !== userId) {
        throw new BadRequestException(
          'Yalnızca yeni sahibi teslimat durumunu güncelleyebilir.',
        );
      }
    }

    item.deliveryStatus = status;

    // Kazanan kişiye "Teslim ettiğini söylüyor, teslim aldınız mı?" bildirimi gönder
    if (status === DeliveryStatus.SHIPPED && item.winner) {
      await this.notificationsService.createNotification(
        item.winner.id,
        '📦 Teslimat Bildirimi',
        `İlan sahibi "${item.title}" eşyasını teslimat sürecine dahil ettiğini söylüyor, teslim aldınız mı?`,
        NotificationType.INFO,
        item.id,
      );
    }

    return this.itemsRepository.save(item);
  }

  // Teslimatı Onayla ve Mutlu Son Kanıtı Ekle
  async confirmDelivery(
    itemId: string,
    userId: string,
    proofImageUrl?: string,
  ): Promise<Item> {
    return await this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(Item, {
        where: { id: itemId },
        relations: ['owner', 'winner'],
      });

      if (!item) throw new NotFoundException('İlan bulunamadı.');
      if (item.status !== ItemStatus.GIVEN_AWAY) {
        throw new BadRequestException('Bu eşya henüz döngüden çıkmamış.');
      }

      if (!item.winner || item.winner.id !== userId) {
        throw new BadRequestException(
          'Sadece bu döngünün yeni sahibi eşyayı onaylayabilir.',
        );
      }

      if (item.isConfirmed) {
        throw new BadRequestException(
          'Bu eşya zaten teslim alınmış ve onaylanmış.',
        );
      }

      // 1. Onayla ve Varsa kanıt fotoğrafını kaydet
      item.isConfirmed = true;
      if (proofImageUrl) {
        item.proofImage = proofImageUrl;
      }
      const savedItem = await manager.save(item);

      // 2. Karma Puanı ve İstatistik Dağıtımı (Atomic & Transactional)
      if (item.postType === ItemPostType.REQUESTING) {
        // "Var Mı?" (Request) durumu
        // Winner (Bende Var diyen kişi): +200
        await manager.increment(
          User,
          { id: item.winner.id },
          'karmaPoint',
          200,
        );
        await manager.increment(
          User,
          { id: item.winner.id },
          'resolvedRequestsCount',
          1,
        );

        await this.eventMetricsService.recordKarmaLedger({
          userId: item.winner.id,
          delta: 200,
          reason: 'request_resolved_winner',
          sourceId: item.id,
        });

        // Owner (Arayan kişi): +20
        await manager.increment(User, { id: item.owner.id }, 'karmaPoint', 20);
        await this.eventMetricsService.recordKarmaLedger({
          userId: item.owner.id,
          delta: 20,
          reason: 'request_resolved_owner',
          sourceId: item.id,
        });

        // Bildirimler (Side effects - transaction içinde kalabilir veya dışarı taşınabilir.
        // Burada DB tutarlılığı için içeride tutuyoruz)
        await this.notificationsService.createNotification(
          item.winner.id,
          '🌟 İhtiyaç Giderildi!',
          'Harikasın! Bir ihtiyacı giderdiğin için 200 İyilik Puanı kazandın! 🚀',
          NotificationType.SUCCESS,
          item.id,
        );
        await this.notificationsService.createNotification(
          item.owner.id,
          '🎉 İhtiyacın Karşılandı!',
          `${item.winner.fullName} talebini yerine getirdi ve eşyayı teslim aldın. +20 İyilik Puanı eklendi.`,
          NotificationType.SUCCESS,
          item.id,
        );
      } else {
        // Normal Bağış veya Takas
        let ownerPoints = 150;
        let winnerPoints = 20;
        let notificationMsg = `${item.winner.fullName} paylaştığınız eşyayı (${item.title}) teslim aldığını doğruladı. +150 İyilik Puanı eklendi! ✨`;

        if (item.shareType === ShareType.TRADE) {
          ownerPoints = 100;
          winnerPoints = 100;
          notificationMsg = `${item.winner.fullName} eşyayı teslim aldığını onayladı. Mutlu son! +100 İyilik Puanı kazandınız!`;
        }

        await manager.increment(
          User,
          { id: item.owner.id },
          'karmaPoint',
          ownerPoints,
        );
        await this.eventMetricsService.recordKarmaLedger({
          userId: item.owner.id,
          delta: ownerPoints,
          reason: 'delivery_confirmed_owner',
          sourceId: item.id,
        });
        await manager.increment(
          User,
          { id: item.winner.id },
          'karmaPoint',
          winnerPoints,
        );
        await this.eventMetricsService.recordKarmaLedger({
          userId: item.winner.id,
          delta: winnerPoints,
          reason: 'delivery_confirmed_winner',
          sourceId: item.id,
        });

        await this.notificationsService.createNotification(
          item.owner.id,
          '🎉 Teslimat Onaylandı!',
          notificationMsg,
          NotificationType.SUCCESS,
          item.id,
        );
      }

      return savedItem;
    });
  }
}

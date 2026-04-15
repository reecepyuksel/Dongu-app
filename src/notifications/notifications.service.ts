import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Repository,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType } from './entities/notification.entity';
import { Item, ItemStatus } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { AppCacheService } from '../common/redis/app-cache.service';
import { EventMetricsService } from '../common/events/event-metrics.service';
import { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly useRedisUnreadCount: boolean;

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private dataSource: DataSource,
    private appCacheService: AppCacheService,
    private configService: ConfigService,
    private eventMetricsService: EventMetricsService,
    private messagesGateway: MessagesGateway,
  ) {
    this.useRedisUnreadCount =
      this.configService.get<string>('USE_REDIS_UNREAD_COUNT', 'false') ===
      'true';
  }

  private async incrementUnreadProjection(userId: string, delta: number) {
    await this.dataSource.query(
      `
      INSERT INTO notification_unread_projection (user_id, unread_count, updated_at)
      VALUES ($1, GREATEST($2, 0), now())
      ON CONFLICT (user_id)
      DO UPDATE SET
        unread_count = GREATEST(notification_unread_projection.unread_count + $2, 0),
        updated_at = now()
      `,
      [userId, delta],
    );
  }

  private async setUnreadProjection(userId: string, count: number) {
    await this.dataSource.query(
      `
      INSERT INTO notification_unread_projection (user_id, unread_count, updated_at)
      VALUES ($1, $2, now())
      ON CONFLICT (user_id)
      DO UPDATE SET unread_count = EXCLUDED.unread_count, updated_at = now()
      `,
      [userId, Math.max(0, count)],
    );
  }

  private async getProjectedUnreadCount(
    userId: string,
  ): Promise<number | null> {
    const rows = await this.dataSource.query(
      `SELECT unread_count FROM notification_unread_projection WHERE user_id = $1`,
      [userId],
    );

    if (!rows.length) return null;
    return Number(rows[0].unread_count || 0);
  }

  // --- Bildirim oluştur (genel yardımcı) ---
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    relatedId?: string,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      user: { id: userId } as User,
      title,
      message,
      type,
      relatedId,
      isRead: false,
    });
    const saved = await this.notificationsRepository.save(notification);
    await this.eventMetricsService.recordNotificationEvent({
      userId,
      notificationId: saved.id,
      type: type.toString(),
      isRead: false,
      sourceId: saved.id,
    });
    this.messagesGateway.notifyNotification(userId, {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      message: saved.message,
      relatedId: saved.relatedId,
      isRead: saved.isRead,
      createdAt: saved.createdAt,
    });
    await this.incrementUnreadProjection(userId, 1);
    await this.appCacheService.invalidateNotificationUnreadCount(userId);
    return saved;
  }

  // --- Kullanıcının bildirimlerini getir ---
  async getMyNotifications(
    userId: string,
    limit: number = 20,
  ): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // --- Okunmamış bildirim sayısı ---
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    if (this.useRedisUnreadCount) {
      const cached =
        await this.appCacheService.getNotificationUnreadCount(userId);
      if (cached) {
        return cached;
      }

      const projectedCount = await this.getProjectedUnreadCount(userId);
      if (projectedCount !== null) {
        await this.appCacheService.setNotificationUnreadCount(
          userId,
          projectedCount,
          30,
        );
        return { count: projectedCount };
      }
    }

    const count = await this.notificationsRepository.count({
      where: { user: { id: userId }, isRead: false },
    });

    if (this.useRedisUnreadCount) {
      await this.appCacheService.setNotificationUnreadCount(userId, count, 30);
    }

    await this.setUnreadProjection(userId, count);

    return { count };
  }

  // --- Tek bildirimi okundu olarak işaretle ---
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const updated = await this.notificationsRepository.update(
      { id: notificationId, user: { id: userId } },
      { isRead: true },
    );

    if (updated.affected) {
      await this.eventMetricsService.recordNotificationEvent({
        userId,
        notificationId,
        type: 'read',
        isRead: true,
        sourceId: notificationId,
      });
      await this.incrementUnreadProjection(userId, -1);
    }

    await this.appCacheService.invalidateNotificationUnreadCount(userId);
  }

  // --- Tüm bildirimleri okundu olarak işaretle ---
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
    await this.eventMetricsService.recordNotificationEvent({
      userId,
      type: 'read_all',
      isRead: true,
      sourceId: `read-all:${userId}`,
    });
    await this.setUnreadProjection(userId, 0);
    await this.appCacheService.invalidateNotificationUnreadCount(userId);
  }

  // --- CRON: Son 24 saat kalan çekilişler için bildirim ---
  @Cron(CronExpression.EVERY_HOUR)
  async notifyUpcomingDraws() {
    this.logger.debug('Checking for draws ending within 24 hours...');

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Süresi 24 saat içinde dolacak ilanları bul
    const upcomingItems = await this.itemsRepository.find({
      where: {
        status: ItemStatus.AVAILABLE,
        drawDate: LessThanOrEqual(in24Hours),
      },
      relations: ['applications', 'applications.applicant'],
    });

    for (const item of upcomingItems) {
      // Sadece drawDate henüz geçmemişleri al
      if (item.drawDate <= now) continue;

      for (const app of item.applications) {
        // Aynı bildirim daha önce gönderilmiş mi?
        const existing = await this.notificationsRepository.findOne({
          where: {
            user: { id: app.applicant.id },
            relatedId: item.id,
            title: '⏰ Çekiliş Yaklaşıyor!',
          },
        });

        if (!existing) {
          await this.createNotification(
            app.applicant.id,
            '⏰ Çekiliş Yaklaşıyor!',
            `"${item.title}" ilanının çekilişine son 24 saat!`,
            NotificationType.WARNING,
            item.id,
          );
          this.logger.log(
            `24h notification sent to ${app.applicant.email} for item ${item.title}`,
          );
        }
      }
    }
  }
}

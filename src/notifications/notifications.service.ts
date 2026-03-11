import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType } from './entities/notification.entity';
import { Item, ItemStatus } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

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
    return this.notificationsRepository.save(notification);
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
    const count = await this.notificationsRepository.count({
      where: { user: { id: userId }, isRead: false },
    });
    return { count };
  }

  // --- Tek bildirimi okundu olarak işaretle ---
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { id: notificationId, user: { id: userId } },
      { isRead: true },
    );
  }

  // --- Tüm bildirimleri okundu olarak işaretle ---
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
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

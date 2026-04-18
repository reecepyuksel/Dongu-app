import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class EventRetentionService {
  private readonly logger = new Logger(EventRetentionService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async applyRetention(): Promise<void> {
    try {
      const eventDays = Number(
        this.configService.get<string>('EVENT_RETENTION_DAYS', '90'),
      );
      const notificationDays = Number(
        this.configService.get<string>('NOTIFICATION_RETENTION_DAYS', '180'),
      );
      const deletedMessageDays = Number(
        this.configService.get<string>('DELETED_MESSAGE_RETENTION_DAYS', '90'),
      );
      const deadLetterDays = Number(
        this.configService.get<string>(
          'EVENT_DEAD_LETTER_RETENTION_DAYS',
          '30',
        ),
      );

      const safeEventDays = Math.max(eventDays, 7);
      const safeNotificationDays = Math.max(notificationDays, 30);
      const safeDeletedMessageDays = Math.max(deletedMessageDays, 7);
      const safeDeadLetterDays = Math.max(deadLetterDays, 7);

      await Promise.all([
        this.dataSource.query(
          `DELETE FROM notification_event WHERE created_at < now() - ($1::int * interval '1 day')`,
          [safeEventDays],
        ),
        this.dataSource.query(
          `DELETE FROM message_event WHERE created_at < now() - ($1::int * interval '1 day')`,
          [safeEventDays],
        ),
        this.dataSource.query(
          `DELETE FROM item_view_event WHERE created_at < now() - ($1::int * interval '1 day')`,
          [safeEventDays],
        ),
        this.dataSource.query(
          `DELETE FROM notification WHERE "isRead" = true AND "createdAt" < now() - ($1::int * interval '1 day')`,
          [safeNotificationDays],
        ),
        this.dataSource.query(
          `DELETE FROM message WHERE "isDeleted" = true AND "createdAt" < now() - ($1::int * interval '1 day')`,
          [safeDeletedMessageDays],
        ),
        this.dataSource.query(
          `DELETE FROM event_retry_dead_letter WHERE moved_at < now() - ($1::int * interval '1 day')`,
          [safeDeadLetterDays],
        ),
      ]);

      this.logger.log(
        `Retention cleanup done eventDays=${safeEventDays} notifDays=${safeNotificationDays} msgDays=${safeDeletedMessageDays}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Retention cleanup skipped: ${message}`);
    }
  }
}

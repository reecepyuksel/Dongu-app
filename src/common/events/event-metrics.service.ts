import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

type NotificationEventInput = {
  userId: string;
  notificationId?: string | null;
  type: string;
  isRead: boolean;
  sourceId?: string | null;
};

type MessageEventInput = {
  messageId?: string | null;
  senderId?: string | null;
  receiverId?: string | null;
  itemId?: string | null;
  eventType: string;
  sourceId?: string | null;
};

type KarmaLedgerInput = {
  userId: string;
  delta: number;
  reason: string;
  sourceId?: string | null;
};

type ItemViewEventInput = {
  itemId: string;
  viewerId?: string | null;
  source?: string | null;
  sourceId?: string | null;
};

type RetryTarget =
  | 'notification_event'
  | 'message_event'
  | 'karma_ledger'
  | 'item_view_event';

type RetryQueueRow = {
  id: number;
  target_table: RetryTarget;
  payload:
    | NotificationEventInput
    | MessageEventInput
    | KarmaLedgerInput
    | ItemViewEventInput;
  retry_count: number;
};

@Injectable()
export class EventMetricsService {
  private readonly logger = new Logger(EventMetricsService.name);
  private readonly enabled: boolean;
  private readonly retryBatchSize: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.enabled =
      this.configService.get<string>('USE_EVENT_BASED_METRICS', 'false') ===
      'true';
    this.retryBatchSize = Number(
      this.configService.get<string>('EVENT_RETRY_BATCH_SIZE', '50'),
    );
  }

  private async nonBlockingWrite(
    query: string,
    params: unknown[],
    eventName: string,
    retryTarget: RetryTarget,
    retryPayload: unknown,
    shouldEnqueue = true,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.dataSource.query(query, params);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`${eventName} write failed: ${message}`);
      if (shouldEnqueue) {
        await this.enqueueRetry(retryTarget, retryPayload, message);
      }
    }
  }

  private async enqueueRetry(
    targetTable: RetryTarget,
    payload: unknown,
    lastError: string,
  ): Promise<void> {
    try {
      await this.dataSource.query(
        `
        INSERT INTO event_retry_queue (
          target_table,
          payload,
          retry_count,
          next_retry_at,
          last_error
        ) VALUES ($1, $2::jsonb, 0, now() + interval '1 minute', $3)
        `,
        [targetTable, JSON.stringify(payload), lastError],
      );
    } catch (queueError: unknown) {
      const message =
        queueError instanceof Error ? queueError.message : String(queueError);
      this.logger.error(`event retry enqueue failed: ${message}`);
    }
  }

  private async retryNotificationEvent(
    input: NotificationEventInput,
  ): Promise<void> {
    await this.recordNotificationEvent(input, false);
  }

  private async retryMessageEvent(input: MessageEventInput): Promise<void> {
    await this.recordMessageEvent(input, false);
  }

  private async retryKarmaLedger(input: KarmaLedgerInput): Promise<void> {
    await this.recordKarmaLedger(input, false);
  }

  private async retryItemViewEvent(input: ItemViewEventInput): Promise<void> {
    await this.recordItemViewEvent(input, false);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processRetryQueue(): Promise<void> {
    if (!this.enabled) return;

    const rows: RetryQueueRow[] = await this.dataSource.query(
      `
      SELECT id, target_table, payload, retry_count
      FROM event_retry_queue
      WHERE next_retry_at <= now()
      ORDER BY next_retry_at ASC, retry_count ASC
      LIMIT $1
      `,
      [this.retryBatchSize],
    );

    for (const row of rows) {
      try {
        switch (row.target_table) {
          case 'notification_event':
            await this.retryNotificationEvent(
              row.payload as NotificationEventInput,
            );
            break;
          case 'message_event':
            await this.retryMessageEvent(row.payload as MessageEventInput);
            break;
          case 'karma_ledger':
            await this.retryKarmaLedger(row.payload as KarmaLedgerInput);
            break;
          case 'item_view_event':
            await this.retryItemViewEvent(row.payload as ItemViewEventInput);
            break;
          default:
            throw new Error('Unknown retry target');
        }

        await this.dataSource.query(
          `DELETE FROM event_retry_queue WHERE id = $1`,
          [row.id],
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        const nextRetryAt = new Date(
          Date.now() + (row.retry_count + 1) * 60_000,
        );

        await this.dataSource.query(
          `
          UPDATE event_retry_queue
          SET retry_count = retry_count + 1,
              last_error = $2,
              next_retry_at = $3,
              updated_at = now()
          WHERE id = $1
          `,
          [row.id, message, nextRetryAt.toISOString()],
        );
      }
    }
  }

  async recordNotificationEvent(
    input: NotificationEventInput,
    shouldEnqueue = true,
  ): Promise<void> {
    const idempotencyKey = input.sourceId
      ? `notification:${input.type}:${input.sourceId}`
      : null;

    await this.nonBlockingWrite(
      `
      INSERT INTO notification_event (
        user_id,
        notification_id,
        type,
        is_read,
        source_id,
        idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
      `,
      [
        input.userId,
        input.notificationId || null,
        input.type,
        input.isRead,
        input.sourceId || null,
        idempotencyKey,
      ],
      'notification_event',
      'notification_event',
      input,
      shouldEnqueue,
    );
  }

  async recordMessageEvent(
    input: MessageEventInput,
    shouldEnqueue = true,
  ): Promise<void> {
    const idempotencyKey = input.sourceId
      ? `message:${input.eventType}:${input.sourceId}`
      : null;

    await this.nonBlockingWrite(
      `
      INSERT INTO message_event (
        message_id,
        sender_id,
        receiver_id,
        item_id,
        event_type,
        source_id,
        idempotency_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT DO NOTHING
      `,
      [
        input.messageId || null,
        input.senderId || null,
        input.receiverId || null,
        input.itemId || null,
        input.eventType,
        input.sourceId || null,
        idempotencyKey,
      ],
      'message_event',
      'message_event',
      input,
      shouldEnqueue,
    );
  }

  async recordKarmaLedger(
    input: KarmaLedgerInput,
    shouldEnqueue = true,
  ): Promise<void> {
    const idempotencyKey = input.sourceId
      ? `karma:${input.reason}:${input.sourceId}`
      : null;

    await this.nonBlockingWrite(
      `
      INSERT INTO karma_ledger (
        user_id,
        delta,
        reason,
        source_id,
        idempotency_key
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
      `,
      [
        input.userId,
        input.delta,
        input.reason,
        input.sourceId || null,
        idempotencyKey,
      ],
      'karma_ledger',
      'karma_ledger',
      input,
      shouldEnqueue,
    );
  }

  async recordItemViewEvent(
    input: ItemViewEventInput,
    shouldEnqueue = true,
  ): Promise<void> {
    const idempotencyKey = input.sourceId
      ? `item_view:${input.sourceId}`
      : null;

    await this.nonBlockingWrite(
      `
      INSERT INTO item_view_event (
        item_id,
        viewer_id,
        source,
        source_id,
        idempotency_key
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
      `,
      [
        input.itemId,
        input.viewerId || null,
        input.source || null,
        input.sourceId || null,
        idempotencyKey,
      ],
      'item_view_event',
      'item_view_event',
      input,
      shouldEnqueue,
    );
  }
}

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

type RetryQueueRowRaw = Partial<{
  id: number | string;
  target_table: string;
  payload: unknown;
  retry_count: number | string;
  retryCount: number | string;
}>;

@Injectable()
export class EventMetricsService {
  private readonly logger = new Logger(EventMetricsService.name);
  private readonly enabled: boolean;
  private readonly retryBatchSize: number;
  private readonly maxRetryCount: number;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.enabled =
      this.configService.get<string>('USE_EVENT_BASED_METRICS', 'false') ===
      'true';
    this.retryBatchSize = this.parsePositiveIntSetting(
      'EVENT_RETRY_BATCH_SIZE',
      50,
      1,
    );
    this.maxRetryCount = this.parsePositiveIntSetting(
      'EVENT_RETRY_MAX_COUNT',
      10,
      1,
    );
  }

  private parsePositiveIntSetting(
    key: string,
    fallback: number,
    min: number,
  ): number {
    const raw = this.configService.get<string>(key, String(fallback));
    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed < min) {
      this.logger.warn(
        `${key} invalid (${String(raw)}). Falling back to ${fallback}.`,
      );
      return fallback;
    }

    return Math.floor(parsed);
  }

  private getNextRetryAtIso(retryCount: number): string {
    const safeRetryCount =
      Number.isFinite(retryCount) && retryCount >= 0
        ? Math.floor(retryCount)
        : 1;

    return new Date(Date.now() + safeRetryCount * 60_000).toISOString();
  }

  private normalizeRetryQueueRow(raw: RetryQueueRowRaw): RetryQueueRow | null {
    const id = Number(raw.id);
    const retryCount = Number(raw.retry_count ?? raw.retryCount ?? 0);
    const target = raw.target_table;

    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }

    if (!Number.isFinite(retryCount) || retryCount < 0) {
      return null;
    }

    if (
      target !== 'notification_event' &&
      target !== 'message_event' &&
      target !== 'karma_ledger' &&
      target !== 'item_view_event'
    ) {
      return null;
    }

    return {
      id: Math.floor(id),
      target_table: target,
      payload: raw.payload as
        | NotificationEventInput
        | MessageEventInput
        | KarmaLedgerInput
        | ItemViewEventInput,
      retry_count: Math.floor(retryCount),
    };
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

    const rawRows: RetryQueueRowRaw[] = await this.dataSource.query(
      `
      WITH candidates AS (
        SELECT id
        FROM event_retry_queue
        WHERE next_retry_at <= now()
        ORDER BY next_retry_at ASC, retry_count ASC
        FOR UPDATE SKIP LOCKED
        LIMIT $1
      )
      UPDATE event_retry_queue q
      SET next_retry_at = now() + interval '5 minutes',
          updated_at = now()
      FROM candidates c
      WHERE q.id = c.id
      RETURNING q.id, q.target_table, q.payload, q.retry_count
      `,
      [this.retryBatchSize],
    );

    const rows = rawRows
      .map((row) => this.normalizeRetryQueueRow(row))
      .filter((row): row is RetryQueueRow => row !== null);

    const malformedRowsCount = rawRows.length - rows.length;
    if (malformedRowsCount > 0) {
      this.logger.warn(
        `Skipped ${malformedRowsCount} malformed retry queue row(s).`,
      );
    }

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
        const nextRetryCount = row.retry_count + 1;

        if (nextRetryCount >= this.maxRetryCount) {
          try {
            await this.dataSource.query(
              `
              INSERT INTO event_retry_dead_letter (
                target_table,
                payload,
                retry_count,
                last_error
              ) VALUES ($1, $2::jsonb, $3, $4)
              `,
              [
                row.target_table,
                JSON.stringify(row.payload),
                nextRetryCount,
                message,
              ],
            );

            await this.dataSource.query(
              `DELETE FROM event_retry_queue WHERE id = $1`,
              [row.id],
            );
          } catch (deadLetterError: unknown) {
            const deadLetterMessage =
              deadLetterError instanceof Error
                ? deadLetterError.message
                : String(deadLetterError);

            this.logger.error(
              `retry dead-letter move failed for queueId=${row.id}: ${deadLetterMessage}`,
            );

            try {
              await this.dataSource.query(
                `
                UPDATE event_retry_queue
                SET retry_count = retry_count + 1,
                    last_error = $2,
                    next_retry_at = $3,
                    updated_at = now()
                WHERE id = $1
                `,
                [
                  row.id,
                  `${message}; dead-letter-failed: ${deadLetterMessage}`,
                  this.getNextRetryAtIso(nextRetryCount),
                ],
              );
            } catch (updateAfterDeadLetterError: unknown) {
              const updateMessage =
                updateAfterDeadLetterError instanceof Error
                  ? updateAfterDeadLetterError.message
                  : String(updateAfterDeadLetterError);
              this.logger.error(
                `retry queue update failed after dead-letter error for queueId=${row.id}: ${updateMessage}`,
              );
            }
          }

          continue;
        }

        try {
          await this.dataSource.query(
            `
            UPDATE event_retry_queue
            SET retry_count = retry_count + 1,
                last_error = $2,
                next_retry_at = $3,
                updated_at = now()
            WHERE id = $1
            `,
            [row.id, message, this.getNextRetryAtIso(nextRetryCount)],
          );
        } catch (updateError: unknown) {
          const updateMessage =
            updateError instanceof Error
              ? updateError.message
              : String(updateError);
          this.logger.error(
            `retry queue update failed for queueId=${row.id}: ${updateMessage}`,
          );
        }
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

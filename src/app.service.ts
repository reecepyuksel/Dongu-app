import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { RedisService } from './common/redis/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getOpsStatus() {
    const [
      dbVersionRows,
      retryQueueRows,
      unreadProjectionRows,
      snapshotRows,
      aggregateRows,
      redisPing,
    ] = await Promise.all([
      this.dataSource.query('SELECT version() AS version'),
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total, COALESCE(SUM(retry_count), 0)::int AS retries FROM event_retry_queue`,
      ),
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total FROM notification_unread_projection`,
      ),
      this.dataSource.query(
        `SELECT COUNT(*)::int AS total, MAX(snapshot_at) AS last_snapshot_at FROM leaderboard_snapshot`,
      ),
      this.dataSource.query(
        `
          SELECT schemaname, matviewname
          FROM pg_matviews
          WHERE matviewname IN ('message_event_hourly', 'item_view_event_daily')
          `,
      ),
      this.redisService.ping(),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      features: {
        redisUnreadCount:
          this.configService.get<string>('USE_REDIS_UNREAD_COUNT', 'false') ===
          'true',
        timescaleLeaderboard:
          this.configService.get<string>(
            'USE_TIMESCALE_LEADERBOARD',
            'false',
          ) === 'true',
        eventBasedMetrics:
          this.configService.get<string>('USE_EVENT_BASED_METRICS', 'false') ===
          'true',
      },
      infrastructure: {
        database: {
          initialized: this.dataSource.isInitialized,
          version: dbVersionRows[0]?.version || null,
        },
        redis: {
          ping: redisPing,
        },
      },
      projections: {
        notificationUnread: Number(unreadProjectionRows[0]?.total || 0),
        leaderboardSnapshot: {
          rows: Number(snapshotRows[0]?.total || 0),
          lastSnapshotAt: snapshotRows[0]?.last_snapshot_at || null,
        },
      },
      retries: {
        queued: Number(retryQueueRows[0]?.total || 0),
        totalRetryAttempts: Number(retryQueueRows[0]?.retries || 0),
        batchSize: Number(
          this.configService.get<string>('EVENT_RETRY_BATCH_SIZE', '50'),
        ),
      },
      aggregates: {
        available: aggregateRows.map(
          (row: { matviewname: string }) => row.matviewname,
        ),
      },
    };
  }
}

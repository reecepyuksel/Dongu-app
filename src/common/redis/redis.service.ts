import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly enabled: boolean;
  private hasReportedUnavailable = false;

  private parseBoolean(value: string | undefined, fallback: boolean): boolean {
    if (typeof value !== 'string') return fallback;
    return value.toLowerCase() === 'true';
  }

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('REDIS_HOST', '127.0.0.1');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD');
    const db = this.configService.get<number>('REDIS_DB', 0);
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    const keyPrefix = this.configService.get<string>(
      'REDIS_KEY_PREFIX',
      `dongu:${nodeEnv}:`,
    );

    this.enabled = this.parseBoolean(
      this.configService.get<string>('REDIS_ENABLED', 'true'),
      true,
    );

    this.client = new Redis({
      host,
      port,
      password,
      db,
      keyPrefix,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err?.message || err}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });

    void this.connect();
  }

  private async connect() {
    if (!this.enabled) {
      this.logger.warn('Redis disabled by REDIS_ENABLED=false');
      return;
    }

    try {
      await this.client.connect();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Redis connect failed: ${message}`);
    }
  }

  private reportUnavailable(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (!this.hasReportedUnavailable) {
      this.logger.warn(
        `Redis unavailable, falling back to database only: ${message}`,
      );
      this.hasReportedUnavailable = true;
    }
  }

  private markAvailable() {
    this.hasReportedUnavailable = false;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    let value: string | null;
    try {
      value = await this.client.get(key);
      this.markAvailable();
    } catch (error: unknown) {
      this.reportUnavailable(error);
      return null;
    }
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.enabled) return;

    const payload = JSON.stringify(value);
    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, payload, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, payload);
      }
      this.markAvailable();
    } catch (error: unknown) {
      this.reportUnavailable(error);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.client.del(key);
      this.markAvailable();
    } catch (error: unknown) {
      this.reportUnavailable(error);
    }
  }

  async delMany(keys: string[]): Promise<void> {
    if (!this.enabled || !keys.length) return;
    try {
      await this.client.del(...keys);
      this.markAvailable();
    } catch (error: unknown) {
      this.reportUnavailable(error);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.enabled) return;

    try {
      const keys = await this.client.keys(pattern);
      if (!keys.length) return;

      await this.client.del(...keys);
      this.markAvailable();
    } catch (error: unknown) {
      this.reportUnavailable(error);
    }
  }

  async ping(): Promise<'PONG' | 'DISABLED' | 'ERROR'> {
    if (!this.enabled) return 'DISABLED';

    try {
      const result = await this.client.ping();
      return result === 'PONG' ? 'PONG' : 'ERROR';
    } catch {
      return 'ERROR';
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      // ignore shutdown errors
    }
  }
}

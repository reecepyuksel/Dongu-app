import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { CacheKeys } from './cache-keys';
import { RedisService } from './redis.service';

@Injectable()
export class AppCacheService {
  constructor(private readonly redisService: RedisService) {}

  getNotificationUnreadCount(userId: string) {
    return this.redisService.get<{ count: number }>(
      CacheKeys.notificationUnreadCount(userId),
    );
  }

  setNotificationUnreadCount(userId: string, count: number, ttlSeconds = 30) {
    return this.redisService.set(
      CacheKeys.notificationUnreadCount(userId),
      { count },
      ttlSeconds,
    );
  }

  invalidateNotificationUnreadCount(userId: string) {
    return this.redisService.del(CacheKeys.notificationUnreadCount(userId));
  }

  getChatUnreadCount(userId: string) {
    return this.redisService.get<{ totalUnread: number }>(
      CacheKeys.chatUnreadCount(userId),
    );
  }

  setChatUnreadCount(userId: string, totalUnread: number, ttlSeconds = 20) {
    return this.redisService.set(
      CacheKeys.chatUnreadCount(userId),
      { totalUnread },
      ttlSeconds,
    );
  }

  invalidateChatUnreadCount(userId: string) {
    return this.redisService.del(CacheKeys.chatUnreadCount(userId));
  }

  getLeaderboard(limit = 100) {
    return this.redisService.get<any[]>(CacheKeys.leaderboardTop(limit));
  }

  setLeaderboard(limit: number, rows: any[], ttlSeconds = 120) {
    return this.redisService.set(
      CacheKeys.leaderboardTop(limit),
      rows,
      ttlSeconds,
    );
  }

  invalidateLeaderboard(limit = 100) {
    return this.redisService.del(CacheKeys.leaderboardTop(limit));
  }

  getConversations(userId: string) {
    return this.redisService.get<any[]>(CacheKeys.userConversations(userId));
  }

  setConversations(userId: string, rows: any[], ttlSeconds = 20) {
    return this.redisService.set(
      CacheKeys.userConversations(userId),
      rows,
      ttlSeconds,
    );
  }

  invalidateConversations(userId: string) {
    return this.redisService.del(CacheKeys.userConversations(userId));
  }

  getTradeOffers(userId: string) {
    return this.redisService.get<any[]>(CacheKeys.userTradeOffers(userId));
  }

  setTradeOffers(userId: string, rows: any[], ttlSeconds = 20) {
    return this.redisService.set(
      CacheKeys.userTradeOffers(userId),
      rows,
      ttlSeconds,
    );
  }

  invalidateTradeOffers(userId: string) {
    return this.redisService.del(CacheKeys.userTradeOffers(userId));
  }

  makeItemsListKey(
    query: Record<string, unknown>,
    page: number,
    limit: number,
  ) {
    const normalized = JSON.stringify(
      Object.keys(query)
        .sort()
        .reduce(
          (acc, key) => {
            acc[key] = query[key];
            return acc;
          },
          {} as Record<string, unknown>,
        ),
    );

    const hash = createHash('sha1').update(normalized).digest('hex');
    return CacheKeys.itemsList(hash, page, limit);
  }

  getItemsList<T>(cacheKey: string) {
    return this.redisService.get<T>(cacheKey);
  }

  setItemsList<T>(cacheKey: string, payload: T, ttlSeconds = 30) {
    return this.redisService.set(cacheKey, payload, ttlSeconds);
  }

  invalidateItemsList() {
    return this.redisService.delByPattern('items:list:*');
  }
}

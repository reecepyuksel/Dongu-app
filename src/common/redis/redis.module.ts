import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { AppCacheService } from './app-cache.service';

@Global()
@Module({
  providers: [RedisService, AppCacheService],
  exports: [RedisService, AppCacheService],
})
export class RedisModule {}

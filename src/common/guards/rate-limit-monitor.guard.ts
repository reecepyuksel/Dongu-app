import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';

@Injectable()
export class RateLimitMonitorGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitMonitorGuard.name);

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { req } = this.getRequestResponse(context);
    const method = req?.method || 'UNKNOWN';
    const path = req?.originalUrl || req?.url || 'unknown';
    const ip = req?.ip || req?.socket?.remoteAddress || 'unknown';
    const userId = req?.user?.userId || req?.user?.id || 'anonymous';

    this.logger.warn(
      `RateLimit exceeded method=${method} path=${path} ip=${ip} user=${userId} limit=${throttlerLimitDetail.limit} ttl=${throttlerLimitDetail.ttl}`,
    );

    await super.throwThrottlingException(context, throttlerLimitDetail);
  }
}

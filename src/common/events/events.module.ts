import { Global, Module } from '@nestjs/common';
import { EventMetricsService } from './event-metrics.service';
import { EventRetentionService } from './event-retention.service';

@Global()
@Module({
  providers: [EventMetricsService, EventRetentionService],
  exports: [EventMetricsService],
})
export class EventsModule {}

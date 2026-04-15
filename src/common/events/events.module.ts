import { Global, Module } from '@nestjs/common';
import { EventMetricsService } from './event-metrics.service';

@Global()
@Module({
  providers: [EventMetricsService],
  exports: [EventMetricsService],
})
export class EventsModule {}

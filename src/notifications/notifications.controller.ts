import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Bildirimlerimi getir
  @UseGuards(AuthGuard('jwt'))
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  getMyNotifications(@Request() req) {
    return this.notificationsService.getMyNotifications(req.user.userId);
  }

  // Okunmamış bildirim sayısı
  @UseGuards(AuthGuard('jwt'))
  @Get('unread-count')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  // Tek bildirimi okundu işaretle
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/read')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  // Tüm bildirimleri okundu işaretle
  @UseGuards(AuthGuard('jwt'))
  @Post('read-all')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}

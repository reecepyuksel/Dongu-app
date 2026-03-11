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

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Bildirimlerimi getir
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getMyNotifications(@Request() req) {
    return this.notificationsService.getMyNotifications(req.user.userId);
  }

  // Okunmamış bildirim sayısı
  @UseGuards(AuthGuard('jwt'))
  @Get('unread-count')
  getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  // Tek bildirimi okundu işaretle
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  // Tüm bildirimleri okundu işaretle
  @UseGuards(AuthGuard('jwt'))
  @Post('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}

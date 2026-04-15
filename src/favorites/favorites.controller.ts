import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { Throttle } from '@nestjs/throttler';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':itemId')
  @Throttle({ default: { limit: 40, ttl: 60_000 } })
  toggleFavorite(@CurrentUser() user: User, @Param('itemId') itemId: string) {
    return this.favoritesService.toggleFavorite(user.id, itemId);
  }

  @Get()
  getMyFavorites(@CurrentUser() user: User) {
    return this.favoritesService.getMyFavorites(user.id);
  }

  @Get(':itemId/check')
  checkIsFavorited(@CurrentUser() user: User, @Param('itemId') itemId: string) {
    return this.favoritesService.checkIsFavorited(user.id, itemId);
  }
}

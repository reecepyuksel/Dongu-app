import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { Favorite } from './favorite.entity';
import { Item } from '../items/entities/item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, Item])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}

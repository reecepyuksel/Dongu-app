import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
  ) {}

  async toggleFavorite(
    userId: string,
    itemId: string,
  ): Promise<{ isFavorited: boolean }> {
    const item = await this.itemsRepository.findOne({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('İlan bulunamadı');
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: { user: { id: userId }, item: { id: itemId } },
    });

    if (existingFavorite) {
      // Zaten favorilerde var, çıkar
      await this.favoritesRepository.remove(existingFavorite);
      return { isFavorited: false };
    } else {
      // Favorilerde yok, ekle
      const newFavorite = this.favoritesRepository.create({
        user: { id: userId } as User,
        item: { id: itemId } as Item,
      });
      await this.favoritesRepository.save(newFavorite);
      return { isFavorited: true };
    }
  }

  async getMyFavorites(userId: string): Promise<Item[]> {
    const favorites = await this.favoritesRepository.find({
      where: { user: { id: userId } },
      relations: ['item', 'item.owner'],
      order: { createdAt: 'DESC' },
    });

    return favorites.map((fav) => fav.item);
  }

  async checkIsFavorited(
    userId: string,
    itemId: string,
  ): Promise<{ isFavorited: boolean }> {
    const favorite = await this.favoritesRepository.findOne({
      where: { user: { id: userId }, item: { id: itemId } },
    });
    return { isFavorited: !!favorite };
  }
}

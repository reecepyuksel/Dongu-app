import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Giveaway } from './entities/giveaway.entity';
import { Item } from '../items/entities/item.entity';
import { GiveawaysService } from './giveaways.service';
import { GiveawaysController } from './giveaways.controller';
import { Message } from '../messages/entities/message.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Giveaway, Item, Message]),
    NotificationsModule,
    CloudinaryModule,
  ],
  controllers: [GiveawaysController],
  providers: [GiveawaysService],
})
export class GiveawaysModule {}

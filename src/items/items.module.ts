import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item } from './entities/item.entity';
import { User } from '../users/entities/user.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Message } from '../messages/entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Item, User, Message]),
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}

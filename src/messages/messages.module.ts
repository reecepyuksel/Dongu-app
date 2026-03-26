import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesGateway } from './messages.gateway';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { BlockedUser } from './entities/blocked-user.entity';
import { Report } from './entities/report.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Item, User, BlockedUser, Report]),
    forwardRef(() => NotificationsModule),
    CloudinaryModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}

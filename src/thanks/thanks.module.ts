import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThanksNote } from './thanks.entity';
import { ThanksService } from './thanks.service';
import { ThanksController } from './thanks.controller';
import { User } from '../users/entities/user.entity';
import { Item } from '../items/entities/item.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ThanksNote, User, Item]),
    NotificationsModule,
  ],
  controllers: [ThanksController],
  providers: [ThanksService],
  exports: [ThanksService],
})
export class ThanksModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { Item } from '../items/entities/item.entity';
import { User } from '../users/entities/user.entity';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Community, CommunityMember, Item, User]),
    CloudinaryModule,
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService],
  exports: [CommunitiesService],
})
export class CommunitiesModule {}

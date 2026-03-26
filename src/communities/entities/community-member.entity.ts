import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Community } from './community.entity';

export enum CommunityRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

@Entity()
@Unique(['user', 'community'])
export class CommunityMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.communities)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Community, (community) => community.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'community_id' })
  community: Community;

  @Column({ type: 'enum', enum: CommunityRole, default: CommunityRole.MEMBER })
  role: CommunityRole;

  @CreateDateColumn()
  joinDate: Date;
}

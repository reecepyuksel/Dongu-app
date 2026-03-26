import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';
import { Giveaway } from '../../giveaways/entities/giveaway.entity';
import { Favorite } from '../../favorites/favorite.entity';
import { CommunityMember } from '../../communities/entities/community-member.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'int', default: 0 })
  karmaPoint: number;

  @Column({ type: 'int', default: 0 })
  resolvedRequestsCount: number;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  badges: any[];

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: true })
  notifyTradeOffers: boolean;

  @Column({ type: 'boolean', default: true })
  notifyMessages: boolean;

  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'int', default: 0 })
  trustScore: number;

  @OneToMany(() => Item, (item) => item.owner)
  items: Item[];

  @OneToMany(() => Giveaway, (giveaway) => giveaway.applicant)
  applications: Giveaway[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => CommunityMember, (member) => member.user)
  communities: CommunityMember[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

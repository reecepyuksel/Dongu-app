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

  @Column({ type: 'jsonb', nullable: true, default: [] })
  badges: any[];

  @Column({ nullable: true })
  avatarUrl: string;

  @OneToMany(() => Item, (item) => item.owner)
  items: Item[];

  @OneToMany(() => Giveaway, (giveaway) => giveaway.applicant)
  applications: Giveaway[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

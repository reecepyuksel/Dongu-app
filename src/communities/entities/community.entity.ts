import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CommunityMember } from './community-member.entity';
import { Item } from '../../items/entities/item.entity';

export enum CommunityType {
  CAMPUS = 'CAMPUS',
  NEIGHBORHOOD = 'NEIGHBORHOOD',
  HOBBY = 'HOBBY',
}

@Entity()
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  district: string;

  @Column({ type: 'enum', enum: CommunityType, default: CommunityType.HOBBY })
  type: CommunityType;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @OneToMany(() => CommunityMember, (member) => member.community)
  members: CommunityMember[];

  @OneToMany(() => Item, (item) => item.community)
  items: Item[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Item } from '../../items/entities/item.entity';

@Entity()
export class Giveaway {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Item, (item) => item.applications, { onDelete: 'CASCADE' })
  item: Item;

  @ManyToOne(() => User, (user) => user.applications)
  applicant: User;

  @CreateDateColumn()
  appliedAt: Date;

  @Column({ default: false })
  isWinner: boolean;
}

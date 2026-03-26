import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Item } from '../items/entities/item.entity';

@Entity('thanks_notes')
export class ThanksNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'text_content', type: 'text' })
  textContent: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  sender: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  receiver: User;

  @ManyToOne(() => Item, { onDelete: 'CASCADE' })
  item: Item;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

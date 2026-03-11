import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Item } from '../items/entities/item.entity';

@Entity('favorites')
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Item, (item) => item.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @CreateDateColumn()
  createdAt: Date;
}

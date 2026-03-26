import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Column,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  reporter: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  reportedUser: User;

  @Column({ type: 'varchar', length: 80 })
  reason: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

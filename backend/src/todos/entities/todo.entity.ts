import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tag } from './tag.entity';

@Entity({ name: 'todos', schema: 'public' })
export class Todo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User, (user) => user.todos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate!: Date | null;

  @Column({ type: 'text', default: 'Low' })
  priority!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  // 5-state status system: todo, in_progress, done, overdue, cancelled
  @Column({
    type: 'varchar',
    length: 20,
    default: 'todo',
  })
  status!: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';

  // Required reason when status is cancelled; null for other statuses
  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  cancellationReason?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Tag, (tag) => tag.todo)
  tags!: Tag[];
}

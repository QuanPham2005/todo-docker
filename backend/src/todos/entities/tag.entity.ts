import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Todo } from './todo.entity';

@Entity({ name: 'tags', schema: 'public' })
export class Tag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'todo_id' })
  todoId!: number;

  @ManyToOne(() => Todo, (todo) => todo.tags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'todo_id' })
  todo!: Todo;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}

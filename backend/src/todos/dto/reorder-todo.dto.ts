import { IsIn, IsInt, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class ReorderTodoDto {
  @IsNotEmpty()
  @IsIn(['todo', 'in_progress', 'done', 'overdue', 'cancelled'])
  targetStatus?: 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled';

  @IsOptional()
  @IsInt()
  @Min(1)
  beforeTodoId?: number;
}
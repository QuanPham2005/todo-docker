import { IsIn, IsInt, IsOptional, Min, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryTodoDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['all', 'todo', 'in_progress', 'done', 'overdue', 'cancelled'])
  status?: 'all' | 'todo' | 'in_progress' | 'done' | 'overdue' | 'cancelled' =
    'all';

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High'])
  priority?: 'Low' | 'Medium' | 'High';

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['due_date', 'created_at', 'priority', 'sort_order'])
  sortBy?: 'due_date' | 'created_at' | 'priority' | 'sort_order' = 'sort_order';

  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase()) // ← đúng chỗ: trên order
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}
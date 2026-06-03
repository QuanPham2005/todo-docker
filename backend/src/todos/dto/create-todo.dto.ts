import { IsIn, IsNotEmpty, IsOptional, IsString, IsArray, ArrayNotEmpty, ArrayUnique, IsDateString } from 'class-validator';

export class CreateTodoDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High'])
  priority?: 'Low' | 'Medium' | 'High';

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];
}

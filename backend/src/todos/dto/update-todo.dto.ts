import { IsIn, IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray, ArrayNotEmpty, ArrayUnique, IsDateString } from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  title?: string;

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
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];
}

import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

// DTO for cancelling a todo with required reason
// Reason must be at least 10 characters to ensure meaningful feedback
export class CancelTodoDto {
  @IsNotEmpty({ message: 'Cancellation reason is required' })
  @IsString()
  @MinLength(10, { message: 'Reason must be at least 10 characters' })
  reason!: string;
}

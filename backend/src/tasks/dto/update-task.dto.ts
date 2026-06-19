import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/**
 * Every field is optional (partial update). The "at least one field" rule
 * (AC-12) is enforced in the controller, not here, because class-validator
 * cannot express "the whole object must be non-empty" cleanly.
 */
export class UpdateTaskDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ticketRef?: string | null;

  @IsOptional()
  @IsISO8601()
  dueDate?: string | null;
}

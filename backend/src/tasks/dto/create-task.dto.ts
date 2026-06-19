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

/** Trims strings so a whitespace-only title fails @MinLength (AC-2). */
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTaskDto {
  @Transform(trim)
  @IsString()
  @MinLength(1) // AC-2: empty / whitespace-only title rejected
  @MaxLength(200) // AC-4
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000) // AC-4
  description?: string | null;

  @IsOptional()
  @IsEnum(TaskStatus) // AC-3: status must be TODO | IN_PROGRESS | DONE
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ticketRef?: string | null;

  @IsOptional()
  @IsISO8601() // accepts an ISO 8601 date/date-time string
  dueDate?: string | null;
}

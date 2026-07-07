import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Tracker, TicketStatus } from '@prisma/client';

/** Trims strings so a whitespace-only key fails @MinLength. */
const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTicketDto {
  @Transform(trim)
  @IsString()
  @MinLength(1) // AC-2: empty / whitespace-only key rejected
  @MaxLength(100) // AC-4
  key!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200) // AC-4
  title?: string | null;

  @IsOptional()
  @IsEnum(Tracker) // AC-3: tracker must be JIRA | GITHUB | OTHER
  tracker?: Tracker;

  @IsOptional()
  @IsString()
  @MaxLength(500) // AC-4
  url?: string | null;

  @IsOptional()
  @IsEnum(TicketStatus) // AC-3: status must be OPEN | IN_PROGRESS | CLOSED
  status?: TicketStatus;
}

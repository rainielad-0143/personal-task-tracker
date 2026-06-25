import { IsEnum, IsOptional } from 'class-validator';
import { Tracker, TicketStatus } from '@prisma/client';

/**
 * Query params for GET /tickets. An invalid `status`/`tracker` value fails
 * @IsEnum and yields 400 (AC-6); omitting both lists everything.
 */
export class FindTicketsQueryDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(Tracker)
  tracker?: Tracker;
}

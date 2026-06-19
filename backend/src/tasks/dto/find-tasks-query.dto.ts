import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '@prisma/client';

/**
 * Query params for GET /tasks. An invalid `status` value fails @IsEnum and
 * yields 400 (AC-8); omitting it lists everything.
 */
export class FindTasksQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}

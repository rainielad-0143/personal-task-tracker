import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Task } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

// Every task route is owner-scoped: the guard supplies the user, and the
// service filters by it so a user only ever sees or mutates their own tasks.
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(user.id, dto); // 201 by default
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: FindTasksQueryDto,
  ): Promise<Task[]> {
    return this.tasksService.findAll(user.id, query.status);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Task> {
    return this.tasksService.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    // AC-12: an empty update body is a 400, not a no-op update.
    // Check for a defined value rather than key presence: with transform +
    // class-transformer's exposeUnsetFields default, an empty body still
    // yields a DTO instance carrying every optional field as `undefined`.
    const hasAnyField = Object.values(dto).some((v) => v !== undefined);
    if (!hasAnyField) {
      throw new BadRequestException(
        'Update body must contain at least one field',
      );
    }
    return this.tasksService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // AC-13: 204
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tasksService.remove(user.id, id);
  }
}

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
} from '@nestjs/common';
import { Task } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FindTasksQueryDto } from './dto/find-tasks-query.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(dto); // 201 by default
  }

  @Get()
  findAll(@Query() query: FindTasksQueryDto): Promise<Task[]> {
    return this.tasksService.findAll(query.status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(
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
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // AC-13: 204
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.tasksService.remove(id);
  }
}

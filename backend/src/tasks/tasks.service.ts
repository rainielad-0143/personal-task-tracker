import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Task, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /** AC-5/AC-6: create a task; status defaults to TODO when omitted. */
  create(dto: CreateTaskDto): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        status: dto.status, // undefined -> Prisma applies default TODO
        ticketRef: dto.ticketRef ?? null,
        dueDate: this.toDate(dto.dueDate),
      },
    });
  }

  /** AC-7/AC-8: list newest-first, optionally filtered by status. */
  findAll(status?: TaskStatus): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** AC-9: fetch one or 404. */
  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  /** AC-10/AC-11: partial update; 404 when the id does not exist. */
  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.ticketRef !== undefined) data.ticketRef = dto.ticketRef;
    if (dto.dueDate !== undefined) data.dueDate = this.toDate(dto.dueDate);

    try {
      return await this.prisma.task.update({ where: { id }, data });
    } catch (err) {
      throw this.toNotFoundIfMissing(err, id);
    }
  }

  /** AC-13/AC-14: delete; 404 when the id does not exist. */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.task.delete({ where: { id } });
    } catch (err) {
      throw this.toNotFoundIfMissing(err, id);
    }
  }

  /** Converts an optional ISO string to a Date (or null) for Prisma. */
  private toDate(value?: string | null): Date | null {
    return value ? new Date(value) : null;
  }

  /** Maps Prisma's "record not found" (P2025) to a 404, rethrows anything else. */
  private toNotFoundIfMissing(err: unknown, id: string): unknown {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      return new NotFoundException(`Task ${id} not found`);
    }
    return err;
  }
}

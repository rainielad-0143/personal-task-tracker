import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Task, TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  /** AC-5/AC-6: create a task owned by the current user. */
  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    await this.assertTicketOwned(userId, dto.ticketId);
    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        status: dto.status, // undefined -> Prisma applies default TODO
        ticketRef: dto.ticketRef ?? null,
        ticketId: dto.ticketId ?? null,
        dueDate: this.toDate(dto.dueDate),
        userId,
      },
    });
  }

  /** AC-7/AC-8: list the user's live tasks newest-first, optionally filtered by status. */
  findAll(userId: string, status?: TaskStatus): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { userId, deletedAt: null, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** AC-9: fetch one of the user's live tasks, or 404. */
  async findOne(userId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    return task;
  }

  /** AC-10/AC-11: partial update of the user's own task; 404 otherwise. */
  async update(userId: string, id: string, dto: UpdateTaskDto): Promise<Task> {
    // Confirm ownership first so another user's id can't be updated (404, not 403,
    // to avoid leaking which ids exist).
    await this.findOne(userId, id);
    await this.assertTicketOwned(userId, dto.ticketId);

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.ticketRef !== undefined) data.ticketRef = dto.ticketRef;
    if (dto.ticketId !== undefined) {
      // Connect to the ticket, or detach when explicitly set to null.
      data.ticket = dto.ticketId
        ? { connect: { id: dto.ticketId } }
        : { disconnect: true };
    }
    if (dto.dueDate !== undefined) data.dueDate = this.toDate(dto.dueDate);

    return this.prisma.task.update({ where: { id }, data });
  }

  /** AC-13/AC-14: soft-delete the user's own task; 404 when missing or not theirs. */
  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id); // ownership check -> 404 if not theirs
    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * AC-4b: a provided `ticketId` must reference a live ticket owned by the user,
   * else 400. `null`/`undefined` (no link / detach) is always allowed.
   */
  private async assertTicketOwned(
    userId: string,
    ticketId?: string | null,
  ): Promise<void> {
    if (!ticketId) return;
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, userId, deletedAt: null },
    });
    if (!ticket) {
      throw new BadRequestException(`Ticket ${ticketId} not found`);
    }
  }

  /** Converts an optional ISO string to a Date (or null) for Prisma. */
  private toDate(value?: string | null): Date | null {
    return value ? new Date(value) : null;
  }
}

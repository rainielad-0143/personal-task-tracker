import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Ticket, TicketStatus, Tracker } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /** AC-1/AC-5: create a ticket owned by the user; 409 on a duplicate live key. */
  async create(userId: string, dto: CreateTicketDto): Promise<Ticket> {
    await this.assertKeyAvailable(userId, dto.key);
    return this.prisma.ticket.create({
      data: {
        key: dto.key,
        title: dto.title ?? null,
        tracker: dto.tracker, // undefined -> Prisma applies default OTHER
        url: dto.url ?? null,
        status: dto.status, // undefined -> Prisma applies default OPEN
        userId,
      },
    });
  }

  /** AC-6: list the user's live tickets newest-first, optional status/tracker filter. */
  findAll(
    userId: string,
    filters: { status?: TicketStatus; tracker?: Tracker } = {},
  ): Promise<Ticket[]> {
    return this.prisma.ticket.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.tracker ? { tracker: filters.tracker } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** AC-7: fetch one of the user's live tickets, or 404. */
  async findOne(userId: string, id: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }
    return ticket;
  }

  /** AC-8: partial update of the user's own ticket; 404 otherwise, 409 on key clash. */
  async update(
    userId: string,
    id: string,
    dto: UpdateTicketDto,
  ): Promise<Ticket> {
    await this.findOne(userId, id); // ownership/existence check -> 404

    if (dto.key !== undefined) {
      await this.assertKeyAvailable(userId, dto.key, id);
    }

    const data: Prisma.TicketUpdateInput = {};
    if (dto.key !== undefined) data.key = dto.key;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.tracker !== undefined) data.tracker = dto.tracker;
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.ticket.update({ where: { id }, data });
  }

  /** AC-9: soft-delete the user's own ticket; 404 when missing or not theirs. */
  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id); // ownership check -> 404 if not theirs
    await this.prisma.ticket.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * AC-5: a user cannot have two *live* tickets with the same key. Soft-deleted
   * tickets are ignored, so a key frees up once its ticket is archived.
   * `exceptId` lets an update keep its own key.
   */
  private async assertKeyAvailable(
    userId: string,
    key: string,
    exceptId?: string,
  ): Promise<void> {
    const clash = await this.prisma.ticket.findFirst({
      where: {
        userId,
        key,
        deletedAt: null,
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
    });
    if (clash) {
      throw new ConflictException(`Ticket key "${key}" already exists`);
    }
  }
}

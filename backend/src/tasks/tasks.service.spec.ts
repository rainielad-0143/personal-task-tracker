import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Prisma, TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Unit tests for TasksService. Prisma is mocked, so these run without a
 * database and protect the AC logic (defaults, ordering, 404 mapping).
 */
describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TasksService);
  });

  describe('create', () => {
    it('passes status undefined so Prisma applies the TODO default (AC-6)', async () => {
      prisma.task.create.mockResolvedValue({ id: '1' });

      await service.create({ title: 'Write spec' });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Write spec',
          description: null,
          status: undefined,
          ticketRef: null,
          dueDate: null,
        },
      });
    });

    it('converts an ISO dueDate string to a Date', async () => {
      prisma.task.create.mockResolvedValue({ id: '1' });

      await service.create({ title: 'T', dueDate: '2026-07-01T00:00:00.000Z' });

      const [arg] = prisma.task.create.mock.calls[0] as [
        { data: { dueDate: Date } },
      ];
      expect(arg.data.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('orders by createdAt desc with no filter (AC-7)', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll();

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('filters by status when provided (AC-8)', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll(TaskStatus.IN_PROGRESS);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { status: TaskStatus.IN_PROGRESS },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the task when found (AC-9)', async () => {
      const task = { id: 'abc', title: 'T' };
      prisma.task.findUnique.mockResolvedValue(task);

      await expect(service.findOne('abc')).resolves.toBe(task);
    });

    it('throws 404 when the id does not exist (AC-9)', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('only sends provided fields to Prisma (AC-10)', async () => {
      prisma.task.update.mockResolvedValue({ id: '1' });

      await service.update('1', { title: 'New title' });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'New title' },
      });
    });

    it('maps Prisma P2025 to a 404 (AC-11)', async () => {
      prisma.task.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: '6',
        }),
      );

      await expect(service.update('missing', { title: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('maps Prisma P2025 to a 404 (AC-14)', async () => {
      prisma.task.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: '6',
        }),
      );

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('resolves when the delete succeeds (AC-13)', async () => {
      prisma.task.delete.mockResolvedValue({ id: '1' });

      await expect(service.remove('1')).resolves.toBeUndefined();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';

/**
 * Unit tests for TasksService. Prisma is mocked, so these run without a
 * database and protect the AC logic (defaults, ordering, ownership scoping).
 */
describe('TasksService', () => {
  let service: TasksService;
  let prisma: {
    task: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      task: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
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
    it('stamps the userId and lets Prisma apply the TODO default (AC-6)', async () => {
      prisma.task.create.mockResolvedValue({ id: '1' });

      await service.create(USER_ID, { title: 'Write spec' });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: 'Write spec',
          description: null,
          status: undefined,
          ticketRef: null,
          dueDate: null,
          userId: USER_ID,
        },
      });
    });

    it('converts an ISO dueDate string to a Date', async () => {
      prisma.task.create.mockResolvedValue({ id: '1' });

      await service.create(USER_ID, {
        title: 'T',
        dueDate: '2026-07-01T00:00:00.000Z',
      });

      const [arg] = prisma.task.create.mock.calls[0] as [
        { data: { dueDate: Date } },
      ];
      expect(arg.data.dueDate).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('scopes to the user and orders by createdAt desc (AC-7)', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll(USER_ID);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('also filters by status when provided (AC-8)', async () => {
      prisma.task.findMany.mockResolvedValue([]);

      await service.findAll(USER_ID, TaskStatus.IN_PROGRESS);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, status: TaskStatus.IN_PROGRESS },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns the task when it belongs to the user (AC-9)', async () => {
      const task = { id: 'abc', title: 'T', userId: USER_ID };
      prisma.task.findFirst.mockResolvedValue(task);

      await expect(service.findOne(USER_ID, 'abc')).resolves.toBe(task);
      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: { id: 'abc', userId: USER_ID },
      });
    });

    it('throws 404 when the id is missing or owned by another user (AC-9)', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne(USER_ID, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('only sends provided fields after an ownership check (AC-10)', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: '1', userId: USER_ID });
      prisma.task.update.mockResolvedValue({ id: '1' });

      await service.update(USER_ID, '1', { title: 'New title' });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { title: 'New title' },
      });
    });

    it('throws 404 without updating when the task is not the user’s (AC-11)', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(
        service.update(USER_ID, 'missing', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws 404 without deleting when the task is not the user’s (AC-14)', async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.task.delete).not.toHaveBeenCalled();
    });

    it('deletes the user’s own task (AC-13)', async () => {
      prisma.task.findFirst.mockResolvedValue({ id: '1', userId: USER_ID });
      prisma.task.delete.mockResolvedValue({ id: '1' });

      await expect(service.remove(USER_ID, '1')).resolves.toBeUndefined();
      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TicketStatus, Tracker } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';

const USER_ID = 'user-1';

/**
 * Unit tests for TicketsService. Prisma is mocked, so these run without a
 * database and protect the AC logic (defaults, scoping, soft-delete, key 409).
 */
describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: {
    ticket: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      ticket: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(TicketsService);
  });

  describe('create', () => {
    it('stamps the userId and lets Prisma apply enum defaults (AC-1)', async () => {
      prisma.ticket.findFirst.mockResolvedValue(null); // key free
      prisma.ticket.create.mockResolvedValue({ id: '1' });

      await service.create(USER_ID, { key: 'PROJ-1' });

      expect(prisma.ticket.create).toHaveBeenCalledWith({
        data: {
          key: 'PROJ-1',
          title: null,
          tracker: undefined,
          url: null,
          status: undefined,
          userId: USER_ID,
        },
      });
    });

    it('rejects a duplicate live key with 409 (AC-5)', async () => {
      prisma.ticket.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(USER_ID, { key: 'PROJ-1' })).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.ticket.create).not.toHaveBeenCalled();
    });

    it('only considers live (non-deleted) tickets for the key check (AC-5)', async () => {
      prisma.ticket.findFirst.mockResolvedValue(null);
      prisma.ticket.create.mockResolvedValue({ id: '1' });

      await service.create(USER_ID, { key: 'PROJ-1' });

      expect(prisma.ticket.findFirst).toHaveBeenCalledWith({
        where: { userId: USER_ID, key: 'PROJ-1', deletedAt: null },
      });
    });
  });

  describe('findAll', () => {
    it('scopes to the user, excludes soft-deleted, newest-first (AC-6)', async () => {
      prisma.ticket.findMany.mockResolvedValue([]);

      await service.findAll(USER_ID);

      expect(prisma.ticket.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('adds status and tracker filters when provided (AC-6)', async () => {
      prisma.ticket.findMany.mockResolvedValue([]);

      await service.findAll(USER_ID, {
        status: TicketStatus.OPEN,
        tracker: Tracker.JIRA,
      });

      expect(prisma.ticket.findMany).toHaveBeenCalledWith({
        where: {
          userId: USER_ID,
          deletedAt: null,
          status: TicketStatus.OPEN,
          tracker: Tracker.JIRA,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('returns a live ticket owned by the user (AC-7)', async () => {
      const ticket = { id: 'abc', userId: USER_ID };
      prisma.ticket.findFirst.mockResolvedValue(ticket);

      await expect(service.findOne(USER_ID, 'abc')).resolves.toBe(ticket);
      expect(prisma.ticket.findFirst).toHaveBeenCalledWith({
        where: { id: 'abc', userId: USER_ID, deletedAt: null },
      });
    });

    it('throws 404 when missing, deleted, or another user’s (AC-7)', async () => {
      prisma.ticket.findFirst.mockResolvedValue(null);

      await expect(service.findOne(USER_ID, 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('sends only provided fields after an ownership check (AC-8)', async () => {
      prisma.ticket.findFirst.mockResolvedValue({ id: '1', userId: USER_ID });
      prisma.ticket.update.mockResolvedValue({ id: '1' });

      await service.update(USER_ID, '1', { status: TicketStatus.CLOSED });

      expect(prisma.ticket.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: TicketStatus.CLOSED },
      });
    });

    it('throws 404 without updating when not the user’s (AC-8)', async () => {
      prisma.ticket.findFirst.mockResolvedValue(null);

      await expect(
        service.update(USER_ID, 'missing', { title: 'x' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });

    it('rejects a key change that clashes with another live ticket (409)', async () => {
      prisma.ticket.findFirst
        .mockResolvedValueOnce({ id: '1', userId: USER_ID }) // ownership ok
        .mockResolvedValueOnce({ id: '2' }); // key taken by another

      await expect(
        service.update(USER_ID, '1', { key: 'TAKEN' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws 404 without touching the row when not the user’s (AC-9)', async () => {
      prisma.ticket.findFirst.mockResolvedValue(null);

      await expect(service.remove(USER_ID, 'missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.ticket.update).not.toHaveBeenCalled();
    });

    it('soft-deletes by stamping deletedAt (AC-9)', async () => {
      prisma.ticket.findFirst.mockResolvedValue({ id: '1', userId: USER_ID });
      prisma.ticket.update.mockResolvedValue({ id: '1' });

      await expect(service.remove(USER_ID, '1')).resolves.toBeUndefined();
      const [arg] = prisma.ticket.update.mock.calls[0] as [
        { where: { id: string }; data: { deletedAt: Date } },
      ];
      expect(arg.where).toEqual({ id: '1' });
      expect(arg.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});

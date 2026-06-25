import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TicketStatus, Tracker } from '@prisma/client';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

/**
 * Controller-level behavior that isn't in the service: the empty-body guard
 * (AC-8) and forwarding the status/tracker filters to the service (AC-6).
 */
describe('TicketsController', () => {
  let controller: TicketsController;
  let service: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useValue: service }],
    }).compile();

    controller = module.get(TicketsController);
  });

  const user = { id: 'user-1', email: 'a@b.com' };

  it('rejects an empty update body with 400 (AC-8)', () => {
    expect(() => controller.update(user, 'id', {})).toThrow(
      BadRequestException,
    );
    expect(service.update).not.toHaveBeenCalled();
  });

  it('forwards a non-empty update to the service with the user id (AC-8)', () => {
    service.update.mockResolvedValue({ id: 'id' });

    void controller.update(user, 'id', { title: 'x' });

    expect(service.update).toHaveBeenCalledWith(user.id, 'id', { title: 'x' });
  });

  it('passes the user id and both filters through to the service (AC-6)', () => {
    service.findAll.mockResolvedValue([]);

    void controller.findAll(user, {
      status: TicketStatus.OPEN,
      tracker: Tracker.GITHUB,
    });

    expect(service.findAll).toHaveBeenCalledWith(user.id, {
      status: TicketStatus.OPEN,
      tracker: Tracker.GITHUB,
    });
  });
});

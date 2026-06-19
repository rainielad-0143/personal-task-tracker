import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

/**
 * Controller-level behavior that isn't in the service: the empty-body guard
 * (AC-12) and forwarding the status filter to the service.
 */
describe('TasksController', () => {
  let controller: TasksController;
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
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: service }],
    }).compile();

    controller = module.get(TasksController);
  });

  it('rejects an empty update body with 400 (AC-12)', () => {
    expect(() => controller.update('id', {})).toThrow(BadRequestException);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('forwards a non-empty update to the service (AC-10)', () => {
    service.update.mockResolvedValue({ id: 'id' });

    void controller.update('id', { title: 'x' });

    expect(service.update).toHaveBeenCalledWith('id', { title: 'x' });
  });

  it('passes the status filter through to the service (AC-8)', () => {
    service.findAll.mockResolvedValue([]);

    void controller.findAll({ status: TaskStatus.DONE });

    expect(service.findAll).toHaveBeenCalledWith(TaskStatus.DONE);
  });
});

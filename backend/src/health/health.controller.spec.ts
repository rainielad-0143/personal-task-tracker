import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  const prismaMock = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('returns ok status with db up when the query succeeds', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(result.status).toBe('ok');
    expect(result.db).toBe('up');
    expect(typeof result.uptime).toBe('number');
    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('propagates the error when the database is unreachable', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));

    await expect(controller.check()).rejects.toThrow('connection refused');
  });
});

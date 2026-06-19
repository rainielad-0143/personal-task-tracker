import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Liveness/readiness probe used by the CI/CD deploy pipeline (Phase 5).
 * `GET /health` returns 200 when the process is up AND the database answers a
 * trivial query; it throws (→ 500) when the DB is unreachable, so the deploy
 * "Verify" step can `curl -f` it and trigger rollback on failure.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: string; db: string; uptime: number }> {
    await this.prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      db: 'up',
      uptime: Math.round(process.uptime()),
    };
  }
}

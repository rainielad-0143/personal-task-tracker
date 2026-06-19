import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Liveness/readiness probe used by the CI/CD deploy pipeline (Phase 5).
 * `GET /health` returns 200 when the process is up AND the database answers a
 * trivial query; it returns 503 (carrying the underlying DB error message) when
 * the database is unreachable, so the deploy "Verify" step can `curl -f` it and
 * trigger rollback — while still making the real cause visible for debugging.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: string; db: string; uptime: number }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      // Surface the real DB error (e.g. missing DATABASE_URL, unreachable host)
      // instead of an opaque 500.
      throw new ServiceUnavailableException((err as Error).message);
    }
    return {
      status: 'ok',
      db: 'up',
      uptime: Math.round(process.uptime()),
    };
  }
}

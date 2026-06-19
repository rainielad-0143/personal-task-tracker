import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin NestJS-managed wrapper around PrismaClient.
 *
 * We deliberately do NOT eagerly `$connect()` on module init: in a serverless
 * environment (Vercel) that would make the whole function fail to boot if the
 * database is unreachable or `DATABASE_URL` is unset. PrismaClient connects
 * lazily on the first query instead, so connection errors surface as catchable
 * per-request errors rather than an opaque FUNCTION_INVOCATION_FAILED.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

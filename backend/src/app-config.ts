import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Shared runtime configuration applied to the Nest app by both the standalone
 * server (`main.ts`) and the Vercel serverless handler (`api/index.ts`), so the
 * two entry points never drift apart.
 */
export function configureApp(app: INestApplication): void {
  // Global validation: strip unknown props, reject extras, and run the
  // class-validator decorators on every DTO so bad input becomes a 400.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Allow browser frontends (Vite dev server / deployed SPA) to call the API.
  app.enableCors();
}

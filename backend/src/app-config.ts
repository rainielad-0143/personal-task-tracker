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

  // Restrict CORS to known frontend origins. Defaults cover the local Vite dev
  // server and the deployed SPA; override/extend with CORS_ORIGIN (comma-separated).
  const defaultOrigins = [
    'http://localhost:5173',
    'https://personal-task-tracker-kappa-ebon.vercel.app',
  ];
  const configured = process.env.CORS_ORIGIN?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: configured ?? defaultOrigins });
}

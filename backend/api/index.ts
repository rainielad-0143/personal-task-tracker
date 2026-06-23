import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';

// Vercel serverless entry point for the NestJS API.
//
// Vercel runs functions, not a long-lived server, so we never call
// `app.listen()`. Instead we initialise Nest onto a shared Express instance and
// hand each request to it. The Express instance and the bootstrap promise are
// cached at module scope so warm invocations skip re-initialisation.
//
// AppModule and configureApp are imported *dynamically inside* bootstrap rather
// than at the top of the file on purpose: a static import that throws while the
// module graph loads (e.g. a native addon that can't load, or a Prisma client
// that wasn't generated) crashes the function before the handler's try/catch
// runs, so Vercel only shows an opaque FUNCTION_INVOCATION_FAILED. Loading them
// lazily keeps any such failure inside the catch below, where we return the
// real reason in the response body.
const server = express();
let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  // Loaded with require (not a static import) so a throw while the module graph
  // initialises is caught by the handler below instead of killing the function
  // at load time. Extensionless require matches the resolution the static
  // import used, which already works on Vercel.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { AppModule } = require('../src/app.module') as typeof import('../src/app.module');
  const { configureApp } = require('../src/app-config') as typeof import('../src/app-config');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  configureApp(app);
  await app.init();
}

export default async function handler(req: Request, res: Response) {
  try {
    if (!bootstrapped) bootstrapped = bootstrap();
    await bootstrapped;
  } catch (err) {
    // Don't cache a rejected bootstrap — otherwise a warm instance stays broken
    // even after the cause (e.g. a missing env var) is fixed. Reset so the next
    // request retries, and surface the real reason instead of a blank 500.
    bootstrapped = null;
    console.error('Nest bootstrap failed:', err);
    res
      .status(500)
      .json({ error: 'Bootstrap failed', message: (err as Error).message });
    return;
  }
  server(req, res);
}

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Request, type Response } from 'express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app-config';

// Vercel serverless entry point for the NestJS API.
//
// Vercel runs functions, not a long-lived server, so we never call
// `app.listen()`. Instead we initialise Nest onto a shared Express instance and
// hand each request to it. The Express instance and the bootstrap promise are
// cached at module scope so warm invocations skip re-initialisation.
const server = express();
let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  configureApp(app);
  await app.init();
}

export default async function handler(req: Request, res: Response) {
  if (!bootstrapped) bootstrapped = bootstrap();
  await bootstrapped;
  server(req, res);
}

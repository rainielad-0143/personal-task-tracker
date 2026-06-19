import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface TaskResponse {
  id: string;
  title: string;
  status: string;
}

/**
 * End-to-end coverage of the HTTP contract (status codes, validation,
 * ordering, filtering). Runs against the real database configured in .env,
 * so it requires that DB to be reachable. Created rows are cleaned up after.
 *
 * Run with: npm run test:e2e
 */
describe('Tasks (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const createdIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (createdIds.length) {
      await prisma.task.deleteMany({ where: { id: { in: createdIds } } });
    }
    await app.close();
  });

  const create = (body: Record<string, unknown>) =>
    request(app.getHttpServer()).post('/tasks').send(body);

  /** Create a task via the API and remember its id for cleanup. */
  const createTracked = async (
    body: Record<string, unknown>,
  ): Promise<TaskResponse> => {
    const res = await create(body).expect(201);
    const task = res.body as TaskResponse;
    createdIds.push(task.id);
    return task;
  };

  it('POST /tasks creates a task and defaults status to TODO (AC-5, AC-6)', async () => {
    const task = await createTracked({ title: 'E2E task' });
    expect(task).toMatchObject({ title: 'E2E task', status: 'TODO' });
    expect(task.id).toBeDefined();
  });

  it('POST /tasks without a title is rejected with 400 (AC-2)', async () => {
    await create({ description: 'no title' }).expect(400);
    await create({ title: '   ' }).expect(400); // whitespace-only
  });

  it('POST /tasks with an invalid status is rejected with 400 (AC-3)', async () => {
    await create({ title: 'bad', status: 'NOPE' }).expect(400);
  });

  it('GET /tasks returns newest-first (AC-7)', async () => {
    const older = await createTracked({ title: 'older' });
    const newer = await createTracked({ title: 'newer' });

    const res = await request(app.getHttpServer()).get('/tasks').expect(200);
    const ids = (res.body as TaskResponse[]).map((t) => t.id);
    expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
  });

  it('GET /tasks?status=BAD is rejected with 400 (AC-8)', async () => {
    await request(app.getHttpServer()).get('/tasks?status=BAD').expect(400);
  });

  it('GET /tasks/:id returns 404 for an unknown id (AC-9)', async () => {
    await request(app.getHttpServer())
      .get('/tasks/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });

  it('PATCH /tasks/:id updates fields and refreshes the task (AC-10)', async () => {
    const created = await createTracked({ title: 'to edit' });

    const res = await request(app.getHttpServer())
      .patch(`/tasks/${created.id}`)
      .send({ status: 'DONE' })
      .expect(200);
    const updated = res.body as TaskResponse;
    expect(updated.status).toBe('DONE');
    expect(updated.title).toBe('to edit');
  });

  it('PATCH /tasks/:id with an empty body is rejected with 400 (AC-12)', async () => {
    const created = await createTracked({ title: 'empty patch' });

    await request(app.getHttpServer())
      .patch(`/tasks/${created.id}`)
      .send({})
      .expect(400);
  });

  it('PATCH /tasks/:id returns 404 for an unknown id (AC-11)', async () => {
    await request(app.getHttpServer())
      .patch('/tasks/00000000-0000-0000-0000-000000000000')
      .send({ title: 'x' })
      .expect(404);
  });

  it('DELETE /tasks/:id returns 204 and the task is then 404 (AC-13)', async () => {
    const res = await create({ title: 'to delete' }).expect(201);
    const created = res.body as TaskResponse;

    await request(app.getHttpServer())
      .delete(`/tasks/${created.id}`)
      .expect(204);
    await request(app.getHttpServer()).get(`/tasks/${created.id}`).expect(404);
  });

  it('DELETE /tasks/:id returns 404 for an unknown id (AC-14)', async () => {
    await request(app.getHttpServer())
      .delete('/tasks/00000000-0000-0000-0000-000000000000')
      .expect(404);
  });
});

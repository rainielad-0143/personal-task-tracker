# Personal Task & Work Tracker

A single-user app to track daily tasks, ticket references, work hours, daily reports,
accomplishments, and blockers.

- **Frontend:** React + Vite + TypeScript (`frontend/`)
- **Backend:** NestJS + TypeScript (`backend/`)
- **Database:** PostgreSQL via Prisma ORM

> Status: the **Tasks** domain (CRUD + status filter) is implemented. Time Entries,
> Daily Reports, and Tickets are planned (see `spec.md` / `requirements.md`).

## Quick start

### 1. Database (Docker)

```bash
docker run -d --name task-tracker-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=task_tracker \
  -p 5432:5432 postgres:16-alpine
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # adjust DATABASE_URL / PORT if needed
npm install
npx prisma generate
npx prisma migrate deploy
npm run start:dev             # or: npm run build && npm run start:prod
```

API: `http://localhost:3000` (health check at `GET /health`).

### 3. Frontend

```bash
cd frontend
cp .env.example .env          # set VITE_API_URL to the backend URL
npm install
npm run dev
```

App: `http://localhost:5173`.

## Common commands

| | Backend (`cd backend`) | Frontend (`cd frontend`) |
|---|---|---|
| Dev | `npm run start:dev` | `npm run dev` |
| Test | `npm run test` | `npm run test` |
| Lint | `npm run lint` | `npm run lint` |
| Build | `npm run build` | `npm run build` |

## Deploy to Vercel

The frontend and backend are separate npm packages, so deploy them as **two
Vercel projects from this same repo** (set a different *Root Directory* for each).

### Backend project (NestJS → serverless function)

- **Root Directory:** `backend`
- Runs as a Vercel function via `backend/api/index.ts` (it initialises Nest onto
  Express and never calls `listen()`); `backend/vercel.json` routes every path to it.
- **Environment variable:** `DATABASE_URL` — point at a **serverless** Postgres
  (Neon / Supabase / Vercel Postgres) and use its **pooled** connection string
  (e.g. Neon's `-pooler` host, or append `?pgbouncer=true&connection_limit=1`).
  A normal long-lived Postgres will exhaust connections under serverless.
- `prisma generate` runs automatically on install (`postinstall`), and the schema
  includes the `rhel-openssl-3.0.x` binary target for Vercel's runtime.
- **Run migrations once** against the prod DB (Vercel doesn't run them for you):
  ```bash
  cd backend && DATABASE_URL="<prod-pooled-url>" npx prisma migrate deploy
  ```
- Health check after deploy: `GET https://<backend>.vercel.app/health`.

### Frontend project (Vite SPA)

- **Root Directory:** `frontend`
- `frontend/vercel.json` sets framework `vite`, output `dist`, and an SPA rewrite.
- **Environment variable:** `VITE_API_URL` = the backend project's URL, e.g.
  `https://<backend>.vercel.app` (set it before building — Vite inlines it).

> CORS is currently open (`app.enableCors()`); lock it to the frontend origin
> before any real production use.

See `CLAUDE.md` for project conventions and `spec.md` / `requirements.md` for scope.

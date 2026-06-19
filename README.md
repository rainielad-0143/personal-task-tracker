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

See `CLAUDE.md` for project conventions and `spec.md` / `requirements.md` for scope.

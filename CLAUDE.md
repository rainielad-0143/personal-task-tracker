# CLAUDE.md — Instructions for AI Assistant

## Project Overview

**Personal Task & Work Tracker** — a single-user app to track daily tasks, ticket
references, daily reports, work hours, accomplishments, and blockers.

- **Frontend:** React + Vite + TypeScript
- **Backend:** NestJS (TypeScript)
- **Database:** PostgreSQL (via Prisma ORM)

## Core Domains

- **Tasks** — daily tasks with status, ticket reference, optional links
- **Time Entries** — work hours logged against tasks/tickets
- **Daily Reports** — accomplishments + blockers, rolled up per day
- **Tickets** — references to external issue trackers (Jira/GitHub/etc.)

## General Rules

- Commit message language: English; Conventional Commits (`feat:`, `fix:`, `chore:` …)
- Branch naming: `feature/<short-description>` or `fix/<short-description>`
- All non-trivial logic must have tests
- Keep frontend and backend types in sync; prefer shared DTO shapes
- Never commit secrets — use `.env` files (gitignored) and `settings.local.json`

## Project Structure

- `frontend/` — React + Vite SPA (TypeScript)
- `backend/` — NestJS API (TypeScript) + Prisma schema in `backend/prisma/`
- `docs/specs/`, `docs/product/requirements.md`, `docs/product/issues.md`, `docs/qa/bug-report.md` — specs, scope, notes
- `.claude/` — Claude Code config & slash commands (see below)
- `.github/` — issue templates (Epic, Sub-issue, Bug) and CI workflow

## Slash Commands

Defined in `.claude/commands/` — type `/<name> <args>`:

- `/feature <description>` — plan-then-implement a feature across FE/BE
- `/fix-bug <expected vs actual + repro>` — reproduce, diagnose, fix (failing test first)
- `/review <diff or "the staged changes">` — review against project conventions
- `/write-tests <files + behavior>` — add tests to existing logic
- `/record-feedback <name>` — record AI-assist feedback to `feedback/<name>.json` (Phase 6)
- `/improve-checklist [name]` — propose checklist improvements from feedback (Phase 6)
- `/aggregate-feedback [period]` — aggregate AI-effectiveness metrics + trend report (Phase 6)

Agent Skills live in `.claude/skills/`:

- `deploy-check` — pre-deploy readiness gate (lint/test/build + GitHub signals → GO/NO-GO)

> `.claude/settings.json` is shared/committed. `.claude/settings.local.json` is per-machine
> (incl. MCP servers) and **gitignored** — never commit it.

## MCP

Project-scoped, committable MCP config is in `.mcp.json` (GitHub MCP server). The PAT
is read from `GITHUB_PERSONAL_ACCESS_TOKEN` (env or gitignored local settings) — never
hardcode it.

## CI / Deployment (Phase 5)

Pipeline templates live in `.github/workflows/`: `ci.yml` (lint+test+build gate),
`deploy-backend.yml` and `deploy-frontend.yml` (build → backup → deploy → verify
`/health` → auto-rollback on failure). Path filters are scoped to `Day5/Rainiel/**`.

> ⚠️ GitHub only runs workflows from the **repo root** `.github/workflows/`. These
> files sit under `Day5/Rainiel/` as deliverables/templates — copy them to the repo
> root to make them live. The backend exposes `GET /health` for the verify step.

## Common Commands

> These work once the apps are scaffolded (Phase 0, Step 5).

**Frontend** (`cd frontend`)

- Dev server: `npm run dev`
- Test: `npm run test`
- Lint: `npm run lint`
- Build: `npm run build`

**Backend** (`cd backend`)

- Dev server: `npm run start:dev`
- Test: `npm run test`
- Lint: `npm run lint`
- Build: `npm run build`
- Prisma migrate: `npx prisma migrate dev`
- Prisma studio: `npx prisma studio`

## Important Notes

- Run tests and lint before opening a PR
- Use Prisma migrations for all schema changes — never edit the DB by hand
- Update this CLAUDE.md when conventions or commands change

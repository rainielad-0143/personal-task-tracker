# Spec — Personal Task & Work Tracker

**Status:** Draft
**Author:** Rainiel
**Source:** Derived from [`requirements.md`](../product/requirements.md)

A single-user app to track daily tasks, ticket references, work hours, daily reports, and
overall progress. This document is the **index** for the per-module specs and the home of
the **shared conventions** every module follows.

## Modules

| Module | Spec | Summary |
| :-- | :-- | :-- |
| **Tasks** | [`spec-tasks.md`](spec-tasks.md) | Daily tasks with status, due date, and an optional ticket link. |
| **Tickets** | [`spec-tickets.md`](spec-tickets.md) | First-class references to external issue trackers (Jira/GitHub/Other). |
| **Time Entries** | [`spec-time-entries.md`](spec-time-entries.md) | Work hours logged against a task and/or ticket via start/end timestamps. |
| **Daily Reports** | [`spec-daily-reports.md`](spec-daily-reports.md) | Per-day accomplishments + blockers, with an auto roll-up of tasks done and hours logged. |
| **Dashboard** | [`spec-dashboard.md`](spec-dashboard.md) | Read-only aggregate view across the other modules. |

## Module relationships

```
User ──┬── Task ──────────────┐
       ├── Ticket ─────────────┤
       ├── TimeEntry ── (Task? / Ticket?)
       └── DailyReport (per date)

Task.ticketId      → Ticket            (optional link)
TimeEntry.taskId   → Task              (optional)
TimeEntry.ticketId → Ticket            (optional)   // at least one of task/ticket required
DailyReport        → derived: tasks completed + minutes logged on its date
Dashboard          → read-only aggregates over all of the above
```

## Shared Conventions

These apply to **every** module spec; module files do not repeat them.

### Auth & user-scoping

Email + password; the server issues a JWT sent as `Authorization: Bearer <token>` on every
request. Every entity is **owned by a user**; `userId` is derived from the JWT and is never
accepted in a request body. A user only ever sees and mutates their own (non-deleted) rows;
accessing another user's row is indistinguishable from "not found".

| Method | Path | Body | Success | Description |
| :-- | :-- | :-- | :-- | :-- |
| `POST` | `/auth/register` | `{ email, password }` | `201` + `{ token, user }` | Self-serve signup |
| `POST` | `/auth/login` | `{ email, password }` | `200` + `{ token, user }` | Sign in |
| `GET` | `/auth/me` | — | `200` + `user` | Current user (validates a stored token) |

- `password` ≥ 8 chars; `email` normalised to lowercase and unique.
- `user` is `{ id, email }` — the password hash is never returned.

### `User` entity

| Field | Type | Constraints | Notes |
| :-- | :-- | :-- | :-- |
| `id` | `string` (UUID) | PK, generated | |
| `email` | `string` | required, unique | stored lowercased |
| `passwordHash` | `string` | required | bcrypt hash; never returned by the API |
| `createdAt` | `DateTime` | auto-set on create | |
| `updatedAt` | `DateTime` | auto-updated on change | |

### Soft delete

All user-owned entities (`Task`, `Ticket`, `TimeEntry`, `DailyReport`) carry a nullable
`deletedAt`. `DELETE` sets `deletedAt` instead of removing the row; all reads exclude rows
where `deletedAt` is non-null. This resolves `requirements.md` Q2/Q4: **logged hours are
never silently destroyed** by deleting a task or ticket.

- Deleting a **Ticket** that is referenced by tasks/time entries is allowed; the references
  remain but resolve to a soft-deleted ticket, surfaced in the UI as "archived". Links are
  not auto-nulled.
- Deleting a **Task** does not delete its time entries; the entries keep their `taskId`.

### Standard error responses

| Code | Meaning |
| :-- | :-- |
| `400` | Validation failure (missing/invalid fields, bad enum value, empty update body). |
| `401` | Missing/invalid/expired token, or wrong credentials on `/auth/login`. |
| `404` | Resource id not found, owned by another user, or already soft-deleted. |
| `409` | Uniqueness conflict (e.g. `/auth/register` with an existing email; per-date upsert clashes). |

### Conventions

- IDs are UUID strings; all timestamps are ISO 8601 strings in DTOs.
- Frontend and backend share DTO shapes (per `CLAUDE.md`).
- Schema changes happen only via Prisma migrations.

## Status

This is a **spec/documentation** deliverable. No schema, backend, or frontend code is
implemented by this document — each module is implemented later via `/feature`.

# Spec — Task Management (CRUD)

**Module:** Tasks · part of the **Personal Task & Work Tracker** (see [`spec.md`](spec.md) index)
**Status:** Draft
**Author:** Rainiel
**Source:** Derived from [`requirements.md`](../product/requirements.md)

> Decisions locked for v1:
> - **Statuses:** `TODO`, `IN_PROGRESS`, `DONE`
> - **Delete:** soft delete (`deletedAt`) — see [`spec.md` → Shared Conventions](spec.md#shared-conventions)
> - **Due date:** optional `dueDate` field included
> - **Sort:** list defaults to newest-created first
> - **Ticket link:** a task may reference a first-class `Ticket` via `ticketId` (see [`spec-tickets.md`](spec-tickets.md)); the free-text `ticketRef` is kept as a fallback.

---

## 1. Overview

A single-user CRUD feature for daily tasks. The backend (NestJS + Prisma) exposes a REST
API over a `Task` entity in PostgreSQL; the frontend (React + Vite + TS) provides a list
view with create, edit, delete, status-change, and status-filter interactions.

Auth, user-scoping, error codes, and soft-delete behavior are shared across all modules and
defined once in [`spec.md`](spec.md).

## 2. Data Model

### `Task` entity

| Field | Type | Constraints | Notes |
| :-- | :-- | :-- | :-- |
| `id` | `string` (UUID) | PK, generated | |
| `title` | `string` | required, 1–200 chars | |
| `description` | `string \| null` | optional, ≤ 2000 chars | |
| `status` | `TaskStatus` enum | required, default `TODO` | `TODO \| IN_PROGRESS \| DONE` |
| `ticketId` | `string \| null` | optional, FK → `Ticket.id` | linked ticket (same owner) |
| `ticketRef` | `string \| null` | optional, ≤ 100 chars | free-text fallback, e.g. `PROJ-123` or URL |
| `dueDate` | `DateTime \| null` | optional | date only is acceptable |
| `deletedAt` | `DateTime \| null` | soft-delete marker | non-null = archived |
| `createdAt` | `DateTime` | auto-set on create | |
| `updatedAt` | `DateTime` | auto-updated on change | |
| `userId` | `string` (UUID) | required, FK → `User.id` | owner; set from the auth token, never from the request body |

> Tasks are **owned by a user**. Every task endpoint is scoped to the authenticated
> user, so a user only ever sees and mutates their own tasks. `userId` is not part of
> the DTOs — it is derived from the JWT. If both `ticketId` and `ticketRef` are present,
> `ticketId` is authoritative; the referenced ticket must belong to the same user.

### Shared DTO shapes (frontend ↔ backend)

```ts
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  ticketId: string | null;
  ticketRef: string | null;
  dueDate: string | null; // ISO 8601
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}

interface CreateTaskDto {
  title: string;
  description?: string | null;
  status?: TaskStatus;       // defaults to "TODO"
  ticketId?: string | null;
  ticketRef?: string | null;
  dueDate?: string | null;
}

// All fields optional; at least one must be present.
type UpdateTaskDto = Partial<CreateTaskDto>;
```

## 3. API

Base path: `/tasks` — **all routes require a valid bearer token** and operate only on
the authenticated user's own, non-deleted tasks. Auth endpoints (`/auth/*`) are in
[`spec.md`](spec.md).

| Method | Path | Body | Success | Description |
| :-- | :-- | :-- | :-- | :-- |
| `POST` | `/tasks` | `CreateTaskDto` | `201` + `Task` | Create a task |
| `GET` | `/tasks` | — | `200` + `Task[]` | List tasks; optional `?status=` filter |
| `GET` | `/tasks/:id` | — | `200` + `Task` | Get one task |
| `PATCH` | `/tasks/:id` | `UpdateTaskDto` | `200` + `Task` | Update a task |
| `DELETE` | `/tasks/:id` | — | `204` | Soft-delete a task |

**Error responses** — standard set in [`spec.md` → Shared Conventions](spec.md#shared-conventions).
Module-specific: `400` for invalid `status` value or empty update body; `404` for an id not
found / owned by another user / already soft-deleted; `400` if `ticketId` does not reference
a ticket owned by the user.

## 4. UI Behavior

- **List view** — shows all tasks, newest-created first, displaying title, status badge,
  ticket (linked or free-text), and due date. Each row has edit and delete actions.
- **Status filter** — a control to filter by `TODO`, `IN_PROGRESS`, `DONE`, or "All".
- **Create** — a form/modal collecting title (required), description, status, ticket
  (pick a linked ticket or type a free-text ref), due date.
- **Edit** — same form pre-filled; on success the row reflects the changes.
- **Delete** — asks for confirmation, then removes the row on success.
- **Empty state** — a clear empty message when no tasks match the view.

## 5. Acceptance Criteria

### Data & validation
- **AC-1:** A `Task` is persisted with `id`, `title`, `status` (default `TODO`),
  `createdAt`, and `updatedAt`; `description`, `ticketId`, `ticketRef`, and `dueDate` are optional.
- **AC-2:** Creating a task **without a title** (missing or empty/whitespace) → `400`, not persisted.
- **AC-3:** A **status outside** `TODO | IN_PROGRESS | DONE` → `400`.
- **AC-4:** `title` > 200 chars or `description` > 2000 chars → `400`.
- **AC-4b:** `ticketId` that doesn't reference a ticket owned by the user → `400`.

### Create
- **AC-5:** `POST /tasks` with a valid body → `201` + the created `Task` (generated `id`, timestamps).
- **AC-6:** When `status` is omitted on create, the task is stored with status `TODO`.

### Read / list
- **AC-7:** `GET /tasks` returns all non-deleted tasks ordered by `createdAt` descending.
- **AC-8:** `GET /tasks?status=IN_PROGRESS` returns only that status; an invalid value → `400`.
- **AC-9:** `GET /tasks/:id` returns the matching task (`200`), or `404` if absent/deleted.

### Update
- **AC-10:** `PATCH /tasks/:id` with valid partial data updates only provided fields, → `200` + updated task, refreshes `updatedAt`.
- **AC-11:** `PATCH /tasks/:id` for a non-existent/deleted id → `404`.
- **AC-12:** `PATCH /tasks/:id` with an **empty body** → `400`.

### Delete
- **AC-13:** `DELETE /tasks/:id` soft-deletes (sets `deletedAt`) and → `204`; a subsequent `GET /tasks/:id` → `404`.
- **AC-14:** `DELETE /tasks/:id` for a non-existent/deleted id → `404`.

### Frontend
- **AC-15:** List renders all non-deleted tasks newest-first with title, status, ticket, due date, plus edit + delete actions.
- **AC-16:** Status filter narrows visible tasks; "All" restores the full list.
- **AC-17:** Creating a task via the UI adds it without a manual reload.
- **AC-18:** Editing a task via the UI reflects updated values.
- **AC-19:** Deleting a task via the UI asks for confirmation and removes the row.
- **AC-20:** When no tasks match the view, an empty-state message is shown.

## 6. Traceability

| Area | Acceptance Criteria |
| :-- | :-- |
| Data model & validation | AC-1 – AC-4b |
| Create API | AC-5, AC-6 |
| Read/List API | AC-7 – AC-9 |
| Update API | AC-10 – AC-12 |
| Delete API | AC-13, AC-14 |
| Frontend UI | AC-15 – AC-20 |

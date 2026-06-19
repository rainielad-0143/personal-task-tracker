# Spec — Task Management (CRUD)

**Feature:** Task Management for the **Personal Task & Work Tracker**
**Status:** Draft (Day 2 — Spec Generation)
**Author:** Rainiel
**Source:** Derived from [`requirements.md`](requirements.md)

> Decisions locked for v1 (from requirements open questions):
> - **Statuses:** `TODO`, `IN_PROGRESS`, `DONE`
> - **Delete:** hard delete (revisit Day 4)
> - **Due date:** optional `dueDate` field included
> - **Sort:** list defaults to newest-created first

---

## 1. Overview

A single-user CRUD feature for daily tasks. The backend (NestJS + Prisma) exposes a REST
API over a `Task` entity in PostgreSQL; the frontend (React + Vite + TS) provides a list
view with create, edit, delete, status-change, and status-filter interactions.

## 2. Data Model

### `Task` entity

| Field | Type | Constraints | Notes |
| :-- | :-- | :-- | :-- |
| `id` | `string` (UUID) | PK, generated | |
| `title` | `string` | required, 1–200 chars | |
| `description` | `string \| null` | optional, ≤ 2000 chars | |
| `status` | `TaskStatus` enum | required, default `TODO` | `TODO \| IN_PROGRESS \| DONE` |
| `ticketRef` | `string \| null` | optional, ≤ 100 chars | free text, e.g. `PROJ-123` or URL |
| `dueDate` | `DateTime \| null` | optional | date only is acceptable |
| `createdAt` | `DateTime` | auto-set on create | |
| `updatedAt` | `DateTime` | auto-updated on change | |

### Shared DTO shapes (frontend ↔ backend)

```ts
type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  ticketRef: string | null;
  dueDate: string | null; // ISO 8601
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}

interface CreateTaskDto {
  title: string;
  description?: string | null;
  status?: TaskStatus;       // defaults to "TODO"
  ticketRef?: string | null;
  dueDate?: string | null;
}

// All fields optional; at least one must be present.
type UpdateTaskDto = Partial<CreateTaskDto>;
```

## 3. API

Base path: `/tasks`

| Method | Path | Body | Success | Description |
| :-- | :-- | :-- | :-- | :-- |
| `POST` | `/tasks` | `CreateTaskDto` | `201` + `Task` | Create a task |
| `GET` | `/tasks` | — | `200` + `Task[]` | List tasks; optional `?status=` filter |
| `GET` | `/tasks/:id` | — | `200` + `Task` | Get one task |
| `PATCH` | `/tasks/:id` | `UpdateTaskDto` | `200` + `Task` | Update a task |
| `DELETE` | `/tasks/:id` | — | `204` | Delete a task |

**Error responses**

- `400` — validation failure (missing/invalid fields, bad status value, empty update body).
- `404` — task id not found (`GET`/`PATCH`/`DELETE`).

## 4. UI Behavior

- **List view** — shows all tasks, newest-created first, displaying title, status badge,
  ticket ref, and due date. Each row has edit and delete actions.
- **Status filter** — a control (e.g. tabs/dropdown) to filter by `TODO`, `IN_PROGRESS`,
  `DONE`, or "All".
- **Create** — a form/modal collecting title (required), description, status, ticket ref,
  due date. On success the new task appears in the list.
- **Edit** — same form pre-filled; on success the row reflects the changes.
- **Delete** — asks for confirmation, then removes the row on success.
- **Empty state** — when there are no tasks (or none match the filter), show a clear empty
  message instead of a blank list.

## 5. Acceptance Criteria

### Data & validation
- **AC-1:** A `Task` is persisted with `id`, `title`, `status` (default `TODO`),
  `createdAt`, and `updatedAt`; `description`, `ticketRef`, and `dueDate` are optional.
- **AC-2:** Creating a task **without a title** (missing or empty/whitespace) is rejected
  with `400` and the task is not persisted.
- **AC-3:** Creating or updating a task with a **status outside** `TODO | IN_PROGRESS |
  DONE` is rejected with `400`.
- **AC-4:** `title` longer than 200 chars or `description` longer than 2000 chars is
  rejected with `400`.

### Create
- **AC-5:** `POST /tasks` with a valid body returns `201` and the created `Task`, including
  a generated `id` and timestamps.
- **AC-6:** When `status` is omitted on create, the task is stored with status `TODO`.

### Read / list
- **AC-7:** `GET /tasks` returns all tasks ordered by `createdAt` descending (newest first).
- **AC-8:** `GET /tasks?status=IN_PROGRESS` returns only tasks with that status; an invalid
  `status` query value returns `400`.
- **AC-9:** `GET /tasks/:id` returns the matching task (`200`), or `404` if no task has
  that id.

### Update
- **AC-10:** `PATCH /tasks/:id` with valid partial data updates only the provided fields,
  returns `200` + the updated task, and refreshes `updatedAt`.
- **AC-11:** `PATCH /tasks/:id` for a non-existent id returns `404`.
- **AC-12:** `PATCH /tasks/:id` with an **empty body** (no fields) is rejected with `400`.

### Delete
- **AC-13:** `DELETE /tasks/:id` removes the task and returns `204`; a subsequent
  `GET /tasks/:id` returns `404`.
- **AC-14:** `DELETE /tasks/:id` for a non-existent id returns `404`.

### Frontend
- **AC-15:** The list view renders all tasks newest-first with title, status, ticket ref,
  and due date, and exposes edit + delete actions per task.
- **AC-16:** The status filter narrows the visible tasks to the selected status, and "All"
  restores the full list.
- **AC-17:** Creating a task via the UI adds it to the list without a manual page reload.
- **AC-18:** Editing a task via the UI reflects the updated values in the list.
- **AC-19:** Deleting a task via the UI asks for confirmation and removes the row on success.
- **AC-20:** When no tasks match the current view, an empty-state message is shown.

## 6. Traceability

| Area | Acceptance Criteria |
| :-- | :-- |
| Data model & validation | AC-1 – AC-4 |
| Create API | AC-5, AC-6 |
| Read/List API | AC-7 – AC-9 |
| Update API | AC-10 – AC-12 |
| Delete API | AC-13, AC-14 |
| Frontend UI | AC-15 – AC-20 |

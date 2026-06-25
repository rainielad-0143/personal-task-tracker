# Requirements — Task Management (CRUD)

**Feature:** Task Management for the **Personal Task & Work Tracker**
**Status:** Draft (Day 2 — Requirements Analysis)
**Author:** Rainiel

---

## 1. Problem

The user needs a single place to capture and manage their **daily tasks**. Today these
live scattered across notes, chat messages, and external ticket trackers, so it is hard to
see what is in progress, what is done, and which external ticket a task maps to. Without a
reliable task list, daily reports and time tracking (other domains in the app) have nothing
solid to build on.

## 2. Goals

- Let the single user **create, read, update, and delete** tasks quickly.
- Track each task's **status** through its lifecycle (e.g. To Do → In Progress → Done).
- Optionally associate a task with an **external ticket reference** (Jira/GitHub/etc.).
- Provide a clear **list view** of tasks that can be filtered by status.
- Keep the data model clean enough that **Time Entries** and **Daily Reports** can later
  reference tasks without rework.

### Non-goals (for this feature)

- No multi-user support, sharing, or permissions (the app is single-user).
- No time logging UI — that is the separate **Time Entries** domain.
- No daily report roll-up — that is the separate **Daily Reports** domain.
- No real integration/sync with external trackers — only a free-text/reference field.

## 3. Actors

| Actor | Description |
| :-- | :-- |
| **User** | The single owner of the app. Creates and manages their own tasks. |
| **System** | Backend (NestJS + Prisma) that validates, persists, and serves tasks. |

## 4. In Scope

- A `Task` entity persisted in PostgreSQL via Prisma.
- Backend CRUD API endpoints for tasks.
- Frontend UI to list, create, edit, delete, and change the status of tasks.
- Status filtering on the list view.
- Validation of required fields and allowed status values.

## 5. Out of Scope

- Authentication / authorization (single-user, no login for this feature).
- Pagination and full-text search (acceptable for an expected small task volume).
- Subtasks, tags, priorities, due-date reminders/notifications.
- Bulk operations (multi-select delete, batch status change).
- Live two-way sync with Jira/GitHub.

## 6. Assumptions

- Single user; no concept of task ownership beyond "the user".
- Task volume is small (tens to low hundreds), so no pagination is needed yet.
- The external ticket reference is a **free-text string** (e.g. `PROJ-123` or a URL), not a
  validated/linked entity.
- Frontend and backend share DTO shapes per `CLAUDE.md` conventions.
- PostgreSQL + Prisma are available and migrations are the only way schema changes happen.

## 7. Open Questions

- **Q1:** What is the exact set of allowed statuses? Proposed: `TODO`, `IN_PROGRESS`,
  `DONE`. Should a `BLOCKED` or `CANCELLED` status exist now, or wait for Day 4 hardening?
- **Q2:** ~~Should deleting a task be a **hard delete** or a **soft delete** (archive)?~~
  **LOCKED → soft delete** (`deletedAt`) across all entities. See [`spec.md` → Shared Conventions](spec.md#shared-conventions).
- **Q3:** Is a **due date** field needed in v1, or is it deferred to a later day?
- **Q4:** ~~When a task is deleted, what happens to any future Time Entries linked to it?~~
  **LOCKED → preserved.** Soft-deleting a task/ticket never removes its time entries; the
  links remain and resolve to an "archived" row. See [`spec-time-entries.md`](spec-time-entries.md) AC-10.
- **Q5:** Default sort order of the task list — by created date (newest first) or by status?

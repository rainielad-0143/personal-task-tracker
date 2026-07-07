# Spec — Tickets Management

**Module:** Tickets · part of the **Personal Task & Work Tracker** (see [`spec.md`](spec.md) index)
**Status:** Draft
**Author:** Rainiel

> A **Ticket** is a first-class reference to an item in an external issue tracker
> (Jira/GitHub/Other). It replaces the old free-text-only model: tasks and time entries can
> link to a real ticket row, while the free-text `Task.ticketRef` remains as a fallback.

Auth, user-scoping, soft-delete, and error codes are shared — see [`spec.md` → Shared Conventions](spec.md#shared-conventions).

---

## 1. Overview

Tickets let the user keep a small, owned catalogue of external issues they work against, so
tasks and logged hours can be attributed to a real ticket and surfaced on the dashboard.
There is **no live sync** with Jira/GitHub — a ticket is a manually-maintained reference.

## 2. Data Model

### `Ticket` entity

| Field | Type | Constraints | Notes |
| :-- | :-- | :-- | :-- |
| `id` | `string` (UUID) | PK, generated | |
| `key` | `string` | required, 1–100 chars | external key, e.g. `PROJ-123` or `org/repo#42` |
| `title` | `string \| null` | optional, ≤ 200 chars | human-readable summary |
| `tracker` | `Tracker` enum | required, default `OTHER` | `JIRA \| GITHUB \| OTHER` |
| `url` | `string \| null` | optional, ≤ 500 chars | link to the external issue |
| `status` | `TicketStatus` enum | required, default `OPEN` | `OPEN \| IN_PROGRESS \| CLOSED` |
| `deletedAt` | `DateTime \| null` | soft-delete marker | |
| `createdAt` | `DateTime` | auto-set on create | |
| `updatedAt` | `DateTime` | auto-updated on change | |
| `userId` | `string` (UUID) | required, FK → `User.id` | owner; derived from JWT |

> `(userId, key)` is unique among non-deleted rows — a user cannot have two live tickets
> with the same key. `Task.ticketId` and `TimeEntry.ticketId` reference `Ticket.id`.

### Shared DTO shapes

```ts
type Tracker = "JIRA" | "GITHUB" | "OTHER";
type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

interface Ticket {
  id: string;
  key: string;
  title: string | null;
  tracker: Tracker;
  url: string | null;
  status: TicketStatus;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

interface CreateTicketDto {
  key: string;
  title?: string | null;
  tracker?: Tracker;        // defaults to "OTHER"
  url?: string | null;
  status?: TicketStatus;    // defaults to "OPEN"
}

type UpdateTicketDto = Partial<CreateTicketDto>; // ≥ 1 field
```

## 3. API

Base path: `/tickets` — all routes require a valid bearer token and operate only on the
user's own, non-deleted tickets.

| Method | Path | Body | Success | Description |
| :-- | :-- | :-- | :-- | :-- |
| `POST` | `/tickets` | `CreateTicketDto` | `201` + `Ticket` | Create a ticket |
| `GET` | `/tickets` | — | `200` + `Ticket[]` | List; optional `?status=` / `?tracker=` filters |
| `GET` | `/tickets/:id` | — | `200` + `Ticket` | Get one ticket |
| `PATCH` | `/tickets/:id` | `UpdateTicketDto` | `200` + `Ticket` | Update a ticket |
| `DELETE` | `/tickets/:id` | — | `204` | Soft-delete a ticket |

Module-specific errors: `400` for invalid `tracker`/`status` value, missing/over-length `key`,
or empty update body; `409` when `key` collides with an existing live ticket for the user.

## 4. UI Behavior

- **List view** — tickets newest-first showing key, tracker badge, title, status, and a link
  out to `url` when present; edit + delete actions per row.
- **Filters** — by tracker and by status; "All" restores the list.
- **Create / Edit** — form collecting key (required), title, tracker, url, status.
- **Delete** — confirmation, then row removal (soft delete).
- **Picker** — a reusable ticket picker is exposed for the Task and Time Entry forms.
- **Empty state** — clear message when no tickets match.

## 5. Acceptance Criteria

- **AC-1:** A `Ticket` persists with `id`, `key`, `tracker` (default `OTHER`), `status`
  (default `OPEN`), and timestamps; `title`/`url` optional.
- **AC-2:** Creating a ticket **without a key** (missing/empty) → `400`, not persisted.
- **AC-3:** Invalid `tracker` or `status` enum value → `400`.
- **AC-4:** `key` > 100, `title` > 200, or `url` > 500 chars → `400`.
- **AC-5:** Creating a ticket whose `key` duplicates an existing live ticket for the user → `409`.
- **AC-6:** `GET /tickets` returns non-deleted tickets newest-first; `?status=` / `?tracker=` narrow the list; invalid filter value → `400`.
- **AC-7:** `GET /tickets/:id` → `200` or `404` if absent/deleted/other-user.
- **AC-8:** `PATCH /tickets/:id` updates provided fields → `200`; empty body → `400`; non-existent → `404`.
- **AC-9:** `DELETE /tickets/:id` soft-deletes → `204`; subsequent `GET` → `404`; tasks/time entries referencing it keep their link (resolves to an "archived" ticket).
- **AC-10:** UI lists, filters, creates, edits, and deletes tickets; the ticket picker is usable from the Task form.

## 6. Traceability

| Area | Acceptance Criteria |
| :-- | :-- |
| Data model & validation | AC-1 – AC-5 |
| Read/List API | AC-6, AC-7 |
| Update / Delete API | AC-8, AC-9 |
| Frontend UI | AC-10 |

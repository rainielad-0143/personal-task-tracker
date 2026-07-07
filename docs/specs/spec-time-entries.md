# Spec — Time Entries

**Module:** Time Entries · part of the **Personal Task & Work Tracker** (see [`spec.md`](spec.md) index)
**Status:** Draft
**Author:** Rainiel

> A **Time Entry** records work hours via **start/end timestamps**; duration is computed,
> not stored. Each entry links to a Task and/or a Ticket so hours roll up onto the daily
> report and dashboard.

Auth, user-scoping, soft-delete, and error codes are shared — see [`spec.md` → Shared Conventions](spec.md#shared-conventions).

---

## 1. Overview

The user logs intervals of work against what they were working on. v1 uses **manual
start/end entry** (no live stop-watch timer). An entry must reference **at least one** of a
task or a ticket so every logged hour is attributable.

## 2. Data Model

### `TimeEntry` entity

| Field | Type | Constraints | Notes |
| :-- | :-- | :-- | :-- |
| `id` | `string` (UUID) | PK, generated | |
| `startedAt` | `DateTime` | required | interval start |
| `endedAt` | `DateTime` | required, > `startedAt` | interval end |
| `note` | `string \| null` | optional, ≤ 500 chars | what was done |
| `taskId` | `string \| null` | optional, FK → `Task.id` | same owner |
| `ticketId` | `string \| null` | optional, FK → `Ticket.id` | same owner |
| `deletedAt` | `DateTime \| null` | soft-delete marker | |
| `createdAt` | `DateTime` | auto-set on create | |
| `updatedAt` | `DateTime` | auto-updated on change | |
| `userId` | `string` (UUID) | required, FK → `User.id` | owner; derived from JWT |

> **At least one** of `taskId` / `ticketId` is required. `durationMinutes` is **derived**
> (`endedAt − startedAt`) and returned in the DTO, not persisted. **Overlapping intervals
> are allowed** in v1 (no overlap validation). The `date` an entry belongs to (for roll-ups)
> is the calendar date of `startedAt` in the user's timezone.

### Shared DTO shapes

```ts
interface TimeEntry {
  id: string;
  startedAt: string;          // ISO 8601
  endedAt: string;            // ISO 8601
  durationMinutes: number;    // derived, read-only
  note: string | null;
  taskId: string | null;
  ticketId: string | null;
  createdAt: string;          // ISO 8601
  updatedAt: string;          // ISO 8601
}

interface CreateTimeEntryDto {
  startedAt: string;
  endedAt: string;
  note?: string | null;
  taskId?: string | null;     // at least one of taskId/ticketId required
  ticketId?: string | null;
}

type UpdateTimeEntryDto = Partial<CreateTimeEntryDto>; // ≥ 1 field; link rule still enforced
```

## 3. API

Base path: `/time-entries` — all routes require a valid bearer token and operate only on the
user's own, non-deleted entries.

| Method | Path | Body | Success | Description |
| :-- | :-- | :-- | :-- | :-- |
| `POST` | `/time-entries` | `CreateTimeEntryDto` | `201` + `TimeEntry` | Log an interval |
| `GET` | `/time-entries` | — | `200` + `TimeEntry[]` | List; filters `?date=`, `?from=`/`?to=`, `?taskId=`, `?ticketId=` |
| `GET` | `/time-entries/:id` | — | `200` + `TimeEntry` | Get one entry |
| `PATCH` | `/time-entries/:id` | `UpdateTimeEntryDto` | `200` + `TimeEntry` | Update an entry |
| `DELETE` | `/time-entries/:id` | — | `204` | Soft-delete an entry |

Module-specific errors: `400` if `endedAt` ≤ `startedAt`, if neither `taskId` nor `ticketId`
is provided, if `note` > 500 chars, or on an empty update body; `400` if `taskId`/`ticketId`
does not reference a row owned by the user. `?date=` is `YYYY-MM-DD`; an unparseable date or
range → `400`.

## 4. UI Behavior

- **List / day view** — entries grouped by date (default: today), each showing start–end,
  duration, the linked task/ticket, and note; a per-day total in hours.
- **Filters** — by date or date range, and by task/ticket.
- **Create / Edit** — form with start and end (date+time pickers), a task picker and/or
  ticket picker, and a note. Duration is shown live as start/end change.
- **Delete** — confirmation, then removal (soft delete).
- **Empty state** — clear message when no entries match.

## 5. Acceptance Criteria

- **AC-1:** A `TimeEntry` persists with `id`, `startedAt`, `endedAt`, timestamps, and a link to a task and/or ticket; `note` optional.
- **AC-2:** Creating an entry with `endedAt` ≤ `startedAt` → `400`, not persisted.
- **AC-3:** Creating an entry with **neither** `taskId` nor `ticketId` → `400`.
- **AC-4:** `taskId`/`ticketId` not owned by the user → `400`.
- **AC-5:** `durationMinutes` in the response equals `(endedAt − startedAt)` in whole minutes and is never accepted from the client.
- **AC-6:** `GET /time-entries?date=YYYY-MM-DD` returns only entries whose `startedAt` falls on that date; invalid date → `400`.
- **AC-7:** `GET /time-entries?taskId=` / `?ticketId=` returns only entries for that link.
- **AC-8:** `PATCH /time-entries/:id` updates provided fields → `200`, re-validating the interval and link rules; empty body → `400`; non-existent → `404`.
- **AC-9:** `DELETE /time-entries/:id` soft-deletes → `204`; subsequent `GET` → `404`.
- **AC-10:** Deleting a linked Task/Ticket does **not** remove its time entries (hours preserved).
- **AC-11:** UI lists entries by day with a per-day hour total, and supports create/edit/delete with live duration.

## 6. Traceability

| Area | Acceptance Criteria |
| :-- | :-- |
| Data model & validation | AC-1 – AC-5 |
| Read/List API | AC-6, AC-7 |
| Update / Delete API | AC-8 – AC-10 |
| Frontend UI | AC-11 |

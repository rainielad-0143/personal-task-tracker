# Spec — Daily Reports

**Module:** Daily Reports · part of the **Personal Task & Work Tracker** (see [`spec.md`](spec.md) index)
**Status:** Draft
**Author:** Rainiel

> A **Daily Report** is **hybrid**: the user writes free-text `accomplishments` and
> `blockers` for a given date, and the report also **auto-surfaces** the tasks completed and
> the total hours logged on that date. One report per date per user.

Auth, user-scoping, soft-delete, and error codes are shared — see [`spec.md` → Shared Conventions](spec.md#shared-conventions).

---

## 1. Overview

At the end of a day the user records what they accomplished and what blocked them. Rather
than retype activity, the report pulls a **read-only roll-up** from the other modules:
tasks moved to `DONE` (by `updatedAt`) and total minutes from time entries on that date.
The stored part is just the two text fields keyed by date.

## 2. Data Model

### `DailyReport` entity (stored)

| Field | Type | Constraints | Notes |
| :-- | :-- | :-- | :-- |
| `id` | `string` (UUID) | PK, generated | |
| `date` | `Date` | required | calendar day (no time component) |
| `accomplishments` | `string \| null` | optional, ≤ 5000 chars | free text |
| `blockers` | `string \| null` | optional, ≤ 5000 chars | free text |
| `deletedAt` | `DateTime \| null` | soft-delete marker | |
| `createdAt` | `DateTime` | auto-set on create | |
| `updatedAt` | `DateTime` | auto-updated on change | |
| `userId` | `string` (UUID) | required, FK → `User.id` | owner; derived from JWT |

> `(userId, date)` is unique among non-deleted rows — at most one live report per day.

### Derived roll-up (computed, not stored)

Returned alongside the stored fields when a report is read:

| Field | Source |
| :-- | :-- |
| `completedTasks` | tasks with `status = DONE` whose `updatedAt` falls on `date` (id + title) |
| `loggedMinutes` | sum of `durationMinutes` of time entries whose `startedAt` falls on `date` |
| `entryCount` | number of time entries on `date` |

### Shared DTO shapes

```ts
interface DailyReport {
  id: string;
  date: string;                 // YYYY-MM-DD
  accomplishments: string | null;
  blockers: string | null;
  rollup: {
    completedTasks: { id: string; title: string }[];
    loggedMinutes: number;
    entryCount: number;
  };
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
}

// Upsert by date: creates the day's report or updates the existing one.
interface UpsertDailyReportDto {
  date: string;                 // YYYY-MM-DD
  accomplishments?: string | null;
  blockers?: string | null;
}
```

## 3. API

Base path: `/daily-reports` — all routes require a valid bearer token and operate only on the
user's own, non-deleted reports.

| Method | Path | Body | Success | Description |
| :-- | :-- | :-- | :-- | :-- |
| `PUT` | `/daily-reports/:date` | `UpsertDailyReportDto` | `200`/`201` + `DailyReport` | Upsert the report for `date` |
| `GET` | `/daily-reports` | — | `200` + `DailyReport[]` | List; filters `?from=`/`?to=` (date range) |
| `GET` | `/daily-reports/:date` | — | `200` + `DailyReport` | Get the report for a date (rollup always computed; `404` if no stored report) |
| `DELETE` | `/daily-reports/:date` | — | `204` | Soft-delete the stored report for `date` |

> Upsert by date avoids a `409`: writing the same date again updates it. `:date` is
> `YYYY-MM-DD`; an unparseable date → `400`.

Module-specific errors: `400` for an invalid date, `accomplishments`/`blockers` > 5000 chars,
or a body `date` that disagrees with the path `:date`.

## 4. UI Behavior

- **Day view** — a date picker (default: today) showing the editable accomplishments and
  blockers fields plus a read-only roll-up panel (completed tasks list, hours logged, entry count).
- **Save** — persists the two text fields (upsert); the roll-up refreshes from live data.
- **History list** — recent reports by date with a one-line preview and hours logged.
- **Empty state** — when a date has no stored report, the fields are blank but the roll-up
  still shows that day's tasks/hours.

## 5. Acceptance Criteria

- **AC-1:** `PUT /daily-reports/:date` creates the day's report (`201`) or updates it (`200`); writing the same date twice never returns `409`.
- **AC-2:** At most one live report exists per `(user, date)`.
- **AC-3:** `accomplishments` or `blockers` > 5000 chars → `400`.
- **AC-4:** A body `date` that disagrees with the path `:date`, or an unparseable date → `400`.
- **AC-5:** `GET /daily-reports/:date` returns the stored fields plus a `rollup` of tasks completed and minutes logged on that date.
- **AC-6:** `rollup.loggedMinutes` equals the sum of that date's time-entry durations; `completedTasks` lists tasks marked `DONE` on that date.
- **AC-7:** `GET /daily-reports?from=&to=` returns reports within the range, newest date first.
- **AC-8:** `DELETE /daily-reports/:date` soft-deletes the stored report → `204`; the roll-up remains computable on a later `GET`.
- **AC-9:** UI shows editable accomplishments/blockers and a live roll-up; saving upserts the day's report.

## 6. Traceability

| Area | Acceptance Criteria |
| :-- | :-- |
| Upsert / uniqueness | AC-1, AC-2 |
| Validation | AC-3, AC-4 |
| Roll-up read | AC-5, AC-6 |
| List / Delete | AC-7, AC-8 |
| Frontend UI | AC-9 |

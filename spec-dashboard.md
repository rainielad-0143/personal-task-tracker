# Spec — Dashboard

**Module:** Dashboard · part of the **Personal Task & Work Tracker** (see [`spec.md`](spec.md) index)
**Status:** Draft
**Author:** Rainiel

> The **Dashboard** is a **read-only aggregate view** over Tasks, Tickets, Time Entries, and
> Daily Reports. It introduces **no new tables** — only query endpoints that summarise data
> the other modules own.

Auth, user-scoping, soft-delete, and error codes are shared — see [`spec.md` → Shared Conventions](spec.md#shared-conventions).

---

## 1. Overview

A single landing screen that answers "where am I right now?": what's on today, how many
hours were logged this week, what's blocking, and which tickets are active. Because it is
purely derived, it is specified **last** and stays thin — every number traces back to a
module already specified.

## 2. Data Model

No persisted entity. The dashboard reads from `Task`, `Ticket`, `TimeEntry`, and
`DailyReport` (all user-scoped, excluding soft-deleted rows).

### Summary DTO

```ts
interface DashboardSummary {
  // Task snapshot
  tasksByStatus: { TODO: number; IN_PROGRESS: number; DONE: number };
  dueToday: number;          // tasks with dueDate == today, not DONE
  overdue: number;           // tasks with dueDate < today, not DONE

  // Time snapshot
  minutesToday: number;      // sum of today's time-entry durations
  minutesThisWeek: number;   // current week (user timezone), Mon–Sun

  // Tickets
  openTickets: number;       // tickets with status != CLOSED
  recentTickets: { id: string; key: string; status: string }[]; // up to 5, newest

  // Reports / blockers
  todayHasReport: boolean;
  recentBlockers: { date: string; blockers: string }[];          // up to 5 latest non-empty
}
```

## 3. API

Base path: `/dashboard` — requires a valid bearer token; reads only the user's own data.

| Method | Path | Body | Success | Description |
| :-- | :-- | :-- | :-- | :-- |
| `GET` | `/dashboard/summary` | — | `200` + `DashboardSummary` | All aggregates in one call |

> One endpoint keeps the frontend simple. "Today" and "this week" are computed in the user's
> timezone. Optional `?date=YYYY-MM-DD` may override "today" for testing; invalid date → `400`.

## 4. UI Behavior

- **Cards row** — task counts by status, due-today / overdue, hours today, hours this week.
- **Tickets widget** — open ticket count + recent tickets, linking into the Tickets module.
- **Today widget** — whether today's daily report exists (link to write/edit it) and recent blockers.
- **All widgets are read-only** and link through to the owning module for any action.
- **Empty / first-run** — sensible zero-states ("No tasks yet", "No hours logged today").

## 5. Acceptance Criteria

- **AC-1:** `GET /dashboard/summary` returns `200` with all fields populated (zeros, not nulls, when there's no data).
- **AC-2:** `tasksByStatus` counts only the user's non-deleted tasks, grouped by status.
- **AC-3:** `dueToday` / `overdue` count non-`DONE` tasks by `dueDate` relative to today.
- **AC-4:** `minutesToday` / `minutesThisWeek` equal the summed durations of the user's time entries in those windows (user timezone).
- **AC-5:** `openTickets` counts tickets with status ≠ `CLOSED`; `recentTickets` lists up to 5 newest.
- **AC-6:** `todayHasReport` reflects whether a stored daily report exists for today; `recentBlockers` lists up to 5 latest non-empty blocker entries.
- **AC-7:** All figures exclude other users' data and soft-deleted rows.
- **AC-8:** The dashboard UI renders every widget with correct zero-states and links each into its owning module.

## 6. Traceability

| Area | Acceptance Criteria |
| :-- | :-- |
| Summary endpoint | AC-1 |
| Task aggregates | AC-2, AC-3 |
| Time aggregates | AC-4 |
| Ticket aggregates | AC-5 |
| Report aggregates | AC-6 |
| Scoping correctness | AC-7 |
| Frontend UI | AC-8 |

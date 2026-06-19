# Test Plan — Task Management (CRUD)

**Feature:** Task Management for the Personal Task & Work Tracker
**Source of truth:** [`spec.md`](spec.md) §5 Acceptance Criteria, [`bug-report.md`](bug-report.md)
**Scope of this plan:** backend `tasks` module + frontend list/data flow (the Day-3 feature code)

> Day-4 quality-loop focus: the **frontend data flow** extracted into
> [`frontend/src/hooks/useTasks.ts`](frontend/src/hooks/useTasks.ts) — this is the section
> refactored and given new tests. Backend cases are listed for completeness and are already
> covered by the existing `*.spec.ts` suites.

---

## 1. Coverage target

| Layer | Tooling | Baseline (before) | Target |
| :-- | :-- | :-- | :-- |
| Frontend | vitest + v8 | 68.6% stmts / 70.2% lines | **≥ 74% stmts**, and the refactored data-flow code **≥ 90% lines** |
| Backend | jest + ts-jest | 13 tests green | keep green; no regressions |

Rationale: the refactor target (`useTasks`) carries the only non-trivial branching on the
frontend (race guard, error paths, create-vs-update), so it gets the highest bar. UI-glue
(`App.tsx` handlers) and presentational components are lower value to unit-test.

---

## 2. What to test — by category

### Happy path
- **HP-1 (AC-15):** list loads all tasks on mount with no status filter.
- **HP-2 (AC-16):** changing the filter re-fetches with that `status`.
- **HP-3 (AC-17):** creating with no editing id calls `createTask`, then reloads.
- **HP-4 (AC-18):** saving with an editing id calls `updateTask`, then reloads.
- **HP-5 (AC-19):** deleting calls `deleteTask`, then reloads the list.
- **HP-6 (AC-5/AC-6 backend):** `POST /tasks` valid body → 201; omitted status stored as `TODO`.
- **HP-7 (AC-7 backend):** `GET /tasks` returns newest-first.

### Edge cases
- **EC-1 (bug-report.md):** a slow response from a **superseded filter** must not overwrite
  a newer load (stale-response race) — the request-id guard discards it.
- **EC-2:** a previous error is **cleared** on the next successful load.
- **EC-3 (AC-20):** empty result set surfaces an empty-state message, not a blank list.
- **EC-4 (AC-8 backend):** `GET /tasks?status=…` with a valid status filters; invalid → 400.

### Error states
- **ER-1 (AC-15 error):** `listTasks` rejects → `error` is set, `loading` false, list unchanged.
- **ER-2:** `saveTask` failure **propagates** to the caller (the form keeps/handles it) and
  does **not** silently swallow — create/edit validation errors must reach the user.
- **ER-3 (AC-19):** `deleteTask` failure surfaces via `error` without throwing.
- **ER-4 (AC-2/AC-3/AC-4/AC-12 backend):** missing title, bad status, over-length fields, and
  empty update body each return 400.
- **ER-5 (AC-9/AC-11/AC-14 backend):** GET/PATCH/DELETE on a non-existent id → 404.

### Security / robustness
- **SEC-1:** API error messages are derived from the server body, not interpolated from
  unsanitised user input into markup (React escapes by default — confirm no `dangerouslySetInnerHTML`).
- **SEC-2 (AC-4):** length caps (title ≤ 200, description ≤ 2000) enforced server-side, not
  only in the UI — a crafted request bypassing the form is still rejected.
- **SEC-3:** status query/body values are validated against the enum server-side (no raw
  passthrough to Prisma `where`).

---

## 3. AC → test traceability

| AC | Covered by | Where |
| :-- | :-- | :-- |
| AC-1, AC-5, AC-6 | HP-6 | `backend/src/tasks/tasks.service.spec.ts` |
| AC-2, AC-3, AC-4, AC-12 | ER-4 | backend DTO validation + service specs |
| AC-7, AC-8 | HP-7, EC-4 | backend specs |
| AC-9, AC-11, AC-14 | ER-5 | backend service specs |
| AC-10, AC-13 | HP-4 (BE), backend specs | backend |
| AC-15 | HP-1, ER-1 | `frontend/src/hooks/useTasks.test.ts` |
| AC-16 | HP-2, EC-1 | `useTasks.test.ts` |
| AC-17 | HP-3 | `useTasks.test.ts` |
| AC-18 | HP-4 | `useTasks.test.ts` |
| AC-19 | HP-5, ER-3 | `useTasks.test.ts` |
| AC-20 | EC-3 | component-level (existing `App` rendering) |

---

## 4. New tests added this loop

`frontend/src/hooks/useTasks.test.ts` (10 cases) — HP-1..HP-5, EC-1, EC-2, ER-1, ER-2, ER-3.
Each maps to a row above. The stale-response case (EC-1) was verified to **fail** when the
request-id guard is removed (regression-catching proof — see `review-notes.md` §Verification).

## 5. Out of scope (this loop)
- E2E / browser tests (no Playwright/Cypress configured).
- `useTheme`, `TaskItem`, `EmptyState` presentational coverage — low risk, deferred.

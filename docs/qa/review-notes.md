# Code Review — Day-3 Task Management feature

**Reviewed:** `backend/src/tasks/**`, `frontend/src/**`
**Against:** [`spec.md`](../specs/spec.md) AC-1…AC-20, project conventions in `CLAUDE.md`
**Outcome:** Solid baseline. One structural issue flagged and refactored this loop; the rest are
minor / hardening notes. No correctness blockers found in the backend.

Severity key: 🔴 must-fix · 🟡 should-fix · 🟢 nice-to-have / note

---

## Flagged section (refactored this loop) 🟡

**`frontend/src/App.tsx` (Day-3 lines 17–90) — mixed concerns, untestable data flow**

- **Issue:** `App` owned both **server-state** (tasks, filter, loading, error, the race-guarded
  `load()`, create/update/delete orchestration) and **UI state** (`formOpen`, `editing`). The
  data logic — including the stale-response race guard from [`bug-report.md`](bug-report.md) —
  could only be exercised by rendering the whole component, which is why `App.tsx` sat at ~53%
  coverage with the error and CRUD branches untested.
- **Suggested fix (applied):** extract the server-state into
  [`frontend/src/hooks/useTasks.ts`](frontend/src/hooks/useTasks.ts) (`tasks`, `filter`,
  `loading`, `error`, `reload`, `saveTask`, `removeTask`). `App.tsx` keeps only form/modal UI
  state. **Behavior unchanged** — operation ordering (api → `closeForm` → `reload`) preserved;
  the existing `App.test.tsx` race test still passes. The logic is now unit-tested directly in
  `useTasks.test.ts` (53% → 100% lines on the extracted code).

---

## Correctness

- 🟢 **`frontend/src/App.tsx:81–90` (Day-3) — delete error not race-guarded.** `handleDelete`'s
  `setError` had no request-id check, so a late delete failure could surface after the user
  changed filter/context. Low impact (deletes are user-initiated, one at a time). Preserved
  as-is in `useTasks.removeTask` to keep the refactor behavior-neutral; worth a follow-up if
  delete UX gets richer.
- 🟢 **`backend/src/tasks/tasks.service.ts:67–68` — `toDate` trusts its input.** `new Date(value)`
  would yield `Invalid Date` for a bad string. Safe in practice because `@IsISO8601()`
  (`create-task.dto.ts:38`) rejects bad `dueDate` before the service runs — but the service is
  a public method with no defensive guard. Fine for now; note it if the service is ever called
  outside the validated controller path.

## Readability

- 🟢 **`backend/src/tasks/tasks.controller.ts:45–54` — empty-body check is non-obvious.** The
  `Object.values(dto).some(v => v !== undefined)` for AC-12 is correct but subtle; the existing
  comment explaining the `exposeUnsetFields` interaction is good and should stay.
- 🟢 **`frontend/src/api/tasksApi.ts:25–40` — `parse<T>` returning `undefined as T` for 204** is a
  reasonable shortcut; the inline comment makes the intent clear.

## Error handling

- 🟢 **`frontend/src/hooks/useTasks.ts` `saveTask`** intentionally lets create/update errors
  **propagate** to the caller so the form can show field-level validation messages (400s from
  AC-2/AC-3/AC-4). This is the right call — swallowing them here would hide validation feedback.
  Covered by test ER-2.
- 🟢 **`backend/src/tasks/tasks.service.ts:71–80`** — Prisma `P2025` → `NotFoundException` mapping
  is clean and rethrows unknown errors. Good.

## Security

- 🟡 **`backend/src/main.ts:19` — `app.enableCors()` with no origin allowlist.** Opens the API to
  any origin. Acceptable for local single-user dev; before any shared/prod deployment restrict
  to the frontend origin: `app.enableCors({ origin: process.env.FRONTEND_URL })`.
- 🟢 **Input validation is correct.** `main.ts:10–16` enables `whitelist + forbidNonWhitelisted +
  transform`; DTOs enforce length caps (AC-4) and enum membership (AC-3); `ParseUUIDPipe` guards
  every `:id`. No raw status passthrough to Prisma. React escapes rendered task text (no
  `dangerouslySetInnerHTML` anywhere) — XSS surface is low.

## Spec compliance

- 🟢 AC-1…AC-14 (backend) all map to existing code and the 13-test jest suite. AC-15…AC-20
  (frontend) map to `App` + components; AC-16 race edge case is covered by both `App.test.tsx`
  and the new `useTasks.test.ts`.

---

## Verification (regression-catching proof)

The stale-response test (EC-1 in `test-plan.md`) was confirmed to **fail** when the request-id
guard in `useTasks.ts` is removed:

```
× ignores a stale response from a superseded filter
  AssertionError: expected [ { id: 'A done', … } ] to deeply equal [ { id: 'A todo', … } ]
```

Guard restored → 20/20 frontend tests green.

## Follow-ups (not done this loop)
- Replace the request-id guard with `AbortController` to also cancel wasted in-flight requests
  (already noted in `bug-report.md` §5).
- CORS origin allowlist before any non-local deployment.

# Bug Report — Stale-response race in the task list

**Feature:** Task Management (CRUD) — frontend list view
**Area:** [`frontend/src/App.tsx`](frontend/src/App.tsx) — `load()`
**Related AC:** AC-16 (status filter shows only matching tasks)
**Severity:** Medium — wrong data shown under the active filter; intermittent

---

## 1. Reproduce

The list re-fetches from the backend whenever the status filter changes. If the
user switches filters faster than the network responds, an earlier (slower)
request can resolve **after** a later one and overwrite the list.

**Steps (manual):**
1. Open the app with several tasks of mixed status.
2. Click the **Done** filter tab, then immediately click **All**.
3. Let the **All** response arrive first and the **Done** response arrive a
   moment later (e.g. on a slow/throttled connection).

**Expected:** the list shows **all** tasks (the active filter is "All").
**Actual:** the list shows only **Done** tasks — the stale "Done" response, which
arrived last, clobbered the "All" data even though "All" is selected.

**Automated repro:** [`frontend/src/App.test.tsx`](frontend/src/App.test.tsx) →
_"ignores a stale response from a superseded filter (AC-16)"_. It mocks the API
so each `listTasks` call returns a deferred promise, then resolves the **current**
("All") request first and the **superseded** ("Done") request last. Before the
fix this test fails: the DOM renders only the Done task.

```
 FAIL  src/App.test.tsx > App — list loading > ignores a stale response …
   expect(screen.getByText('A todo')).toBeInTheDocument()
   → "A todo" is not in the document (only the stale "Done" task is rendered)
```

## 2. Diagnose (root cause)

`load()` applied every response unconditionally:

```ts
const data = await listTasks(filter === 'ALL' ? undefined : filter)
setTasks(data) // <- whichever request resolves LAST wins
```

Each filter change starts a new in-flight request, but there is **no sequencing
or cancellation**. Responses are not guaranteed to return in the order they were
requested, so the *last to resolve* — not the *most recent request* — determines
what is displayed. The symptom (wrong tasks under a filter) is a side effect of
this missing ordering guarantee, not of the filter logic itself.

## 3. Fix

Tag each load with a monotonically increasing request id and ignore any response
that is not from the latest load (minimal change, no new dependencies):

```ts
const requestIdRef = useRef(0)

const load = useCallback(async () => {
  const requestId = ++requestIdRef.current
  setLoading(true)
  setError(null)
  try {
    const data = await listTasks(filter === 'ALL' ? undefined : filter)
    if (requestId !== requestIdRef.current) return // superseded by a newer load
    setTasks(data)
  } catch (err) {
    if (requestId !== requestIdRef.current) return
    setError(err instanceof Error ? err.message : 'Failed to load tasks')
  } finally {
    if (requestId === requestIdRef.current) setLoading(false)
  }
}, [filter])
```

A stale response now returns early instead of calling `setTasks`, so only the
newest request can update the list. This addresses the root cause (ordering)
rather than the symptom (the displayed rows).

## 4. Verify

- `npm run test` — the repro test now passes; full suite **10/10 green**.
- `npm run build` and `npm run lint` — clean.
- Manual: rapidly toggling filters always ends on data matching the active tab.

```
 Test Files  4 passed (4)
      Tests  10 passed (10)
```

## 5. Guard / related cases

- The same race applies to mutations that call `load()` (create/edit/delete);
  the request-id guard covers those too since they share `load()`.
- A future refactor could replace the id guard with an `AbortController` to also
  cancel the wasted in-flight request on the network, not just ignore its result.

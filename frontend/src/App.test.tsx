import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { listTasks } from './api/tasksApi'
import type { Task, TaskStatus } from './types/task'

// The component talks to the backend only through this module; mocking it lets
// us control the timing of each list request to reproduce the race.
vi.mock('./api/tasksApi')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function makeTask(partial: Partial<Task> & { title: string }): Task {
  return {
    id: partial.title,
    description: null,
    status: 'TODO',
    ticketRef: null,
    dueDate: null,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...partial,
  }
}

describe('App — list loading', () => {
  // Each listTasks() call records its filter and hands back a deferred we
  // resolve manually, so we can force responses to land out of order.
  let calls: { status?: TaskStatus; d: Deferred<Task[]> }[]

  beforeEach(() => {
    calls = []
    vi.mocked(listTasks).mockImplementation((status?: TaskStatus) => {
      const d = deferred<Task[]>()
      calls.push({ status, d })
      return d.promise
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('ignores a stale response from a superseded filter (AC-16)', async () => {
    const user = userEvent.setup()
    const allTasks = [makeTask({ title: 'A todo' }), makeTask({ title: 'A done', status: 'DONE' })]
    const doneTasks = [makeTask({ title: 'A done', status: 'DONE' })]

    render(<App />)

    // calls[0]: initial load for "All".
    await act(async () => {
      calls[0].d.resolve(allTasks)
    })
    expect(await screen.findByText('A todo')).toBeInTheDocument()

    // Switch to "Done" (calls[1]) then quickly back to "All" (calls[2]).
    await user.click(screen.getByRole('tab', { name: 'Done' }))
    await user.click(screen.getByRole('tab', { name: 'All' }))
    expect(calls).toHaveLength(3)

    // The current filter is "All". Its response (calls[2]) lands first...
    await act(async () => {
      calls[2].d.resolve(allTasks)
    })
    // ...then the superseded "Done" request (calls[1]) resolves late.
    await act(async () => {
      calls[1].d.resolve(doneTasks)
    })

    // The list must reflect the current "All" filter, not the stale "Done"
    // response that arrived last.
    await waitFor(() => {
      expect(screen.getByText('A todo')).toBeInTheDocument()
    })
  })
})

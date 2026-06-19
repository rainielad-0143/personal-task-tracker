import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTasks } from './useTasks'
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from '../api/tasksApi'
import type { Task, TaskStatus } from '../types/task'

// The hook reaches the backend only through this module; mocking it lets us
// control each call's timing and outcome.
vi.mock('../api/tasksApi')

interface Deferred<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (reason?: unknown) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
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

describe('useTasks', () => {
  beforeEach(() => {
    vi.mocked(listTasks).mockResolvedValue([])
    vi.mocked(createTask).mockResolvedValue(makeTask({ title: 'created' }))
    vi.mocked(updateTask).mockResolvedValue(makeTask({ title: 'updated' }))
    vi.mocked(deleteTask).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // --- Happy path -----------------------------------------------------------

  it('loads all tasks on mount with no status filter (AC-15)', async () => {
    const tasks = [makeTask({ title: 'A' }), makeTask({ title: 'B' })]
    vi.mocked(listTasks).mockResolvedValue(tasks)

    const { result } = renderHook(() => useTasks())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(listTasks).toHaveBeenCalledWith(undefined)
    expect(result.current.tasks).toEqual(tasks)
    expect(result.current.error).toBeNull()
  })

  it('re-fetches with the selected status when the filter changes (AC-16)', async () => {
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setFilter('IN_PROGRESS'))

    await waitFor(() =>
      expect(listTasks).toHaveBeenLastCalledWith('IN_PROGRESS'),
    )
    expect(result.current.filter).toBe('IN_PROGRESS')
  })

  // --- Edge case: stale-response race (bug-report.md) ------------------------

  it('ignores a stale response from a superseded filter', async () => {
    const calls: { status?: TaskStatus; d: Deferred<Task[]> }[] = []
    vi.mocked(listTasks).mockImplementation((status?: TaskStatus) => {
      const d = deferred<Task[]>()
      calls.push({ status, d })
      return d.promise
    })

    const allTasks = [makeTask({ title: 'A todo' })]
    const doneTasks = [makeTask({ title: 'A done', status: 'DONE' })]

    const { result } = renderHook(() => useTasks())

    // calls[0]: initial "All" load resolves.
    await act(async () => {
      calls[0].d.resolve(allTasks)
    })

    // Switch to "Done" (calls[1]) then quickly back to "All" (calls[2]).
    act(() => result.current.setFilter('DONE'))
    await waitFor(() => expect(calls).toHaveLength(2))
    act(() => result.current.setFilter('ALL'))
    await waitFor(() => expect(calls).toHaveLength(3))

    // The current "All" request (calls[2]) lands first...
    await act(async () => {
      calls[2].d.resolve(allTasks)
    })
    // ...then the superseded "Done" request (calls[1]) resolves late.
    await act(async () => {
      calls[1].d.resolve(doneTasks)
    })

    // The list must reflect the current filter, not the stale response.
    expect(result.current.tasks).toEqual(allTasks)
  })

  // --- Error path -----------------------------------------------------------

  it('sets an error message when the load fails (AC-15 error state)', async () => {
    vi.mocked(listTasks).mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useTasks())

    await waitFor(() => expect(result.current.error).toBe('network down'))
    expect(result.current.loading).toBe(false)
    expect(result.current.tasks).toEqual([])
  })

  it('clears a previous error on a new successful load', async () => {
    vi.mocked(listTasks).mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.error).toBe('boom'))

    vi.mocked(listTasks).mockResolvedValue([makeTask({ title: 'A' })])
    await act(async () => {
      await result.current.reload()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.tasks).toHaveLength(1)
  })

  // --- saveTask -------------------------------------------------------------

  it('creates a task when no editing id is given (AC-17)', async () => {
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveTask({ title: 'New' })
    })

    expect(createTask).toHaveBeenCalledWith({ title: 'New' })
    expect(updateTask).not.toHaveBeenCalled()
  })

  it('updates a task when an editing id is given (AC-18)', async () => {
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveTask({ title: 'Edited' }, 'task-1')
    })

    expect(updateTask).toHaveBeenCalledWith('task-1', { title: 'Edited' })
    expect(createTask).not.toHaveBeenCalled()
  })

  it('propagates save errors to the caller (form keeps them)', async () => {
    vi.mocked(createTask).mockRejectedValue(new Error('title required'))
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.saveTask({ title: '' })
      }),
    ).rejects.toThrow('title required')
  })

  // --- removeTask -----------------------------------------------------------

  it('deletes then reloads on success (AC-19)', async () => {
    const remaining = [makeTask({ title: 'left' })]
    vi.mocked(listTasks).mockResolvedValue([])
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(listTasks).mockResolvedValue(remaining)
    await act(async () => {
      await result.current.removeTask('task-1')
    })

    expect(deleteTask).toHaveBeenCalledWith('task-1')
    expect(result.current.tasks).toEqual(remaining)
  })

  it('surfaces a delete failure via error without throwing', async () => {
    vi.mocked(deleteTask).mockRejectedValue(new Error('delete failed'))
    const { result } = renderHook(() => useTasks())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.removeTask('task-1')
    })

    expect(result.current.error).toBe('delete failed')
  })
})

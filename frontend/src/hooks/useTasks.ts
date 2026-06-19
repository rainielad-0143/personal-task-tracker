import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from '../api/tasksApi'
import type {
  CreateTaskInput,
  StatusFilterValue,
  Task,
} from '../types/task'

export interface UseTasksResult {
  tasks: Task[]
  filter: StatusFilterValue
  setFilter: (filter: StatusFilterValue) => void
  loading: boolean
  error: string | null
  /** Re-fetch the list for the current filter (race-guarded). */
  reload: () => Promise<void>
  /** Create (no id) or update (id) a task via the API. Errors propagate to the caller. */
  saveTask: (input: CreateTaskInput, editingId?: string) => Promise<Task>
  /** Delete a task, then reload; failures surface via `error`. */
  removeTask: (id: string) => Promise<void>
}

/**
 * Owns the task list server-state: fetching, filtering, and the create/update/
 * delete calls. The component keeps only its own UI state (which form is open).
 *
 * Loads are tagged with a monotonic request id so a slow response from a
 * superseded filter can't overwrite a newer one (the stale-response race
 * documented in bug-report.md).
 */
export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<StatusFilterValue>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  const reload = useCallback(async () => {
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

  // Re-fetch whenever the filter changes (AC-16) — no manual reload (AC-17–19).
  // This effect intentionally synchronizes the list with the backend; the
  // loading flag it sets is the whole point, so the set-state-in-effect rule
  // is a false positive here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  const saveTask = useCallback(
    (input: CreateTaskInput, editingId?: string): Promise<Task> =>
      editingId ? updateTask(editingId, input) : createTask(input),
    [],
  )

  const removeTask = useCallback(
    async (id: string) => {
      try {
        await deleteTask(id)
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete task')
      }
    },
    [reload],
  )

  return {
    tasks,
    filter,
    setFilter,
    loading,
    error,
    reload,
    saveTask,
    removeTask,
  }
}

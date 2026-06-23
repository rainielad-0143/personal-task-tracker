import { useState } from 'react'
import {
  STATUS_LABELS,
  type CreateTaskInput,
  type Task,
} from '../types/task'
import { StatusFilter } from './StatusFilter'
import { TaskList } from './TaskList'
import { TaskForm } from './TaskForm'
import { EmptyState } from './EmptyState'
import { ThemeToggle } from './ThemeToggle'
import { useTheme } from '../hooks/useTheme'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../auth/useAuth'

/** The authenticated experience: the signed-in user's task list and editor. */
export function TasksView() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { tasks, filter, setFilter, loading, error, reload, saveTask, removeTask } =
    useTasks()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSubmit(input: CreateTaskInput) {
    await saveTask(input, editing?.id)
    closeForm()
    await reload()
  }

  async function handleDelete(task: Task) {
    // AC-19: confirm before deleting.
    if (!window.confirm(`Delete "${task.title}"?`)) return
    await removeTask(task.id)
  }

  const emptyMessage =
    filter === 'ALL'
      ? 'No tasks yet. Create your first task to get started.'
      : `No ${STATUS_LABELS[filter].toLowerCase()} tasks.`

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Tracker</h1>
        <div className="app-header-actions">
          {user && <span className="user-email">{user.email}</span>}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button type="button" className="primary" onClick={openCreate}>
            + New task
          </button>
          <button type="button" className="link" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <StatusFilter value={filter} onChange={setFilter} />

      {error && (
        <p className="banner-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : tasks.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <TaskList tasks={tasks} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {formOpen && (
        <TaskForm initial={editing} onSubmit={handleSubmit} onCancel={closeForm} />
      )}
    </div>
  )
}

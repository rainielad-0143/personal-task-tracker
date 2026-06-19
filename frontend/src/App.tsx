import { useState } from 'react'
import './App.css'
import {
  STATUS_LABELS,
  type CreateTaskInput,
  type Task,
} from './types/task'
import { StatusFilter } from './components/StatusFilter'
import { TaskList } from './components/TaskList'
import { TaskForm } from './components/TaskForm'
import { EmptyState } from './components/EmptyState'
import { ThemeToggle } from './components/ThemeToggle'
import { useTheme } from './hooks/useTheme'
import { useTasks } from './hooks/useTasks'

function App() {
  const { theme, toggleTheme } = useTheme()
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
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button type="button" className="primary" onClick={openCreate}>
            + New task
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
        <TaskForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}
    </div>
  )
}

export default App

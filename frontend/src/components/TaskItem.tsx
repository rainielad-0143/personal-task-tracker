import type { CSSProperties } from 'react'
import { STATUS_LABELS, type Task } from '../types/task'

interface Props {
  task: Task
  /** Position in the list, used to stagger the entrance animation. */
  index?: number
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

/** One task row with its status, ticket ref, due date, and actions (AC-15). */
export function TaskItem({ task, index = 0, onEdit, onDelete }: Props) {
  return (
    <li
      className="task-item"
      style={{ '--index': index } as CSSProperties}
    >
      <div className="task-main">
        <span className="task-title">{task.title}</span>
        <span className={`status-badge status-${task.status.toLowerCase()}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>
      <div className="task-meta">
        <span className="task-ticket" title="Ticket reference">
          {task.ticketRef ?? '—'}
        </span>
        <span className="task-due">Due: {formatDate(task.dueDate)}</span>
      </div>
      <div className="task-actions">
        <button type="button" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button
          type="button"
          className="danger"
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </li>
  )
}

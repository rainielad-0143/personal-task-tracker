import { useState, type FormEvent } from 'react'
import {
  STATUS_LABELS,
  TASK_STATUSES,
  type CreateTaskInput,
  type Task,
  type TaskStatus,
} from '../types/task'
import { TicketPicker } from './TicketPicker'

interface Props {
  /** The task being edited, or null when creating a new one. */
  initial: Task | null
  onSubmit: (input: CreateTaskInput) => Promise<void>
  onCancel: () => void
}

/** Modal form used for both create (AC-17) and edit (AC-18). */
export function TaskForm({ initial, onSubmit, onCancel }: Props) {
  const isEdit = initial !== null
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'TODO')
  const [ticketId, setTicketId] = useState<string | null>(
    initial?.ticketId ?? null,
  )
  const [ticketRef, setTicketRef] = useState(initial?.ticketRef ?? '')
  const [dueDate, setDueDate] = useState(
    initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (title.trim().length === 0) {
      setError('Title is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        status,
        ticketId,
        ticketRef: ticketRef.trim() || null,
        dueDate: dueDate || null,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit task' : 'Create task'}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{isEdit ? 'Edit task' : 'New task'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Title*
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="task-ticket-picker">
            Linked ticket
          </label>
          <TicketPicker
            id="task-ticket-picker"
            value={ticketId}
            onChange={setTicketId}
          />
          <label>
            Ticket reference (free text)
            <input
              value={ticketRef}
              onChange={(e) => setTicketRef(e.target.value)}
              maxLength={100}
              placeholder="PROJ-123"
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  TRACKERS,
  TRACKER_LABELS,
  type CreateTicketInput,
  type Ticket,
  type TicketStatus,
  type Tracker,
} from '../types/ticket'

interface Props {
  /** The ticket being edited, or null when creating a new one. */
  initial: Ticket | null
  onSubmit: (input: CreateTicketInput) => Promise<void>
  onCancel: () => void
}

/** Modal form used for both create and edit (AC-10). */
export function TicketForm({ initial, onSubmit, onCancel }: Props) {
  const isEdit = initial !== null
  const [key, setKey] = useState(initial?.key ?? '')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [tracker, setTracker] = useState<Tracker>(initial?.tracker ?? 'OTHER')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [status, setStatus] = useState<TicketStatus>(initial?.status ?? 'OPEN')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (key.trim().length === 0) {
      setError('Key is required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        key: key.trim(),
        title: title.trim() || null,
        tracker,
        url: url.trim() || null,
        status,
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
        aria-label={isEdit ? 'Edit ticket' : 'Create ticket'}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{isEdit ? 'Edit ticket' : 'New ticket'}</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Key*
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              maxLength={100}
              placeholder="PROJ-123 or org/repo#42"
              autoFocus
            />
          </label>
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </label>
          <label>
            Tracker
            <select
              value={tracker}
              onChange={(e) => setTracker(e.target.value as Tracker)}
            >
              {TRACKERS.map((t) => (
                <option key={t} value={t}>
                  {TRACKER_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label>
            URL
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              maxLength={500}
              placeholder="https://…"
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
            >
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TICKET_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
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

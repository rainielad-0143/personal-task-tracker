import type { CSSProperties } from 'react'
import {
  TICKET_STATUS_LABELS,
  TRACKER_LABELS,
  type Ticket,
} from '../types/ticket'

interface Props {
  ticket: Ticket
  /** Position in the list, used to stagger the entrance animation. */
  index?: number
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
}

/** One ticket row with its tracker, status, link, and actions (AC-10). */
export function TicketItem({ ticket, index = 0, onEdit, onDelete }: Props) {
  return (
    <li className="task-item" style={{ '--index': index } as CSSProperties}>
      <div className="task-main">
        <span className="task-title">
          {ticket.key}
          {ticket.title ? ` — ${ticket.title}` : ''}
        </span>
        <span
          className={`status-badge status-${ticket.status.toLowerCase()}`}
        >
          {TICKET_STATUS_LABELS[ticket.status]}
        </span>
      </div>
      <div className="task-meta">
        <span className="task-ticket" title="Tracker">
          {TRACKER_LABELS[ticket.tracker]}
        </span>
        {ticket.url ? (
          <a
            className="task-due"
            href={ticket.url}
            target="_blank"
            rel="noreferrer noopener"
          >
            Open ↗
          </a>
        ) : (
          <span className="task-due">No link</span>
        )}
      </div>
      <div className="task-actions">
        <button type="button" onClick={() => onEdit(ticket)}>
          Edit
        </button>
        <button type="button" className="danger" onClick={() => onDelete(ticket)}>
          Delete
        </button>
      </div>
    </li>
  )
}

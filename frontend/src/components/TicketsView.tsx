import { useState } from 'react'
import {
  TICKET_STATUSES,
  TICKET_STATUS_LABELS,
  TRACKERS,
  TRACKER_LABELS,
  type CreateTicketInput,
  type Ticket,
  type TicketStatusFilterValue,
  type TrackerFilterValue,
} from '../types/ticket'
import { TicketList } from './TicketList'
import { TicketForm } from './TicketForm'
import { EmptyState } from './EmptyState'
import { useTickets } from '../hooks/useTickets'

/** The signed-in user's ticket catalogue and editor (spec-tickets.md §4). */
export function TicketsView() {
  const {
    tickets,
    statusFilter,
    setStatusFilter,
    trackerFilter,
    setTrackerFilter,
    loading,
    error,
    reload,
    saveTicket,
    removeTicket,
  } = useTickets()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ticket | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(ticket: Ticket) {
    setEditing(ticket)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  async function handleSubmit(input: CreateTicketInput) {
    await saveTicket(input, editing?.id)
    closeForm()
    await reload()
  }

  async function handleDelete(ticket: Ticket) {
    if (!window.confirm(`Delete ticket "${ticket.key}"?`)) return
    await removeTicket(ticket.id)
  }

  const filtered = statusFilter !== 'ALL' || trackerFilter !== 'ALL'
  const emptyMessage = filtered
    ? 'No tickets match these filters.'
    : 'No tickets yet. Create one to link tasks and time against it.'

  return (
    <div className="app">
      <header className="app-header">
        <h1>Tickets</h1>
        <div className="app-header-actions">
          <button type="button" className="primary" onClick={openCreate}>
            + New ticket
          </button>
        </div>
      </header>

      <div className="ticket-filters">
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TicketStatusFilterValue)
            }
          >
            <option value="ALL">All</option>
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TICKET_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tracker
          <select
            value={trackerFilter}
            onChange={(e) =>
              setTrackerFilter(e.target.value as TrackerFilterValue)
            }
          >
            <option value="ALL">All</option>
            {TRACKERS.map((t) => (
              <option key={t} value={t}>
                {TRACKER_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="banner-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="loading">Loading…</p>
      ) : tickets.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <TicketList tickets={tickets} onEdit={openEdit} onDelete={handleDelete} />
      )}

      {formOpen && (
        <TicketForm
          initial={editing}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { listTickets } from '../api/ticketsApi'
import type { Ticket } from '../types/ticket'

interface Props {
  /** Currently-linked ticket id, or null when none. */
  value: string | null
  onChange: (ticketId: string | null) => void
  /** Optional id used to associate an external <label>. */
  id?: string
}

/**
 * Reusable dropdown of the user's live tickets, shared by the Task form (and
 * any future form that links a ticket). Fetches its own list once on mount;
 * the empty option detaches the link.
 */
export function TicketPicker({ value, onChange, id }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    listTickets()
      .then((data) => {
        if (active) setTickets(data)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">— No ticket —</option>
        {tickets.map((t) => (
          <option key={t.id} value={t.id}>
            {t.key}
            {t.title ? ` — ${t.title}` : ''}
          </option>
        ))}
      </select>
      {loadError && (
        <span className="form-error" role="alert">
          Couldn’t load tickets
        </span>
      )}
    </>
  )
}

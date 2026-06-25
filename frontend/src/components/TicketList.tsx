import type { Ticket } from '../types/ticket'
import { TicketItem } from './TicketItem'

interface Props {
  tickets: Ticket[]
  onEdit: (ticket: Ticket) => void
  onDelete: (ticket: Ticket) => void
}

/** Renders the tickets in the order the API returns them (newest-first). */
export function TicketList({ tickets, onEdit, onDelete }: Props) {
  return (
    <ul className="task-list">
      {tickets.map((ticket, index) => (
        <TicketItem
          key={ticket.id}
          ticket={ticket}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

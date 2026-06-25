import type {
  CreateTicketInput,
  Ticket,
  TicketStatus,
  Tracker,
  UpdateTicketInput,
} from '../types/ticket'
import { apiFetch } from './http'

// ApiError is re-exported so importers (and tests) keep their path.
export { ApiError } from './http'

export interface ListTicketsParams {
  status?: TicketStatus
  tracker?: Tracker
}

export function listTickets(params: ListTicketsParams = {}): Promise<Ticket[]> {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.tracker) query.set('tracker', params.tracker)
  const qs = query.toString()
  return apiFetch<Ticket[]>(`/tickets${qs ? `?${qs}` : ''}`)
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return apiFetch<Ticket>('/tickets', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateTicket(
  id: string,
  input: UpdateTicketInput,
): Promise<Ticket> {
  return apiFetch<Ticket>(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteTicket(id: string): Promise<void> {
  return apiFetch<void>(`/tickets/${id}`, { method: 'DELETE' })
}

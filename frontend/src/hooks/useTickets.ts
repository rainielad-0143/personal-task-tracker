import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createTicket,
  deleteTicket,
  listTickets,
  updateTicket,
} from '../api/ticketsApi'
import type {
  CreateTicketInput,
  Ticket,
  TicketStatusFilterValue,
  TrackerFilterValue,
} from '../types/ticket'

export interface UseTicketsResult {
  tickets: Ticket[]
  statusFilter: TicketStatusFilterValue
  setStatusFilter: (value: TicketStatusFilterValue) => void
  trackerFilter: TrackerFilterValue
  setTrackerFilter: (value: TrackerFilterValue) => void
  loading: boolean
  error: string | null
  /** Re-fetch the list for the current filters (race-guarded). */
  reload: () => Promise<void>
  /** Create (no id) or update (id) a ticket via the API. Errors propagate. */
  saveTicket: (input: CreateTicketInput, editingId?: string) => Promise<Ticket>
  /** Soft-delete a ticket, then reload; failures surface via `error`. */
  removeTicket: (id: string) => Promise<void>
}

/**
 * Owns the ticket list server-state: fetching, filtering, and the create/update/
 * delete calls. Mirrors useTasks, including the monotonic request-id guard that
 * stops a slow superseded response from overwriting a newer one.
 */
export function useTickets(): UseTicketsResult {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [statusFilter, setStatusFilter] =
    useState<TicketStatusFilterValue>('ALL')
  const [trackerFilter, setTrackerFilter] = useState<TrackerFilterValue>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const data = await listTickets({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        tracker: trackerFilter === 'ALL' ? undefined : trackerFilter,
      })
      if (requestId !== requestIdRef.current) return // superseded by a newer load
      setTickets(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return
      setError(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }, [statusFilter, trackerFilter])

  // Re-fetch whenever a filter changes — no manual reload needed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  const saveTicket = useCallback(
    (input: CreateTicketInput, editingId?: string): Promise<Ticket> =>
      editingId ? updateTicket(editingId, input) : createTicket(input),
    [],
  )

  const removeTicket = useCallback(
    async (id: string) => {
      try {
        await deleteTicket(id)
        await reload()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete ticket')
      }
    },
    [reload],
  )

  return {
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
  }
}

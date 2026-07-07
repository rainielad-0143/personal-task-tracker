import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useTickets } from './useTickets'
import {
  createTicket,
  deleteTicket,
  listTickets,
  updateTicket,
} from '../api/ticketsApi'
import type { Ticket } from '../types/ticket'

// The hook reaches the backend only through this module; mocking it lets us
// control each call's timing and outcome.
vi.mock('../api/ticketsApi')

function makeTicket(partial: Partial<Ticket> & { key: string }): Ticket {
  return {
    id: partial.key,
    title: null,
    tracker: 'OTHER',
    url: null,
    status: 'OPEN',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...partial,
  }
}

describe('useTickets', () => {
  beforeEach(() => {
    vi.mocked(listTickets).mockResolvedValue([])
    vi.mocked(createTicket).mockResolvedValue(makeTicket({ key: 'created' }))
    vi.mocked(updateTicket).mockResolvedValue(makeTicket({ key: 'updated' }))
    vi.mocked(deleteTicket).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('loads all tickets on mount with no filters', async () => {
    const tickets = [makeTicket({ key: 'A' }), makeTicket({ key: 'B' })]
    vi.mocked(listTickets).mockResolvedValue(tickets)

    const { result } = renderHook(() => useTickets())
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(listTickets).toHaveBeenCalledWith({
      status: undefined,
      tracker: undefined,
    })
    expect(result.current.tickets).toEqual(tickets)
    expect(result.current.error).toBeNull()
  })

  it('re-fetches with status and tracker filters when they change', async () => {
    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setStatusFilter('OPEN'))
    await waitFor(() =>
      expect(listTickets).toHaveBeenLastCalledWith({
        status: 'OPEN',
        tracker: undefined,
      }),
    )

    act(() => result.current.setTrackerFilter('JIRA'))
    await waitFor(() =>
      expect(listTickets).toHaveBeenLastCalledWith({
        status: 'OPEN',
        tracker: 'JIRA',
      }),
    )
  })

  it('creates a ticket when no editing id is given', async () => {
    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveTicket({ key: 'NEW' })
    })

    expect(createTicket).toHaveBeenCalledWith({ key: 'NEW' })
    expect(updateTicket).not.toHaveBeenCalled()
  })

  it('updates a ticket when an editing id is given', async () => {
    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.saveTicket({ key: 'PROJ-1', status: 'CLOSED' }, 'ticket-1')
    })

    expect(updateTicket).toHaveBeenCalledWith('ticket-1', {
      key: 'PROJ-1',
      status: 'CLOSED',
    })
    expect(createTicket).not.toHaveBeenCalled()
  })

  it('propagates save errors to the caller', async () => {
    vi.mocked(createTicket).mockRejectedValue(new Error('key exists'))
    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await expect(
      act(async () => {
        await result.current.saveTicket({ key: 'DUP' })
      }),
    ).rejects.toThrow('key exists')
  })

  it('deletes then reloads on success', async () => {
    const remaining = [makeTicket({ key: 'left' })]
    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    vi.mocked(listTickets).mockResolvedValue(remaining)
    await act(async () => {
      await result.current.removeTicket('ticket-1')
    })

    expect(deleteTicket).toHaveBeenCalledWith('ticket-1')
    expect(result.current.tickets).toEqual(remaining)
  })

  it('surfaces a delete failure via error without throwing', async () => {
    vi.mocked(deleteTicket).mockRejectedValue(new Error('delete failed'))
    const { result } = renderHook(() => useTickets())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.removeTicket('ticket-1')
    })

    expect(result.current.error).toBe('delete failed')
  })
})

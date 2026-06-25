import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TicketPicker } from './TicketPicker'
import { listTickets } from '../api/ticketsApi'
import type { Ticket } from '../types/ticket'

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

describe('TicketPicker', () => {
  beforeEach(() => {
    vi.mocked(listTickets).mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders fetched tickets as options labelled key — title', async () => {
    vi.mocked(listTickets).mockResolvedValue([
      makeTicket({ id: 't1', key: 'PROJ-1', title: 'Login' }),
    ])

    render(<TicketPicker value={null} onChange={vi.fn()} />)

    await waitFor(() =>
      expect(
        screen.getByRole('option', { name: 'PROJ-1 — Login' }),
      ).toBeInTheDocument(),
    )
  })

  it('reports the selected ticket id, and null for the empty option', async () => {
    vi.mocked(listTickets).mockResolvedValue([
      makeTicket({ id: 't1', key: 'PROJ-1' }),
    ])
    const onChange = vi.fn()
    render(<TicketPicker value={null} onChange={onChange} />)

    const select = await screen.findByRole('combobox')
    await userEvent.selectOptions(select, 't1')
    expect(onChange).toHaveBeenLastCalledWith('t1')

    await userEvent.selectOptions(select, '')
    expect(onChange).toHaveBeenLastCalledWith(null)
  })

  it('shows an error note when the ticket load fails', async () => {
    vi.mocked(listTickets).mockRejectedValue(new Error('boom'))

    render(<TicketPicker value={null} onChange={vi.fn()} />)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Couldn’t load tickets',
      ),
    )
  })
})

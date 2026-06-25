import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TicketForm } from './TicketForm'

describe('TicketForm', () => {
  it('blocks submit and shows an error when the key is empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TicketForm initial={null} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Key is required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a trimmed payload with the chosen fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TicketForm initial={null} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/Key/), '  PROJ-9  ')
    await userEvent.selectOptions(screen.getByLabelText('Tracker'), 'JIRA')
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'IN_PROGRESS')
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      key: 'PROJ-9',
      title: null,
      tracker: 'JIRA',
      url: null,
      status: 'IN_PROGRESS',
    })
  })

  it('pre-fills fields when editing', () => {
    const ticket = {
      id: '1',
      key: 'PROJ-1',
      title: 'Fix login',
      tracker: 'GITHUB' as const,
      url: 'https://example.com/1',
      status: 'CLOSED' as const,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    }
    render(<TicketForm initial={ticket} onSubmit={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByLabelText(/Key/)).toHaveValue('PROJ-1')
    expect(screen.getByLabelText('Tracker')).toHaveValue('GITHUB')
    expect(screen.getByLabelText('Status')).toHaveValue('CLOSED')
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })
})

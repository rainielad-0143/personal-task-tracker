import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskForm } from './TaskForm'

describe('TaskForm', () => {
  it('blocks submit and shows an error when the title is empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TaskForm initial={null} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Title is required')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a trimmed payload with the chosen fields (AC-17)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TaskForm initial={null} onSubmit={onSubmit} onCancel={vi.fn()} />)

    await userEvent.type(screen.getByLabelText(/Title/), '  Write the spec  ')
    await userEvent.selectOptions(
      screen.getByLabelText('Status'),
      'IN_PROGRESS',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Write the spec',
      description: null,
      status: 'IN_PROGRESS',
      ticketRef: null,
      dueDate: null,
    })
  })

  it('pre-fills fields when editing (AC-18)', () => {
    const task = {
      id: '1',
      title: 'Existing',
      description: 'desc',
      status: 'DONE' as const,
      ticketRef: 'PROJ-1',
      dueDate: '2026-07-01T00:00:00.000Z',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    }
    render(<TaskForm initial={task} onSubmit={vi.fn()} onCancel={vi.fn()} />)

    expect(screen.getByLabelText(/Title/)).toHaveValue('Existing')
    expect(screen.getByLabelText('Status')).toHaveValue('DONE')
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })
})

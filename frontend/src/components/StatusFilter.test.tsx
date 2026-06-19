import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusFilter } from './StatusFilter'

describe('StatusFilter', () => {
  it('renders an All tab plus one per status and marks the active one', () => {
    render(<StatusFilter value="ALL" onChange={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: 'To Do' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'In Progress' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Done' })).toBeInTheDocument()
  })

  it('reports the selected status (AC-16)', async () => {
    const onChange = vi.fn()
    render(<StatusFilter value="ALL" onChange={onChange} />)

    await userEvent.click(screen.getByRole('tab', { name: 'Done' }))

    expect(onChange).toHaveBeenCalledWith('DONE')
  })
})

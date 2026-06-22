import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthForm } from './AuthForm'
import { AuthProvider } from '../auth/AuthProvider'
import * as authApi from '../api/authApi'
import { ApiError } from '../api/http'

vi.mock('../api/authApi')

function renderForm() {
  // No stored token -> AuthProvider settles to "anonymous", and AuthForm itself
  // is what we render under it.
  render(
    <AuthProvider>
      <AuthForm />
    </AuthProvider>,
  )
}

describe('AuthForm', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('logs in with the entered email and password', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'jwt-1',
      user: { id: 'u1', email: 'me@example.com' },
    })

    renderForm()

    await user.type(screen.getByLabelText('Email'), 'me@example.com')
    await user.type(screen.getByLabelText('Password'), 'supersecret')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'me@example.com',
        password: 'supersecret',
      }),
    )
    // token persisted so the session survives a reload
    expect(localStorage.getItem('tt_token')).toBe('jwt-1')
  })

  it('toggles to register mode and calls register', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.register).mockResolvedValue({
      token: 'jwt-2',
      user: { id: 'u2', email: 'new@example.com' },
    })

    renderForm()

    await user.click(
      screen.getByRole('button', { name: /create an account/i }),
    )
    await user.type(screen.getByLabelText('Email'), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'supersecret')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() =>
      expect(authApi.register).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'supersecret',
      }),
    )
  })

  it('shows the API error message when login fails', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError('Invalid email or password', 401),
    )

    renderForm()

    await user.type(screen.getByLabelText('Email'), 'me@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrongpass1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('Invalid email or password'),
    ).toBeInTheDocument()
  })
})

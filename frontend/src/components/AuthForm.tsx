import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../api/http'

type Mode = 'login' | 'register'

/**
 * The unauthenticated entry screen: a single form that toggles between logging
 * in and registering. On success the AuthProvider flips the app to the task UI.
 */
export function AuthForm() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isRegister = mode === 'register'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const creds = { email, password }
      await (isRegister ? register(creds) : login(creds))
    } catch (err) {
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register')
    setError(null)
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Task Tracker</h1>
        <p className="auth-subtitle">
          {isRegister ? 'Create your account' : 'Sign in to your tasks'}
        </p>

        {error && (
          <p className="banner-error" role="alert">
            {error}
          </p>
        )}

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
          minLength={isRegister ? 8 : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="primary" disabled={submitting}>
          {submitting
            ? 'Please wait…'
            : isRegister
              ? 'Create account'
              : 'Sign in'}
        </button>

        <button type="button" className="link" onClick={switchMode}>
          {isRegister
            ? 'Already have an account? Sign in'
            : "New here? Create an account"}
        </button>
      </form>
    </div>
  )
}

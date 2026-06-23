import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import * as authApi from '../api/authApi'
import { UNAUTHORIZED_EVENT } from '../api/http'
import { clearToken, getToken, setToken } from '../api/authStorage'
import type { AuthCredentials, AuthUser } from '../types/auth'
import { AuthContext, type AuthStatus } from './auth-context'

/**
 * Owns the authentication state for the whole app: validates any stored token
 * on boot, exposes login/register/logout, and logs the user out when the API
 * reports the token is no longer valid (the UNAUTHORIZED_EVENT).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  // Derive the starting status synchronously: with no stored token we are
  // immediately anonymous; with one we stay "loading" until it's validated.
  // (Doing this here rather than in the effect avoids a synchronous setState
  // inside the effect body — see react-hooks/set-state-in-effect.)
  const [status, setStatus] = useState<AuthStatus>(() =>
    getToken() ? 'loading' : 'anonymous',
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setStatus('anonymous')
  }, [])

  // On mount, when a token is stored, confirm it still works. The setState
  // calls live in async promise callbacks, not the effect body.
  useEffect(() => {
    if (!getToken()) return
    authApi
      .fetchCurrentUser()
      .then((u) => {
        setUser(u)
        setStatus('authenticated')
      })
      .catch(() => {
        // invalid/expired token — http.ts already cleared it
        setUser(null)
        setStatus('anonymous')
      })
  }, [])

  // A 401 from any request means our session ended: drop back to the login screen.
  useEffect(() => {
    const onUnauthorized = () => logout()
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [logout])

  const authenticate = useCallback(
    async (
      action: (creds: AuthCredentials) => Promise<{ token: string; user: AuthUser }>,
      creds: AuthCredentials,
    ) => {
      const { token, user: u } = await action(creds)
      setToken(token)
      setUser(u)
      setStatus('authenticated')
    },
    [],
  )

  const login = useCallback(
    (creds: AuthCredentials) => authenticate(authApi.login, creds),
    [authenticate],
  )

  const register = useCallback(
    (creds: AuthCredentials) => authenticate(authApi.register, creds),
    [authenticate],
  )

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

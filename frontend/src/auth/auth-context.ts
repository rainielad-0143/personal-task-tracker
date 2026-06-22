import { createContext } from 'react'
import type { AuthCredentials, AuthUser } from '../types/auth'

/** Whether we are still validating a stored token, logged in, or logged out. */
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthContextValue {
  user: AuthUser | null
  status: AuthStatus
  login: (creds: AuthCredentials) => Promise<void>
  register: (creds: AuthCredentials) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

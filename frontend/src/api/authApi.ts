import type { AuthCredentials, AuthResult, AuthUser } from '../types/auth'
import { apiFetch } from './http'

export function register(creds: AuthCredentials): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(creds),
  })
}

export function login(creds: AuthCredentials): Promise<AuthResult> {
  return apiFetch<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(creds),
  })
}

/** Validates the stored token on app boot and returns the current user. */
export function fetchCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/me')
}

// Auth DTO shapes — kept in sync with the backend AuthService.

export interface AuthUser {
  id: string
  email: string
}

export interface AuthCredentials {
  email: string
  password: string
}

/** Returned by /auth/register and /auth/login. */
export interface AuthResult {
  token: string
  user: AuthUser
}

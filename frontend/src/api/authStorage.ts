// Persists the JWT in localStorage so a login survives reloads and new tabs.
// (Per the design decision: bearer token in localStorage, not an httpOnly cookie.)

const TOKEN_KEY = 'tt_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

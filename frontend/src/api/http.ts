import { clearToken, getToken } from './authStorage'

const BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000'
).replace(/\/$/, '')

/** Fired when the API rejects our token (401); the app listens to log the user out. */
export const UNAUTHORIZED_EVENT = 'auth:unauthorized'

/** Error carrying the HTTP status so the UI can react to it if needed. */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** Parses a JSON response, or throws an ApiError built from the error body. */
async function parse<T>(res: Response): Promise<T> {
  if (res.ok) {
    // 204 No Content has an empty body.
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
  }

  // A 401 means our token is missing/expired/invalid: drop it and let the app
  // fall back to the login screen.
  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }

  let message = `Request failed (${res.status})`
  try {
    const body = (await res.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) message = body.message.join(', ')
    else if (body.message) message = body.message
  } catch {
    // non-JSON error body — keep the default message
  }
  throw new ApiError(message, res.status)
}

/**
 * Shared fetch wrapper: prefixes the API base URL, attaches the bearer token
 * (when present) and a JSON content-type, then parses/error-maps the response.
 */
export function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(init.headers)
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  return fetch(`${BASE_URL}${path}`, { ...init, headers }).then((res) =>
    parse<T>(res),
  )
}

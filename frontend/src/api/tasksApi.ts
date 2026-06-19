import type {
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from '../types/task'

const BASE_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000'
).replace(/\/$/, '')

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

export function listTasks(status?: TaskStatus): Promise<Task[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return fetch(`${BASE_URL}/tasks${query}`).then((res) => parse<Task[]>(res))
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  return fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => parse<Task>(res))
}

export function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => parse<Task>(res))
}

export function deleteTask(id: string): Promise<void> {
  return fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' }).then((res) =>
    parse<void>(res),
  )
}

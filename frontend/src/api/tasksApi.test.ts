import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createTask, listTasks } from './tasksApi'
import { UNAUTHORIZED_EVENT } from './http'
import { setToken } from './authStorage'

const BASE = 'http://localhost:3000'

/** Builds a fake fetch Response. */
function fakeResponse(body: {
  ok?: boolean
  status?: number
  json?: unknown
}): Response {
  return {
    ok: body.ok ?? true,
    status: body.status ?? 200,
    json: () => Promise.resolve(body.json),
  } as Response
}

/** Reads the RequestInit headers from the Nth fetch call as a plain object. */
function headersOfCall(call: number): Record<string, string> {
  const init = vi.mocked(fetch).mock.calls[call][1] as RequestInit
  return Object.fromEntries(new Headers(init.headers) as unknown as Iterable<[string, string]>)
}

describe('tasksApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('listTasks() with no status hits /tasks without a query (AC-7)', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ json: [] }))

    await listTasks()

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`${BASE}/tasks`)
  })

  it('listTasks(status) adds the status query param (AC-8/AC-16)', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ json: [] }))

    await listTasks('IN_PROGRESS')

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      `${BASE}/tasks?status=IN_PROGRESS`,
    )
  })

  it('attaches the bearer token when one is stored', async () => {
    setToken('jwt-123')
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ json: [] }))

    await listTasks()

    expect(headersOfCall(0).authorization).toBe('Bearer jwt-123')
  })

  it('omits the Authorization header when no token is stored', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ json: [] }))

    await listTasks()

    expect(headersOfCall(0).authorization).toBeUndefined()
  })

  it('createTask() POSTs JSON to /tasks with a content-type', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ status: 201, json: {} }))

    await createTask({ title: 'New' })

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`${BASE}/tasks`)
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ title: 'New' }))
    expect(headersOfCall(0)['content-type']).toBe('application/json')
  })

  it('throws ApiError with the backend message on a 400', async () => {
    vi.mocked(fetch).mockResolvedValue(
      fakeResponse({
        ok: false,
        status: 400,
        json: { message: ['title should not be empty'] },
      }),
    )

    await expect(createTask({ title: '' })).rejects.toMatchObject({
      status: 400,
      message: 'title should not be empty',
    })
  })

  it('clears the token and emits an unauthorized event on a 401', async () => {
    setToken('jwt-123')
    vi.mocked(fetch).mockResolvedValue(
      fakeResponse({ ok: false, status: 401, json: { message: 'Unauthorized' } }),
    )
    const onUnauthorized = vi.fn()
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)

    await expect(listTasks()).rejects.toBeInstanceOf(ApiError)

    expect(localStorage.getItem('tt_token')).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  })
})

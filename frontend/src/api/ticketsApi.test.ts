import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTicket, deleteTicket, listTickets } from './ticketsApi'

// Resolve the base URL exactly as http.ts does, so the assertions hold whatever
// VITE_API_URL is set to locally (e.g. a dev backend on another port).
const BASE = (
  (import.meta.env.VITE_API_URL as string | undefined) ??
  'http://localhost:3000'
).replace(/\/$/, '')

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

describe('ticketsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('listTickets() with no params hits /tickets without a query', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ json: [] }))

    await listTickets()

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`${BASE}/tickets`)
  })

  it('listTickets() encodes status and tracker filters', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ json: [] }))

    await listTickets({ status: 'OPEN', tracker: 'JIRA' })

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(
      `${BASE}/tickets?status=OPEN&tracker=JIRA`,
    )
  })

  it('createTicket() POSTs JSON to /tickets', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ status: 201, json: {} }))

    await createTicket({ key: 'PROJ-1' })

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`${BASE}/tickets`)
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify({ key: 'PROJ-1' }))
  })

  it('deleteTicket() sends a DELETE and resolves on 204', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ status: 204 }))

    await expect(deleteTicket('abc')).resolves.toBeUndefined()
    const init = vi.mocked(fetch).mock.calls[0][1] as RequestInit
    expect(init.method).toBe('DELETE')
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe(`${BASE}/tickets/abc`)
  })

  it('surfaces the backend message as an ApiError on a 409', async () => {
    vi.mocked(fetch).mockResolvedValue(
      fakeResponse({
        ok: false,
        status: 409,
        json: { message: 'Ticket key "PROJ-1" already exists' },
      }),
    )

    await expect(createTicket({ key: 'PROJ-1' })).rejects.toMatchObject({
      status: 409,
      message: 'Ticket key "PROJ-1" already exists',
    })
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, createTask, listTasks } from './tasksApi'

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

describe('tasksApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('listTasks() with no status hits /tasks without a query (AC-7)', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ json: [] }))

    await listTasks()

    expect(fetch).toHaveBeenCalledWith(`${BASE}/tasks`)
  })

  it('listTasks(status) adds the status query param (AC-8/AC-16)', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ json: [] }))

    await listTasks('IN_PROGRESS')

    expect(fetch).toHaveBeenCalledWith(`${BASE}/tasks?status=IN_PROGRESS`)
  })

  it('createTask() POSTs JSON to /tasks', async () => {
    vi.mocked(fetch).mockResolvedValue(fakeResponse({ status: 201, json: {} }))

    await createTask({ title: 'New' })

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/tasks`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'New' }),
      }),
    )
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
    await expect(createTask({ title: '' })).rejects.toBeInstanceOf(ApiError)
  })
})

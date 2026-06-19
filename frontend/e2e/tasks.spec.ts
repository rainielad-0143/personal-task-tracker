import { test, expect, type APIRequestContext } from '@playwright/test'

const API = 'http://localhost:3000'

interface SeedTask {
  title: string
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
  ticketRef?: string | null
  dueDate?: string | null
}

/** Delete every task via the real API so each test starts from a clean list. */
async function resetTasks(request: APIRequestContext): Promise<void> {
  const res = await request.get(`${API}/tasks`)
  const tasks = (await res.json()) as { id: string }[]
  for (const t of tasks) await request.delete(`${API}/tasks/${t.id}`)
}

/** Create a task via the API and return it (used to seed list/filter tests). */
async function seed(request: APIRequestContext, task: SeedTask) {
  const res = await request.post(`${API}/tasks`, { data: task })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

test.beforeEach(async ({ request }) => {
  await resetTasks(request)
})

test('AC-17: creating a task adds it to the list without a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '+ New task' }).click()
  await page.getByLabel(/Title/).fill('Write Q3 report')
  await page.getByRole('button', { name: 'Create' }).click()

  // No page.reload() — the list updates in place.
  await expect(page.getByText('Write Q3 report')).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(1)
})

test('AC-15: list renders newest-first with title, status, ticket, due date', async ({
  page,
  request,
}) => {
  await seed(request, { title: 'Oldest', ticketRef: 'PROJ-1' })
  await seed(request, { title: 'Middle', status: 'IN_PROGRESS' })
  await seed(request, { title: 'Newest', status: 'DONE', ticketRef: 'PROJ-9' })

  await page.goto('/')
  const rows = page.getByRole('listitem')
  await expect(rows).toHaveCount(3)

  // Newest-created first (AC-7 ordering surfaced in the UI).
  await expect(rows.nth(0)).toContainText('Newest')
  await expect(rows.nth(2)).toContainText('Oldest')
  // Fields present.
  await expect(rows.nth(0)).toContainText('Done')
  await expect(rows.nth(0)).toContainText('PROJ-9')
  await expect(rows.nth(2)).toContainText('PROJ-1')
})

test('AC-16: status filter narrows the list and "All" restores it', async ({
  page,
  request,
}) => {
  await seed(request, { title: 'A todo', status: 'TODO' })
  await seed(request, { title: 'A progress', status: 'IN_PROGRESS' })
  await seed(request, { title: 'A done', status: 'DONE' })

  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(3)

  await page.getByRole('tab', { name: 'Done' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(1)
  await expect(page.getByText('A done')).toBeVisible()

  await page.getByRole('tab', { name: 'All' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(3)
})

test('AC-18: editing a task reflects the updated values in the list', async ({
  page,
  request,
}) => {
  await seed(request, { title: 'Old title' })

  await page.goto('/')
  await page.getByRole('button', { name: 'Edit' }).click()
  const title = page.getByLabel(/Title/)
  await title.fill('New title')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByText('New title')).toBeVisible()
  await expect(page.getByText('Old title')).toHaveCount(0)
})

test('AC-19: deleting a task asks for confirmation and removes the row', async ({
  page,
  request,
}) => {
  await seed(request, { title: 'Delete me' })

  await page.goto('/')
  page.on('dialog', (d) => d.accept()) // window.confirm
  await page.getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByText('Delete me')).toHaveCount(0)
  await expect(page.getByRole('listitem')).toHaveCount(0)
})

test('AC-19b: cancelling the confirm keeps the task', async ({ page, request }) => {
  await seed(request, { title: 'Keep me' })

  await page.goto('/')
  page.on('dialog', (d) => d.dismiss()) // user clicks Cancel
  await page.getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByText('Keep me')).toBeVisible()
})

test('AC-20: empty state shows a message when there are no tasks', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/No tasks yet/i)).toBeVisible()
})

test('AC-20b: filtered-empty shows a status-specific message', async ({
  page,
  request,
}) => {
  await seed(request, { title: 'Only todo', status: 'TODO' })

  await page.goto('/')
  await page.getByRole('tab', { name: 'Done' }).click()
  await expect(page.getByText(/No done tasks/i)).toBeVisible()
})

// --- Documented bug (expected failure) -------------------------------------
// formatDate() in TaskItem.tsx does new Date(iso).toLocaleDateString(); a
// date-only dueDate is stored as UTC midnight, so users west of UTC see the
// previous calendar day. Pinned to a sub-UTC timezone to reproduce
// deterministically. Marked test.fail() so the suite stays green while the bug
// is open — see review-notes.md.
test.describe('due date timezone handling', () => {
  test.use({ timezoneId: 'America/New_York' })

  test('AC-15c: due date keeps the calendar date the user entered', async ({
    page,
    request,
  }) => {
    test.fail() // KNOWN BUG: off-by-one under sub-UTC timezones
    await seed(request, { title: 'Dentist', dueDate: '2026-06-20' })

    await page.goto('/')
    await expect(page.getByRole('listitem')).toContainText('6/20/2026')
  })
})

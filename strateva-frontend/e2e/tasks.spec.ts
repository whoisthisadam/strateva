import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { assertNoEnglish } from './helpers/assertNoEnglish'
import { TEST_USERS, type TestUserKey } from './helpers/users'

const TOKEN_KEY = 'strateva.token'
const BRAND_ALLOW = [/^Strateva$/, /^KPI$/, /^(pm|ba|emp)$/]
const FORBIDDEN_SNIPPET = 'Недостаточно прав'

async function apiLogin(ctx: APIRequestContext, key: TestUserKey): Promise<string> {
  const u = TEST_USERS[key]
  const res = await ctx.post('/api/v1/auth/login', {
    data: { username: u.username, password: u.password },
  })
  expect(res.ok(), `login failed for ${key}`).toBeTruthy()
  return (await res.json()).token as string
}

async function ensureActiveGoal(ctx: APIRequestContext, pmToken: string): Promise<string> {
  const auth = { Authorization: `Bearer ${pmToken}` }
  const listed = await ctx.get('/api/v1/goals?size=50&status=ACTIVE', { headers: auth })
  const existing = ((await listed.json()).content ?? []) as Array<{ id: string }>
  if (existing.length > 0) return existing[0].id
  const today = new Date()
  const end = new Date(today)
  end.setMonth(end.getMonth() + 6)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const created = await ctx.post('/api/v1/goals', {
    headers: { ...auth, 'Content-Type': 'application/json' },
    data: {
      title: 'E2E tasks: цель',
      periodStart: fmt(today),
      periodEnd: fmt(end),
      priority: 'HIGH',
      kpis: [{ name: 'Контрольный KPI', targetValue: '100', currentValue: '0', unit: '%' }],
    },
  })
  expect(created.ok(), 'create goal for tasks').toBeTruthy()
  const goalId = (await created.json()).id as string
  await ctx.post(`/api/v1/goals/${goalId}/submit`, { headers: auth })
  await ctx.post(`/api/v1/goals/${goalId}/status`, {
    headers: { ...auth, 'Content-Type': 'application/json' },
    data: { status: 'ACTIVE' },
  })
  return goalId
}

async function apiCreateTask(
  ctx: APIRequestContext,
  pmToken: string,
  goalId: string,
  title: string,
): Promise<string> {
  const res = await ctx.post('/api/v1/tasks', {
    headers: { Authorization: `Bearer ${pmToken}`, 'Content-Type': 'application/json' },
    data: { title, description: null, goalId, priority: 'MEDIUM', deadline: null },
  })
  expect(res.ok(), 'create task').toBeTruthy()
  return (await res.json()).id as string
}

async function apiAssignTask(
  ctx: APIRequestContext,
  pmToken: string,
  taskId: string,
  assignee: string,
): Promise<void> {
  const res = await ctx.post(`/api/v1/tasks/${taskId}/assignee`, {
    headers: { Authorization: `Bearer ${pmToken}`, 'Content-Type': 'application/json' },
    data: { assignee },
  })
  expect(res.ok(), 'assign task').toBeTruthy()
}

async function authAs(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    ({ k, t }) => window.localStorage.setItem(k, t),
    { k: TOKEN_KEY, t: token },
  )
}

test.describe('Tasks — lifecycle, assignment, BR-3 and UC-9', () => {
  let pmToken = ''
  let baToken = ''
  let empToken = ''
  let goalId = ''

  test.beforeAll(async ({ request }) => {
    pmToken = await apiLogin(request, 'pm')
    baToken = await apiLogin(request, 'ba')
    empToken = await apiLogin(request, 'emp')
    goalId = await ensureActiveGoal(request, pmToken)
  })

  test('PM: creates a task, assigns employee via UI', async ({ page }) => {
    await authAs(page, pmToken)
    const title = `E2E задача ${Date.now()}`

    await page.goto('/tasks/new')
    await expect(page.getByRole('heading', { name: 'Новая задача' })).toBeVisible()
    await page.getByTestId('task-title').fill(title)
    await page.getByTestId('task-goal').selectOption({ index: 1 })
    await page.getByTestId('task-submit').click()

    await expect(page).toHaveURL(/\/tasks\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByTestId('task-status')).toHaveText('К выполнению')

    // BR-3: without assignee the status dropdown must be locked.
    const select = page.getByTestId('task-status-select')
    await expect(select).toBeDisabled()
    await expect(page.getByTestId('task-status-lock-reason')).toBeVisible()

    await page.getByTestId('action-assign').click()
    const dialog = page.getByTestId('task-assign-dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByTestId('task-assignee-select').selectOption({ value: TEST_USERS.emp.username })
    await dialog.getByTestId('task-assign-submit').click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText(TEST_USERS.emp.username)).toBeVisible()
    await expect(select).toBeEnabled()
    await assertNoEnglish(page, { allow: BRAND_ALLOW })
  })

  test('EMPLOYEE: moves an assigned task TODO → IN_PROGRESS → DONE', async ({ page, request }) => {
    const taskId = await apiCreateTask(request, pmToken, goalId, `E2E поток ${Date.now()}`)
    await apiAssignTask(request, pmToken, taskId, TEST_USERS.emp.username)

    await authAs(page, empToken)
    await page.goto(`/tasks/${taskId}`)
    await expect(page.getByTestId('task-status')).toHaveText('К выполнению')

    await page.getByTestId('task-status-select').selectOption({ value: 'IN_PROGRESS' })
    await expect(page.getByTestId('task-status')).toHaveText('В работе')

    await page.getByTestId('task-status-select').selectOption({ value: 'DONE' })
    await expect(page.getByTestId('task-status')).toHaveText('Завершена')

    // DONE is terminal → dropdown is gone (panel hidden).
    await expect(page.getByTestId('task-status-panel')).toHaveCount(0)
  })

  test('EMPLOYEE: UC-9 — /tasks list shows only own tasks', async ({ page, request }) => {
    // One task assigned to employee, one unassigned and one unrelated to employee.
    const mineId = await apiCreateTask(request, pmToken, goalId, `E2E моя ${Date.now()}`)
    await apiAssignTask(request, pmToken, mineId, TEST_USERS.emp.username)
    await apiCreateTask(request, pmToken, goalId, `E2E чужая ${Date.now()}`)

    await authAs(page, empToken)
    await page.goto('/tasks')
    await expect(page.getByRole('heading', { name: 'Задачи' })).toBeVisible()
    // Wait for the list XHR to resolve and at least one row to render.
    const rows = page.getByTestId('tasks-row')
    await expect(rows.first()).toBeVisible()
    const assigneeCells = rows.locator('td:nth-child(5)')
    const count = await assigneeCells.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      await expect(assigneeCells.nth(i)).toHaveText(TEST_USERS.emp.username)
    }
    // «Создать задачу» is PM-only.
    await expect(page.getByTestId('create-task')).toHaveCount(0)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('EMPLOYEE: foreign task detail returns 404 view', async ({ page, request }) => {
    const foreignId = await apiCreateTask(request, pmToken, goalId, `E2E чужая ${Date.now()}`)
    await authAs(page, empToken)
    await page.goto(`/tasks/${foreignId}`)
    // Backend returns 404 → hook surfaces error path; detail heading must not show foreign title.
    await expect(page.getByTestId('task-status-panel')).toHaveCount(0)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('BA: /tasks/new silently redirects to /tasks', async ({ page }) => {
    await authAs(page, baToken)
    await page.goto('/tasks/new')
    await expect(page).toHaveURL(/\/tasks$/)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
    await expect(page.getByTestId('create-task')).toHaveCount(0)
  })

  test('EMPLOYEE: /tasks/new silently redirects to /tasks', async ({ page }) => {
    await authAs(page, empToken)
    await page.goto('/tasks/new')
    await expect(page).toHaveURL(/\/tasks$/)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('Nav «Задачи» is visible for all three roles', async ({ page }) => {
    for (const token of [pmToken, baToken, empToken]) {
      await authAs(page, token)
      await page.goto('/')
      await expect(page.getByRole('navigation').getByText('Задачи')).toBeVisible()
    }
  })

  test('Dashboard card «Задачи» is visible for all three roles', async ({ page }) => {
    for (const token of [pmToken, baToken, empToken]) {
      await authAs(page, token)
      await page.goto('/')
      await expect(page.getByTestId('dashboard-card-tasks')).toBeVisible()
    }
  })
})

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { assertNoEnglish } from './helpers/assertNoEnglish'
import { TEST_USERS, type TestUserKey } from './helpers/users'

const TOKEN_KEY = 'strateva.token'
const BRAND_ALLOW = [/^Strateva$/, /^KPI$/]
const FORBIDDEN_SNIPPET = 'Недостаточно прав'

async function apiLogin(ctx: APIRequestContext, key: TestUserKey): Promise<string> {
  const u = TEST_USERS[key]
  const res = await ctx.post('/api/v1/auth/login', {
    data: { username: u.username, password: u.password },
  })
  expect(res.ok(), `login failed for ${key}`).toBeTruthy()
  return (await res.json()).token as string
}

async function ensureGoalId(ctx: APIRequestContext, pmToken: string): Promise<string> {
  const auth = { Authorization: `Bearer ${pmToken}` }
  const listed = await ctx.get('/api/v1/goals?size=50', { headers: auth })
  const content = ((await listed.json()).content ?? []) as Array<{ id: string }>
  if (content.length > 0) return content[0].id
  const today = new Date()
  const end = new Date(today)
  end.setMonth(end.getMonth() + 6)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const created = await ctx.post('/api/v1/goals', {
    headers: { ...auth, 'Content-Type': 'application/json' },
    data: {
      title: 'E2E backlog: цель',
      periodStart: fmt(today),
      periodEnd: fmt(end),
      priority: 'HIGH',
      kpis: [{ name: 'Контрольный KPI', targetValue: '100', currentValue: '0', unit: '%' }],
    },
  })
  expect(created.ok(), 'create goal for backlog').toBeTruthy()
  return (await created.json()).id as string
}

async function apiCreateBacklog(
  ctx: APIRequestContext,
  baToken: string,
  goalId: string,
  title: string,
): Promise<string> {
  const res = await ctx.post('/api/v1/backlogs', {
    headers: { Authorization: `Bearer ${baToken}`, 'Content-Type': 'application/json' },
    data: { title, goalId },
  })
  expect(res.ok(), 'create backlog').toBeTruthy()
  return (await res.json()).id as string
}

async function apiAddItem(
  ctx: APIRequestContext,
  baToken: string,
  backlogId: string,
  title: string,
): Promise<void> {
  const res = await ctx.post(`/api/v1/backlogs/${backlogId}/items`, {
    headers: { Authorization: `Bearer ${baToken}`, 'Content-Type': 'application/json' },
    data: { title, description: null, priority: 'MEDIUM' },
  })
  expect(res.ok(), 'add backlog item').toBeTruthy()
}

async function apiSubmit(ctx: APIRequestContext, baToken: string, backlogId: string): Promise<void> {
  const res = await ctx.post(`/api/v1/backlogs/${backlogId}/submit`, {
    headers: { Authorization: `Bearer ${baToken}` },
  })
  expect(res.ok(), 'submit backlog').toBeTruthy()
}

async function authAs(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    ({ k, t }) => window.localStorage.setItem(k, t),
    { k: TOKEN_KEY, t: token },
  )
}

test.describe('Backlog — lifecycle and silent authorization', () => {
  let pmToken = ''
  let baToken = ''
  let empToken = ''
  let goalId = ''

  test.beforeAll(async ({ request }) => {
    pmToken = await apiLogin(request, 'pm')
    baToken = await apiLogin(request, 'ba')
    empToken = await apiLogin(request, 'emp')
    goalId = await ensureGoalId(request, pmToken)
  })

  test('BA: creates backlog, adds item, submits via UI', async ({ page, request }) => {
    await authAs(page, baToken)
    const title = `E2E создание ${Date.now()}`

    await page.goto('/backlogs/new')
    await expect(page.getByRole('heading', { name: 'Новый бэклог' })).toBeVisible()
    await page.getByTestId('backlog-title').fill(title)
    await page.getByTestId('backlog-goal').selectOption({ index: 1 })
    await page.getByTestId('backlog-submit').click()

    await expect(page).toHaveURL(/\/backlogs\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: title })).toBeVisible()
    await expect(page.getByTestId('backlog-status')).toHaveText('Черновик')

    // Submit button is not shown until we have at least one item.
    await expect(page.locator('[data-testid="action-submit"]')).toHaveCount(0)

    await page.getByTestId('add-backlog-item').click()
    const form = page.getByTestId('backlog-item-form')
    await form.getByLabel('Наименование элемента').fill('Элемент E2E')
    await form.getByLabel('Описание').fill('Контекст из автотеста')
    await form.getByTestId('backlog-item-submit').click()
    await expect(page.getByTestId('backlog-item-row')).toHaveCount(1)

    page.once('dialog', (d) => void d.accept())
    await page.getByTestId('action-submit').click()
    await expect(page.getByTestId('backlog-status')).toHaveText('На согласовании')

    // After submission, item mutation UI must be gone for BA.
    await expect(page.getByTestId('add-backlog-item')).toHaveCount(0)
    await expect(page.locator('[data-testid="edit-backlog-item"]')).toHaveCount(0)
    await assertNoEnglish(page, { allow: [...BRAND_ALLOW, /^(pm|ba|emp)$/] })
    // Cleanup done by PM sign below would be ideal; leave in SUBMITTED so next
    // test can transition it — but since each test creates a fresh one via API
    // we simply leave it; DB is scoped to the e2e run.
    void request
  })

  test('PM: signs a submitted backlog', async ({ page, request }) => {
    const title = `E2E подпись ${Date.now()}`
    const id = await apiCreateBacklog(request, baToken, goalId, title)
    await apiAddItem(request, baToken, id, 'Готовый элемент')
    await apiSubmit(request, baToken, id)

    await authAs(page, pmToken)
    await page.goto(`/backlogs/${id}`)
    await expect(page.getByTestId('backlog-status')).toHaveText('На согласовании')

    page.once('dialog', (d) => void d.accept())
    await page.getByTestId('action-sign').click()
    await expect(page.getByTestId('backlog-status')).toHaveText('Подписан')
    // After signing no actionable buttons remain for PM.
    await expect(page.getByTestId('action-sign')).toHaveCount(0)
    await expect(page.getByTestId('action-cancel')).toHaveCount(0)
    await assertNoEnglish(page, { allow: [...BRAND_ALLOW, /^(pm|ba|emp)$/] })
  })

  test('PM: cancels a draft backlog', async ({ page, request }) => {
    const id = await apiCreateBacklog(request, baToken, goalId, `E2E отмена ${Date.now()}`)
    await authAs(page, pmToken)
    await page.goto(`/backlogs/${id}`)
    await expect(page.getByTestId('backlog-status')).toHaveText('Черновик')

    page.once('dialog', (d) => void d.accept())
    await page.getByTestId('action-cancel').click()
    await expect(page.getByTestId('backlog-status')).toHaveText('Сторнирован')
  })

  test('BA: no sign/cancel buttons even on SUBMITTED backlog', async ({ page, request }) => {
    const id = await apiCreateBacklog(request, baToken, goalId, `E2E BA-readonly ${Date.now()}`)
    await apiAddItem(request, baToken, id, 'Элемент для SUBMITTED')
    await apiSubmit(request, baToken, id)

    await authAs(page, baToken)
    await page.goto(`/backlogs/${id}`)
    await expect(page.getByTestId('backlog-status')).toHaveText('На согласовании')
    await expect(page.getByTestId('action-sign')).toHaveCount(0)
    await expect(page.getByTestId('action-cancel')).toHaveCount(0)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('PM: /backlogs hides «Создать бэклог»', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/backlogs')
    await expect(page.getByRole('heading', { name: 'Бэклоги' })).toBeVisible()
    await expect(page.getByTestId('create-backlog')).toHaveCount(0)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('PM: /backlogs/new silently redirects to /backlogs', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/backlogs/new')
    await expect(page).toHaveURL(/\/backlogs$/)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('EMPLOYEE: /backlogs silently redirects to /', async ({ page }) => {
    await authAs(page, empToken)
    await page.goto('/backlogs')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('EMPLOYEE: nav entry «Бэклоги» is absent', async ({ page }) => {
    await authAs(page, empToken)
    await page.goto('/')
    await expect(page.getByRole('navigation').getByText('Бэклоги')).toHaveCount(0)
  })
})

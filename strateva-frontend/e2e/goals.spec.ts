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

async function ensureActiveGoal(ctx: APIRequestContext, pmToken: string): Promise<string> {
  const auth = { Authorization: `Bearer ${pmToken}` }
  const listed = await ctx.get('/api/v1/goals?size=50', { headers: auth })
  const existing = ((await listed.json()).content ?? []).find((g: { status: string }) => g.status === 'ACTIVE')
  if (existing) return existing.id as string

  const today = new Date()
  const end = new Date(today)
  end.setMonth(end.getMonth() + 6)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const created = await ctx.post('/api/v1/goals', {
    headers: { ...auth, 'Content-Type': 'application/json' },
    data: {
      title: 'E2E: Проверка скрытой авторизации',
      description: 'Создано автотестом для проверки silent-authz',
      periodStart: fmt(today),
      periodEnd: fmt(end),
      priority: 'HIGH',
      kpis: [{ name: 'Контрольный KPI', targetValue: '100', currentValue: '0', unit: '%' }],
    },
  })
  expect(created.ok(), 'create goal').toBeTruthy()
  const goal = await created.json()
  const submit = await ctx.post(`/api/v1/goals/${goal.id}/submit`, { headers: auth })
  expect(submit.ok(), 'submit goal').toBeTruthy()
  const activate = await ctx.post(`/api/v1/goals/${goal.id}/status`, {
    headers: { ...auth, 'Content-Type': 'application/json' },
    data: { status: 'ACTIVE' },
  })
  expect(activate.ok(), 'activate goal').toBeTruthy()
  return goal.id as string
}

async function authAs(page: Page, token: string): Promise<void> {
  // addInitScript runs before every navigation in this page, so the token
  // survives all subsequent page.goto() calls within the test.
  await page.addInitScript(
    ({ k, t }) => window.localStorage.setItem(k, t),
    { k: TOKEN_KEY, t: token },
  )
}

test.describe('Strategic goals — silent authorization', () => {
  let pmToken = ''
  let baToken = ''
  let empToken = ''
  let activeGoalId = ''

  test.beforeAll(async ({ request }) => {
    pmToken = await apiLogin(request, 'pm')
    baToken = await apiLogin(request, 'ba')
    empToken = await apiLogin(request, 'emp')
    activeGoalId = await ensureActiveGoal(request, pmToken)
  })

  test('BA: /goals hides «Создать цель» and shows no forbidden banner', async ({ page }) => {
    await authAs(page, baToken)
    await page.goto('/goals')
    await expect(page.getByRole('heading', { name: 'Стратегические цели' })).toBeVisible()
    await expect(page.getByTestId('create-goal')).toHaveCount(0)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
    await assertNoEnglish(page, { allow: BRAND_ALLOW })
  })

  test('BA: /goals/:id hides action container and action buttons', async ({ page }) => {
    await authAs(page, baToken)
    await page.goto(`/goals/${activeGoalId}`)
    await expect(page.getByRole('heading').first()).toBeVisible()
    await expect(page.getByTestId('goal-actions')).toHaveCount(0)
    await expect(page.locator('[data-testid^="action-"]')).toHaveCount(0)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
    // Author field renders the raw username literal (pm/ba/emp), allowlist it.
    await assertNoEnglish(page, { allow: [...BRAND_ALLOW, /^(pm|ba|emp)$/] })
  })

  test('BA: /goals/new silently redirects to /goals', async ({ page }) => {
    await authAs(page, baToken)
    await page.goto('/goals/new')
    await expect(page).toHaveURL(/\/goals$/)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('BA: /goals/:id/edit silently redirects to /goals', async ({ page }) => {
    await authAs(page, baToken)
    await page.goto(`/goals/${activeGoalId}/edit`)
    await expect(page).toHaveURL(/\/goals$/)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('EMPLOYEE: /goals hides «Создать цель» and status filter', async ({ page }) => {
    await authAs(page, empToken)
    await page.goto('/goals')
    await expect(page.getByRole('heading', { name: 'Стратегические цели' })).toBeVisible()
    await expect(page.getByTestId('create-goal')).toHaveCount(0)
    await expect(page.getByTestId('goals-status-filter')).toHaveCount(0)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('EMPLOYEE: /goals/new silently redirects to /goals', async ({ page }) => {
    await authAs(page, empToken)
    await page.goto('/goals/new')
    await expect(page).toHaveURL(/\/goals$/)
    await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
  })

  test('PM regression: /goals/new renders form and /goals/:id shows action container', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/goals/new')
    await expect(page).toHaveURL(/\/goals\/new$/)
    await expect(page.getByRole('heading', { name: 'Новая стратегическая цель' })).toBeVisible()

    await page.goto(`/goals/${activeGoalId}`)
    await expect(page.getByTestId('goal-actions')).toBeVisible()
  })
})

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { assertNoEnglish } from './helpers/assertNoEnglish'
import { TEST_USERS, type TestUserKey } from './helpers/users'

const TOKEN_KEY = 'strateva.token'
const BRAND_ALLOW = [/^Strateva$/, /^KPI$/, /^(pm|ba|emp)$/, /^CSV$/]
const FORBIDDEN_SNIPPET = 'Недостаточно прав'

async function apiLogin(ctx: APIRequestContext, key: TestUserKey): Promise<string> {
  const u = TEST_USERS[key]
  const res = await ctx.post('/api/v1/auth/login', {
    data: { username: u.username, password: u.password },
  })
  expect(res.ok(), `login failed for ${key}`).toBeTruthy()
  return (await res.json()).token as string
}

async function authAs(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    ({ k, t }) => window.localStorage.setItem(k, t),
    { k: TOKEN_KEY, t: token },
  )
}

test.describe('Reports & Analytics — PM visibility and BA/EMP hiding', () => {
  let pmToken = ''
  let baToken = ''
  let empToken = ''

  test.beforeAll(async ({ request }) => {
    pmToken = await apiLogin(request, 'pm')
    baToken = await apiLogin(request, 'ba')
    empToken = await apiLogin(request, 'emp')
  })

  test('PM: /analytics renders overview tiles and chart containers', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/analytics')

    await expect(page.getByTestId('analytics-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Панель аналитики' })).toBeVisible()

    // Six overview tiles.
    for (const tile of [
      'analytics-goals-total',
      'analytics-goals-active',
      'analytics-tasks-total',
      'analytics-tasks-done',
      'analytics-tasks-overdue',
      'analytics-backlogs-signed',
    ]) {
      await expect(page.getByTestId(tile)).toBeVisible()
    }

    // Three chart containers (cards) regardless of data presence.
    await expect(page.getByTestId('analytics-chart-goals')).toBeVisible()
    await expect(page.getByTestId('analytics-chart-workload')).toBeVisible()
    await expect(page.getByTestId('analytics-chart-throughput')).toBeVisible()

    await assertNoEnglish(page, { allow: BRAND_ALLOW })
  })

  test('PM: /reports renders all five tabs and switches between them', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/reports')

    await expect(page.getByTestId('reports-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Отчёты' })).toBeVisible()

    const tabs = [
      'reports-tab-goals-progress',
      'reports-tab-kpis-progress',
      'reports-tab-task-workload',
      'reports-tab-overdue-tasks',
      'reports-tab-backlog-throughput',
    ]
    for (const t of tabs) {
      await expect(page.getByTestId(t)).toBeVisible()
    }

    // Default tab is goals-progress → selected, others not.
    await expect(page.getByTestId('reports-tab-goals-progress')).toHaveAttribute(
      'aria-selected',
      'true',
    )

    // Switch tabs and verify selection updates.
    await page.getByTestId('reports-tab-task-workload').click()
    await expect(page.getByTestId('reports-tab-task-workload')).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByTestId('reports-tab-goals-progress')).toHaveAttribute(
      'aria-selected',
      'false',
    )

    await assertNoEnglish(page, { allow: BRAND_ALLOW })
  })

  test('PM: CSV export from /reports triggers a browser download', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/reports')
    await expect(page.getByTestId('reports-export-csv')).toBeEnabled()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('reports-export-csv').click(),
    ])
    expect(download.suggestedFilename()).toBe('goals-progress.csv')
  })

  test('PM: dashboard surfaces the reports summary card', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/')
    await expect(page.getByTestId('dashboard-card-reports')).toBeVisible()
    await expect(page.getByTestId('dashboard-card-reports-overdue')).toBeVisible()
  })

  test('PM: nav exposes «Панель аналитики» and «Отчёты»', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/')
    const nav = page.getByRole('navigation')
    await expect(nav.getByText('Панель аналитики')).toBeVisible()
    await expect(nav.getByText('Отчёты', { exact: true })).toBeVisible()
  })

  for (const role of ['ba', 'emp'] as const) {
    test(`${role.toUpperCase()}: /analytics silently redirects to /`, async ({ page }) => {
      await authAs(page, role === 'ba' ? baToken : empToken)
      await page.goto('/analytics')
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
      await expect(page.getByTestId('analytics-page')).toHaveCount(0)
    })

    test(`${role.toUpperCase()}: /reports silently redirects to /`, async ({ page }) => {
      await authAs(page, role === 'ba' ? baToken : empToken)
      await page.goto('/reports')
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
      await expect(page.getByTestId('reports-page')).toHaveCount(0)
    })

    test(`${role.toUpperCase()}: nav hides analytics/reports and dashboard hides reports card`, async ({ page }) => {
      await authAs(page, role === 'ba' ? baToken : empToken)
      await page.goto('/')
      const nav = page.getByRole('navigation')
      await expect(nav.getByText('Панель аналитики')).toHaveCount(0)
      await expect(nav.getByText('Отчёты', { exact: true })).toHaveCount(0)
      await expect(page.getByTestId('dashboard-card-reports')).toHaveCount(0)
    })
  }
})

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'
import { assertNoEnglish } from './helpers/assertNoEnglish'
import { TEST_USERS, type TestUserKey } from './helpers/users'

const TOKEN_KEY = 'strateva.token'
// The audit viewer surfaces raw domain entity-type identifiers as source tokens.
const BRAND_ALLOW = [
  /^Strateva$/,
  /^KPI$/,
  /^(pm|ba|emp)$/,
  /^StrategicGoal$/,
  /^Backlog$/,
  /^Task$/,
  /^User$/,
]
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

test.describe('Admin — audit viewer & user list (PM-only)', () => {
  let pmToken = ''
  let baToken = ''
  let empToken = ''

  test.beforeAll(async ({ request }) => {
    pmToken = await apiLogin(request, 'pm')
    baToken = await apiLogin(request, 'ba')
    empToken = await apiLogin(request, 'emp')
  })

  test('PM: /admin/audit renders filters, table, and paginates', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/admin/audit')

    await expect(page.getByTestId('audit-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Журнал аудита' })).toBeVisible()
    await expect(page.getByTestId('audit-filter-entity-type')).toBeVisible()
    await expect(page.getByTestId('audit-filter-performed-by')).toBeVisible()
    await expect(page.getByTestId('audit-filter-apply')).toBeEnabled()
    await expect(page.getByTestId('audit-filter-reset')).toBeEnabled()

    // Seed data should ensure at least one audit row exists.
    await expect(page.getByTestId('audit-row').first()).toBeVisible()
    await expect(page.getByTestId('audit-pagination-status')).toBeVisible()

    await assertNoEnglish(page, { allow: BRAND_ALLOW })
  })

  test('PM: entity-type filter narrows the result set', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/admin/audit')
    await expect(page.getByTestId('audit-row').first()).toBeVisible()

    await page.getByTestId('audit-filter-entity-type').selectOption('StrategicGoal')
    await page.getByTestId('audit-filter-apply').click()
    await expect(page.getByTestId('audit-row').first()).toBeVisible()

    // Every visible row must have entityType = StrategicGoal.
    const types = await page.locator('[data-testid="audit-row"] td:nth-child(5)').allInnerTexts()
    expect(types.length).toBeGreaterThan(0)
    for (const t of types) expect(t.trim()).toBe('StrategicGoal')
  })

  test('PM: row expand surfaces the details panel', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/admin/audit')
    const firstRow = page.getByTestId('audit-row').first()
    await expect(firstRow).toBeVisible()

    const toggle = firstRow.locator('button[data-testid^="audit-row-toggle-"]')
    await toggle.click()

    await expect(page.getByText('Детали изменения').first()).toBeVisible()
  })

  test('PM: /admin/users lists seeded users with role badges', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/admin/users')

    await expect(page.getByTestId('users-page')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Пользователи' })).toBeVisible()

    const rows = page.getByTestId('users-row')
    await expect(rows).toHaveCount(3)
    await expect(page.getByTestId('user-role').filter({ hasText: 'Менеджер проектов' })).toBeVisible()
    await expect(page.getByTestId('user-role').filter({ hasText: 'Бизнес-аналитик' })).toBeVisible()
    await expect(page.getByTestId('user-role').filter({ hasText: 'Сотрудник' })).toBeVisible()

    await assertNoEnglish(page, { allow: BRAND_ALLOW })
  })

  test('PM: /admin/users role filter narrows to one user', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/admin/users')
    await page.getByTestId('users-role-filter').selectOption('EMPLOYEE')
    await expect(page.getByTestId('users-row')).toHaveCount(1)
  })

  test('PM: dashboard surfaces the audit summary card', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/')
    await expect(page.getByTestId('dashboard-card-audit')).toBeVisible()
    await expect(page.getByTestId('dashboard-card-audit-total')).toBeVisible()
    await expect(page.getByTestId('dashboard-card-audit-recent')).toBeVisible()
  })

  test('PM: nav exposes «Журнал аудита» and «Пользователи»', async ({ page }) => {
    await authAs(page, pmToken)
    await page.goto('/')
    const nav = page.getByRole('navigation')
    await expect(nav.getByText('Журнал аудита')).toBeVisible()
    await expect(nav.getByText('Пользователи', { exact: true })).toBeVisible()
  })

  for (const role of ['ba', 'emp'] as const) {
    test(`${role.toUpperCase()}: /admin/audit silently redirects to /`, async ({ page }) => {
      await authAs(page, role === 'ba' ? baToken : empToken)
      await page.goto('/admin/audit')
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
      await expect(page.getByTestId('audit-page')).toHaveCount(0)
    })

    test(`${role.toUpperCase()}: /admin/users silently redirects to /`, async ({ page }) => {
      await authAs(page, role === 'ba' ? baToken : empToken)
      await page.goto('/admin/users')
      await expect(page).toHaveURL(/\/$/)
      await expect(page.getByText(FORBIDDEN_SNIPPET)).toHaveCount(0)
      await expect(page.getByTestId('users-page')).toHaveCount(0)
    })

    test(`${role.toUpperCase()}: nav hides admin links and dashboard hides audit card`, async ({ page }) => {
      await authAs(page, role === 'ba' ? baToken : empToken)
      await page.goto('/')
      const nav = page.getByRole('navigation')
      await expect(nav.getByText('Журнал аудита')).toHaveCount(0)
      await expect(nav.getByText('Пользователи', { exact: true })).toHaveCount(0)
      await expect(page.getByTestId('dashboard-card-audit')).toHaveCount(0)
    })
  }
})

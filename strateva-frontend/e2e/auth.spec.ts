import { test, expect } from '@playwright/test'
import { assertNoEnglish } from './helpers/assertNoEnglish'
import { TEST_USERS, type TestUserKey } from './helpers/users'

const BRAND_ALLOW = [/^Strateva$/, /^KPI$/]

test.describe('Authentication — UC-1', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear())
  })

  test('empty submit shows Russian validation for both fields', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Вход в систему' })).toBeVisible()
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page.getByText('Введите логин')).toBeVisible()
    await expect(page.getByText('Введите пароль')).toBeVisible()
    await assertNoEnglish(page, { allow: BRAND_ALLOW })
  })

  test('wrong password surfaces Russian error and stays on /login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Логин').fill('pm')
    await page.getByLabel('Пароль').fill('WRONG-PASSWORD')
    await page.getByRole('button', { name: 'Войти' }).click()
    await expect(page.getByText('Неверный логин или пароль')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
    await assertNoEnglish(page, { allow: BRAND_ALLOW })
  })

  for (const key of Object.keys(TEST_USERS) as TestUserKey[]) {
    const u = TEST_USERS[key]
    test(`successful login + logout (${key}: ${u.role})`, async ({ page }) => {
      await page.goto('/login')
      await page.getByLabel('Логин').fill(u.username)
      await page.getByLabel('Пароль').fill(u.password)
      await page.getByRole('button', { name: 'Войти' }).click()

      await expect(page).toHaveURL('/')
      await expect(page.getByRole('heading', { name: 'Главная' })).toBeVisible()
      await expect(
        page.getByRole('main').getByText(u.fullName, { exact: true }),
      ).toBeVisible()
      await assertNoEnglish(page, { allow: BRAND_ALLOW })

      await page.getByRole('button', { name: 'Выйти' }).click()
      await expect(page).toHaveURL(/\/login$/)
      await expect(page.getByRole('heading', { name: 'Вход в систему' })).toBeVisible()
    })
  }

  test('protected route without token redirects to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('HTML lang attribute is ru', async ({ page }) => {
    await page.goto('/login')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBe('ru')
  })
})

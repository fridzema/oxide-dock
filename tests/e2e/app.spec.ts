import { expect, test } from '@playwright/test'

test.describe('App Navigation', () => {
  test('home page loads with correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'OxideDock' })).toBeVisible()
  })

  test('navigates to about page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page.getByText('A desktop application foundation built with')).toBeVisible()
  })

  test('counter increments and decrements', async ({ page }) => {
    await page.goto('/')
    const count = page.locator('.font-mono.tabular-nums')
    await expect(count).toHaveText('0')

    await page.getByRole('button', { name: 'Increment counter' }).click()
    await expect(count).toHaveText('1')

    await page.getByRole('button', { name: 'Increment counter' }).click()
    await expect(count).toHaveText('2')

    await page.getByRole('button', { name: 'Decrement counter' }).click()
    await expect(count).toHaveText('1')
  })
})

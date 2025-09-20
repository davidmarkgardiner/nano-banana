import { test, expect } from '@playwright/test'

test.describe('Basic App Functionality', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Should show the main title
    await expect(page.locator('h1:has-text("Nano Banana")')).toBeVisible()

    // Should show the login form when not authenticated
    await expect(page.locator('h2:has-text("Login")')).toBeVisible()
  })

  test('should show Firebase connection status', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Should show Firebase connected message
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible()
  })
})
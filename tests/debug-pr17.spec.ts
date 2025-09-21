import { test, expect } from '@playwright/test'

test.describe('Debug PR #17 - Image Transfusion', () => {
  test('should take screenshot and check page content', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'tests/screenshots/pr17-debug.png', fullPage: true })

    // Check what text content is visible
    const bodyText = await page.locator('body').textContent()
    console.log('Page text content:', bodyText)

    // Check if auth is required first
    const hasGoogleAuth = await page.locator('text=Sign in with Google').count() > 0
    console.log('Has Google Auth button:', hasGoogleAuth)

    // Look for any mention of transfusion/blend
    const hasTransfusion = bodyText?.includes('transfusion') || bodyText?.includes('Transfusion')
    const hasBlend = bodyText?.includes('blend') || bodyText?.includes('Blend')
    console.log('Has transfusion text:', hasTransfusion)
    console.log('Has blend text:', hasBlend)

    // Get page title
    const title = await page.title()
    console.log('Page title:', title)

    // Check for any error messages in console
    const consoleLogs: string[] = []
    page.on('console', msg => consoleLogs.push(msg.text()))

    await page.waitForTimeout(2000)

    if (consoleLogs.length > 0) {
      console.log('Console messages:', consoleLogs)
    }
  })
})
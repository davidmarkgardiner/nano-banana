import { test, expect } from '@playwright/test'

test.describe('Manual Verification of Text Storage', () => {
  test('take screenshot of the app for manual verification', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Take screenshot of initial state
    await page.screenshot({ path: 'app-initial-state.png', fullPage: true })

    // Check if login form is visible
    const loginVisible = await page.locator('h2:has-text("Login")').isVisible()
    console.log('Login form visible:', loginVisible)

    // Check if Firebase connection status is shown
    const firebaseConnected = await page.locator('text=Firebase connected').isVisible()
    console.log('Firebase connected message visible:', firebaseConnected)

    // Check for any error messages
    const errorMessages = await page.locator('text=/error|Error|failed|Failed/').allTextContents()
    console.log('Error messages found:', errorMessages)

    // Log the page title and basic content
    const title = await page.title()
    console.log('Page title:', title)

    // Check what components are actually rendered
    const hasNanoBanana = await page.locator('h1:has-text("Nano Banana")').isVisible()
    const hasLoginForm = await page.locator('form').isVisible()
    const hasTextStorage = await page.locator('h3:has-text("Text Data Storage")').isVisible()

    console.log('Has Nano Banana title:', hasNanoBanana)
    console.log('Has login form:', hasLoginForm)
    console.log('Has text storage component:', hasTextStorage)

    // Let's also check if we can see the auth context working
    const authElements = await page.locator('[class*="auth"], [class*="Auth"]').count()
    console.log('Auth-related elements count:', authElements)
  })

  test('verify app loads and shows expected content', async ({ page }) => {
    await page.goto('http://localhost:3000')

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle')

    // Basic expectations that should always work
    await expect(page.locator('h1:has-text("Nano Banana")')).toBeVisible()
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible()

    // Should show login form when not authenticated
    await expect(page.locator('h2:has-text("Login")')).toBeVisible()

    // Should NOT show text storage when not authenticated
    await expect(page.locator('h3:has-text("Text Data Storage")')).not.toBeVisible()

    console.log('✅ Basic app functionality verified')
  })
})
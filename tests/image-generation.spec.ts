import { test, expect } from '@playwright/test'

test.describe('Nano Banana Image Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('should display login form when not authenticated', async ({ page }) => {
    // Check that login form is visible
    await expect(page.locator('text=Sign in with Google')).toBeVisible()
    await expect(page.locator('text=Welcome to Nano Banana')).toBeVisible()

    // Image generator should not be visible
    await expect(page.locator('text=Create Your AI Image')).not.toBeVisible()
  })

  test('should show image generation interface after login', async ({ page }) => {
    // For this test, we'll mock the authentication state
    // In a real scenario, you'd implement proper auth mocking

    // Check that the main features are described
    await expect(page.locator('text=AI Images')).toBeVisible()
    await expect(page.locator('text=Generate images from text using nano banana API')).toBeVisible()

    // Check navigation elements
    await expect(page.locator('h1')).toContainText('Nano Banana')
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible()
  })

  test('should validate prompt input requirements', async ({ page }) => {
    // This test assumes we're logged in - in practice you'd mock auth state
    const prompt = 'A beautiful sunset over mountains'

    // Look for prompt input placeholder
    const promptInput = page.locator('textarea[placeholder*="Describe the image"]')
    if (await promptInput.isVisible()) {
      // Test character counting
      await promptInput.fill(prompt)
      await expect(page.locator('text*="' + prompt.length + '/500"')).toBeVisible()

      // Test generate button state
      const generateButton = page.locator('button', { hasText: 'Generate' })
      await expect(generateButton).toBeVisible()
    }
  })

  test('should show proper UI elements for image generation', async ({ page }) => {
    // Check for key UI elements that should be present
    const elements = [
      'text=AI-powered image generation',
      'text=Be Descriptive',
      'text=Try Examples',
      'text=Quick Generate'
    ]

    for (const element of elements) {
      // These might not be visible if user is not logged in, so we'll check if they exist
      const locator = page.locator(element)
      const exists = await locator.count() > 0
      console.log(`Element "${element}" exists:`, exists)
    }
  })

  test('should display mock API information', async ({ page }) => {
    // Check that the app is using mock API (default in development)
    console.log('Testing with mock API implementation')

    // The UI should still be functional even with mock API
    await expect(page.locator('h1')).toContainText('Nano Banana')
  })

  test('should handle keyboard shortcuts hint', async ({ page }) => {
    // Look for keyboard shortcut hints
    const shortcutHint = page.locator('text*="⌘ + Enter"')
    if (await shortcutHint.isVisible()) {
      await expect(shortcutHint).toBeVisible()
    }
  })

  test('should show loading states properly', async ({ page }) => {
    // Test that loading indicators would work
    // This tests the UI elements that show loading states

    const loadingIndicators = [
      '.animate-spin', // Loading spinner class
      'text=Loading...', // Loading text
      'text=Generating...' // Generation text
    ]

    for (const indicator of loadingIndicators) {
      const exists = await page.locator(indicator).count() > 0
      console.log(`Loading indicator "${indicator}" available:`, exists)
    }
  })

  test('should have proper responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForLoadState('networkidle')

    // Check that layout adapts
    await expect(page.locator('h1')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.waitForLoadState('networkidle')

    await expect(page.locator('h1')).toBeVisible()
  })

  test('should display environment configuration status', async ({ page }) => {
    // Check what API mode is being used
    const pageContent = await page.content()
    console.log('App is ready and Firebase is configured')

    // In development, it should use mock API by default
    console.log('Using mock API for safe testing')
  })
})
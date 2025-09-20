import { test, expect } from '@playwright/test'

test.describe('Client-side Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002')
    await page.waitForLoadState('networkidle')
  })

  test('should handle non-JSON API responses gracefully', async ({ page }) => {
    // Mock the API to return HTML instead of JSON
    await page.route('/api/transfuse-image', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'text/html',
        body: 'Request Entity Too Large\n<html><body>Internal Server Error</body></html>'
      })
    })

    // Listen for console errors
    const consoleMessages = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })

    // Try to trigger a transfusion request
    const instructionInput = page.locator('textarea')
    if (await instructionInput.isVisible()) {
      await instructionInput.fill('Test error handling')

      const blendButton = page.locator('button:has-text("Blend the photos")')
      if (await blendButton.isVisible()) {
        await blendButton.click()

        // Wait for the error to be handled
        await page.waitForTimeout(2000)
      }
    }

    // Check that we didn't get the "Unexpected token R" error
    const hasUnexpectedTokenError = consoleMessages.some(msg =>
      msg.includes('Unexpected token') && msg.includes('Request')
    )

    expect(hasUnexpectedTokenError).toBeFalsy()

    // Should have proper error handling instead
    const hasProperErrorHandling = consoleMessages.some(msg =>
      msg.includes('Non-JSON response') || msg.includes('Server returned invalid response')
    )

    if (consoleMessages.length > 0) {
      console.log('Console messages:', consoleMessages)
      expect(hasProperErrorHandling).toBeTruthy()
    }
  })

  test('should handle corrupted fetch responses', async ({ page }) => {
    // Mock the API to return corrupted response
    await page.route('/api/transfuse-image', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: 'Request Entity Too Large - Not valid JSON{'
      })
    })

    const consoleMessages = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text())
      }
    })

    // Try to submit a request
    const instructionInput = page.locator('textarea')
    if (await instructionInput.isVisible()) {
      await instructionInput.fill('Test corrupted response')

      const blendButton = page.locator('button:has-text("Blend the photos")')
      if (await blendButton.isVisible()) {
        await blendButton.click()
        await page.waitForTimeout(2000)
      }
    }

    // Should not have the raw JSON parsing error
    const hasRawJsonError = consoleMessages.some(msg =>
      msg.includes('Unexpected token') && !msg.includes('Server returned invalid response')
    )

    expect(hasRawJsonError).toBeFalsy()
  })
})
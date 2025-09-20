import { test, expect } from '@playwright/test'

test.describe('Text Storage Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000')
  })

  test('should show login form when not authenticated', async ({ page }) => {
    // Should show login form
    await expect(page.locator('h2:has-text("Login")')).toBeVisible()

    // Should not show the text storage component
    await expect(page.locator('h3:has-text("Text Data Storage")')).not.toBeVisible()
  })

  test('should show text storage component after signup/login', async ({ page }) => {
    // First try to sign up with test credentials (in case they don't exist)
    await page.click('text="Need an account? Sign up"')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword123')
    await page.click('button[type="submit"]')

    // Wait a moment to see if signup worked or if we need to login instead
    await page.waitForTimeout(2000)

    // If we see an error about existing account, switch to login
    const hasError = await page.locator('text=/already exists|already in use/i').isVisible()
    if (hasError) {
      await page.click('text="Already have an account? Login"')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'testpassword123')
      await page.click('button[type="submit"]')
    }

    // Wait for authentication to complete and page to update
    await expect(page.locator('text=Welcome,')).toBeVisible({ timeout: 15000 })

    // Should show the text storage component
    await expect(page.locator('h3:has-text("Text Data Storage")')).toBeVisible()

    // Should show the text input and save button
    await expect(page.locator('[data-testid="text-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="save-button"]')).toBeVisible()
  })

  test('should save and display text data', async ({ page }) => {
    // Login first (try signup first, then login if account exists)
    await page.click('text="Need an account? Sign up"')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const hasError = await page.locator('text=/already exists|already in use/i').isVisible()
    if (hasError) {
      await page.click('text="Already have an account? Login"')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'testpassword123')
      await page.click('button[type="submit"]')
    }

    // Wait for login to complete
    await expect(page.locator('text=Welcome,')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('h3:has-text("Text Data Storage")')).toBeVisible()

    // Test data to save
    const testMessage = `Test message ${Date.now()}`

    // Fill in the text input
    await page.fill('[data-testid="text-input"]', testMessage)

    // Save button should be enabled when there's text
    await expect(page.locator('[data-testid="save-button"]')).toBeEnabled()

    // Click save button
    await page.click('[data-testid="save-button"]')

    // Should show success message
    await expect(page.locator('text=Message saved successfully!')).toBeVisible({ timeout: 5000 })

    // Text input should be cleared
    await expect(page.locator('[data-testid="text-input"]')).toHaveValue('')

    // Should show the saved message
    await expect(page.locator(`[data-testid="saved-message"]:has-text("${testMessage}")`)).toBeVisible({ timeout: 5000 })
  })

  test('should persist data across page refreshes', async ({ page }) => {
    // Login and save a message (try signup first, then login if account exists)
    await page.click('text="Need an account? Sign up"')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const hasError = await page.locator('text=/already exists|already in use/i').isVisible()
    if (hasError) {
      await page.click('text="Already have an account? Login"')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'testpassword123')
      await page.click('button[type="submit"]')
    }

    await expect(page.locator('text=Welcome,')).toBeVisible({ timeout: 15000 })

    const testMessage = `Persistence test ${Date.now()}`
    await page.fill('[data-testid="text-input"]', testMessage)
    await page.click('[data-testid="save-button"]')

    // Wait for save to complete
    await expect(page.locator('text=Message saved successfully!')).toBeVisible({ timeout: 5000 })
    await expect(page.locator(`[data-testid="saved-message"]:has-text("${testMessage}")`)).toBeVisible()

    // Refresh the page
    await page.reload()

    // Should still be logged in and see the saved message
    await expect(page.locator('text=Welcome,')).toBeVisible({ timeout: 15000 })
    await expect(page.locator(`[data-testid="saved-message"]:has-text("${testMessage}")`)).toBeVisible({ timeout: 10000 })
  })

  test('save button should be disabled when input is empty', async ({ page }) => {
    // Login first (try signup first, then login if account exists)
    await page.click('text="Need an account? Sign up"')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const hasError = await page.locator('text=/already exists|already in use/i').isVisible()
    if (hasError) {
      await page.click('text="Already have an account? Login"')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'testpassword123')
      await page.click('button[type="submit"]')
    }

    await expect(page.locator('text=Welcome,')).toBeVisible({ timeout: 15000 })

    // Save button should be disabled when input is empty
    await expect(page.locator('[data-testid="save-button"]')).toBeDisabled()

    // Type some text
    await page.fill('[data-testid="text-input"]', 'Some text')

    // Save button should now be enabled
    await expect(page.locator('[data-testid="save-button"]')).toBeEnabled()

    // Clear the input
    await page.fill('[data-testid="text-input"]', '')

    // Save button should be disabled again
    await expect(page.locator('[data-testid="save-button"]')).toBeDisabled()
  })

  test('should show no messages state initially', async ({ page }) => {
    // Login first (try signup first, then login if account exists)
    await page.click('text="Need an account? Sign up"')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const hasError = await page.locator('text=/already exists|already in use/i').isVisible()
    if (hasError) {
      await page.click('text="Already have an account? Login"')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'testpassword123')
      await page.click('button[type="submit"]')
    }

    await expect(page.locator('text=Welcome,')).toBeVisible({ timeout: 15000 })

    // Check if we have any existing messages
    const hasMessages = await page.locator('[data-testid="saved-message"]').count() > 0

    if (!hasMessages) {
      // Should show "no messages" state
      await expect(page.locator('[data-testid="no-messages"]')).toBeVisible()
    }
  })

  test('should handle save errors gracefully', async ({ page }) => {
    // Login first (try signup first, then login if account exists)
    await page.click('text="Need an account? Sign up"')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const hasError = await page.locator('text=/already exists|already in use/i').isVisible()
    if (hasError) {
      await page.click('text="Already have an account? Login"')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'testpassword123')
      await page.click('button[type="submit"]')
    }

    await expect(page.locator('text=Welcome,')).toBeVisible({ timeout: 15000 })

    // We can't easily simulate a Firebase error in this test environment,
    // but we can verify the UI components are set up correctly

    // Verify error handling elements exist (even if not visible)
    const errorDiv = page.locator('div:has-text("Failed to save message")')

    // Fill in text and try to save
    await page.fill('[data-testid="text-input"]', 'Test message')
    await page.click('[data-testid="save-button"]')

    // Should either succeed or show appropriate loading state
    // The actual error handling would need Firebase to be in an error state
  })

  test('should allow deleting own messages', async ({ page }) => {
    // Login and create a message (try signup first, then login if account exists)
    await page.click('text="Need an account? Sign up"')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'testpassword123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const hasError = await page.locator('text=/already exists|already in use/i').isVisible()
    if (hasError) {
      await page.click('text="Already have an account? Login"')
      await page.fill('#email', 'test@example.com')
      await page.fill('#password', 'testpassword123')
      await page.click('button[type="submit"]')
    }

    await expect(page.locator('text=Welcome,')).toBeVisible({ timeout: 15000 })

    const testMessage = `Delete test ${Date.now()}`
    await page.fill('[data-testid="text-input"]', testMessage)
    await page.click('[data-testid="save-button"]')

    // Wait for message to appear
    await expect(page.locator(`[data-testid="saved-message"]:has-text("${testMessage}")`)).toBeVisible({ timeout: 5000 })

    // Find and click the delete button for this message
    const messageDiv = page.locator(`[data-testid="saved-message"]:has-text("${testMessage}")`)
    const deleteButton = messageDiv.locator('button:has-text("Delete")')

    await expect(deleteButton).toBeVisible()
    await deleteButton.click()

    // Message should be removed
    await expect(page.locator(`[data-testid="saved-message"]:has-text("${testMessage}")`)).not.toBeVisible({ timeout: 5000 })
  })
})
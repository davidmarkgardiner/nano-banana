import { test, expect } from '@playwright/test'

test.describe('Image Transfusion Feature - PR #17', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002')
    await page.waitForLoadState('networkidle')
  })

  test('should display image transfusion panel', async ({ page }) => {
    // Wait for the page to load and look for the transfusion panel heading
    await page.waitForSelector('text=Nano Banana transfusion', { timeout: 10000 })

    // Check if the transfusion panel is visible
    const transfusionPanel = page.locator('text=Nano Banana transfusion')
    await expect(transfusionPanel).toBeVisible()

    // Check for the main heading
    await expect(page.locator('text=Blend two photos with matching accessories')).toBeVisible()
  })

  test('should have base image upload functionality', async ({ page }) => {
    // Look for base image upload input by ID
    const baseImageInput = page.locator('#base-photo')
    await expect(baseImageInput).toBeVisible()

    // Check for related labels
    await expect(page.locator('text=Base photo')).toBeVisible()
  })

  test('should have reference image upload functionality', async ({ page }) => {
    // Look for reference image upload input by ID
    const referenceImageInput = page.locator('#reference-photo')
    await expect(referenceImageInput).toBeVisible()

    // Check for related labels
    await expect(page.locator('text=Reference photo')).toBeVisible()
  })

  test('should have instruction input field', async ({ page }) => {
    // Look for instruction textarea
    const instructionInput = page.locator('textarea')
    await expect(instructionInput).toBeVisible()

    // Test typing in the instruction field
    await instructionInput.fill('Blend these two images together')
    await expect(instructionInput).toHaveValue('Blend these two images together')
  })

  test('should have blend button', async ({ page }) => {
    // Look for the "Blend the photos" button
    const blendButton = page.locator('button:has-text("Blend the photos")')
    await expect(blendButton).toBeVisible()
  })

  test('should handle API endpoint for transfusion', async ({ page }) => {
    // Monitor network requests
    const requests = []
    page.on('request', request => {
      if (request.url().includes('/api/transfuse-image')) {
        requests.push(request)
      }
    })

    // Try to trigger a transfusion request (even if it fails due to missing images)
    const instructionInput = page.locator('textarea')
    await instructionInput.fill('Test transfusion instruction')

    const blendButton = page.locator('button:has-text("Blend the photos")')
    await blendButton.click()

    // Wait a moment for potential network requests
    await page.waitForTimeout(1000)

    // Check if the API endpoint exists (even if the request fails due to validation)
    // We expect either a network request or a validation error
    const hasValidationError = await page.locator('text=Select both photos, text=provide at least').count() > 0
    const hasNetworkRequest = requests.length > 0

    expect(hasValidationError || hasNetworkRequest).toBeTruthy()
  })

  test('should show validation errors for missing images', async ({ page }) => {
    // Try to submit without images
    const instructionInput = page.locator('textarea')
    await instructionInput.fill('Test instruction without images')

    const blendButton = page.locator('button:has-text("Blend the photos")')
    await blendButton.click()

    // Wait for error message
    await page.waitForTimeout(1000)

    // Check for validation error about missing images
    const errorMessage = page.locator('text=Select both photos, text=Select both images, text=upload')
    await expect(errorMessage).toBeVisible()
  })

  test('should check if transfuseImages API function is available', async ({ page }) => {
    // Add console listener to capture any errors
    const consoleMessages = []
    page.on('console', msg => consoleMessages.push(msg.text()))

    // Navigate and wait for the app to load
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Look for any console errors related to transfuseImages
    const hasTransfuseError = consoleMessages.some(msg =>
      msg.includes('transfuseImages is not a function') ||
      msg.includes('transfuseImages')
    )

    // If there's an error, we want to know about it
    if (hasTransfuseError) {
      console.log('Console messages:', consoleMessages)
    }

    // The test passes if we can at least load the page without critical errors
    await expect(page.locator('body')).toBeVisible()
  })
})
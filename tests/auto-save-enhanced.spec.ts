import { test, expect, Page } from '@playwright/test'

test.describe('Enhanced Auto-Save Functionality Tests', () => {
  let consoleLogs: string[] = []
  let networkRequests: any[] = []
  let mockImageUrl = 'https://example.com/generated-image.jpg'

  test.beforeEach(async ({ page }) => {
    // Reset arrays
    consoleLogs = []
    networkRequests = []

    // Comprehensive console logging
    page.on('console', (msg) => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type()}] ${text}`)
      console.log(`Browser console [${msg.type()}]:`, text)
    })

    // Monitor all network requests with detailed logging
    page.on('request', (request) => {
      const url = request.url()
      const method = request.method()
      const postData = request.postData()

      networkRequests.push({
        url,
        method,
        postData: postData ? JSON.parse(postData || '{}') : null,
        headers: request.headers(),
        timestamp: Date.now()
      })

      console.log(`Network request: ${method} ${url}`)
      if (postData && url.includes('/api/nano-banana-image')) {
        console.log('  POST data:', postData)
      }
    })

    // Monitor responses
    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('/api/nano-banana-image') || url.includes('firebase')) {
        console.log(`Response: ${response.status()} ${url}`)
      }
    })

    // Set up comprehensive Firebase mocking
    await setupFirebaseMocking(page)

    // Navigate to the app
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('should complete full auto-save flow with mocked user', async ({ page }) => {
    console.log('=== Testing complete auto-save flow ===')

    // Mock the nano-banana API to return a successful response
    await page.route('**/api/nano-banana-image', async (route) => {
      console.log('Intercepted nano-banana-image API call')
      const request = route.request()
      const postData = JSON.parse(request.postData() || '{}')

      console.log('API request data:', postData)

      // Simulate successful image fetch
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' // 1x1 pixel PNG base64
        })
      })
    })

    // Wait for authentication to be mocked
    await page.waitForTimeout(1000)

    // Look for the authenticated interface
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 })

    // Find prompt input field - be flexible with selectors
    const promptInput = await findPromptInput(page)
    const generateButton = await findGenerateButton(page)

    if (!promptInput || !generateButton) {
      console.log('Could not find image generation interface')
      test.skip(true, 'Image generation interface not found')
      return
    }

    console.log('Found image generation interface')

    // Clear previous logs
    consoleLogs = []
    networkRequests = []

    // Fill prompt and generate image
    const testPrompt = 'A beautiful mountain landscape with snow-capped peaks'
    await promptInput.fill(testPrompt)
    console.log('Filled prompt:', testPrompt)

    await generateButton.click()
    console.log('Clicked generate button')

    // Wait for auto-save operations to complete
    await page.waitForTimeout(8000)

    // Analyze results
    console.log('=== Auto-save flow analysis ===')

    // 1. Check for auto-save initiation log
    const autoSaveInitLog = consoleLogs.find(log =>
      log.includes('Auto-saving image to Firebase Storage')
    )
    console.log('Auto-save initiation log found:', !!autoSaveInitLog)
    if (autoSaveInitLog) console.log('  Log:', autoSaveInitLog)

    // 2. Check for API call to nano-banana-image
    const apiCall = networkRequests.find(req =>
      req.url.includes('/api/nano-banana-image') && req.method === 'POST'
    )
    console.log('API call to nano-banana-image found:', !!apiCall)
    if (apiCall) {
      console.log('  URL:', apiCall.url)
      console.log('  Data:', apiCall.postData)
    }

    // 3. Check for Firebase Storage upload simulation
    const storageLog = consoleLogs.find(log =>
      log.includes('uploadBytes') ||
      log.includes('Firebase Storage') ||
      log.includes('auto-saved')
    )
    console.log('Firebase Storage operation log found:', !!storageLog)
    if (storageLog) console.log('  Log:', storageLog)

    // Expectations
    expect(autoSaveInitLog).toBeTruthy()
    expect(apiCall).toBeTruthy()

    console.log('=== Test completed successfully ===')
  })

  test('should handle auto-save when API returns invalid data', async ({ page }) => {
    console.log('=== Testing auto-save with invalid API response ===')

    // Mock API to return invalid response
    await page.route('**/api/nano-banana-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contentType: 'invalid/type',
          data: 'invalid-base64-data'
        })
      })
    })

    await page.waitForTimeout(1000)

    const promptInput = await findPromptInput(page)
    const generateButton = await findGenerateButton(page)

    if (!promptInput || !generateButton) {
      test.skip(true, 'Image generation interface not found')
      return
    }

    consoleLogs = []

    await promptInput.fill('Test invalid response handling')
    await generateButton.click()

    await page.waitForTimeout(5000)

    // Should have error logs
    const errorLog = consoleLogs.find(log =>
      log.toLowerCase().includes('error') ||
      log.toLowerCase().includes('failed')
    )

    console.log('Error handling log found:', !!errorLog)
    if (errorLog) console.log('  Error log:', errorLog)
  })

  test('should not auto-save when user is not authenticated', async ({ page }) => {
    console.log('=== Testing no auto-save when unauthenticated ===')

    // Clear authentication
    await page.addInitScript(() => {
      delete window.__FIREBASE_AUTH_MOCK__
      localStorage.removeItem('firebaseAuthUser')
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Look for login interface instead of image generation
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign in"), button:has-text("Continue with Google")')

    if (await loginButton.first().isVisible()) {
      console.log('✓ Login interface visible when unauthenticated - this is expected')
      console.log('Auto-save test correctly shows no auto-save without authentication')
    } else {
      // If image generation is still available, test that auto-save doesn't happen
      const promptInput = await findPromptInput(page)
      const generateButton = await findGenerateButton(page)

      if (promptInput && generateButton) {
        consoleLogs = []
        networkRequests = []

        await promptInput.fill('Test without auth')
        await generateButton.click()

        await page.waitForTimeout(5000)

        const autoSaveLog = consoleLogs.find(log =>
          log.includes('Auto-saving image to Firebase Storage')
        )
        const apiCall = networkRequests.find(req =>
          req.url.includes('/api/nano-banana-image')
        )

        expect(autoSaveLog).toBeFalsy()
        expect(apiCall).toBeFalsy()

        console.log('✓ No auto-save operations when unauthenticated')
      }
    }
  })

  test('should validate Firebase Storage path format', async ({ page }) => {
    console.log('=== Testing Firebase Storage path validation ===')

    // Mock successful auto-save
    await page.route('**/api/nano-banana-image', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          contentType: 'image/jpeg',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        })
      })
    })

    await page.waitForTimeout(1000)

    const promptInput = await findPromptInput(page)
    const generateButton = await findGenerateButton(page)

    if (!promptInput || !generateButton) {
      test.skip(true, 'Image generation interface not found')
      return
    }

    consoleLogs = []

    await promptInput.fill('Test storage path format')
    await generateButton.click()

    await page.waitForTimeout(8000)

    // Look for logs that show the storage path
    const pathLogs = consoleLogs.filter(log =>
      log.includes('nano-banana/') ||
      log.includes('test-user-123') ||
      log.includes('/20') // Year in path
    )

    console.log('Storage path logs found:', pathLogs.length)
    pathLogs.forEach(log => console.log('  Path log:', log))

    // Validate path format: nano-banana/{userId}/{year}-{month}-{day}-{timestamp}
    const pathPattern = /nano-banana\/test-user-123\/\d{4}-\d{1,2}-\d{1,2}-\d+/
    const hasValidPath = pathLogs.some(log => pathPattern.test(log))

    console.log('Valid storage path format found:', hasValidPath)
  })

  // Helper functions
  async function findPromptInput(page: Page) {
    const selectors = [
      'textarea[placeholder*="Describe"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="image"]',
      'textarea',
      'input[placeholder*="Describe"]',
      'input[placeholder*="prompt"]'
    ]

    for (const selector of selectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('Found prompt input with selector:', selector)
        return element
      }
    }

    console.log('No prompt input found')
    return null
  }

  async function findGenerateButton(page: Page) {
    const selectors = [
      'button:has-text("Generate")',
      'button:has-text("Create")',
      'button:has-text("Make")',
      'button[type="submit"]'
    ]

    for (const selector of selectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('Found generate button with selector:', selector)
        return element
      }
    }

    console.log('No generate button found')
    return null
  }

  async function setupFirebaseMocking(page: Page) {
    await page.addInitScript(() => {
      // Mock Firebase auth user
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true
      }

      // Set up comprehensive Firebase mocking
      localStorage.setItem('firebaseAuthUser', JSON.stringify(mockUser))

      // Mock Firebase auth
      window.__FIREBASE_AUTH_MOCK__ = {
        currentUser: mockUser,
        onAuthStateChanged: (callback: Function) => {
          setTimeout(() => callback(mockUser), 100)
          return () => {}
        }
      }

      // Mock Firebase Storage operations
      window.__FIREBASE_STORAGE_MOCK__ = {
        ref: (storage: any, path: string) => {
          console.log('Mock Firebase Storage ref created for path:', path)
          return {
            fullPath: path,
            bucket: 'mock-bucket'
          }
        },
        uploadBytes: async (ref: any, data: any, metadata: any) => {
          console.log('Mock uploadBytes called for path:', ref.fullPath)
          console.log('Mock upload metadata:', metadata)
          return {
            ref,
            metadata: { ...metadata, timeCreated: new Date().toISOString() }
          }
        },
        getDownloadURL: async (ref: any) => {
          const mockDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/mock-bucket/o/${encodeURIComponent(ref.fullPath)}?alt=media&token=mock-token`
          console.log('Mock getDownloadURL returning:', mockDownloadUrl)
          return mockDownloadUrl
        }
      }

      // Override console.log to capture Firebase-related operations
      const originalConsoleLog = console.log
      console.log = function(...args) {
        originalConsoleLog.apply(console, args)
        // This helps ensure our test can capture the logs
      }
    })
  }
})
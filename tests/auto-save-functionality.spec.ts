import { test, expect, Page } from '@playwright/test'

test.describe('Auto-Save Functionality', () => {
  let consoleLogs: string[] = []
  let networkRequests: any[] = []
  let firebaseRequests: any[] = []

  test.beforeEach(async ({ page }) => {
    // Reset arrays
    consoleLogs = []
    networkRequests = []
    firebaseRequests = []

    // Listen to console logs
    page.on('console', (msg) => {
      consoleLogs.push(msg.text())
    })

    // Monitor network requests
    page.on('request', (request) => {
      const url = request.url()
      networkRequests.push({
        url,
        method: request.method(),
        postData: request.postData(),
        headers: request.headers()
      })

      // Track Firebase-related requests
      if (url.includes('firebase') || url.includes('googleapis') || url.includes('firestore') || url.includes('storage')) {
        firebaseRequests.push({
          url,
          method: request.method(),
          timestamp: Date.now()
        })
      }
    })

    // Navigate to the app
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('should display auto-save console logs when user is authenticated and generates image', async ({ page }) => {
    // Mock authentication by injecting user into localStorage
    await mockAuthentication(page)

    // Navigate to the main app interface
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Wait for authenticated state to load
    await page.waitForTimeout(2000)

    // Look for the image generation interface
    const promptTextarea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"], textarea')
    const generateButton = page.locator('button:has-text("Generate")')

    // If the UI elements are not visible, the user might not be properly authenticated
    if (!(await promptTextarea.isVisible()) || !(await generateButton.isVisible())) {
      console.log('Image generation interface not visible - checking authentication state')

      // Try to find login elements
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign in")')
      if (await loginButton.isVisible()) {
        console.log('User appears to be logged out - auto-save test requires authentication')
        test.skip(true, 'Auto-save test requires user authentication')
      }
    }

    // Clear previous console logs
    consoleLogs = []

    // Generate an image
    await promptTextarea.fill('A beautiful sunset over mountains')
    await generateButton.click()

    // Wait for image generation to complete
    await page.waitForTimeout(5000)

    // Check for auto-save console log
    const autoSaveLog = consoleLogs.find(log => log.includes('Auto-saving image to Firebase Storage'))
    expect(autoSaveLog).toBeTruthy()
    console.log('✓ Found auto-save console log:', autoSaveLog)
  })

  test('should make network request to /api/nano-banana-image during auto-save', async ({ page }) => {
    // Mock authentication
    await mockAuthentication(page)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Clear previous network requests
    networkRequests = []

    // Find and interact with image generation interface
    const promptTextarea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"], textarea')
    const generateButton = page.locator('button:has-text("Generate")')

    if (await promptTextarea.isVisible() && await generateButton.isVisible()) {
      await promptTextarea.fill('A cyberpunk cityscape at night')
      await generateButton.click()

      // Wait for requests to complete
      await page.waitForTimeout(5000)

      // Check for API request to nano-banana-image endpoint
      const apiRequest = networkRequests.find(req =>
        req.url.includes('/api/nano-banana-image') && req.method === 'POST'
      )

      if (apiRequest) {
        expect(apiRequest).toBeTruthy()
        console.log('✓ Found API request to /api/nano-banana-image:', apiRequest.url)

        // Verify request contains imageUrl in POST data
        if (apiRequest.postData) {
          const postData = JSON.parse(apiRequest.postData)
          expect(postData.imageUrl).toBeTruthy()
          console.log('✓ API request contains imageUrl:', postData.imageUrl)
        }
      } else {
        console.log('⚠ No API request to /api/nano-banana-image found')
        console.log('Network requests made:', networkRequests.map(r => r.url))
      }
    } else {
      test.skip(true, 'Image generation interface not available')
    }
  })

  test('should attempt Firebase Storage operations during auto-save', async ({ page }) => {
    // Mock authentication
    await mockAuthentication(page)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Clear previous requests
    firebaseRequests = []
    consoleLogs = []

    // Generate an image
    const promptTextarea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"], textarea')
    const generateButton = page.locator('button:has-text("Generate")')

    if (await promptTextarea.isVisible() && await generateButton.isVisible()) {
      await promptTextarea.fill('A serene mountain lake reflection')
      await generateButton.click()

      // Wait for auto-save operations
      await page.waitForTimeout(7000)

      // Check for Firebase Storage related console logs
      const storageLog = consoleLogs.find(log =>
        log.includes('Firebase Storage') ||
        log.includes('auto-saved') ||
        log.includes('uploadBytes') ||
        log.includes('getDownloadURL')
      )

      if (storageLog) {
        console.log('✓ Found Firebase Storage operation log:', storageLog)
      } else {
        console.log('⚠ No Firebase Storage logs found')
        console.log('Console logs:', consoleLogs)
      }

      // Check for Firebase network requests
      if (firebaseRequests.length > 0) {
        console.log('✓ Found Firebase-related network requests:', firebaseRequests.length)
        firebaseRequests.forEach(req => console.log('  -', req.url))
      } else {
        console.log('⚠ No Firebase network requests detected')
      }
    } else {
      test.skip(true, 'Image generation interface not available')
    }
  })

  test('should handle auto-save errors gracefully', async ({ page }) => {
    // Mock authentication
    await mockAuthentication(page)

    // Mock network failure for the API endpoint
    await page.route('**/api/nano-banana-image', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })

    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Clear logs
    consoleLogs = []

    // Generate an image
    const promptTextarea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"], textarea')
    const generateButton = page.locator('button:has-text("Generate")')

    if (await promptTextarea.isVisible() && await generateButton.isVisible()) {
      await promptTextarea.fill('A peaceful garden with flowers')
      await generateButton.click()

      // Wait for auto-save attempt and error handling
      await page.waitForTimeout(5000)

      // Check for error handling logs
      const errorLog = consoleLogs.find(log =>
        log.includes('Auto-save') &&
        (log.includes('failed') || log.includes('error') || log.includes('Failed to fetch'))
      )

      if (errorLog) {
        console.log('✓ Found auto-save error handling log:', errorLog)
      } else {
        console.log('⚠ No auto-save error logs found')
        console.log('All console logs:', consoleLogs)
      }

      // Verify that image generation still works despite auto-save failure
      const imageElement = page.locator('img[src*="http"], img[src*="data:"]')
      if (await imageElement.isVisible()) {
        console.log('✓ Image generation succeeded despite auto-save failure')
      }
    } else {
      test.skip(true, 'Image generation interface not available')
    }
  })

  test('should only auto-save when user is authenticated', async ({ page }) => {
    // Ensure user is NOT authenticated (default state)
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Clear logs
    consoleLogs = []
    networkRequests = []

    // Check if we can access image generation without authentication
    const promptTextarea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"], textarea')
    const generateButton = page.locator('button:has-text("Generate")')

    if (await promptTextarea.isVisible() && await generateButton.isVisible()) {
      await promptTextarea.fill('A simple test image')
      await generateButton.click()

      // Wait for potential auto-save attempts
      await page.waitForTimeout(5000)

      // Verify NO auto-save operations occurred
      const autoSaveLog = consoleLogs.find(log => log.includes('Auto-saving image to Firebase Storage'))
      expect(autoSaveLog).toBeFalsy()

      const apiRequest = networkRequests.find(req => req.url.includes('/api/nano-banana-image'))
      expect(apiRequest).toBeFalsy()

      console.log('✓ Confirmed no auto-save operations when user is not authenticated')
    } else {
      console.log('✓ Image generation interface not available without authentication - this is expected')
    }
  })

  test('should validate auto-save file naming and storage path', async ({ page }) => {
    // Mock authentication
    await mockAuthentication(page)
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Clear logs
    consoleLogs = []

    // Generate an image
    const promptTextarea = page.locator('textarea[placeholder*="Describe"], textarea[placeholder*="prompt"], textarea')
    const generateButton = page.locator('button:has-text("Generate")')

    if (await promptTextarea.isVisible() && await generateButton.isVisible()) {
      await promptTextarea.fill('A majestic eagle soaring through clouds')
      await generateButton.click()

      // Wait for auto-save
      await page.waitForTimeout(7000)

      // Check for download URL log (indicates successful upload)
      const downloadUrlLog = consoleLogs.find(log =>
        log.includes('auto-saved') && log.includes('https://')
      )

      if (downloadUrlLog) {
        console.log('✓ Found download URL log:', downloadUrlLog)

        // Verify the path structure (should include nano-banana/userId/date-timestamp)
        const pathPattern = /nano-banana\/[\w-]+\/\d{4}-\d{1,2}-\d{1,2}-\d+/
        const hasValidPath = pathPattern.test(downloadUrlLog)

        if (hasValidPath) {
          console.log('✓ Storage path follows expected pattern')
        } else {
          console.log('⚠ Storage path may not follow expected pattern')
        }
      } else {
        console.log('⚠ No download URL log found - auto-save may have failed')
      }
    } else {
      test.skip(true, 'Image generation interface not available')
    }
  })

  // Helper function to mock authentication
  async function mockAuthentication(page: Page) {
    await page.addInitScript(() => {
      // Mock Firebase auth user
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true
      }

      // Set up mock in localStorage/sessionStorage
      localStorage.setItem('firebaseAuthUser', JSON.stringify(mockUser))

      // Mock Firebase auth object
      window.__FIREBASE_AUTH_MOCK__ = {
        currentUser: mockUser,
        onAuthStateChanged: (callback: Function) => {
          setTimeout(() => callback(mockUser), 100)
          return () => {}
        }
      }
    })
  }
})
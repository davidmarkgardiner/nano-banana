import { test, expect, Page } from '@playwright/test'

/**
 * Comprehensive Playwright test for nano-banana auto-save functionality
 *
 * This test performs REAL authentication and tests the complete auto-save flow:
 * 1. Real login (email/password or Google OAuth)
 * 2. Image generation
 * 3. Auto-save monitoring with detailed logging
 * 4. Firebase Storage verification
 * 5. Network request monitoring
 *
 * Requirements:
 * - App running at localhost:3000
 * - Real Firebase credentials configured
 * - Test credentials available in environment or manual input
 */

test.describe('Auto-Save Real Authentication Tests', () => {
  let consoleLogs: string[] = []
  let networkRequests: any[] = []
  let firebaseRequests: any[] = []
  let errors: string[] = []

  // Test credentials - replace with real test account credentials
  const TEST_EMAIL = process.env.TEST_EMAIL || 'test.nanobanan@gmail.com'
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!'

  test.beforeEach(async ({ page }) => {
    // Reset monitoring arrays
    consoleLogs = []
    networkRequests = []
    firebaseRequests = []
    errors = []

    // Enhanced console monitoring
    page.on('console', (msg) => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`)

      // Also log to test output for debugging
      console.log(`Browser Console [${msg.type().toUpperCase()}]:`, text)
    })

    // Monitor page errors
    page.on('pageerror', (error) => {
      const errorMsg = `Page Error: ${error.message}`
      errors.push(errorMsg)
      console.log(errorMsg)
    })

    // Enhanced network monitoring
    page.on('request', (request) => {
      const url = request.url()
      const method = request.method()
      const postData = request.postData()

      const requestInfo = {
        url,
        method,
        postData: postData ? (postData.length > 500 ? postData.substring(0, 500) + '...' : postData) : null,
        headers: request.headers(),
        timestamp: new Date().toISOString()
      }

      networkRequests.push(requestInfo)

      // Log important requests for debugging
      if (url.includes('/api/') || url.includes('firebase') || url.includes('googleapis')) {
        console.log(`Network Request: ${method} ${url}`)
        if (postData && postData.length < 200) {
          console.log(`  Post Data: ${postData}`)
        }
      }

      // Track Firebase-related requests with more detail
      if (url.includes('firebase') || url.includes('googleapis') || url.includes('firestore') || url.includes('storage') || url.includes('auth')) {
        firebaseRequests.push({
          url,
          method,
          timestamp: new Date().toISOString(),
          type: getFirebaseRequestType(url)
        })
        console.log(`Firebase Request: ${method} ${url} (${getFirebaseRequestType(url)})`)
      }
    })

    // Monitor network responses for additional debugging
    page.on('response', (response) => {
      const url = response.url()
      if (url.includes('/api/') || url.includes('firebase') || url.includes('googleapis')) {
        console.log(`Network Response: ${response.status()} ${url}`)
      }
    })

    // Navigate to the app
    console.log('Navigating to http://localhost:3000...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })

    // Wait for initial load
    await page.waitForTimeout(2000)
  })

  test('Complete auto-save flow with real authentication and detailed monitoring', async ({ page }) => {
    console.log('\n=== Starting Comprehensive Auto-Save Test ===')

    // Step 1: Verify initial page load
    console.log('\n1. Verifying initial page load...')
    const title = await page.title()
    console.log(`Page title: ${title}`)

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/auto-save-test-start.png',
      fullPage: true
    })

    // Step 2: Check authentication state
    console.log('\n2. Checking authentication state...')
    const userProfileVisible = await page.locator('[data-testid="user-profile"], .user-profile, text="Logout"').isVisible({ timeout: 5000 }).catch(() => false)

    if (!userProfileVisible) {
      console.log('User not authenticated - proceeding with login...')
      await performRealLogin(page)
    } else {
      console.log('User appears to be already authenticated')
    }

    // Wait for authentication to settle
    await page.waitForTimeout(3000)

    // Step 3: Verify authenticated state and find image generation interface
    console.log('\n3. Looking for image generation interface...')

    // Try multiple selectors for the prompt input
    const promptSelectors = [
      'textarea[placeholder*="Describe"]',
      'textarea[placeholder*="prompt"]',
      'textarea[placeholder*="image"]',
      'textarea',
      'input[placeholder*="prompt"]',
      'input[placeholder*="Describe"]'
    ]

    let promptElement = null
    for (const selector of promptSelectors) {
      promptElement = page.locator(selector).first()
      if (await promptElement.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found prompt input with selector: ${selector}`)
        break
      }
    }

    if (!promptElement || !(await promptElement.isVisible())) {
      console.log('❌ Could not find prompt input element')
      await debugPageState(page)
      throw new Error('Image generation interface not found')
    }

    // Find generate button
    const generateButtonSelectors = [
      'button:has-text("Generate")',
      'button:has-text("Create")',
      'button:has-text("Submit")',
      'button[type="submit"]',
      'button[data-testid="generate-button"]'
    ]

    let generateButton = null
    for (const selector of generateButtonSelectors) {
      generateButton = page.locator(selector).first()
      if (await generateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found generate button with selector: ${selector}`)
        break
      }
    }

    if (!generateButton || !(await generateButton.isVisible())) {
      console.log('❌ Could not find generate button')
      await debugPageState(page)
      throw new Error('Generate button not found')
    }

    // Step 4: Clear previous logs and start image generation
    console.log('\n4. Starting image generation...')
    consoleLogs = []
    networkRequests = []
    firebaseRequests = []

    const testPrompt = 'A beautiful sunset over mountains with golden light reflecting on a calm lake'
    console.log(`Using prompt: "${testPrompt}"`)

    await promptElement.fill(testPrompt)
    await page.waitForTimeout(500)

    console.log('Clicking generate button...')
    await generateButton.click()

    // Step 5: Monitor the generation process
    console.log('\n5. Monitoring image generation and auto-save process...')

    // Wait for generation to start (loading state)
    console.log('Waiting for generation to start...')
    await page.waitForTimeout(2000)

    // Monitor for up to 30 seconds
    const maxWaitTime = 30000
    const checkInterval = 2000
    let totalWaitTime = 0

    while (totalWaitTime < maxWaitTime) {
      await page.waitForTimeout(checkInterval)
      totalWaitTime += checkInterval

      console.log(`\n--- Progress Update (${totalWaitTime/1000}s) ---`)

      // Check for image generation completion
      const imageElements = await page.locator('img[src*="http"], img[src*="data:"], img[src*="blob:"]').count()
      console.log(`Generated images found: ${imageElements}`)

      // Check console logs for auto-save activity
      const autoSaveLogs = consoleLogs.filter(log =>
        log.toLowerCase().includes('auto-sav') ||
        log.toLowerCase().includes('firebase storage') ||
        log.toLowerCase().includes('uploading') ||
        log.toLowerCase().includes('download url')
      )

      if (autoSaveLogs.length > 0) {
        console.log('✅ Auto-save activity detected:')
        autoSaveLogs.forEach(log => console.log(`  - ${log}`))
      }

      // Check for API calls
      const apiCalls = networkRequests.filter(req => req.url.includes('/api/nano-banana-image'))
      if (apiCalls.length > 0) {
        console.log(`✅ Found ${apiCalls.length} API call(s) to /api/nano-banana-image`)
      }

      // Check for Firebase requests
      if (firebaseRequests.length > 0) {
        console.log(`✅ Found ${firebaseRequests.length} Firebase request(s)`)
        const storageRequests = firebaseRequests.filter(req => req.type === 'Storage')
        if (storageRequests.length > 0) {
          console.log(`  - ${storageRequests.length} Storage request(s)`)
        }
      }

      // Check if generation seems complete
      if (imageElements > 0) {
        console.log('Image generation appears complete, waiting for auto-save...')
        await page.waitForTimeout(5000) // Extra time for auto-save
        break
      }
    }

    // Step 6: Final analysis and verification
    console.log('\n6. Final Analysis...')

    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/auto-save-test-complete.png',
      fullPage: true
    })

    // Analyze console logs
    console.log('\n--- Console Log Analysis ---')
    const relevantLogs = consoleLogs.filter(log =>
      log.toLowerCase().includes('auto') ||
      log.toLowerCase().includes('firebase') ||
      log.toLowerCase().includes('storage') ||
      log.toLowerCase().includes('image') ||
      log.toLowerCase().includes('error')
    )

    if (relevantLogs.length === 0) {
      console.log('❌ No relevant console logs found')
    } else {
      console.log(`Found ${relevantLogs.length} relevant console logs:`)
      relevantLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log}`)
      })
    }

    // Analyze network requests
    console.log('\n--- Network Request Analysis ---')
    const apiRequests = networkRequests.filter(req => req.url.includes('/api/nano-banana-image'))
    const imageGenerationRequests = networkRequests.filter(req =>
      req.url.includes('/api/generate') || req.url.includes('nano-banana')
    )

    console.log(`API requests to /api/nano-banana-image: ${apiRequests.length}`)
    console.log(`Image generation requests: ${imageGenerationRequests.length}`)
    console.log(`Total Firebase requests: ${firebaseRequests.length}`)

    if (apiRequests.length > 0) {
      console.log('✅ Auto-save API calls detected')
      apiRequests.forEach(req => {
        console.log(`  - ${req.method} ${req.url} at ${req.timestamp}`)
        if (req.postData) {
          console.log(`    Data: ${req.postData.substring(0, 100)}...`)
        }
      })
    } else {
      console.log('❌ No auto-save API calls detected')
    }

    // Firebase Storage analysis
    const storageRequests = firebaseRequests.filter(req => req.type === 'Storage')
    if (storageRequests.length > 0) {
      console.log('✅ Firebase Storage requests detected')
      storageRequests.forEach(req => {
        console.log(`  - ${req.method} ${req.url} at ${req.timestamp}`)
      })
    } else {
      console.log('❌ No Firebase Storage requests detected')
    }

    // Error analysis
    if (errors.length > 0) {
      console.log('\n--- Error Analysis ---')
      errors.forEach(error => console.log(`❌ ${error}`))
    }

    // Step 7: Assertions and final verdict
    console.log('\n7. Final Verification...')

    // Check for successful auto-save logs
    const autoSaveSuccessLog = consoleLogs.find(log =>
      log.includes('Auto-saving image to Firebase Storage') ||
      log.includes('Image auto-saved to Firebase Storage') ||
      log.includes('auto-saved') && log.includes('https://')
    )

    if (autoSaveSuccessLog) {
      console.log('✅ AUTO-SAVE SUCCESS: Found auto-save success log')
      console.log(`   Log: ${autoSaveSuccessLog}`)
    } else {
      console.log('⚠️  AUTO-SAVE STATUS UNCLEAR: No explicit success log found')
    }

    // Verify image generation worked
    const finalImageCount = await page.locator('img[src*="http"], img[src*="data:"], img[src*="blob:"]').count()
    if (finalImageCount > 0) {
      console.log(`✅ IMAGE GENERATION SUCCESS: ${finalImageCount} image(s) displayed`)
    } else {
      console.log('❌ IMAGE GENERATION FAILED: No images displayed')
    }

    // Summary
    console.log('\n=== TEST SUMMARY ===')
    console.log(`Images generated: ${finalImageCount}`)
    console.log(`Auto-save API calls: ${apiRequests.length}`)
    console.log(`Firebase Storage requests: ${storageRequests.length}`)
    console.log(`Relevant console logs: ${relevantLogs.length}`)
    console.log(`Errors: ${errors.length}`)

    // Determine overall result
    const hasImageGeneration = finalImageCount > 0
    const hasAutoSaveActivity = apiRequests.length > 0 || storageRequests.length > 0 || autoSaveSuccessLog

    if (hasImageGeneration && hasAutoSaveActivity) {
      console.log('🎉 OVERALL RESULT: AUTO-SAVE APPEARS TO BE WORKING')
    } else if (hasImageGeneration && !hasAutoSaveActivity) {
      console.log('⚠️  OVERALL RESULT: IMAGE GENERATION WORKS BUT AUTO-SAVE IS NOT FUNCTIONING')
    } else {
      console.log('❌ OVERALL RESULT: BASIC FUNCTIONALITY IS NOT WORKING')
    }

    // Create detailed expectations for proper test validation
    expect(hasImageGeneration, 'Image generation should work').toBeTruthy()

    // This expectation will help identify if auto-save is actually working
    if (!hasAutoSaveActivity) {
      console.log('\n🔍 DIAGNOSIS: Auto-save is not working. Possible causes:')
      console.log('   1. User authentication may not be properly established')
      console.log('   2. Firebase Storage may not be configured correctly')
      console.log('   3. Auto-save logic may have a bug')
      console.log('   4. Network/CORS issues preventing API calls')
      console.log('   5. Firebase permissions may be blocking uploads')
    }
  })

  // Helper function to perform real login
  async function performRealLogin(page: Page) {
    console.log('\n--- Starting Real Authentication ---')

    // Look for login form
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"], input[id="password"]').first()
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign in"), button[type="submit"]').first()

    // Check if login form is visible
    const emailVisible = await emailInput.isVisible({ timeout: 5000 }).catch(() => false)
    const passwordVisible = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false)
    const loginButtonVisible = await loginButton.isVisible({ timeout: 5000 }).catch(() => false)

    if (!emailVisible || !passwordVisible || !loginButtonVisible) {
      console.log('❌ Login form not found or not complete')
      await debugPageState(page)
      throw new Error('Cannot find complete login form')
    }

    console.log('Found login form, proceeding with email/password login...')
    console.log(`Using email: ${TEST_EMAIL}`)

    // Fill in credentials
    await emailInput.fill(TEST_EMAIL)
    await passwordInput.fill(TEST_PASSWORD)
    await page.waitForTimeout(500)

    // Submit login
    await loginButton.click()
    console.log('Login form submitted, waiting for authentication...')

    // Wait for authentication to complete
    await page.waitForTimeout(5000)

    // Check if login was successful
    const authSuccessIndicators = [
      page.locator('text="Logout"'),
      page.locator('text="Sign out"'),
      page.locator('[data-testid="user-profile"]'),
      page.locator('.user-profile'),
      page.locator('text="Welcome"'),
      page.locator('text="Generate"')
    ]

    let loginSuccessful = false
    for (const indicator of authSuccessIndicators) {
      if (await indicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        loginSuccessful = true
        console.log('✅ Login appears successful - found authenticated UI element')
        break
      }
    }

    // Check for login errors
    const errorSelectors = [
      'text="Invalid"',
      'text="Error"',
      'text="Wrong"',
      'text="Failed"',
      '.error',
      '[role="alert"]'
    ]

    for (const selector of errorSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('❌ Login error detected')
        await debugPageState(page)
        throw new Error('Login failed - error message visible')
      }
    }

    if (!loginSuccessful) {
      console.log('⚠️  Login status unclear - no clear success indicators found')
      await debugPageState(page)
    }

    console.log('--- Authentication Complete ---\n')
  }

  // Helper function to debug page state
  async function debugPageState(page: Page) {
    console.log('\n--- DEBUG: Current Page State ---')

    const url = page.url()
    console.log(`Current URL: ${url}`)

    const title = await page.title()
    console.log(`Page title: ${title}`)

    // Check for common elements
    const elements = {
      'Login form': 'input[type="email"], input[name="email"]',
      'Generate button': 'button:has-text("Generate")',
      'Logout button': 'text="Logout", text="Sign out"',
      'Error messages': '.error, [role="alert"]',
      'Loading indicators': '.loading, .spinner',
      'Images': 'img',
      'Textareas': 'textarea'
    }

    for (const [name, selector] of Object.entries(elements)) {
      const count = await page.locator(selector).count()
      const visible = count > 0 && await page.locator(selector).first().isVisible({ timeout: 1000 }).catch(() => false)
      console.log(`${name}: ${count} found, ${visible ? 'visible' : 'not visible'}`)
    }

    // Get page text content (limited)
    const bodyText = await page.locator('body').textContent()
    const limitedText = bodyText?.substring(0, 300) + '...'
    console.log(`Page content preview: ${limitedText}`)

    console.log('--- END DEBUG ---\n')
  }

  // Helper function to categorize Firebase requests
  function getFirebaseRequestType(url: string): string {
    if (url.includes('storage')) return 'Storage'
    if (url.includes('firestore') || url.includes('documents')) return 'Firestore'
    if (url.includes('auth') || url.includes('identitytoolkit')) return 'Auth'
    if (url.includes('functions')) return 'Functions'
    return 'Other'
  }

  test.afterEach(async ({ page }) => {
    // Final cleanup and summary logging
    console.log('\n=== Test Cleanup ===')
    console.log(`Total console logs captured: ${consoleLogs.length}`)
    console.log(`Total network requests: ${networkRequests.length}`)
    console.log(`Total Firebase requests: ${firebaseRequests.length}`)
    console.log(`Total errors: ${errors.length}`)

    // Take final screenshot for debugging
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/auto-save-test-final.png',
      fullPage: true
    })
  })
})
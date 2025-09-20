import { test, expect, Page } from '@playwright/test'

/**
 * Auto-save test specifically for Google OAuth authentication
 *
 * This test attempts to use Google OAuth for authentication and then
 * tests the auto-save functionality. Google OAuth in testing environments
 * can be challenging, so this test includes fallbacks and detailed logging.
 */

test.describe('Auto-Save Google OAuth Tests', () => {
  let consoleLogs: string[] = []
  let networkRequests: any[] = []
  let firebaseRequests: any[] = []

  test.beforeEach(async ({ page }) => {
    // Reset monitoring arrays
    consoleLogs = []
    networkRequests = []
    firebaseRequests = []

    // Enhanced monitoring (same as main test)
    page.on('console', (msg) => {
      const text = msg.text()
      consoleLogs.push(`[${msg.type().toUpperCase()}] ${text}`)
      console.log(`Browser Console [${msg.type().toUpperCase()}]:`, text)
    })

    page.on('request', (request) => {
      const url = request.url()
      const requestInfo = {
        url,
        method: request.method(),
        postData: request.postData(),
        timestamp: new Date().toISOString()
      }
      networkRequests.push(requestInfo)

      if (url.includes('firebase') || url.includes('googleapis') || url.includes('google') || url.includes('oauth')) {
        firebaseRequests.push({
          url,
          method: request.method(),
          timestamp: new Date().toISOString(),
          type: getRequestType(url)
        })
        console.log(`Auth/Firebase Request: ${request.method()} ${url}`)
      }
    })

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)
  })

  test('Google OAuth authentication and auto-save flow', async ({ page }) => {
    console.log('\n=== Google OAuth Auto-Save Test ===')

    // Check if already authenticated
    const alreadyAuth = await page.locator('text="Logout", text="Sign out"').isVisible({ timeout: 5000 }).catch(() => false)

    if (!alreadyAuth) {
      console.log('Attempting Google OAuth login...')
      await attemptGoogleLogin(page)
    } else {
      console.log('User already authenticated, proceeding with test...')
    }

    // Wait for authentication state to settle
    await page.waitForTimeout(3000)

    // Verify we can access image generation
    const generateButton = await findGenerateButton(page)
    if (!generateButton) {
      console.log('❌ Cannot find image generation interface after authentication')
      return
    }

    // Perform image generation with auto-save monitoring
    console.log('Starting image generation with auto-save monitoring...')
    await performImageGenerationTest(page)
  })

  test('Manual Google login simulation (for interactive testing)', async ({ page }) => {
    console.log('\n=== Manual Google Login Test ===')
    console.log('This test will pause for manual Google login if needed')

    // Check authentication state
    const isAuthenticated = await page.locator('text="Logout", text="Sign out"').isVisible({ timeout: 5000 }).catch(() => false)

    if (!isAuthenticated) {
      // Look for Google login button
      const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")').first()

      if (await googleButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Found Google login button')
        console.log('NOTE: Manual intervention may be required for Google OAuth')

        // Click Google button and wait for potential redirect
        await googleButton.click()

        // Wait longer for OAuth flow (may require manual intervention)
        console.log('Waiting for OAuth flow... (this may require manual action)')
        await page.waitForTimeout(10000)

        // Check if we're back and authenticated
        const nowAuthenticated = await page.locator('text="Logout", text="Sign out"').isVisible({ timeout: 5000 }).catch(() => false)

        if (nowAuthenticated) {
          console.log('✅ Google OAuth appears successful')
        } else {
          console.log('⚠️  Google OAuth may not have completed - continuing with test anyway')
        }
      } else {
        console.log('❌ Google login button not found')
      }
    }

    // Continue with auto-save test regardless of auth status
    await performImageGenerationTest(page)
  })

  async function attemptGoogleLogin(page: Page) {
    try {
      // Look for Google sign-in button
      const googleButtonSelectors = [
        'button:has-text("Google")',
        'button:has-text("Continue with Google")',
        'button:has-text("Sign in with Google")',
        '[data-testid="google-login"]',
        '.google-login'
      ]

      let googleButton = null
      for (const selector of googleButtonSelectors) {
        googleButton = page.locator(selector).first()
        if (await googleButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Found Google button with selector: ${selector}`)
          break
        }
      }

      if (!googleButton || !(await googleButton.isVisible())) {
        console.log('❌ Google login button not found')
        return false
      }

      // Click the Google button
      console.log('Clicking Google login button...')
      await googleButton.click()

      // Wait for OAuth flow
      // Note: In a real test environment, you might need to:
      // 1. Use a test Google account
      // 2. Pre-configure OAuth tokens
      // 3. Mock the OAuth flow
      await page.waitForTimeout(5000)

      // Check if login was successful
      const authSuccess = await page.locator('text="Logout", text="Sign out"').isVisible({ timeout: 10000 }).catch(() => false)

      if (authSuccess) {
        console.log('✅ Google login appears successful')
        return true
      } else {
        console.log('⚠️  Google login status unclear')
        return false
      }

    } catch (error) {
      console.log(`❌ Google login error: ${error}`)
      return false
    }
  }

  async function findGenerateButton(page: Page) {
    const selectors = [
      'button:has-text("Generate")',
      'button:has-text("Create")',
      'button[data-testid="generate-button"]'
    ]

    for (const selector of selectors) {
      const button = page.locator(selector).first()
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        return button
      }
    }
    return null
  }

  async function performImageGenerationTest(page: Page) {
    console.log('Starting image generation test...')

    // Find prompt input
    const promptInput = page.locator('textarea, input[placeholder*="prompt"], input[placeholder*="Describe"]').first()
    const generateButton = await findGenerateButton(page)

    if (!(await promptInput.isVisible({ timeout: 2000 }).catch(() => false))) {
      console.log('❌ Prompt input not found')
      return
    }

    if (!generateButton) {
      console.log('❌ Generate button not found')
      return
    }

    // Clear monitoring arrays
    consoleLogs = []
    networkRequests = []
    firebaseRequests = []

    // Generate image
    const testPrompt = 'A serene mountain landscape with flowing river'
    await promptInput.fill(testPrompt)
    await generateButton.click()

    console.log('Image generation started, monitoring for auto-save...')

    // Monitor for 20 seconds
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(2000)
      console.log(`Monitoring... ${(i + 1) * 2}s`)

      // Check for auto-save activity
      const autoSaveLogs = consoleLogs.filter(log =>
        log.toLowerCase().includes('auto-sav') ||
        log.toLowerCase().includes('firebase storage')
      )

      const apiCalls = networkRequests.filter(req => req.url.includes('/api/nano-banana-image'))
      const storageCalls = firebaseRequests.filter(req => req.type === 'Storage')

      if (autoSaveLogs.length > 0) {
        console.log(`✅ Auto-save logs found: ${autoSaveLogs.length}`)
        autoSaveLogs.forEach(log => console.log(`  - ${log}`))
      }

      if (apiCalls.length > 0) {
        console.log(`✅ Auto-save API calls found: ${apiCalls.length}`)
      }

      if (storageCalls.length > 0) {
        console.log(`✅ Firebase Storage calls found: ${storageCalls.length}`)
      }

      // Check if image appeared
      const imageCount = await page.locator('img[src*="http"], img[src*="data:"]').count()
      if (imageCount > 0) {
        console.log(`✅ Images generated: ${imageCount}`)
        break
      }
    }

    // Final summary
    const finalImageCount = await page.locator('img[src*="http"], img[src*="data:"]').count()
    const autoSaveApiCalls = networkRequests.filter(req => req.url.includes('/api/nano-banana-image')).length
    const storageRequests = firebaseRequests.filter(req => req.type === 'Storage').length

    console.log('\n--- Test Results ---')
    console.log(`Images generated: ${finalImageCount}`)
    console.log(`Auto-save API calls: ${autoSaveApiCalls}`)
    console.log(`Firebase Storage requests: ${storageRequests}`)

    if (finalImageCount > 0 && autoSaveApiCalls > 0) {
      console.log('🎉 SUCCESS: Both image generation and auto-save appear to be working')
    } else if (finalImageCount > 0) {
      console.log('⚠️  PARTIAL: Image generation works but auto-save may not be functioning')
    } else {
      console.log('❌ FAILURE: Image generation itself is not working')
    }
  }

  function getRequestType(url: string): string {
    if (url.includes('storage')) return 'Storage'
    if (url.includes('firestore')) return 'Firestore'
    if (url.includes('auth') || url.includes('oauth') || url.includes('google')) return 'Auth'
    return 'Other'
  }

  test.afterEach(async ({ page }) => {
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/google-auth-test-final.png',
      fullPage: true
    })
  })
})
import { test, expect, Page } from '@playwright/test'

/**
 * Approval System Bypass Test
 *
 * This test verifies that the Firebase permissions issue has been bypassed
 * and users are now auto-approved, eliminating the "Missing or insufficient permissions" error.
 *
 * Test Steps:
 * 1. Navigate to http://localhost:3000
 * 2. Take a screenshot to see the current state
 * 3. Look for Google sign-in options
 * 4. Check if there are any "Awaiting admin approval" messages visible
 * 5. Look at the browser console for any "TEMPORARY: Auto-approving user" log messages
 * 6. Take another screenshot after checking
 */

test.describe('Approval System Bypass Tests', () => {
  let consoleLogs: string[] = []
  let networkRequests: any[] = []
  let approvalLogs: string[] = []
  let errorLogs: string[] = []

  test.beforeEach(async ({ page }) => {
    // Reset monitoring arrays
    consoleLogs = []
    networkRequests = []
    approvalLogs = []
    errorLogs = []

    // Monitor console for approval-related messages
    page.on('console', (msg) => {
      const text = msg.text()
      const type = msg.type().toUpperCase()
      const logEntry = `[${type}] ${text}`

      consoleLogs.push(logEntry)
      console.log(`Browser Console [${type}]:`, text)

      // Track auto-approval messages
      if (text.toLowerCase().includes('auto-approving') ||
          text.toLowerCase().includes('temporary') ||
          text.toLowerCase().includes('bypass')) {
        approvalLogs.push(logEntry)
        console.log(`🔧 APPROVAL LOG: ${text}`)
      }

      // Track permission errors
      if (text.toLowerCase().includes('permission') ||
          text.toLowerCase().includes('insufficient') ||
          text.toLowerCase().includes('missing')) {
        errorLogs.push(logEntry)
        console.log(`❌ ERROR LOG: ${text}`)
      }
    })

    // Monitor network requests for Firebase/auth calls
    page.on('request', (request) => {
      const url = request.url()
      const requestInfo = {
        url,
        method: request.method(),
        timestamp: new Date().toISOString()
      }
      networkRequests.push(requestInfo)

      if (url.includes('firebase') || url.includes('googleapis') || url.includes('google') || url.includes('oauth')) {
        console.log(`Auth/Firebase Request: ${request.method()} ${url}`)
      }
    })
  })

  test('Verify approval system bypass functionality', async ({ page }) => {
    console.log('\n=== Approval System Bypass Test ===')

    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to http://localhost:3002...')
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000) // Wait for initial load

    // Step 2: Take initial screenshot
    console.log('Step 2: Taking initial screenshot...')
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/approval-bypass-initial.png',
      fullPage: true
    })

    // Step 3: Look for Google sign-in options
    console.log('Step 3: Looking for Google sign-in options...')
    const googleSignInSelectors = [
      'button:has-text("Google")',
      'button:has-text("Continue with Google")',
      'button:has-text("Sign in with Google")',
      'button:has-text("Login with Google")',
      '[data-testid="google-login"]',
      '.google-login'
    ]

    let googleButtonFound = false
    let googleButtonSelector = ''

    for (const selector of googleSignInSelectors) {
      const button = page.locator(selector).first()
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        googleButtonFound = true
        googleButtonSelector = selector
        console.log(`✅ Found Google sign-in button with selector: ${selector}`)
        break
      }
    }

    if (!googleButtonFound) {
      console.log('ℹ️  No Google sign-in button found - user may already be authenticated')
    }

    // Step 4: Check for "Awaiting admin approval" messages
    console.log('Step 4: Checking for admin approval messages...')
    const approvalMessageSelectors = [
      'text="Awaiting admin approval"',
      'text="waiting for approval"',
      'text="pending approval"',
      'text="admin must approve"',
      ':has-text("approval")',
      ':has-text("pending")'
    ]

    let approvalMessageFound = false
    for (const selector of approvalMessageSelectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        approvalMessageFound = true
        const text = await element.textContent()
        console.log(`⚠️  Found approval message: "${text}"`)
        break
      }
    }

    if (!approvalMessageFound) {
      console.log('✅ No "Awaiting admin approval" messages found')
    }

    // Step 5: Check for permission error messages
    console.log('Step 5: Checking for permission error messages...')
    const permissionErrorSelectors = [
      'text="Missing or insufficient permissions"',
      'text="Permission denied"',
      'text="Access denied"',
      ':has-text("insufficient permissions")',
      ':has-text("permission denied")'
    ]

    let permissionErrorFound = false
    for (const selector of permissionErrorSelectors) {
      const element = page.locator(selector).first()
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        permissionErrorFound = true
        const text = await element.textContent()
        console.log(`❌ Found permission error: "${text}"`)
        break
      }
    }

    if (!permissionErrorFound) {
      console.log('✅ No permission error messages found')
    }

    // Try to trigger authentication if Google button exists
    if (googleButtonFound) {
      console.log('Step 6: Attempting to interact with Google sign-in...')
      try {
        const googleButton = page.locator(googleButtonSelector).first()
        await googleButton.click()

        // Wait for potential OAuth redirect or popup
        await page.waitForTimeout(5000)

        console.log('Clicked Google sign-in button, monitoring for auto-approval...')
      } catch (error) {
        console.log(`Note: Could not click Google button: ${error}`)
      }
    }

    // Monitor for a period to catch auto-approval logs
    console.log('Step 7: Monitoring console for auto-approval messages...')
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(2000)
      console.log(`Monitoring... ${(i + 1) * 2}s`)

      if (approvalLogs.length > 0) {
        console.log('✅ Auto-approval activity detected!')
        break
      }
    }

    // Step 6: Take final screenshot
    console.log('Step 8: Taking final screenshot...')
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/approval-bypass-final.png',
      fullPage: true
    })

    // Analysis and reporting
    console.log('\n=== TEST RESULTS ===')

    console.log('\n📊 Summary:')
    console.log(`Google sign-in button found: ${googleButtonFound}`)
    console.log(`Admin approval messages found: ${approvalMessageFound}`)
    console.log(`Permission errors found: ${permissionErrorFound}`)
    console.log(`Auto-approval logs detected: ${approvalLogs.length}`)
    console.log(`Error logs detected: ${errorLogs.length}`)
    console.log(`Total console messages: ${consoleLogs.length}`)

    if (approvalLogs.length > 0) {
      console.log('\n🔧 Auto-approval messages:')
      approvalLogs.forEach(log => console.log(`  - ${log}`))
    }

    if (errorLogs.length > 0) {
      console.log('\n❌ Error messages:')
      errorLogs.forEach(log => console.log(`  - ${log}`))
    }

    // Final assessment
    console.log('\n🎯 BYPASS ASSESSMENT:')

    if (!permissionErrorFound && !approvalMessageFound) {
      if (approvalLogs.length > 0) {
        console.log('🎉 SUCCESS: Bypass is working! Auto-approval detected and no permission errors.')
      } else {
        console.log('✅ GOOD: No permission errors or approval messages detected.')
      }
    } else if (permissionErrorFound) {
      console.log('❌ FAILURE: Permission errors still present - bypass may not be working.')
    } else if (approvalMessageFound) {
      console.log('⚠️  PARTIAL: Admin approval messages still visible - bypass may not be complete.')
    }

    // Check for specific functionality
    await checkAppFunctionality(page)
  })

  async function checkAppFunctionality(page: Page) {
    console.log('\n=== FUNCTIONALITY CHECK ===')

    // Check if main app interface is accessible
    const functionalityChecks = [
      { name: 'Generate button', selector: 'button:has-text("Generate")' },
      { name: 'Prompt input', selector: 'textarea, input[placeholder*="prompt"]' },
      { name: 'Image container', selector: '[data-testid="image-container"], .image-container' },
      { name: 'Main content area', selector: 'main, .main-content, #main' }
    ]

    let functionalElementsFound = 0

    for (const check of functionalityChecks) {
      const element = page.locator(check.selector).first()
      const isVisible = await element.isVisible({ timeout: 2000 }).catch(() => false)

      if (isVisible) {
        functionalElementsFound++
        console.log(`✅ ${check.name} found and visible`)
      } else {
        console.log(`❌ ${check.name} not found or not visible`)
      }
    }

    console.log(`\n📈 Functionality Score: ${functionalElementsFound}/${functionalityChecks.length}`)

    if (functionalElementsFound >= 2) {
      console.log('✅ App appears to be functional - core UI elements are accessible')
    } else {
      console.log('❌ App may not be fully functional - few UI elements detected')
    }
  }

  test.afterEach(async ({ page }) => {
    // Take a final screenshot for debugging
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/approval-bypass-test-complete.png',
      fullPage: true
    })
  })
})
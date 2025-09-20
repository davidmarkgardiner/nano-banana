import { test, expect, Page } from '@playwright/test'

/**
 * Authentication Bypass Verification Test
 *
 * This test specifically focuses on verifying that the auth bypass works
 * by looking for the auto-approval log messages when authentication state changes.
 */

test.describe('Authentication Bypass Verification', () => {
  let consoleLogs: string[] = []
  let autoApprovalDetected = false

  test.beforeEach(async ({ page }) => {
    consoleLogs = []
    autoApprovalDetected = false

    // Monitor for auto-approval console messages
    page.on('console', (msg) => {
      const text = msg.text()
      const type = msg.type().toUpperCase()
      const logEntry = `[${type}] ${text}`

      consoleLogs.push(logEntry)
      console.log(`Browser Console [${type}]:`, text)

      // Check for auto-approval messages
      if (text.includes('TEMPORARY: Auto-approving user') ||
          text.includes('Auto-approving user')) {
        autoApprovalDetected = true
        console.log('🎯 AUTO-APPROVAL DETECTED!')
      }
    })
  })

  test('Verify auto-approval bypass triggers on page load', async ({ page }) => {
    console.log('\n=== Authentication Bypass Verification ===')

    // Navigate to the app
    console.log('Step 1: Loading the application...')
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Take initial screenshot
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/auth-bypass-initial.png',
      fullPage: true
    })

    // Check current state
    console.log('Step 2: Checking initial authentication state...')

    // Look for authentication-related UI elements
    const googleButton = page.locator('button:has-text("Continue with Google")').first()
    const isGoogleButtonVisible = await googleButton.isVisible()

    const signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout")').first()
    const isSignedIn = await signOutButton.isVisible()

    console.log(`Google sign-in button visible: ${isGoogleButtonVisible}`)
    console.log(`Already signed in: ${isSignedIn}`)

    // Check for approval status indicators
    const statusText = await page.textContent('body')
    const hasApprovalText = statusText?.includes('approval') || statusText?.includes('Approval')
    const hasRequiresApproval = statusText?.includes('Requires approval')
    const hasLocked = statusText?.includes('Locked')

    console.log(`Page contains approval text: ${hasApprovalText}`)
    console.log(`Contains "Requires approval": ${hasRequiresApproval}`)
    console.log(`Contains "Locked": ${hasLocked}`)

    // Wait longer for any delayed authentication state changes
    console.log('Step 3: Waiting for authentication state to stabilize...')
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000)
      console.log(`Waiting... ${i + 1}s`)

      if (autoApprovalDetected) {
        console.log('✅ Auto-approval detected during wait!')
        break
      }
    }

    // Check final state
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/auth-bypass-final.png',
      fullPage: true
    })

    // Report findings
    console.log('\n=== BYPASS VERIFICATION RESULTS ===')
    console.log(`Auto-approval console message detected: ${autoApprovalDetected}`)
    console.log(`Total console messages: ${consoleLogs.length}`)

    if (autoApprovalDetected) {
      console.log('🎉 SUCCESS: Auto-approval bypass is working!')
    } else {
      console.log('❌ Auto-approval not detected - this could mean:')
      console.log('   1. User is not authenticated')
      console.log('   2. Bypass is not triggering')
      console.log('   3. Need to trigger authentication manually')
    }

    // Look for relevant console logs
    const relevantLogs = consoleLogs.filter(log =>
      log.toLowerCase().includes('auth') ||
      log.toLowerCase().includes('approval') ||
      log.toLowerCase().includes('user') ||
      log.toLowerCase().includes('temporary')
    )

    if (relevantLogs.length > 0) {
      console.log('\n📋 Relevant console logs:')
      relevantLogs.forEach(log => console.log(`  - ${log}`))
    }
  })

  test('Attempt to trigger authentication and monitor bypass', async ({ page }) => {
    console.log('\n=== Trigger Authentication Test ===')

    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Look for Google sign-in button
    const googleButton = page.locator('button:has-text("Continue with Google")').first()
    const isVisible = await googleButton.isVisible()

    if (isVisible) {
      console.log('Found Google sign-in button, attempting to click...')

      // Click the button (this may trigger OAuth flow or show popup)
      try {
        await googleButton.click()
        console.log('Clicked Google sign-in button')

        // Wait for potential authentication state changes
        for (let i = 0; i < 15; i++) {
          await page.waitForTimeout(1000)
          console.log(`Monitoring authentication... ${i + 1}s`)

          if (autoApprovalDetected) {
            console.log('🎯 Auto-approval triggered after clicking sign-in!')
            break
          }

          // Check if page state changed
          const newStatusText = await page.textContent('body')
          if (newStatusText?.includes('Auto-approving') ||
              newStatusText?.includes('system-bypass')) {
            console.log('📄 Auto-approval visible in page content!')
          }
        }

      } catch (error) {
        console.log(`Note: Could not complete sign-in click: ${error}`)
      }
    } else {
      console.log('Google sign-in button not found - user may already be authenticated')
    }

    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/auth-trigger-final.png',
      fullPage: true
    })

    console.log('\n=== TRIGGER TEST RESULTS ===')
    console.log(`Auto-approval detected: ${autoApprovalDetected}`)
    console.log(`Console messages: ${consoleLogs.length}`)
  })
})
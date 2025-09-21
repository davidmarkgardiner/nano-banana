import { test, expect, Page } from '@playwright/test'

/**
 * Enhanced Approval System Bypass Test
 *
 * This test includes more detailed error handling and longer wait times
 * to better understand what's happening with the application.
 */

test.describe('Enhanced Approval System Bypass Tests', () => {
  let consoleLogs: string[] = []
  let networkRequests: any[] = []
  let jsErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    // Reset monitoring arrays
    consoleLogs = []
    networkRequests = []
    jsErrors = []

    // Comprehensive console monitoring
    page.on('console', (msg) => {
      const text = msg.text()
      const type = msg.type().toUpperCase()
      const logEntry = `[${type}] ${text}`

      consoleLogs.push(logEntry)
      console.log(`Browser Console [${type}]:`, text)

      // Track JavaScript errors specifically
      if (type === 'ERROR') {
        jsErrors.push(logEntry)
        console.log(`🚨 JS ERROR: ${text}`)
      }
    })

    // Monitor page errors
    page.on('pageerror', (error) => {
      const errorMsg = `Page Error: ${error.message}`
      jsErrors.push(errorMsg)
      console.log(`🚨 PAGE ERROR: ${error.message}`)
    })

    // Monitor network failures
    page.on('requestfailed', (request) => {
      console.log(`❌ Request failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`)
    })

    // Monitor all network requests
    page.on('request', (request) => {
      const url = request.url()
      networkRequests.push({
        url,
        method: request.method(),
        timestamp: new Date().toISOString()
      })
    })
  })

  test('Enhanced bypass verification with detailed monitoring', async ({ page }) => {
    console.log('\n=== Enhanced Approval System Bypass Test ===')

    try {
      // Step 1: Navigate to the app with longer timeout
      console.log('Step 1: Navigating to http://localhost:3000...')
      await page.goto('http://localhost:3000', {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      // Step 2: Wait for initial React app to load
      console.log('Step 2: Waiting for React app to initialize...')
      await page.waitForTimeout(5000)

      // Step 3: Take initial screenshot
      console.log('Step 3: Taking initial screenshot...')
      await page.screenshot({
        path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/enhanced-bypass-initial.png',
        fullPage: true
      })

      // Step 4: Check for any content on the page
      console.log('Step 4: Checking page content...')
      const bodyText = await page.textContent('body')
      const hasContent = bodyText && bodyText.trim().length > 0
      console.log(`Page has text content: ${hasContent}`)
      if (hasContent) {
        console.log(`Content preview: ${bodyText?.substring(0, 200)}...`)
      }

      // Step 5: Look for specific elements that should be present
      console.log('Step 5: Looking for specific UI elements...')

      const elementsToCheck = [
        { name: 'HTML title', selector: 'title' },
        { name: 'Main container', selector: 'main, #main, [role="main"]' },
        { name: 'Any button', selector: 'button' },
        { name: 'Any input', selector: 'input, textarea' },
        { name: 'Google sign-in', selector: 'button:has-text("Google"), button:has-text("Sign in")' },
        { name: 'Nano Banana text', selector: ':has-text("Nano Banana")' },
        { name: 'React root', selector: '#__next, #root, [data-reactroot]' }
      ]

      let foundElements = 0
      for (const element of elementsToCheck) {
        try {
          const locator = page.locator(element.selector).first()
          const isVisible = await locator.isVisible({ timeout: 2000 })

          if (isVisible) {
            foundElements++
            const text = await locator.textContent().catch(() => '[No text]')
            console.log(`✅ ${element.name} found: "${text?.substring(0, 50)}..."`)
          } else {
            console.log(`❌ ${element.name} not visible`)
          }
        } catch (error) {
          console.log(`❌ ${element.name} not found: ${error}`)
        }
      }

      console.log(`Found ${foundElements}/${elementsToCheck.length} expected elements`)

      // Step 6: Check for specific approval-related text
      console.log('Step 6: Checking for approval/permission messages...')

      const textChecks = [
        'Awaiting admin approval',
        'Missing or insufficient permissions',
        'Permission denied',
        'Admin approval required',
        'TEMPORARY: Auto-approving user',
        'auto-approv'
      ]

      for (const text of textChecks) {
        const found = bodyText?.toLowerCase().includes(text.toLowerCase())
        if (found) {
          console.log(`🎯 Found text: "${text}"`)
        }
      }

      // Step 7: Take final screenshot
      console.log('Step 7: Taking final screenshot...')
      await page.screenshot({
        path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/enhanced-bypass-final.png',
        fullPage: true
      })

      // Step 8: Generate detailed report
      console.log('\n=== DETAILED REPORT ===')
      console.log(`Total console messages: ${consoleLogs.length}`)
      console.log(`JavaScript errors: ${jsErrors.length}`)
      console.log(`Network requests: ${networkRequests.length}`)
      console.log(`UI elements found: ${foundElements}/${elementsToCheck.length}`)

      if (jsErrors.length > 0) {
        console.log('\n❌ JavaScript Errors:')
        jsErrors.forEach(error => console.log(`  - ${error}`))
      }

      if (foundElements === 0) {
        console.log('\n🚨 CRITICAL: No UI elements found - app may not be loading')
      } else if (foundElements < 3) {
        console.log('\n⚠️  WARNING: Few UI elements found - app may be partially broken')
      } else {
        console.log('\n✅ SUCCESS: App appears to be loading UI elements')
      }

      // Check for auto-approval specifically
      const autoApprovalLogs = consoleLogs.filter(log =>
        log.toLowerCase().includes('auto-approv') ||
        log.toLowerCase().includes('temporary') ||
        log.toLowerCase().includes('bypass')
      )

      if (autoApprovalLogs.length > 0) {
        console.log('\n🔧 Auto-approval activity detected:')
        autoApprovalLogs.forEach(log => console.log(`  - ${log}`))
      } else {
        console.log('\n📝 No auto-approval logs detected (may need authentication trigger)')
      }

    } catch (error) {
      console.log(`\n❌ Test error: ${error}`)
    }
  })

  test('Simple content verification', async ({ page }) => {
    console.log('\n=== Simple Content Verification ===')

    // Just check if we can load the page and get some content
    await page.goto('http://localhost:3000')
    await page.waitForTimeout(3000)

    const title = await page.title()
    const bodyText = await page.textContent('body')

    console.log(`Page title: "${title}"`)
    console.log(`Body text length: ${bodyText?.length || 0}`)
    console.log(`Has "Nano Banana": ${bodyText?.includes('Nano Banana')}`)
    console.log(`Has "Google": ${bodyText?.includes('Google')}`)
    console.log(`Has "approval": ${bodyText?.toLowerCase().includes('approval')}`)

    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/tests/screenshots/simple-content-check.png',
      fullPage: true
    })
  })
})
import { test, expect } from '@playwright/test'

test.describe('Manual App Verification', () => {
  test('should test the nano banana app functionality manually', async ({ page }) => {
    console.log('🚀 Starting manual verification...')

    // Navigate to the app with extended timeout
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })

    // Wait a bit for the app to initialize
    await page.waitForTimeout(3000)

    console.log('📄 Page loaded, checking content...')

    // Take a screenshot first to see what we have
    await page.screenshot({
      path: '/Users/davidgardiner/Desktop/repo/nano-banana/manual-verification-screenshot.png',
      fullPage: true
    })

    // Get page title
    const title = await page.title()
    console.log('📝 Page title:', title)

    // Get page content and check for key elements
    const bodyText = await page.textContent('body')
    console.log('🔍 Page contains "Nano Banana":', bodyText?.includes('Nano Banana') || false)
    console.log('🔍 Page contains "Firebase":', bodyText?.includes('Firebase') || false)
    console.log('🔍 Page contains "Sign in":', bodyText?.includes('Sign in') || false)

    // Check if we can find the main elements by various selectors
    const mainElements = [
      'h1',
      '[data-testid="app-header"]',
      'button',
      'input',
      'textarea'
    ]

    for (const selector of mainElements) {
      const count = await page.locator(selector).count()
      console.log(`🔍 Found ${count} elements with selector: ${selector}`)
    }

    // Test the API endpoint from the browser context
    console.log('🌐 Testing API endpoint...')
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: 'test prompt for verification' })
        })

        const data = await response.json()
        return {
          status: response.status,
          data
        }
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    console.log('📡 API Response:', JSON.stringify(apiResponse, null, 2))

    // Basic assertions
    expect(title).toContain('Nano Banana')

    // The API should be responding (even if with errors due to no API key)
    expect(apiResponse.status).toBeDefined()

    console.log('✅ Manual verification completed!')
  })

  test('should test mock API functionality', async ({ page }) => {
    console.log('🎭 Testing mock API functionality...')

    // Test that we can access the nano banana API client
    const mockTestResult = await page.evaluate(async () => {
      try {
        // Check if the environment variable for mock API is working
        const isMockAPI = process.env.NEXT_PUBLIC_USE_REAL_API !== 'true'

        return {
          usingMockAPI: isMockAPI,
          environment: process.env.NODE_ENV,
          hasRealAPIFlag: process.env.NEXT_PUBLIC_USE_REAL_API
        }
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    console.log('🎭 Mock API Test Result:', JSON.stringify(mockTestResult, null, 2))

    console.log('✅ Mock API test completed!')
  })
})
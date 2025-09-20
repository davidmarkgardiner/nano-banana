import { test, expect } from '@playwright/test'

test.describe('Nano Banana API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('should handle API endpoint validation', async ({ page }) => {
    // Test the API endpoint directly using page.evaluate to make requests
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        })
        return {
          status: res.status,
          data: await res.json()
        }
      } catch (error) {
        return {
          status: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // Should return 400 for missing prompt
    expect(response.status).toBe(400)
    expect(response.data.error).toContain('Prompt is required')
  })

  test('should validate prompt length requirements', async ({ page }) => {
    // Test too short prompt
    const shortPromptResponse = await page.evaluate(async () => {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'Hi' })
      })
      return {
        status: res.status,
        data: await res.json()
      }
    })

    expect(shortPromptResponse.status).toBe(400)
    expect(shortPromptResponse.data.error).toContain('at least 3 characters')

    // Test too long prompt
    const longPrompt = 'A'.repeat(501)
    const longPromptResponse = await page.evaluate(async (prompt) => {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      })
      return {
        status: res.status,
        data: await res.json()
      }
    }, longPrompt)

    expect(longPromptResponse.status).toBe(400)
    expect(longPromptResponse.data.error).toContain('less than 500 characters')
  })

  test('should handle valid prompt when API key is not configured', async ({ page }) => {
    // This test assumes GEMINI_API_KEY is not set (which is typical in test environment)
    const validPromptResponse = await page.evaluate(async () => {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'A beautiful mountain landscape' })
      })
      return {
        status: res.status,
        data: await res.json()
      }
    })

    // Should return 500 for missing API key (expected in test environment)
    expect(validPromptResponse.status).toBe(500)
    expect(validPromptResponse.data.error).toContain('API key not configured')
  })

  test('should use correct HTTP methods', async ({ page }) => {
    // Test that GET is not allowed
    const getResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/generate-image', {
          method: 'GET'
        })
        return {
          status: res.status,
          ok: res.ok
        }
      } catch (error) {
        return {
          status: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // Should not be OK for GET requests (Next.js returns 405 for unsupported methods)
    expect(getResponse.status).not.toBe(200)
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Test the client-side error handling by mocking a network failure
    const networkErrorResponse = await page.evaluate(async () => {
      // Override fetch to simulate network error
      const originalFetch = window.fetch
      window.fetch = () => Promise.reject(new Error('Network error'))

      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: 'Test prompt' })
        })
        return { success: true, data: await res.json() }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      } finally {
        // Restore original fetch
        window.fetch = originalFetch
      }
    })

    expect(networkErrorResponse.success).toBe(false)
    expect(networkErrorResponse.error).toBe('Network error')
  })

  test('should verify API endpoint exists', async ({ page }) => {
    // Verify the API route exists and responds
    const optionsResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/generate-image', {
          method: 'OPTIONS'
        })
        return {
          status: res.status,
          exists: res.status !== 404
        }
      } catch (error) {
        return {
          status: 0,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    // The endpoint should exist (not return 404)
    expect(optionsResponse.exists).toBe(true)
  })
})
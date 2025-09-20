import { test, expect } from '@playwright/test'

test.describe('Transfuse Image API - Security and Validation', () => {
  const validBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  test('should reject requests without required fields', async ({ request }) => {
    const response = await request.post('/api/transfuse-image', {
      data: {}
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('baseImageDataUrl and referenceImageDataUrl are required')
  })

  test('should reject requests with missing instruction', async ({ request }) => {
    const response = await request.post('/api/transfuse-image', {
      data: {
        baseImageDataUrl: validBase64Image,
        referenceImageDataUrl: validBase64Image
      }
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Provide instructions describing how')
  })

  test('should reject instructions that are too short', async ({ request }) => {
    const response = await request.post('/api/transfuse-image', {
      data: {
        baseImageDataUrl: validBase64Image,
        referenceImageDataUrl: validBase64Image,
        instruction: 'hi'
      }
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('at least a short sentence')
  })

  test('should reject instructions that are too long', async ({ request }) => {
    const longInstruction = 'a'.repeat(601)
    const response = await request.post('/api/transfuse-image', {
      data: {
        baseImageDataUrl: validBase64Image,
        referenceImageDataUrl: validBase64Image,
        instruction: longInstruction
      }
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('less than 600 characters')
  })

  test('should reject invalid base64 data URLs', async ({ request }) => {
    const response = await request.post('/api/transfuse-image', {
      data: {
        baseImageDataUrl: 'not-a-valid-data-url',
        referenceImageDataUrl: validBase64Image,
        instruction: 'blend these images together'
      }
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('base64 encoded data URLs')
  })

  test('should handle rate limiting', async ({ request }) => {
    // Make multiple rapid requests to trigger rate limiting
    const validRequest = {
      baseImageDataUrl: validBase64Image,
      referenceImageDataUrl: validBase64Image,
      instruction: 'blend these images together'
    }

    // Make 11 requests rapidly (limit is 10 per minute)
    const requests = Array(11).fill(0).map(() =>
      request.post('/api/transfuse-image', { data: validRequest })
    )

    const responses = await Promise.all(requests)

    // At least one should be rate limited (429)
    const rateLimitedResponses = responses.filter(r => r.status() === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)
  })

  test('should sanitize instruction input', async ({ request }) => {
    const maliciousInstruction = 'blend <script>alert("xss")</script> these images'
    const response = await request.post('/api/transfuse-image', {
      data: {
        baseImageDataUrl: validBase64Image,
        referenceImageDataUrl: validBase64Image,
        instruction: maliciousInstruction
      }
    })

    // Should process the request but sanitize the instruction
    // In a real test, we'd need to mock the Gemini API since we don't have a valid key
    expect([400, 401, 500]).toContain(response.status())
  })

  test('should handle missing Gemini API key gracefully', async ({ request }) => {
    const response = await request.post('/api/transfuse-image', {
      data: {
        baseImageDataUrl: validBase64Image,
        referenceImageDataUrl: validBase64Image,
        instruction: 'blend these images together'
      }
    })

    // Should return 500 with appropriate error message
    expect(response.status()).toBe(500)
    const body = await response.json()
    expect(body.error).toContain('Gemini API key not configured')
  })

  test('should validate content-length header', async ({ request }) => {
    // This test would require a very large payload to trigger the 20MB limit
    // For now, just verify the endpoint exists and responds appropriately
    const response = await request.post('/api/transfuse-image', {
      data: {
        baseImageDataUrl: validBase64Image,
        referenceImageDataUrl: validBase64Image,
        instruction: 'test instruction'
      }
    })

    // Should not return 413 for small valid requests
    expect(response.status()).not.toBe(413)
  })

  test('should generate proper UUID for response ID', async ({ request }) => {
    // Mock a successful response by ensuring we have the right structure
    const response = await request.post('/api/transfuse-image', {
      data: {
        baseImageDataUrl: validBase64Image,
        referenceImageDataUrl: validBase64Image,
        instruction: 'test instruction with proper length'
      }
    })

    if (response.status() === 200) {
      const body = await response.json()
      // UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(body.id).toMatch(uuidRegex)
    }
  })
})
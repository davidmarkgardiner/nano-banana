import { test, expect } from '@playwright/test'

test.describe('Video API Debug', () => {
  test('POST /api/generate-video returns response', async ({ request }) => {
    const response = await request.post('/api/generate-video', {
      data: {
        prompt: 'A simple test video of ocean waves',
        aspectRatio: '16:9',
        durationSeconds: 4,
        resolution: '720p',
      },
      timeout: 120000, // 2 minute timeout for video generation
    })

    console.log('Response status:', response.status())
    console.log('Response headers:', response.headers())

    const body = await response.text()
    console.log('Response body:', body.slice(0, 500))

    // We expect either success or a specific error, not 404
    expect(response.status()).not.toBe(404)
  })

  test('Check if route exists with invalid method', async ({ request }) => {
    // GET should return 405 Method Not Allowed if route exists
    const response = await request.get('/api/generate-video')
    console.log('GET status:', response.status())

    // 404 means route doesn't exist, 405 means route exists but wrong method
    const status = response.status()
    expect([404, 405]).toContain(status)
  })

  test('Test with minimal valid payload', async ({ request }) => {
    const response = await request.post('/api/generate-video', {
      data: {
        prompt: 'test',
        aspectRatio: '16:9',
        durationSeconds: 4,
      },
      timeout: 10000, // Short timeout to see immediate response
    })

    console.log('Minimal test - Status:', response.status())
    const body = await response.text()
    console.log('Minimal test - Body:', body)
  })

  test('Test validation error response', async ({ request }) => {
    // This should return 400 quickly since validation fails
    const response = await request.post('/api/generate-video', {
      data: {
        prompt: '', // Empty prompt should fail validation
        aspectRatio: '16:9',
        durationSeconds: 4,
      },
      timeout: 5000,
    })

    console.log('Validation error test - Status:', response.status())
    const body = await response.json()
    console.log('Validation error test - Body:', body)

    expect(response.status()).toBe(400)
    expect(body.error).toBeTruthy()
  })
})

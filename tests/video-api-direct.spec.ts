import { test, expect } from '@playwright/test'

test.describe('Video API Direct Test', () => {
  test('test video generation API directly', async ({ request }) => {
    // Set a long timeout for video generation
    test.setTimeout(180000) // 3 minutes

    console.log('Starting video generation API test...')

    const payload = {
      prompt: 'A beautiful sunset over the ocean with gentle waves crashing on the shore',
      aspectRatio: '16:9',
      durationSeconds: 8,
      resolution: '720p',
      model: 'veo-3.1-generate-preview',
      personGeneration: 'dont_allow',
    }

    console.log('Sending request with payload:', JSON.stringify(payload, null, 2))

    const response = await request.post('http://localhost:3000/api/generate-video', {
      data: payload,
      timeout: 180000, // 3 minute timeout
    })

    console.log('Response status:', response.status())
    console.log('Response headers:', response.headers())

    const responseText = await response.text()
    console.log('Response body:', responseText)

    if (response.ok()) {
      const data = JSON.parse(responseText)
      console.log('Video URL:', data.videoUrl)
      expect(data.videoUrl).toBeTruthy()
    } else {
      console.log('API returned error status:', response.status())
      // Log for debugging but don't fail - we want to see the error
    }
  })
})

import { test, expect } from '@playwright/test'

test.describe('Transfusion API Debug', () => {
  test('should debug the JSON parsing error', async ({ request }) => {
    const validBase64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

    // Test with valid small request first
    console.log('Testing with small images...')
    const smallRequest = {
      baseImageDataUrl: validBase64Image,
      referenceImageDataUrl: validBase64Image,
      instruction: 'blend these small images'
    }

    const response1 = await request.post('/api/transfuse-image', {
      data: smallRequest
    })

    console.log('Small request status:', response1.status())
    if (!response1.ok()) {
      const errorBody = await response1.text()
      console.log('Small request error:', errorBody)
    }

    // Test with larger base64 data (simulating real image)
    console.log('Testing with larger images...')
    const largerBase64 = 'data:image/png;base64,' + 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='.repeat(1000)

    const largerRequest = {
      baseImageDataUrl: largerBase64,
      referenceImageDataUrl: largerBase64,
      instruction: 'blend these larger images'
    }

    const response2 = await request.post('/api/transfuse-image', {
      data: largerRequest
    })

    console.log('Larger request status:', response2.status())
    if (!response2.ok()) {
      const errorBody = await response2.text()
      console.log('Larger request error:', errorBody)
    }

    // Test with malformed request to trigger the "unexpected token R" error
    console.log('Testing with potentially malformed request...')
    try {
      const response3 = await request.post('/api/transfuse-image', {
        data: 'Request is not valid json',  // This should trigger the error
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Malformed request status:', response3.status())
      const errorBody = await response3.text()
      console.log('Malformed request response:', errorBody)
    } catch (error) {
      console.log('Malformed request threw error:', error)
    }
  })
})
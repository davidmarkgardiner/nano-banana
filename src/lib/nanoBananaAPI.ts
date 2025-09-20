import { NanoBananaAPI, NanoBananaAPIResponse } from '@/types'

// Mock implementation for development
// This will be replaced with actual API integration later
class MockNanoBananaAPI implements NanoBananaAPI {
  async generateImage(_prompt: string): Promise<NanoBananaAPIResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
    
    // Simulate occasional errors for testing
    if (Math.random() < 0.1) {
      throw new Error('Failed to generate image. Please try again.')
    }
    
    // Return mock data with placeholder image
    const mockImageId = Math.random().toString(36).substring(7)
    
    return {
      imageUrl: `https://picsum.photos/512/512?random=${mockImageId}`,
      id: mockImageId,
      metadata: {
        model: 'nano-banana-v1-mock',
        dimensions: {
          width: 512,
          height: 512
        },
        generatedAt: new Date()
      }
    }
  }
}

// Production API implementation using server-side endpoint
class NanoBananaAPIClient implements NanoBananaAPI {
  async generateImage(prompt: string): Promise<NanoBananaAPIResponse> {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image')
      }

      return data
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while generating the image')
    }
  }
}

// Export the appropriate implementation
// Use real API if NEXT_PUBLIC_USE_REAL_API is set, otherwise use mock
const useRealAPI = process.env.NEXT_PUBLIC_USE_REAL_API === 'true'
const nanoBananaAPI: NanoBananaAPI = useRealAPI
  ? new NanoBananaAPIClient()
  : new MockNanoBananaAPI()

export default nanoBananaAPI
import {
  NanoBananaAPI,
  NanoBananaAPIResponse,
  NanoBananaImageEditRequest,
  NanoBananaImageTransfusionRequest,
  NanoBananaGenerateOptions,
  VideoGenerationRequest,
  VideoGenerationResponse,
} from '@/types'

// Mock implementation for development
// This will be replaced with actual API integration later
class MockNanoBananaAPI implements NanoBananaAPI {
  async generateImage(prompt: string, options?: NanoBananaGenerateOptions): Promise<NanoBananaAPIResponse> {
    const usePro = options?.usePro ?? false

    // Simulate API delay (Pro takes longer due to thinking)
    await new Promise(resolve => setTimeout(resolve, usePro ? 4000 + Math.random() * 3000 : 2000 + Math.random() * 3000))

    // Simulate occasional errors for testing
    if (Math.random() < 0.1) {
      throw new Error('Failed to generate image. Please try again.')
    }

    // Return mock data with placeholder image
    const mockImageId = Math.random().toString(36).substring(7)
    const size = usePro ? 1024 : 512

    return {
      imageUrl: `https://picsum.photos/${size}/${size}?random=${mockImageId}`,
      id: mockImageId,
      metadata: {
        model: usePro ? 'nano-banana-pro-mock' : 'nano-banana-v1-mock',
        dimensions: {
          width: size,
          height: size
        },
        generatedAt: new Date(),
        prompt,
      }
    }
  }

  async editImage({ instruction }: NanoBananaImageEditRequest): Promise<NanoBananaAPIResponse> {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

    if (Math.random() < 0.1) {
      throw new Error('Failed to apply the requested changes. Please try again.')
    }

    const mockImageId = Math.random().toString(36).substring(7)
    const normalizedInstruction = encodeURIComponent(instruction.trim() || 'edit')

    return {
      imageUrl: `https://picsum.photos/seed/${normalizedInstruction}-${mockImageId}/1024/1024`,
      id: mockImageId,
      metadata: {
        model: 'nano-banana-v1-mock-edit',
        dimensions: {
          width: 1024,
          height: 1024
        },
        generatedAt: new Date(),
        prompt: instruction,
      }
    }
  }

  async transfuseImages({ instruction }: NanoBananaImageTransfusionRequest): Promise<NanoBananaAPIResponse> {
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

    if (Math.random() < 0.1) {
      throw new Error('Failed to blend the provided photos. Please try again.')
    }

    const mockImageId = Math.random().toString(36).substring(7)
    const normalizedInstruction = encodeURIComponent(instruction.trim() || 'transfusion')

    return {
      imageUrl: `https://picsum.photos/seed/${normalizedInstruction}-${mockImageId}/1024/1024`,
      id: mockImageId,
      metadata: {
        model: 'nano-banana-v1-mock-transfusion',
        dimensions: {
          width: 1024,
          height: 1024
        },
        generatedAt: new Date(),
        prompt: instruction,
      }
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000))

    const mockId = Math.random().toString(36).substring(7)
    const videoUrl = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'

    return {
      videoUrl,
      id: mockId,
      metadata: {
        model: 'veo-3.1-generate-preview (mock)',
        durationSeconds: request.durationSeconds,
        aspectRatio: request.aspectRatio,
        resolution: request.resolution || '720p',
        generatedAt: new Date(),
        prompt: request.prompt,
      },
    }
  }
}

async function parseNanoBananaResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''

  // Clone the response to avoid "body stream already read" errors
  const responseClone = response.clone()
  const responseText = await responseClone.text()
  const trimmedText = responseText.trim()
  const isJsonResponse = contentType.includes('application/json')

  let parsedData: unknown
  let parsedJsonSuccessfully = false

  if (isJsonResponse) {
    try {
      parsedData = JSON.parse(responseText)
      parsedJsonSuccessfully = true
    } catch {
      parsedJsonSuccessfully = false
    }
  }

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('The uploaded images are too large. Please try again with smaller files.')
    }

    if (
      parsedJsonSuccessfully &&
      parsedData &&
      typeof parsedData === 'object' &&
      'error' in parsedData &&
      typeof (parsedData as { error?: unknown }).error === 'string'
    ) {
      throw new Error((parsedData as { error: string }).error)
    }

    if (trimmedText.length > 0) {
      throw new Error(trimmedText)
    }

    throw new Error(`Request failed with status ${response.status}`)
  }

  if (parsedJsonSuccessfully && parsedData && typeof parsedData === 'object') {
    return parsedData as T
  }

  if (isJsonResponse) {
    throw new Error('Failed to parse the server response. Please try again later.')
  }

  if (trimmedText.length === 0) {
    throw new Error('Received empty response from the server.')
  }

  throw new Error('Unexpected response format received from the server.')
}

// Production API implementation using server-side endpoint
class NanoBananaAPIClient implements NanoBananaAPI {
  async generateImage(prompt: string, options?: NanoBananaGenerateOptions): Promise<NanoBananaAPIResponse> {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, usePro: options?.usePro ?? false })
      })

      return await parseNanoBananaResponse<NanoBananaAPIResponse>(response)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while generating the image')
    }
  }

  async editImage(request: NanoBananaImageEditRequest): Promise<NanoBananaAPIResponse> {
    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      return await parseNanoBananaResponse<NanoBananaAPIResponse>(response)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while editing the image')
    }
  }

  async transfuseImages(request: NanoBananaImageTransfusionRequest): Promise<NanoBananaAPIResponse> {
    try {
      const response = await fetch('/api/transfuse-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      return await parseNanoBananaResponse<NanoBananaAPIResponse>(response)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while transfusing the images')
    }
  }

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      return await parseNanoBananaResponse<VideoGenerationResponse>(response)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error('An unexpected error occurred while generating the video')
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

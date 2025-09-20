export interface GeneratedImage {
  id: string
  prompt: string
  imageUrl: string
  timestamp: Date
  userId: string
  metadata?: ImageMetadata
}

export interface ImageMetadata {
  model: string
  dimensions: {
    width: number
    height: number
  }
  generatedAt: Date
}

export interface ImageGenerationState {
  prompt: string
  generatedImage: string | null
  isLoading: boolean
  error: string | null
  history: GeneratedImage[]
}

export interface NanoBananaAPIResponse {
  imageUrl: string
  id: string
  metadata: ImageMetadata
}

export interface NanoBananaAPI {
  generateImage(prompt: string): Promise<NanoBananaAPIResponse>
}

export interface PromptSuggestionResponse {
  prompt: string
  source: 'gemini' | 'fallback'
  warning?: string
}

export interface UseImageGenerationReturn {
  prompt: string
  setPrompt: (prompt: string) => void
  generatedImage: string | null
  isLoading: boolean
  error: string | null
  generateImage: () => Promise<void>
  clearError: () => void
  reset: () => void
}

export interface ImageStorageService {
  saveGeneratedImage: (image: GeneratedImage) => Promise<void>
  getUserImages: (userId: string) => Promise<GeneratedImage[]>
  deleteImage: (imageId: string) => Promise<void>
}
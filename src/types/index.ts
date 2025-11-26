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
  prompt?: string
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

export interface VideoMetadata {
  model: string
  durationSeconds: number
  aspectRatio: '16:9' | '9:16'
  resolution: '720p' | '1080p'
  generatedAt: Date
  prompt: string
}

export interface VideoGenerationRequest {
  prompt: string
  aspectRatio: '16:9' | '9:16'
  durationSeconds: 4 | 6 | 8
  resolution?: '720p' | '1080p'
  negativePrompt?: string
  personGeneration?: boolean
  model?: string
  referenceImageDataUrl?: string
}

export interface VideoGenerationResponse {
  videoUrl: string
  id: string
  metadata: VideoMetadata
}

export interface NanoBananaImageEditRequest {
  imageDataUrl: string
  instruction: string
}

export interface NanoBananaImageTransfusionRequest {
  baseImageDataUrl: string
  referenceImageDataUrl: string
  instruction: string
}

export interface NanoBananaGenerateOptions {
  usePro?: boolean  // Use Nano Banana Pro (gemini-3-pro-image-preview) for higher quality
}

export interface NanoBananaAPI {
  generateImage(prompt: string, options?: NanoBananaGenerateOptions): Promise<NanoBananaAPIResponse>
  editImage(request: NanoBananaImageEditRequest): Promise<NanoBananaAPIResponse>
  transfuseImages(request: NanoBananaImageTransfusionRequest): Promise<NanoBananaAPIResponse>
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>
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
  usePro: boolean
  setUsePro: (usePro: boolean) => void
  generateImage: (promptOverride?: string) => Promise<void>
  clearError: () => void
  reset: () => void
}

export interface UseVideoGenerationReturn {
  prompt: string
  setPrompt: (prompt: string) => void
  aspectRatio: '16:9' | '9:16'
  setAspectRatio: (aspect: '16:9' | '9:16') => void
  durationSeconds: 4 | 6 | 8
  setDurationSeconds: (duration: 4 | 6 | 8) => void
  resolution: '720p' | '1080p'
  setResolution: (resolution: '720p' | '1080p') => void
  negativePrompt: string
  setNegativePrompt: (prompt: string) => void
  allowPeople: boolean
  setAllowPeople: (allow: boolean) => void
  model: string
  setModel: (model: string) => void
  useReferenceImage: boolean
  setUseReferenceImage: (useRef: boolean) => void
  referenceImageDataUrl: string | null
  setReferenceImageDataUrl: (dataUrl: string | null) => void
  setReferenceFromCanvas: () => Promise<string | null>
  isLoading: boolean
  error: string | null
  videoUrl: string | null
  statusMessage: string
  generateVideo: () => Promise<void>
  clearError: () => void
  reset: () => void
}

export interface ImageStorageService {
  saveGeneratedImage: (image: GeneratedImage) => Promise<void>
  getUserImages: (userId: string) => Promise<GeneratedImage[]>
  deleteImage: (imageId: string) => Promise<void>
}

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp?: number
}

export type ChatDataSource = 'general' | 'repo' | 'web'

export interface IssueReportMetadata {
  url?: string
  chatTranscript?: ChatMessage[]
  browser?: string
  additionalContext?: string
}

export interface IssueReportRequest {
  title: string
  description: string
  severity?: 'low' | 'medium' | 'high'
  category?: 'bug' | 'feedback' | 'feature'
  metadata?: IssueReportMetadata
}

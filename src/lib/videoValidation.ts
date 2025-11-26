/**
 * Shared video generation validation logic
 * Used by both API route and tests
 */

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
export const DEFAULT_VIDEO_MODEL = process.env.GEMINI_VIDEO_MODEL || 'veo-3.1-generate-preview'
export const POLL_INTERVAL_MS = 5_000 // Start at 5s, can increase with backoff
export const MAX_POLL_INTERVAL_MS = 15_000
export const DEFAULT_TIMEOUT_MS = process.env.GEMINI_VIDEO_TIMEOUT_MS
  ? Number(process.env.GEMINI_VIDEO_TIMEOUT_MS)
  : 90_000

export const ASPECT_RATIOS = new Set(['16:9', '9:16'])
export const VALID_DURATIONS = new Set([4, 6, 8])
export const VALID_RESOLUTIONS = new Set(['720p', '1080p'])
// Model IDs per official Gemini docs: https://ai.google.dev/gemini-api/docs/video#model-versions
export const ALLOWED_MODELS = new Set([
  'veo-3.1-generate-preview',      // Veo 3.1 (Preview)
  'veo-3.1-fast-generate-preview', // Veo 3.1 Fast (Preview)
  'veo-3.0-generate-001',          // Veo 3 (Stable)
  'veo-3.0-fast-generate-001',     // Veo 3 Fast (Stable)
  'veo-2.0-generate-001',          // Veo 2 (Stable)
])

// Ensure DEFAULT_VIDEO_MODEL is always allowed
ALLOWED_MODELS.add(DEFAULT_VIDEO_MODEL)

export const PROMPT_MIN_LENGTH = 3
export const PROMPT_MAX_LENGTH = 1200
export const NEGATIVE_PROMPT_MAX_LENGTH = 300

// Rate limiting config
export const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute

export interface ValidatedVideoPayload {
  prompt: string
  aspectRatio: '16:9' | '9:16'
  durationSeconds: 4 | 6 | 8
  resolution: '720p' | '1080p'
  negativePrompt: string
  personGeneration: boolean
  model: string
  referenceImageDataUrl: string
}

export interface VideoValidationError {
  error: string
}

export type VideoValidationResult = ValidatedVideoPayload | VideoValidationError

export function validateVideoPayload(body: unknown): VideoValidationResult {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body must be a JSON object.' }
  }

  const payload = body as Record<string, unknown>

  const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : ''
  const aspectRatio = payload.aspectRatio as string
  const durationSeconds = Number(payload.durationSeconds)
  const resolution = (typeof payload.resolution === 'string' ? payload.resolution : '720p') as string
  const negativePrompt = typeof payload.negativePrompt === 'string' ? payload.negativePrompt.trim() : ''
  const personGeneration = Boolean(payload.personGeneration)
  const model = typeof payload.model === 'string' ? payload.model.trim() : DEFAULT_VIDEO_MODEL
  const referenceImageDataUrl = typeof payload.referenceImageDataUrl === 'string' ? payload.referenceImageDataUrl.trim() : ''

  if (!prompt) {
    return { error: 'Prompt is required and must be a string.' }
  }

  if (prompt.length < PROMPT_MIN_LENGTH || prompt.length > PROMPT_MAX_LENGTH) {
    return { error: `Prompt must be between ${PROMPT_MIN_LENGTH} and ${PROMPT_MAX_LENGTH} characters.` }
  }

  if (!ASPECT_RATIOS.has(aspectRatio)) {
    return { error: 'aspectRatio must be "16:9" or "9:16".' }
  }

  if (!VALID_DURATIONS.has(durationSeconds)) {
    return { error: 'durationSeconds must be 4, 6, or 8.' }
  }

  if (!VALID_RESOLUTIONS.has(resolution)) {
    return { error: 'resolution must be "720p" or "1080p".' }
  }

  if (resolution === '1080p' && (aspectRatio !== '16:9' || durationSeconds !== 8)) {
    return { error: '1080p is only available for 16:9 videos with 8 second duration.' }
  }

  if (negativePrompt.length > NEGATIVE_PROMPT_MAX_LENGTH) {
    return { error: `negativePrompt must be less than ${NEGATIVE_PROMPT_MAX_LENGTH} characters.` }
  }

  if (model && !ALLOWED_MODELS.has(model)) {
    return { error: `Unsupported video model. Allowed: ${Array.from(ALLOWED_MODELS).join(', ')}` }
  }

  if (referenceImageDataUrl) {
    const dataUrlRegex = /^data:([^;]+);base64,(.+)$/
    const match = referenceImageDataUrl.match(dataUrlRegex)
    if (!match) {
      return { error: 'referenceImageDataUrl must be a base64 data URL.' }
    }
    if (!match[1].startsWith('image/')) {
      return { error: 'referenceImageDataUrl must be an image.' }
    }

    if (aspectRatio !== '16:9') {
      return { error: 'Reference images require aspectRatio 16:9.' }
    }
    if (durationSeconds !== 8) {
      return { error: 'Reference images require durationSeconds = 8.' }
    }
  }

  return {
    prompt,
    aspectRatio: aspectRatio as '16:9' | '9:16',
    durationSeconds: durationSeconds as 4 | 6 | 8,
    resolution: resolution as '720p' | '1080p',
    negativePrompt,
    personGeneration,
    model,
    referenceImageDataUrl,
  }
}

export function isValidationError(result: VideoValidationResult): result is VideoValidationError {
  return 'error' in result
}

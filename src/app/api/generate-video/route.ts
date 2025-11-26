import { NextRequest, NextResponse } from 'next/server'
import {
  validateVideoPayload,
  isValidationError,
  GEMINI_API_BASE,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_VIDEO_MODEL,
  POLL_INTERVAL_MS,
  MAX_POLL_INTERVAL_MS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  ValidatedVideoPayload,
} from '@/lib/videoValidation'


// Types for Gemini API responses (REST format from official docs)
interface GeminiOperationResponse {
  name?: string
  done?: boolean
  error?: { message?: string; code?: number }
  response?: {
    // REST API format uses generateVideoResponse
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: VideoResource
      }>
    }
    // SDK format uses generatedVideos
    generatedVideos?: Array<{
      video?: VideoResource | string
    }>
    generated_videos?: Array<{
      video?: VideoResource | string
    }>
  }
}

interface VideoResource {
  uri?: string
  downloadUri?: string
  download_uri?: string
  name?: string
}

interface GeminiErrorResponse {
  error?: {
    message?: string
    code?: number
  }
}

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimiter = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const clientData = rateLimiter.get(clientId)

  if (!clientData || now > clientData.resetTime) {
    rateLimiter.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  clientData.count++
  return true
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeOperationName(name: string) {
  // Operation names from Gemini already have the full path like:
  // "models/veo-3.1-generate-preview/operations/gasj8tz6313x"
  // Just return as-is, no prefix needed
  return name
}

async function fetchJson<T>(url: string, init: RequestInit, signal?: AbortSignal): Promise<T> {
  console.log('[Video API] Fetching:', url, 'method:', init.method)

  const response = await fetch(url, { ...init, signal })
  const text = await response.text()

  console.log('[Video API] Response status:', response.status, 'body length:', text.length)
  console.log('[Video API] Response headers:', Object.fromEntries(response.headers.entries()))

  let data: T | GeminiErrorResponse
  try {
    data = text ? JSON.parse(text) : {}
  } catch (err) {
    console.error('[Video API] Failed to parse response:', text.slice(0, 500))
    throw new Error('Unexpected response from Gemini.')
  }

  if (!response.ok) {
    console.error('[Video API] Error response body:', text.slice(0, 1000))
    const errorData = data as GeminiErrorResponse
    const errorMessage =
      typeof errorData?.error?.message === 'string'
        ? errorData.error.message
        : text || `Request failed with status ${response.status}`
    const error = new Error(errorMessage) as Error & { status: number }
    error.status = response.status
    throw error
  }

  console.log('[Video API] Success response:', JSON.stringify(data).slice(0, 200))
  return data as T
}

async function startVideoOperation(
  apiKey: string,
  validated: ValidatedVideoPayload,
  model: string,
  signal?: AbortSignal
): Promise<GeminiOperationResponse> {
  // Build REST API payload format per official Gemini docs
  // https://ai.google.dev/gemini-api/docs/video
  const instance: Record<string, unknown> = {
    prompt: validated.prompt,
  }

  // Add reference image if provided (as starting frame)
  if (validated.referenceImageDataUrl) {
    const dataUrlRegex = /^data:([^;]+);base64,(.+)$/
    const match = validated.referenceImageDataUrl.match(dataUrlRegex)
    if (match) {
      const [, mimeType, data] = match
      instance.image = {
        bytesBase64Encoded: data,
        mimeType,
      }
    }
  }

  const parameters: Record<string, unknown> = {
    aspectRatio: validated.aspectRatio,
    durationSeconds: validated.durationSeconds,
  }

  // Add resolution if specified (only for certain models)
  if (validated.resolution) {
    parameters.resolution = validated.resolution
  }

  // Add negative prompt if specified
  if (validated.negativePrompt) {
    parameters.negativePrompt = validated.negativePrompt
  }

  // Add person generation setting
  if (validated.personGeneration) {
    parameters.personGeneration = 'allow_all'
  }

  const restPayload = {
    instances: [instance],
    parameters,
  }

  // Use predictLongRunning endpoint per official docs
  // Use x-goog-api-key header as shown in official curl examples
  const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:predictLongRunning`

  console.log('[Video API] Starting video generation with model:', model)
  console.log('[Video API] Request URL:', url)
  console.log('[Video API] Payload:', JSON.stringify({ ...restPayload, instances: restPayload.instances.map(i => ({ ...i, image: i.image ? '[IMAGE_DATA]' : undefined })) }))

  return await fetchJson<GeminiOperationResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(restPayload),
  }, signal)
}

async function pollOperation(
  apiKey: string,
  name: string,
  signal?: AbortSignal
): Promise<GeminiOperationResponse> {
  const url = `${GEMINI_API_BASE}/${normalizeOperationName(name)}`
  return fetchJson<GeminiOperationResponse>(url, {
    method: 'GET',
    headers: {
      'x-goog-api-key': apiKey,
    },
  }, signal)
}

function extractVideoUri(operationResult: GeminiOperationResponse): string | null {
  const response = operationResult?.response

  // Try REST API format first (generateVideoResponse.generatedSamples)
  const generatedSamples = response?.generateVideoResponse?.generatedSamples
  if (Array.isArray(generatedSamples) && generatedSamples.length > 0) {
    const video = generatedSamples[0]?.video
    if (video) {
      return video.uri || video.downloadUri || video.download_uri || video.name || null
    }
  }

  // Fall back to SDK format (generatedVideos)
  const generatedVideos = response?.generatedVideos || response?.generated_videos
  const first = Array.isArray(generatedVideos) ? generatedVideos[0] : null
  if (!first) {
    return null
  }

  const videoResource = first.video
  if (typeof videoResource === 'string') {
    return videoResource
  }

  if (!videoResource) {
    return null
  }

  const uri =
    videoResource.uri ||
    videoResource.downloadUri ||
    videoResource.download_uri ||
    videoResource.name ||
    null

  return uri
}

export async function POST(request: NextRequest) {
  // Create abort controller for potential cancellation
  const abortController = new AbortController()

  // Clean up if client disconnects
  request.signal.addEventListener('abort', () => {
    abortController.abort()
  })

  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured on server' },
        { status: 500 }
      )
    }

    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later (max 10 requests per minute).' },
        { status: 429 }
      )
    }

    // Validate content type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      )
    }

    // Check content length (max 20MB for reference images)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Request size exceeds maximum allowed (20MB)' },
        { status: 413 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 })
    }

    const validated = validateVideoPayload(body)
    if (isValidationError(validated)) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }

    const start = await startVideoOperation(
      apiKey,
      validated,
      validated.model || DEFAULT_VIDEO_MODEL,
      abortController.signal
    )

    const operationName = start?.name

    if (!operationName) {
      console.error('Missing operation name from Gemini video generation', start)
      return NextResponse.json(
        { error: 'Failed to start video generation operation.' },
        { status: 500 }
      )
    }

    const startTime = Date.now()
    let current = start
    let pollInterval = POLL_INTERVAL_MS

    while (!current.done) {
      if (Date.now() - startTime > DEFAULT_TIMEOUT_MS) {
        return NextResponse.json(
          { error: 'Video generation timed out. Please try again with shorter duration or 720p resolution.' },
          { status: 408 }
        )
      }

      // Check if request was aborted
      if (abortController.signal.aborted) {
        return NextResponse.json(
          { error: 'Request was cancelled.' },
          { status: 499 }
        )
      }

      await sleep(pollInterval)

      // Exponential backoff for polling, capped at MAX_POLL_INTERVAL_MS
      pollInterval = Math.min(Math.round(pollInterval * 1.2), MAX_POLL_INTERVAL_MS)

      current = await pollOperation(apiKey, operationName, abortController.signal)

      // Check for operation error
      if (current.error) {
        const errorMessage = current.error.message || 'Video generation failed.'
        console.error('Gemini operation error:', current.error)
        return NextResponse.json(
          { error: errorMessage },
          { status: current.error.code || 500 }
        )
      }
    }

    const videoUri = extractVideoUri(current)

    if (!videoUri) {
      console.error('No video URI found in Gemini response', { current })
      return NextResponse.json(
        { error: 'No video was generated in the response. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      videoUrl: videoUri,
      id: crypto.randomUUID(),
      metadata: {
        model: validated.model || DEFAULT_VIDEO_MODEL,
        durationSeconds: validated.durationSeconds,
        aspectRatio: validated.aspectRatio,
        resolution: validated.resolution,
        generatedAt: new Date().toISOString(),
        prompt: validated.prompt,
      },
    })
  } catch (error) {
    console.error('Gemini video generation error:', error)

    // Handle abort
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request was cancelled.' },
        { status: 499 }
      )
    }

    let status = 500
    let message = 'Failed to generate video.'

    if (error instanceof Error && 'status' in error && typeof (error as Error & { status: number }).status === 'number') {
      status = (error as Error & { status: number }).status
    }

    if (error instanceof Error) {
      const lower = error.message.toLowerCase()
      if (lower.includes('safety') || lower.includes('block')) {
        status = 400
        message = 'Content blocked by safety filters. Please adjust your prompt.'
      } else if (lower.includes('quota') || lower.includes('limit')) {
        status = 429
        message = 'API quota exceeded. Please try again later.'
      } else if (lower.includes('auth') || lower.includes('key')) {
        status = 401
        message = 'Invalid API key for Gemini video generation.'
      } else if (lower.includes('timeout')) {
        status = 408
        message = 'Video generation timed out. Try a shorter clip (4-6s) or 720p.'
      } else {
        message = error.message || message
      }
    }

    return NextResponse.json({ error: message }, { status })
  }
}

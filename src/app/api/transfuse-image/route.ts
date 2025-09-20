import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ImageTransfusionRequestBody {
  baseImageDataUrl?: string
  referenceImageDataUrl?: string
  instruction?: string
}

// Constants for validation and security
const DATA_URL_REGEX = /^data:([^;]+);base64,(.+)$/
const MAX_REQUEST_SIZE = 20 * 1024 * 1024 // 20MB total request size
const MIN_INSTRUCTION_LENGTH = 3
const MAX_INSTRUCTION_LENGTH = 600
const GEMINI_REQUEST_TIMEOUT = 30000 // 30 seconds
const DIMENSION_SIZE = 1024

// Simple in-memory rate limiting (for production, use Redis or similar)
const rateLimiter = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute

// Input sanitization function
function sanitizeInstruction(instruction: string): string {
  // Remove potentially dangerous characters and normalize whitespace
  return instruction
    .replace(/[<>"'&\x00-\x1f\x7f-\x9f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Base64 validation function
function isValidBase64(base64String: string): boolean {
  try {
    // Check if it's a valid base64 string
    const decoded = atob(base64String)
    // Re-encode and compare to check for corruption
    return btoa(decoded) === base64String
  } catch (error) {
    return false
  }
}

// Image data validation function
function validateImageData(dataUrl: string): { valid: boolean; error?: string } {
  const match = dataUrl.match(DATA_URL_REGEX)
  if (!match) {
    return { valid: false, error: 'Invalid data URL format' }
  }

  const [, mimeType, base64Data] = match

  // Check MIME type
  if (!mimeType.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' }
  }

  // Validate base64 data
  if (!isValidBase64(base64Data)) {
    return { valid: false, error: 'Invalid or corrupted image data' }
  }

  // Check base64 length (rough size check)
  const sizeBytes = (base64Data.length * 3) / 4
  if (sizeBytes > 10 * 1024 * 1024) { // 10MB per image
    return { valid: false, error: 'Image file too large (max 10MB)' }
  }

  return { valid: true }
}

// Rate limiting check
function checkRateLimit(clientId: string): boolean {
  const now = Date.now()
  const clientData = rateLimiter.get(clientId)

  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize rate limit data
    rateLimiter.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  clientData.count++
  return true
}

// Timeout wrapper for Gemini API calls
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    })
  ])
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get client identifier for rate limiting
    const clientId = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Check rate limit
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
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

    // Check request size before parsing
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request size exceeds maximum allowed (20MB)' },
        { status: 413 }
      )
    }

    // Parse JSON with better error handling
    let body: ImageTransfusionRequestBody
    try {
      body = (await request.json()) as ImageTransfusionRequestBody
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body. Please check your request format.' },
        { status: 400 }
      )
    }

    // Additional request size check after parsing
    const requestSize = JSON.stringify(body).length
    if (requestSize > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request payload exceeds maximum allowed size' },
        { status: 413 }
      )
    }

    const baseImageDataUrl = body.baseImageDataUrl?.trim() ?? ''
    const referenceImageDataUrl = body.referenceImageDataUrl?.trim() ?? ''
    const rawInstruction = body.instruction?.trim() ?? ''

    // Sanitize instruction input
    const instruction = sanitizeInstruction(rawInstruction)

    if (!baseImageDataUrl || !referenceImageDataUrl) {
      return NextResponse.json(
        { error: 'baseImageDataUrl and referenceImageDataUrl are required so Nano Banana can blend both photos.' },
        { status: 400 }
      )
    }

    if (!instruction) {
      return NextResponse.json(
        { error: 'Provide instructions describing how the photos should be blended.' },
        { status: 400 }
      )
    }

    if (instruction.length < MIN_INSTRUCTION_LENGTH) {
      return NextResponse.json(
        { error: 'Please provide at least a short sentence describing the desired transfusion.' },
        { status: 400 }
      )
    }

    if (instruction.length > MAX_INSTRUCTION_LENGTH) {
      return NextResponse.json(
        { error: 'Transfusion instructions must be less than 600 characters.' },
        { status: 400 }
      )
    }

    // Validate base image data
    const baseValidation = validateImageData(baseImageDataUrl)
    if (!baseValidation.valid) {
      return NextResponse.json(
        { error: `Base image error: ${baseValidation.error}` },
        { status: 400 }
      )
    }

    // Validate reference image data
    const referenceValidation = validateImageData(referenceImageDataUrl)
    if (!referenceValidation.valid) {
      return NextResponse.json(
        { error: `Reference image error: ${referenceValidation.error}` },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured on server' },
        { status: 500 }
      )
    }

    // Extract data from validated URLs (safe to use ! since we've already validated)
    const baseMatch = baseImageDataUrl.match(DATA_URL_REGEX)!
    const referenceMatch = referenceImageDataUrl.match(DATA_URL_REGEX)!
    const [, baseMimeType, baseData] = baseMatch
    const [, referenceMimeType, referenceData] = referenceMatch

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image-preview'
    })

    const result = await withTimeout(
      model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: baseData,
                  mimeType: baseMimeType,
                }
              },
              {
                inlineData: {
                  data: referenceData,
                  mimeType: referenceMimeType,
                }
              },
              {
                text: `Blend details from the reference photo into the base photo. ${instruction} Return only the updated base photo.`
              }
            ]
          }
        ]
      }),
      GEMINI_REQUEST_TIMEOUT
    )

    const response = result.response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      part => (part as { inlineData?: unknown }).inlineData
    ) as { inlineData?: { data?: string; mimeType?: string } } | undefined

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json(
        { error: 'No transfused image was returned from Gemini.' },
        { status: 500 }
      )
    }

    const transfusedImageData = imagePart.inlineData.data
    const transfusedMimeType = imagePart.inlineData.mimeType ?? 'image/png'
    const imageUrl = `data:${transfusedMimeType};base64,${transfusedImageData}`

    return NextResponse.json({
      imageUrl,
      id: crypto.randomUUID(),
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        dimensions: {
          width: DIMENSION_SIZE,
          height: DIMENSION_SIZE
        },
        generatedAt: new Date(),
        prompt: instruction,
      }
    })
  } catch (error) {
    console.error('Gemini image transfusion error:', error)

    let errorMessage = 'An unexpected error occurred while blending the images'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'API quota exceeded. Please try again later.'
        statusCode = 429
      } else if (error.message.includes('invalid') || error.message.includes('authentication')) {
        errorMessage = 'Invalid API key. Please check your Gemini API configuration.'
        statusCode = 401
      } else if (error.message.includes('safety') || error.message.includes('content')) {
        errorMessage = 'Content policy violation. Please adjust the instruction and try again.'
        statusCode = 400
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again with smaller images or a shorter instruction.'
        statusCode = 408
      } else if (error.message.includes('Base64 decoding failed')) {
        errorMessage = 'Invalid image data detected. Please try uploading your photos again.'
        statusCode = 400
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Network error occurred. Please check your connection and try again.'
        statusCode = 502
      } else if (error.message.includes('file size') || error.message.includes('too large')) {
        errorMessage = 'Image files are too large. Please use smaller images (under 10MB each).'
        statusCode = 413
      } else if (error.message.includes('unsupported') || error.message.includes('format')) {
        errorMessage = 'Unsupported image format. Please use JPG, PNG, or WebP images.'
        statusCode = 400
      } else {
        errorMessage = `Failed to transfuse images: ${error.message}`
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

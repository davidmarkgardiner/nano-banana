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

    // Check request size before parsing
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: 'Request size exceeds maximum allowed (20MB)' },
        { status: 413 }
      )
    }

    const body = (await request.json()) as ImageTransfusionRequestBody

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

    const baseMatch = baseImageDataUrl.match(DATA_URL_REGEX)
    const referenceMatch = referenceImageDataUrl.match(DATA_URL_REGEX)

    if (!baseMatch || !referenceMatch) {
      return NextResponse.json(
        { error: 'Images must be provided as base64 encoded data URLs.' },
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

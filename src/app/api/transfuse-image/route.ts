import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface ImageTransfusionRequestBody {
  baseImageDataUrl?: string
  referenceImageDataUrl?: string
  instruction?: string
}

const DATA_URL_REGEX = /^data:([^;]+);base64,(.+)$/

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ImageTransfusionRequestBody
    const baseImageDataUrl = body.baseImageDataUrl?.trim() ?? ''
    const referenceImageDataUrl = body.referenceImageDataUrl?.trim() ?? ''
    const instruction = body.instruction?.trim() ?? ''

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

    if (instruction.length < 3) {
      return NextResponse.json(
        { error: 'Please provide at least a short sentence describing the desired transfusion.' },
        { status: 400 }
      )
    }

    if (instruction.length > 600) {
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

    const result = await model.generateContent({
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
    })

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
      id: Math.random().toString(36).substring(7),
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        dimensions: {
          width: 1024,
          height: 1024
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

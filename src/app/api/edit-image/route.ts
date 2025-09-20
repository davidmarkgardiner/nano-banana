import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

interface EditImageRequestBody {
  imageDataUrl?: string
  instruction?: string
}

const DATA_URL_REGEX = /^data:([^;]+);base64,(.+)$/

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as EditImageRequestBody
    const instruction = body.instruction?.trim() ?? ''
    const imageDataUrl = body.imageDataUrl?.trim() ?? ''

    if (!imageDataUrl) {
      return NextResponse.json(
        { error: 'imageDataUrl is required so Nano Banana can edit the current canvas.' },
        { status: 400 }
      )
    }

    const dataUrlMatch = imageDataUrl.match(DATA_URL_REGEX)

    if (!dataUrlMatch) {
      return NextResponse.json(
        { error: 'imageDataUrl must be a base64 encoded data URL.' },
        { status: 400 }
      )
    }

    if (!instruction) {
      return NextResponse.json(
        { error: 'Provide editing instructions so Nano Banana knows what to change.' },
        { status: 400 }
      )
    }

    if (instruction.length < 3) {
      return NextResponse.json(
        { error: 'Editing instructions must be at least 3 characters long.' },
        { status: 400 }
      )
    }

    if (instruction.length > 500) {
      return NextResponse.json(
        { error: 'Editing instructions must be less than 500 characters.' },
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

    const [, mimeType, base64Data] = dataUrlMatch

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
                data: base64Data,
                mimeType,
              }
            },
            {
              text: `Apply these changes to the provided image: ${instruction}. Return only the edited image.`
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
        { error: 'No edited image was returned from Gemini.' },
        { status: 500 }
      )
    }

    const editedImageData = imagePart.inlineData.data
    const editedMimeType = imagePart.inlineData.mimeType ?? 'image/png'
    const imageUrl = `data:${editedMimeType};base64,${editedImageData}`

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
    console.error('Gemini image edit error:', error)

    let errorMessage = 'An unexpected error occurred while editing the image'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'API quota exceeded. Please try again later.'
        statusCode = 429
      } else if (error.message.includes('invalid') || error.message.includes('authentication')) {
        errorMessage = 'Invalid API key. Please check your Gemini API configuration.'
        statusCode = 401
      } else if (error.message.includes('safety') || error.message.includes('content')) {
        errorMessage = 'Content policy violation. Please try a different instruction.'
        statusCode = 400
      } else {
        errorMessage = `Failed to edit image: ${error.message}`
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

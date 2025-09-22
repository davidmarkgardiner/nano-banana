import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      )
    }

    if (prompt.trim().length < 3) {
      return NextResponse.json(
        { error: 'Prompt must be at least 3 characters long' },
        { status: 400 }
      )
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: 'Prompt must be less than 500 characters' },
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

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image-preview'
    })

    // Generate the image with the provided prompt
    const result = await model.generateContent(prompt)
    const response = result.response

    // Find the image part in the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      part => part.inlineData && part.inlineData.mimeType?.startsWith('image/')
    )

    if (!imagePart || !imagePart.inlineData) {
      // Log detailed response for debugging
      console.error('No image found in Gemini response:', {
        candidates: response.candidates?.length || 0,
        firstCandidate: response.candidates?.[0] ? {
          finishReason: response.candidates[0].finishReason,
          safetyRatings: response.candidates[0].safetyRatings,
          contentParts: response.candidates[0].content?.parts?.length || 0,
          partTypes: response.candidates[0].content?.parts?.map(p =>
            p.inlineData ? `inline:${p.inlineData.mimeType}` : 'text'
          )
        } : null,
        promptLength: prompt.length,
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '')
      })

      // Check if content was blocked by safety filters
      const firstCandidate = response.candidates?.[0]
      if (firstCandidate?.finishReason === 'SAFETY') {
        return NextResponse.json(
          { error: 'Content blocked by safety filters. Please try a different prompt.' },
          { status: 400 }
        )
      }

      if (firstCandidate?.finishReason === 'RECITATION') {
        return NextResponse.json(
          { error: 'Content may violate copyright. Please try a different prompt.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'No image was generated in the response. This may be due to content policies or temporary API issues.' },
        { status: 500 }
      )
    }

    // Convert base64 to data URL
    const imageData = imagePart.inlineData.data
    const mimeType = imagePart.inlineData.mimeType || 'image/png'
    const imageUrl = `data:${mimeType};base64,${imageData}`

    const imageId = Math.random().toString(36).substring(7)

    return NextResponse.json({
      imageUrl,
      id: imageId,
      metadata: {
        model: 'gemini-2.5-flash-image-preview',
        dimensions: {
          width: 1024,
          height: 1024
        },
        generatedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Gemini API Error:', error)

    let errorMessage = 'An unexpected error occurred while generating the image'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'API quota exceeded. Please try again later.'
        statusCode = 429
      } else if (error.message.includes('invalid') || error.message.includes('authentication')) {
        errorMessage = 'Invalid API key. Please check your Gemini API configuration.'
        statusCode = 401
      } else if (error.message.includes('safety') || error.message.includes('content')) {
        errorMessage = 'Content policy violation. Please try a different prompt.'
        statusCode = 400
      } else {
        errorMessage = `Failed to generate image: ${error.message}`
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
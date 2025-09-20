import { NextRequest, NextResponse } from 'next/server'

interface NanoBananaImageRequest {
  imageUrl?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as NanoBananaImageRequest
    const imageUrl = body.imageUrl?.trim()

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 })
    }

    // Handle data URLs (base64 encoded images)
    if (imageUrl.startsWith('data:')) {
      const dataUrlRegex = /^data:([^;]+);base64,(.+)$/
      const match = imageUrl.match(dataUrlRegex)

      if (!match) {
        return NextResponse.json({ error: 'Invalid data URL format' }, { status: 400 })
      }

      const [, contentType, base64Data] = match
      return NextResponse.json({ contentType, data: base64Data })
    }

    // Handle HTTP/HTTPS URLs
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'imageUrl must be a data URL or absolute HTTP/HTTPS URL' }, { status: 400 })
    }

    const response = await fetch(imageUrl)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') ?? 'application/octet-stream'
    const arrayBuffer = await response.arrayBuffer()
    const data = Buffer.from(arrayBuffer).toString('base64')

    return NextResponse.json({ contentType, data })
  } catch (error) {
    console.error('Error retrieving Nano Banana image:', error)
    return NextResponse.json({ error: 'Failed to retrieve Nano Banana image' }, { status: 500 })
  }
}

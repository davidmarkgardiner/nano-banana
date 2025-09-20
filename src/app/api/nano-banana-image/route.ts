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

    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'imageUrl must be an absolute URL' }, { status: 400 })
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

'use client'

/**
 * Convert any accessible image URL into a base64 data URL so it can be sent to APIs
 * that require inline image data. Data URLs are returned unchanged.
 */
export async function convertImageUrlToDataUrl(imageUrl: string): Promise<string> {
  if (!imageUrl) {
    throw new Error('No image available to convert.')
  }

  if (imageUrl.startsWith('data:')) {
    return imageUrl
  }

  const response = await fetch(imageUrl)

  if (!response.ok) {
    throw new Error('Failed to download the image for processing.')
  }

  const blob = await response.blob()

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Unsupported image format encountered during conversion.'))
    }
    reader.onerror = () => {
      reject(new Error('Unable to read the image data for conversion.'))
    }
    reader.readAsDataURL(blob)
  })
}

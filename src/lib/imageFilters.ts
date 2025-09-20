'use client'

export type ImageFilter = 'none' | 'grayscale' | 'sepia' | 'invert'

export const applyFilterToImageDataUrl = async (
  sourceDataUrl: string,
  filter: ImageFilter
): Promise<string> =>
  new Promise((resolve, reject) => {
    if (filter === 'none') {
      // Return original image without any processing to preserve quality
      resolve(sourceDataUrl)
      return
    }

    const imageElement = document.createElement('img')
    imageElement.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = imageElement.width
      canvas.height = imageElement.height

      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Unable to process image: Canvas not supported.'))
        return
      }

      context.drawImage(imageElement, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const { data } = imageData

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index]
        const green = data[index + 1]
        const blue = data[index + 2]

        if (filter === 'grayscale') {
          const average = 0.299 * red + 0.587 * green + 0.114 * blue
          data[index] = average
          data[index + 1] = average
          data[index + 2] = average
          continue
        }

        if (filter === 'sepia') {
          data[index] = Math.min(0.393 * red + 0.769 * green + 0.189 * blue, 255)
          data[index + 1] = Math.min(0.349 * red + 0.686 * green + 0.168 * blue, 255)
          data[index + 2] = Math.min(0.272 * red + 0.534 * green + 0.131 * blue, 255)
          continue
        }

        if (filter === 'invert') {
          data[index] = 255 - red
          data[index + 1] = 255 - green
          data[index + 2] = 255 - blue
        }
      }

      context.putImageData(imageData, 0, 0)

      // Detect original format from data URL and use appropriate output format
      const isOriginalJpeg = sourceDataUrl.startsWith('data:image/jpeg')
      const isOriginalPng = sourceDataUrl.startsWith('data:image/png')

      if (isOriginalJpeg) {
        // Use high-quality JPEG (95% quality) for JPEG sources
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      } else if (isOriginalPng) {
        // Use PNG for PNG sources to preserve transparency
        resolve(canvas.toDataURL('image/png'))
      } else {
        // Default to high-quality JPEG for other formats
        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
    }

    imageElement.onerror = () => {
      reject(new Error('Failed to load the selected image for processing.'))
    }

    imageElement.src = sourceDataUrl
  })

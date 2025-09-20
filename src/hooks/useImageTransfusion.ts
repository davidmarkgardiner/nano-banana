'use client'

import { useCallback, useState } from 'react'
import nanoBananaAPI from '@/lib/nanoBananaAPI'
import { useCanvasImage } from '@/context/CanvasImageContext'
import { NanoBananaAPIResponse, NanoBananaImageTransfusionRequest } from '@/types'

interface UseImageTransfusionReturn {
  isTransfusing: boolean
  error: string | null
  lastInstruction: string | null
  transfuse: (request: NanoBananaImageTransfusionRequest) => Promise<NanoBananaAPIResponse | null>
  clearError: () => void
}

export function useImageTransfusion(): UseImageTransfusionReturn {
  const { showGeneratedImage } = useCanvasImage()
  const [isTransfusing, setIsTransfusing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastInstruction, setLastInstruction] = useState<string | null>(null)

  const transfuse = useCallback(
    async (request: NanoBananaImageTransfusionRequest): Promise<NanoBananaAPIResponse | null> => {
      const trimmedInstruction = request.instruction.trim()

      if (!request.baseImageDataUrl || !request.referenceImageDataUrl) {
        setError('Select both photos before sending them to Nano Banana.')
        return null
      }

      if (!trimmedInstruction) {
        setError('Describe how Nano Banana should merge the photos.')
        return null
      }

      if (trimmedInstruction.length < 3) {
        setError('Please provide at least a short sentence describing the desired transfusion.')
        return null
      }

      try {
        setIsTransfusing(true)
        setError(null)

        const response = await nanoBananaAPI.transfuseImages({
          ...request,
          instruction: trimmedInstruction,
        })

        showGeneratedImage(response.imageUrl, trimmedInstruction)
        setLastInstruction(trimmedInstruction)

        return response
      } catch (transfusionError) {
        console.error('Failed to transfuse images with Nano Banana:', transfusionError)
        setError(
          transfusionError instanceof Error
            ? transfusionError.message
            : 'Failed to blend the images. Please try again.'
        )
        return null
      } finally {
        setIsTransfusing(false)
      }
    },
    [showGeneratedImage]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isTransfusing,
    error,
    lastInstruction,
    transfuse,
    clearError,
  }
}

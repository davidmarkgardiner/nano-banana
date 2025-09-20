'use client'

import { useCallback, useEffect, useState } from 'react'
import nanoBananaAPI from '@/lib/nanoBananaAPI'
import { useCanvasImage } from '@/context/CanvasImageContext'
import { convertImageUrlToDataUrl } from '@/lib/imageData'
import { NanoBananaAPIResponse } from '@/types'

interface UseImageRemixReturn {
  instruction: string
  setInstruction: (value: string) => void
  isRemixing: boolean
  error: string | null
  lastInstruction: string | null
  remixImage: (instructionOverride?: string) => Promise<NanoBananaAPIResponse | null>
  clearError: () => void
}

export function useImageRemix(): UseImageRemixReturn {
  const { currentImage, showGeneratedImage } = useCanvasImage()
  const [instruction, setInstruction] = useState('')
  const [isRemixing, setIsRemixing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastInstruction, setLastInstruction] = useState<string | null>(null)

  useEffect(() => {
    setInstruction('')
    setError(null)
  }, [currentImage?.id])

  const remixImage = useCallback(
    async (instructionOverride?: string): Promise<NanoBananaAPIResponse | null> => {
      if (!currentImage) {
        setError('Load or generate an image before asking Nano Banana to edit it.')
        return null
      }

      const instructionToUse = (instructionOverride ?? instruction).trim()

      if (!instructionToUse) {
        setError('Describe the changes you want before sending the image to Nano Banana.')
        return null
      }

      if (instructionToUse.length < 3) {
        setError('Please provide at least a few words describing the edit you need.')
        return null
      }

      try {
        setIsRemixing(true)
        setError(null)

        const dataUrl = await convertImageUrlToDataUrl(currentImage.displayUrl)
        const response = await nanoBananaAPI.editImage({
          imageDataUrl: dataUrl,
          instruction: instructionToUse,
        })

        showGeneratedImage(response.imageUrl, instructionToUse)
        setInstruction('')
        setLastInstruction(instructionToUse)

        return response
      } catch (remixError) {
        console.error('Failed to edit image with Nano Banana:', remixError)
        setError(
          remixError instanceof Error
            ? remixError.message
            : 'Failed to edit the image. Please try again.'
        )
        return null
      } finally {
        setIsRemixing(false)
      }
    },
    [currentImage, instruction, showGeneratedImage]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    instruction,
    setInstruction,
    isRemixing,
    error,
    lastInstruction,
    remixImage,
    clearError,
  }
}

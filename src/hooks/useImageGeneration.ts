'use client'

import { useState, useCallback } from 'react'
import { UseImageGenerationReturn } from '@/types'
import nanoBananaAPI from '@/lib/nanoBananaAPI'

export function useImageGeneration(): UseImageGenerationReturn {
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image')
      return
    }

    if (prompt.length < 3) {
      setError('Prompt must be at least 3 characters long')
      return
    }

    if (prompt.length > 500) {
      setError('Prompt must be less than 500 characters')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const response = await nanoBananaAPI.generateImage(prompt)
      setGeneratedImage(response.imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsLoading(false)
    }
  }, [prompt])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setPrompt('')
    setGeneratedImage(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    prompt,
    setPrompt,
    generatedImage,
    isLoading,
    error,
    generateImage,
    clearError,
    reset
  }
}
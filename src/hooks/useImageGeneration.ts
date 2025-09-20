'use client'

import { useState, useCallback } from 'react'
import { UseImageGenerationReturn } from '@/types'
import nanoBananaAPI from '@/lib/nanoBananaAPI'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

const MAX_PROMPT_SLUG_LENGTH = 60

const createPromptSlug = (text: string): string => {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')

  if (!normalized) {
    return 'image'
  }

  const abbreviated = normalized
    .split(' ')
    .filter(Boolean)
    .slice(0, 6)
    .join('-')
    .replace(/-+/g, '-')

  const slug = abbreviated.slice(0, MAX_PROMPT_SLUG_LENGTH).replace(/^-+|-+$/g, '')

  return slug || 'image'
}

const formatTwoDigits = (value: number): string => value.toString().padStart(2, '0')

export function useImageGeneration(): UseImageGenerationReturn {
  const { user } = useAuth()
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

      // Auto-save to Firebase Storage if user is logged in and storage is available
      if (user && response.imageUrl && storage) {
        try {
          console.log('Auto-saving image to Firebase Storage...')

          // Fetch the image data using our API endpoint
          const apiResponse = await fetch('/api/nano-banana-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: response.imageUrl })
          })

          if (apiResponse.ok) {
            const { contentType, data } = await apiResponse.json()

            // Convert base64 to Uint8Array
            const binaryString = atob(data)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }

            if (!storage) {
              console.warn('Firebase Storage not available, skipping auto-save')
              return
            }

            // Create storage path
            const now = new Date()
            const timestamp = now.getTime()
            const promptSlug = createPromptSlug(prompt)
            const dateSegment = `${now.getFullYear()}-${formatTwoDigits(now.getMonth() + 1)}-${formatTwoDigits(now.getDate())}`
            const path = `nano-banana/${user.uid}/${dateSegment}-${promptSlug}-${timestamp}`

            // Upload to Firebase Storage
            const storageRef = ref(storage, path)
            await uploadBytes(storageRef, bytes, { contentType })

            const downloadUrl = await getDownloadURL(storageRef)
            console.log('Image auto-saved to Firebase Storage:', downloadUrl)
          } else {
            console.warn('Failed to fetch image for auto-save:', apiResponse.statusText)
          }
        } catch (saveError) {
          console.error('Auto-save to Firebase Storage failed:', saveError)
          // Don't show error to user for auto-save failures
        }
      } else if (!storage) {
        console.warn('Firebase Storage not initialized. Skipping auto-save.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsLoading(false)
    }
  }, [prompt, user])

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
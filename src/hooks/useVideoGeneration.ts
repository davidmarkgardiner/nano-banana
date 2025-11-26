'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { UseVideoGenerationReturn, VideoGenerationRequest } from '@/types'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { createPromptSlug, formatTwoDigits } from '@/lib/promptSlug'
import { useCanvasImage } from '@/context/CanvasImageContext'
import nanoBananaAPI from '@/lib/nanoBananaAPI'
import { convertImageUrlToDataUrl } from '@/lib/imageData'

const PROMPT_MIN = 3
const PROMPT_MAX = 1200
const NEGATIVE_PROMPT_MAX = 300
const DEFAULT_VIDEO_MODEL = process.env.NEXT_PUBLIC_GEMINI_VIDEO_MODEL || 'veo-3.1-generate-preview'

export function useVideoGeneration(): UseVideoGenerationReturn {
  const { user } = useAuth()
  const { clearImage, currentImage } = useCanvasImage()
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9')
  const [durationSeconds, setDurationSeconds] = useState<4 | 6 | 8>(6)
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [allowPeople, setAllowPeople] = useState(false)
  const [model, setModel] = useState<string>(DEFAULT_VIDEO_MODEL)
  const [useReferenceImage, setUseReferenceImage] = useState(false)
  const [referenceImageDataUrlState, setReferenceImageDataUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('Ready to render your scene')

  // Abort controller for cancellation support
  const abortControllerRef = useRef<AbortController | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const clearError = useCallback(() => setError(null), [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current)
      }
    }
  }, [])

  const reset = useCallback(() => {
    // Cancel any in-progress generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }

    setPrompt('')
    setAspectRatio('16:9')
    setDurationSeconds(6)
    setResolution('720p')
    setNegativePrompt('')
    setAllowPeople(false)
    setModel(DEFAULT_VIDEO_MODEL)
    setUseReferenceImage(false)
    setReferenceImageDataUrl(null)
    setVideoUrl(null)
    setStatusMessage('Ready to render your scene')
    setError(null)
    setIsLoading(false)
    startTimeRef.current = null
    clearImage()
  }, [clearImage])

  const setReferenceFromCanvas = useCallback(async (): Promise<string | null> => {
    if (!currentImage) {
      setReferenceImageDataUrl(null)
      return null
    }
    try {
      const sourceUrl = currentImage.originalDataUrl || currentImage.originalUrl || currentImage.displayUrl
      const dataUrl = await convertImageUrlToDataUrl(sourceUrl)
      setReferenceImageDataUrl(dataUrl)
      setError(null)
      return dataUrl
    } catch (convertError) {
      setError(convertError instanceof Error ? convertError.message : 'Failed to load reference image.')
      return null
    }
  }, [currentImage])

  useEffect(() => {
    if (useReferenceImage && (referenceImageDataUrlState || currentImage)) {
      setError(null)
    }
  }, [useReferenceImage, referenceImageDataUrlState, currentImage])

  // Update status message with elapsed time
  const startStatusUpdates = useCallback(() => {
    startTimeRef.current = Date.now()
    setStatusMessage('Submitting to Veo…')

    statusIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        if (elapsed < 10) {
          setStatusMessage(`Processing (${elapsed}s)… Veo typically takes 30-60s`)
        } else if (elapsed < 30) {
          setStatusMessage(`Processing (${elapsed}s)… Rendering your scene`)
        } else if (elapsed < 60) {
          setStatusMessage(`Processing (${elapsed}s)… Almost there`)
        } else {
          setStatusMessage(`Processing (${elapsed}s)… This is taking longer than usual`)
        }
      }
    }, 1000)
  }, [])

  const stopStatusUpdates = useCallback(() => {
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current)
      statusIntervalRef.current = null
    }
    startTimeRef.current = null
  }, [])

  const generateVideo = useCallback(async () => {
    const trimmedPrompt = prompt.trim()
    const trimmedNegative = negativePrompt.trim()

    if (trimmedPrompt.length < PROMPT_MIN || trimmedPrompt.length > PROMPT_MAX) {
      setError(`Prompt must be between ${PROMPT_MIN} and ${PROMPT_MAX} characters.`)
      return
    }

    if (trimmedNegative.length > NEGATIVE_PROMPT_MAX) {
      setError('Negative prompt must be less than 300 characters.')
      return
    }

    if (resolution === '1080p' && (aspectRatio !== '16:9' || durationSeconds !== 8)) {
      setError('1080p requires 16:9 aspect and 8 second duration.')
      return
    }

    let resolvedReferenceDataUrl = referenceImageDataUrlState || undefined
    const targetAspect = useReferenceImage ? '16:9' : aspectRatio
    const targetDuration = useReferenceImage ? 8 : durationSeconds

    if (useReferenceImage) {
      if (!resolvedReferenceDataUrl) {
        if (!currentImage?.originalUrl && !currentImage?.displayUrl) {
          setError('Add a canvas image or upload a reference to use it.')
          return
        }
        const canvasRef = await setReferenceFromCanvas()
        resolvedReferenceDataUrl = canvasRef || undefined
      }

      if (!resolvedReferenceDataUrl) {
        setError('Failed to load reference image.')
        return
      }

      if (aspectRatio !== '16:9' || durationSeconds !== 8) {
        setAspectRatio('16:9')
        setDurationSeconds(8)
      }
    }

    const request: VideoGenerationRequest = {
      prompt: trimmedPrompt,
      aspectRatio: targetAspect,
      durationSeconds: targetDuration,
      resolution,
      negativePrompt: trimmedNegative || undefined,
      personGeneration: allowPeople,
      model,
      referenceImageDataUrl: useReferenceImage ? resolvedReferenceDataUrl : undefined,
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      setIsLoading(true)
      setError(null)
      startStatusUpdates()

      const response = await nanoBananaAPI.generateVideo(request)

      stopStatusUpdates()
      setVideoUrl(response.videoUrl)
      setStatusMessage('Video ready to play')

      // Auto-save to Firebase Storage if user is logged in
      if (user && response.videoUrl) {
        try {
          setStatusMessage('Saving to your library…')

          // Use generic media fetch endpoint
          const apiResponse = await fetch('/api/nano-banana-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: response.videoUrl })
          })

          if (apiResponse.ok) {
            const { contentType, data } = await apiResponse.json()

            const binaryString = atob(data)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }

            if (!storage) {
              console.warn('Firebase Storage not available, skipping video auto-save')
            } else {
              const now = new Date()
              const timestamp = now.getTime()
              const promptSlug = createPromptSlug(trimmedPrompt)
              const dateSegment = `${now.getFullYear()}-${formatTwoDigits(now.getMonth() + 1)}-${formatTwoDigits(now.getDate())}`
              const ext = (contentType?.split('/')?.[1] || 'mp4').split(';')[0]
              const path = `nano-banana-videos/${user.uid}/${dateSegment}-${promptSlug}-${timestamp}.${ext}`

              const storageRef = ref(storage, path)
              await uploadBytes(storageRef, bytes, { contentType })

              const downloadUrl = await getDownloadURL(storageRef)
              console.log('Video auto-saved to Firebase Storage:', downloadUrl)
            }
          } else {
            console.warn('Failed to fetch video for auto-save:', apiResponse.statusText)
          }

          setStatusMessage('Video ready to play')
        } catch (saveError) {
          console.error('Auto-save to Firebase Storage failed:', saveError)
          setStatusMessage('Video ready (auto-save failed)')
        }
      }
    } catch (err) {
      stopStatusUpdates()

      // Don't show error if it was intentionally aborted
      if (err instanceof Error && err.name === 'AbortError') {
        setStatusMessage('Generation cancelled')
        return
      }

      const message = err instanceof Error ? err.message : 'Failed to generate video.'
      setError(message)
      setStatusMessage('Render failed')
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [
    allowPeople,
    aspectRatio,
    currentImage,
    durationSeconds,
    model,
    negativePrompt,
    prompt,
    referenceImageDataUrlState,
    resolution,
    setReferenceFromCanvas,
    startStatusUpdates,
    stopStatusUpdates,
    useReferenceImage,
    user,
  ])

  return {
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    durationSeconds,
    setDurationSeconds,
    resolution,
    setResolution,
    negativePrompt,
    setNegativePrompt,
    allowPeople,
    setAllowPeople,
    model,
    setModel,
    useReferenceImage,
    setUseReferenceImage,
    referenceImageDataUrl: referenceImageDataUrlState,
    setReferenceImageDataUrl,
    setReferenceFromCanvas,
    isLoading,
    error,
    videoUrl,
    statusMessage,
    generateVideo,
    clearError,
    reset,
  }
}

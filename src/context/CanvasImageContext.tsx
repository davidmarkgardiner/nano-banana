'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { applyFilterToImageDataUrl, ImageFilter } from '@/lib/imageFilters'

export type CanvasImageSource = 'generated' | 'uploaded'

interface CanvasImage {
  id: number
  source: CanvasImageSource
  originalUrl: string
  displayUrl: string
  prompt?: string
  originalDataUrl?: string
}

interface ShowUploadedImageOptions {
  prompt?: string
  initialFilter?: ImageFilter
}

interface CanvasImageContextValue {
  currentImage: CanvasImage | null
  filter: ImageFilter
  isProcessing: boolean
  error: string | null
  showGeneratedImage: (url: string, prompt?: string) => void
  showUploadedImage: (dataUrl: string, options?: ShowUploadedImageOptions) => Promise<void>
  applyFilter: (nextFilter: ImageFilter) => Promise<void>
  clearImage: () => void
}

const CanvasImageContext = createContext<CanvasImageContextValue | undefined>(undefined)

const convertUrlToDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch the image for processing.')
  }

  const blob = await response.blob()

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('Unsupported image format encountered during processing.'))
    }
    reader.onerror = () => {
      reject(new Error('Unable to read the image data for processing.'))
    }
    reader.readAsDataURL(blob)
  })
}

export function CanvasImageProvider({ children }: { children: React.ReactNode }) {
  const nextIdRef = useRef(1)
  const [currentImage, setCurrentImage] = useState<CanvasImage | null>(null)
  const [filter, setFilter] = useState<ImageFilter>('none')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runFilterPipeline = useCallback(
    async (image: CanvasImage, nextFilter: ImageFilter, baseDataUrl?: string) => {
      if (nextFilter === 'none') {
        setFilter('none')
        setError(null)
        setCurrentImage((prev) => {
          if (!prev || prev.id !== image.id) {
            return prev
          }

          return {
            ...prev,
            displayUrl: prev.originalUrl,
          }
        })
        return
      }

      setIsProcessing(true)
      setError(null)

      try {
        const sourceDataUrl =
          baseDataUrl ??
          (image.originalDataUrl
            ? image.originalDataUrl
            : await convertUrlToDataUrl(image.originalUrl))

        const processedDataUrl = await applyFilterToImageDataUrl(sourceDataUrl, nextFilter)

        setCurrentImage((prev) => {
          if (!prev || prev.id !== image.id) {
            return prev
          }

          return {
            ...prev,
            displayUrl: processedDataUrl,
            originalDataUrl: sourceDataUrl,
          }
        })
        setFilter(nextFilter)
      } catch (processingError) {
        console.error('Failed to apply filter to canvas image:', processingError)
        setError(
          processingError instanceof Error
            ? processingError.message
            : 'Failed to apply the selected filter to the image.'
        )
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const showGeneratedImage = useCallback((url: string, prompt?: string) => {
    const image: CanvasImage = {
      id: nextIdRef.current++,
      source: 'generated',
      originalUrl: url,
      displayUrl: url,
      prompt,
    }

    setCurrentImage(image)
    setFilter('none')
    setError(null)
    setIsProcessing(false)
  }, [])

  const showUploadedImage = useCallback(
    async (dataUrl: string, options?: ShowUploadedImageOptions) => {
      const image: CanvasImage = {
        id: nextIdRef.current++,
        source: 'uploaded',
        originalUrl: dataUrl,
        originalDataUrl: dataUrl,
        displayUrl: dataUrl,
        prompt: options?.prompt,
      }

      setCurrentImage(image)
      setError(null)

      const initialFilter = options?.initialFilter ?? 'none'
      setFilter(initialFilter)

      if (initialFilter !== 'none') {
        await runFilterPipeline(image, initialFilter, dataUrl)
      }
    },
    [runFilterPipeline]
  )

  const applyFilter = useCallback(
    async (nextFilter: ImageFilter) => {
      if (!currentImage) {
        setFilter(nextFilter)
        return
      }

      await runFilterPipeline(currentImage, nextFilter)
    },
    [currentImage, runFilterPipeline]
  )

  const clearImage = useCallback(() => {
    setCurrentImage(null)
    setFilter('none')
    setIsProcessing(false)
    setError(null)
  }, [])

  const value: CanvasImageContextValue = {
    currentImage,
    filter,
    isProcessing,
    error,
    showGeneratedImage,
    showUploadedImage,
    applyFilter,
    clearImage,
  }

  return <CanvasImageContext.Provider value={value}>{children}</CanvasImageContext.Provider>
}

export function useCanvasImage(): CanvasImageContextValue {
  const context = useContext(CanvasImageContext)

  if (!context) {
    throw new Error('useCanvasImage must be used within a CanvasImageProvider')
  }

  return context
}

'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageDisplayProps {
  imageUrl: string | null
  isLoading: boolean
  error: string | null
  prompt: string
  onRetry?: () => void
  onClear?: () => void
}

export default function ImageDisplay({
  imageUrl,
  isLoading,
  error,
  prompt,
  onRetry,
  onClear
}: ImageDisplayProps) {
  const [imageError, setImageError] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)

  // Reset image loading state when imageUrl changes
  const handleImageLoad = () => {
    setIsImageLoading(false)
    setImageError(false)
  }

  const handleImageError = () => {
    setIsImageLoading(false)
    setImageError(true)
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden relative">
          {/* Skeleton Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"></div>
          
          {/* Loading Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Generating your image...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center px-4">
              This may take a few moments
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error && !imageUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="aspect-square bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-300 dark:border-red-700 overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="text-red-500 dark:text-red-400 mb-4">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Generation Failed</h3>
            <p className="text-red-700 dark:text-red-300 text-center mb-4">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Generated Image State
  if (imageUrl) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 overflow-hidden relative group">
          {/* Image Loading Overlay */}
          {isImageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {/* Image Error State */}
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Failed to load image</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Actual Image */}
          {!imageError && (
            <Image
              src={imageUrl}
              alt={prompt}
              fill
              className="object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority
            />
          )}

          {/* Hover Overlay with Actions */}
          {!isImageLoading && !imageError && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                {/* Download Button */}
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = imageUrl
                    link.download = `nano-banana-${Date.now()}.jpg`
                    link.click()
                  }}
                  className="px-3 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg transition-colors flex items-center gap-1 text-sm"
                  title="Download image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>

                {/* Clear Button */}
                {onClear && (
                  <button
                    onClick={onClear}
                    className="px-3 py-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                    title="Clear image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Image Info */}
        {!isImageLoading && !imageError && prompt && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Prompt:</span> {prompt}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Empty State - No Image Yet
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="aspect-square bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Your Generated Image</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Enter a prompt above and click generate to create your AI image
          </p>
        </div>
      </div>
    </div>
  )
}
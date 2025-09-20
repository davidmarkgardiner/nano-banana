'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageDisplayProps {
  imageUrl: string | null
  isLoading: boolean
  error: string | null
  prompt: string
  onRetry?: () => void
  onRegenerate?: () => void
  onClear?: () => void
  className?: string
  variant?: 'default' | 'hero'
}

export default function ImageDisplay({
  imageUrl,
  isLoading,
  error,
  prompt,
  onRetry,
  onRegenerate,
  onClear,
  className,
  variant = 'default'
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

  const isHero = variant === 'hero'

  const containerClassName = [
    isHero ? 'w-full max-w-3xl mx-auto lg:max-w-5xl xl:max-w-6xl' : 'w-full max-w-2xl mx-auto',
    className
  ]
    .filter(Boolean)
    .join(' ')

  const baseFrameClass = isHero
    ? 'relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[5/6] overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/70 via-slate-900/30 to-indigo-900/40 shadow-[0_40px_120px_-45px_rgba(56,189,248,0.55)] backdrop-blur-2xl'
    : 'relative aspect-square overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'

  const loadingBackdropClass = isHero
    ? 'absolute inset-0 bg-gradient-to-br from-slate-800/60 via-sky-500/25 to-indigo-900/40 animate-pulse'
    : 'absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse'

  const loadingSpinnerClass = isHero
    ? 'animate-spin rounded-full h-14 w-14 border-4 border-sky-400 border-t-transparent mb-4'
    : 'animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4'

  const loadingTitleClass = isHero
    ? 'text-lg font-medium text-slate-100'
    : 'text-gray-600 dark:text-gray-300 font-medium'

  const loadingSubtitleClass = isHero
    ? 'mt-2 text-sm text-slate-200/70 text-center px-6'
    : 'text-sm text-gray-500 dark:text-gray-400 mt-2 text-center px-4'

  const errorFrameClass = isHero
    ? 'relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[5/6] overflow-hidden rounded-3xl border border-rose-400/50 bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-rose-500/15 shadow-[0_35px_120px_-45px_rgba(244,114,182,0.6)] backdrop-blur-2xl'
    : 'relative aspect-square overflow-hidden rounded-lg border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'

  const errorIconClass = isHero ? 'text-rose-200 mb-4' : 'text-red-500 dark:text-red-400 mb-4'
  const errorTitleClass = isHero ? 'text-lg font-semibold text-rose-50 mb-2' : 'text-lg font-medium text-red-800 dark:text-red-200 mb-2'
  const errorMessageClass = isHero ? 'text-sm text-rose-100/80 text-center mb-4 px-6' : 'text-red-700 dark:text-red-300 text-center mb-4'
  const errorButtonClass = isHero
    ? 'px-4 py-2 rounded-lg border border-rose-300/60 bg-rose-500/10 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/20'
    : 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'

  const overlayBackgroundClass = isHero
    ? 'absolute inset-0 bg-gradient-to-br from-slate-900/20 to-slate-900/60'
    : 'absolute inset-0 bg-gray-100 dark:bg-gray-800'

  const overlayIconWrapperClass = isHero ? 'text-slate-200/70 mb-2' : 'text-gray-400 dark:text-gray-500 mb-2'
  const overlayTextClass = isHero ? 'text-sm text-slate-200/80' : 'text-sm text-gray-500 dark:text-gray-400'

  const downloadButtonClass = isHero
    ? 'px-4 py-2 rounded-full border border-white/30 bg-white/20 text-sm font-medium text-white backdrop-blur-lg transition-all hover:border-white hover:bg-white/30 flex items-center gap-2'
    : 'px-3 py-2 bg-white/90 hover:bg-white text-gray-800 rounded-lg transition-colors flex items-center gap-1 text-sm'

  const clearButtonClass = isHero
    ? 'px-4 py-2 rounded-full border border-rose-300/50 bg-rose-500/20 text-sm font-medium text-rose-100 transition-all hover:bg-rose-500/30 flex items-center gap-2'
    : 'px-3 py-2 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm'

  const regenerateButtonClass = isHero
    ? 'px-4 py-2 rounded-full border border-sky-300/50 bg-sky-500/20 text-sm font-medium text-sky-100 transition-all hover:bg-sky-500/30 flex items-center gap-2'
    : 'px-3 py-2 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm'

  const actionBarClass = isHero
    ? 'mt-4 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center'
    : 'mt-3 flex flex-wrap items-center justify-center gap-2'

  const promptInfoClass = isHero
    ? 'mt-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(56,189,248,0.6)]'
    : 'mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700'

  const promptLabelClass = isHero ? 'font-semibold text-white' : 'font-medium'

  const emptyFrameClass = isHero
    ? 'relative aspect-[3/4] sm:aspect-[4/5] lg:aspect-[5/6] overflow-hidden rounded-3xl border-2 border-dashed border-white/25 bg-white/5 backdrop-blur-2xl shadow-[0_30px_100px_-45px_rgba(59,130,246,0.5)]'
    : 'relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'

  const emptyTitleClass = isHero ? 'text-xl font-semibold text-white mb-2' : 'text-lg font-medium text-gray-700 dark:text-gray-300 mb-2'
  const emptyDescriptionClass = isHero ? 'text-slate-200/80 text-center max-w-sm' : 'text-gray-500 dark:text-gray-400 text-center'

  // Loading State
  if (isLoading) {
    return (
      <div className={containerClassName}>
        <div className={baseFrameClass}>
          <div className={loadingBackdropClass}></div>

          {/* Loading Content */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className={loadingSpinnerClass}></div>
            <p className={loadingTitleClass}>Generating your image...</p>
            <p className={loadingSubtitleClass}>This may take a few moments</p>
          </div>
        </div>
      </div>
    )
  }

  // Error State
  if (error && !imageUrl) {
    return (
      <div className={containerClassName}>
        <div className={errorFrameClass}>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className={errorIconClass}>
              <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.293-9.293a1 1 0 011.414 0L10 9.586l1.293-1.293a1 1 0 011.414 1.414L11.414 11l1.293 1.293a1 1 0 01-1.414 1.414L10 12.414l-1.293 1.293a1 1 0 01-1.414-1.414L8.586 11l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className={errorTitleClass}>Generation Failed</h3>
            <p className={errorMessageClass}>{error}</p>
            {onRetry && (
              <button onClick={onRetry} className={errorButtonClass}>
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Generated Image State
  const handleRegenerate = onRegenerate ?? onRetry

  if (imageUrl) {
    return (
      <div className={containerClassName}>
        <div className={baseFrameClass}>
          {/* Image Loading Overlay */}
          {isImageLoading && <div className={overlayBackgroundClass}></div>}

          {/* Image Error State */}
          {imageError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
              <div className={overlayIconWrapperClass}>
                <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              </div>
              <p className={overlayTextClass}>Failed to load image</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={
                    isHero
                      ? 'mt-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white transition-colors hover:bg-white/20'
                      : 'mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors'
                  }
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

        </div>

        {!isImageLoading && !imageError && (
          <div className={actionBarClass}>
            {handleRegenerate && (
              <button onClick={handleRegenerate} className={regenerateButtonClass} title="Regenerate image">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m0 0A7 7 0 0112 5c1.513 0 2.924.472 4.082 1.276L20 9m0 0V4h-5m5 5h-.581m0 0A7 7 0 0112 19a7 7 0 01-4.082-1.276L4 15"
                  />
                </svg>
                Regenerate
              </button>
            )}

            <button
              onClick={() => {
                const link = document.createElement('a')
                link.href = imageUrl
                link.download = `nano-banana-${Date.now()}.jpg`
                link.click()
              }}
              className={downloadButtonClass}
              title="Download image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download
            </button>

            {onClear && (
              <button onClick={onClear} className={clearButtonClass} title="Clear image">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Clear
              </button>
            )}
          </div>
        )}

        {/* Image Info */}
        {!isImageLoading && !imageError && prompt && (
          <div className={promptInfoClass}>
            <p className="text-sm">
              <span className={promptLabelClass}>Prompt:</span> {prompt}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Empty State - No Image Yet
  return (
    <div className={containerClassName}>
      <div className={emptyFrameClass}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className={isHero ? 'text-slate-300 mb-4' : 'text-gray-400 dark:text-gray-500 mb-4'}>
            <svg className={isHero ? 'h-20 w-20' : 'w-20 h-20'} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className={emptyTitleClass}>Your Generated Image</h3>
          <p className={emptyDescriptionClass}>
            Enter a prompt above and click generate to create your AI image
          </p>
        </div>
      </div>
    </div>
  )
}

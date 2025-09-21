'use client'

import { useState, KeyboardEvent } from 'react'
import ImageUploadButton from '@/components/ImageUploadButton'

interface TextPromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void | Promise<void>
  isLoading: boolean
  error: string | null
  maxLength?: number
  className?: string
}

export default function TextPromptInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  error,
  maxLength = 500,
  className
}: TextPromptInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      if (!isLoading && value.trim()) {
        onSubmit()
      }
    }
  }

  const handleSubmit = () => {
    if (!isLoading && value.trim()) {
      onSubmit()
    }
  }

  const characterCount = value.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isOverLimit = characterCount > maxLength

  const containerClassName = [
    'w-full max-w-2xl mx-auto',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClassName}>
      {/* Input Section */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Describe the image you want to generate... (e.g., 'A serene mountain landscape at sunset with purple clouds')"
          className={`
            w-full min-h-[120px] p-4 rounded-lg border-2 transition-all duration-200
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-white
            placeholder-gray-500 dark:placeholder-gray-400
            resize-none
            ${isFocused 
              ? 'border-blue-500 shadow-lg ring-2 ring-blue-500/20' 
              : 'border-gray-300 dark:border-gray-600 shadow-sm'
            }
            ${error 
              ? 'border-red-500 dark:border-red-400' 
              : ''
            }
            ${isOverLimit 
              ? 'border-red-500 dark:border-red-400' 
              : ''
            }
            focus:outline-none
          `}
          disabled={isLoading}
          maxLength={maxLength}
        />
        
        {/* Character Counter */}
        <div className={`
          absolute bottom-2 right-2 text-sm
          ${isOverLimit 
            ? 'text-red-500 dark:text-red-400' 
            : isNearLimit 
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-gray-400 dark:text-gray-500'
          }
        `}>
          {characterCount}/{maxLength}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Submit Section */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Keyboard Shortcut Hint */}
        <div className="text-sm text-gray-500 dark:text-gray-400 order-3 sm:order-1">
          Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">⌘ + Enter</kbd> to generate
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 order-1 sm:order-2">
          {/* Upload Button */}
          <ImageUploadButton
            isDisabled={isLoading}
          />

          {/* Generate Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !value.trim() || isOverLimit}
            className={`
              px-12 py-4 rounded-xl font-bold text-lg transition-all duration-300 relative overflow-hidden
              ${isLoading || !value.trim() || isOverLimit
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 animate-pulse'
              }
              min-w-[160px] flex items-center justify-center group
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_2s_infinite] before:skew-x-12
            `}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent mr-3"></div>
                <span className="text-lg font-bold">Generating...</span>
              </>
            ) : (
              <>
                <span className="text-2xl mr-2 group-hover:animate-bounce">✨</span>
                <span className="text-lg font-bold tracking-wide">Generate</span>
                <span className="text-2xl ml-2 group-hover:animate-bounce animation-delay-100">🎨</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips */}
      {!error && value.length === 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Tips for better results:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Be specific about colors, lighting, and mood</li>
            <li>• Mention the style (realistic, cartoon, artistic, etc.)</li>
            <li>• Include details about composition and perspective</li>
            <li>• Try: &quot;A cozy coffee shop interior with warm lighting and vintage furniture&quot;</li>
          </ul>
        </div>
      )}
    </div>
  )
}
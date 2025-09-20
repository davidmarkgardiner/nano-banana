'use client'

import { ChangeEvent, useRef } from 'react'
import { useCanvasImage } from '@/context/CanvasImageContext'

interface ImageUploadButtonProps {
  className?: string
  isDisabled?: boolean
}

export default function ImageUploadButton({ className, isDisabled }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showUploadedImage } = useCanvasImage()

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Only image files can be uploaded.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Please select an image that is 10MB or smaller.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''

      if (!result) {
        alert('Failed to read the selected file. Please try again.')
        return
      }

      void showUploadedImage(result, {
        prompt: file.name,
      }).catch((error: unknown) => {
        console.error('Failed to process uploaded image:', error)
        alert('Failed to process the uploaded image.')
      })
    }

    reader.onerror = () => {
      alert('Failed to read the selected file. Please try again.')
    }

    reader.readAsDataURL(file)

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    if (!isDisabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        disabled={isDisabled}
        className={`
          px-8 py-3 rounded-lg font-medium transition-all duration-200
          ${isDisabled
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
          }
          min-w-[120px] flex items-center justify-center
          ${className}
        `}
      >
        📸 Upload
      </button>
    </>
  )
}
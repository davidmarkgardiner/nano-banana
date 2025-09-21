'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { useCanvasImage } from '@/context/CanvasImageContext'
import { useUploadRetry } from '@/hooks/useUploadRetry'
import { validateImageFile, compressImage } from '@/lib/uploadUtils'

interface ImageUploadButtonProps {
  className?: string
  isDisabled?: boolean
}

export default function ImageUploadButton({ className, isDisabled }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showUploadedImage } = useCanvasImage()
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const { executeWithRetry, retryState } = useUploadRetry({
    maxRetries: 3,
    retryDelay: 1000,
    onRetry: (attempt) => console.log(`Retrying upload, attempt ${attempt}`)
  })

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const validation = validateImageFile(file)
    if (!validation.isValid) {
      alert(validation.error)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      await executeWithRetry(async () => {
        let processedFile = file
        
        // Compress large images
        if (file.size > 5 * 1024 * 1024) {
          setUploadProgress(10)
          try {
            const compressed = await compressImage(file, 1920, 1920, 0.8)
            processedFile = new File([compressed], file.name, { type: 'image/jpeg' })
            setUploadProgress(20)
          } catch (compressionError) {
            console.warn('Compression failed, using original file:', compressionError)
          }
        }

        return new Promise<void>((resolve, reject) => {
          const reader = new FileReader()
          
          reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : ''

            if (!result) {
              reject(new Error('Failed to read the selected file'))
              return
            }

            void showUploadedImage(result, {
              prompt: file.name,
            }).then(() => {
              setUploadProgress(100)
              resolve()
            }).catch(reject)
          }

          reader.onerror = () => {
            reject(new Error('Failed to read file'))
          }

          reader.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round(20 + (event.loaded / event.total) * 80)
              setUploadProgress(progress)
            }
          }

          reader.readAsDataURL(processedFile)
        })
      })
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
      alert(retryState.attempt > 1 ? `Upload failed after ${retryState.attempt} attempts: ${errorMessage}` : errorMessage)
      setIsUploading(false)
      setUploadProgress(0)
    }

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
      <div className="relative">
        <button
          onClick={handleButtonClick}
          disabled={isDisabled || isUploading}
          className={`
            px-8 py-3 rounded-lg font-medium transition-all duration-200
            ${isDisabled || isUploading
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
            }
            min-w-[120px] flex items-center justify-center relative overflow-hidden
            ${className}
          `}
        >
          {isUploading && (
            <div 
              className="absolute inset-0 bg-emerald-400 transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          )}
          <span className="relative z-10">
            {isUploading 
              ? retryState.isRetrying 
                ? `Retry ${retryState.attempt} - ${uploadProgress}%` 
                : `${uploadProgress}%`
              : '📸 Upload'
            }
          </span>
        </button>
      </div>
    </>
  )
}
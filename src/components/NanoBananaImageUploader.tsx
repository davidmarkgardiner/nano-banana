'use client'

import { ChangeEvent, FormEvent, useState } from 'react'
import NextImage from 'next/image'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'
import { useCanvasImage } from '@/context/CanvasImageContext'
import { ImageFilter } from '@/lib/imageFilters'

interface NanoBananaResponse {
  contentType: string
  data: string
}

const decodeBase64ToUint8Array = (base64Data: string): Uint8Array => {
  const normalized = base64Data.replace(/\s/g, '')
  const binaryString = atob(normalized)
  const length = binaryString.length
  const bytes = new Uint8Array(length)

  for (let index = 0; index < length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index)
  }

  return bytes
}


export default function NanoBananaImageUploader(): JSX.Element | null {
  const { user, approvalStatus } = useAuth()
  const {
    currentImage,
    filter,
    applyFilter,
    isProcessing,
    error: canvasError,
    showUploadedImage,
    clearImage,
  } = useCanvasImage()
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [storagePath, setStoragePath] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState('')
  const [localUploading, setLocalUploading] = useState(false)
  const [originalStoragePath, setOriginalStoragePath] = useState('')
  const [processedStoragePath, setProcessedStoragePath] = useState('')
  const [originalDownloadUrl, setOriginalDownloadUrl] = useState('')
  const [processedDownloadUrl, setProcessedDownloadUrl] = useState('')

  const isUploadedImageActive = currentImage?.source === 'uploaded'
  const uploadedOriginalPreview = isUploadedImageActive
    ? currentImage.originalDataUrl ?? currentImage.originalUrl
    : ''
  const uploadedProcessedPreview = isUploadedImageActive ? currentImage.displayUrl : ''

  const hasApproval = user && approvalStatus === 'approved'

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!imageUrl.trim()) {
      setError('Please provide the Nano Banana image URL before uploading.')
      return
    }

    if (!storage) {
      setError('Firebase Storage is not configured. Please contact the administrator.')
      return
    }

    try {
      setUploading(true)
      setError('')
      setStoragePath('')
      setDownloadUrl('')

      const response = await fetch('/api/nano-banana-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageUrl.trim() })
      })

      if (!response.ok) {
        let message = 'Unable to fetch the Nano Banana image.'

        try {
          const errorData = (await response.json()) as { error?: string }
          if (errorData?.error) {
            message = errorData.error
          }
        } catch (parseError) {
          console.error('Failed to parse Nano Banana error response:', parseError)
        }

        throw new Error(message)
      }

      if (!storage) {
        throw new Error('Firebase Storage not available')
      }

      const data = (await response.json()) as NanoBananaResponse
      if (!storage) {
        throw new Error('Storage not initialized')
      }

      const bytes = decodeBase64ToUint8Array(data.data)
      const now = new Date()
      const path = `nano-banana/${user.uid}/${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getTime()}`
      const storageReference = ref(storage, path)

      await uploadBytes(storageReference, bytes, { contentType: data.contentType })
      const url = await getDownloadURL(storageReference)

      setStoragePath(path)
      setDownloadUrl(url)
      setImageUrl('')
    } catch (uploadError) {
      console.error('Failed to store Nano Banana image:', uploadError)
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to store Nano Banana image.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    setLocalError('')
    setOriginalStoragePath('')
    setProcessedStoragePath('')
    setOriginalDownloadUrl('')
    setProcessedDownloadUrl('')

    if (!file) {
      setLocalFile(null)
      if (isUploadedImageActive) {
        clearImage()
      }
      return
    }

    if (!file.type.startsWith('image/')) {
      setLocalError('Only image files can be uploaded.')
      setLocalFile(null)
      if (isUploadedImageActive) {
        clearImage()
      }
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setLocalError('Please select an image that is 10MB or smaller.')
      setLocalFile(null)
      if (isUploadedImageActive) {
        clearImage()
      }
      return
    }

    setLocalFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''

      if (!result) {
        setLocalError('Failed to read the selected file. Please try again.')
        setLocalFile(null)
        if (isUploadedImageActive) {
          clearImage()
        }
        return
      }

      void showUploadedImage(result, {
        prompt: file.name,
        initialFilter: 'grayscale',
      }).catch((processingError: unknown) => {
        console.error('Failed to prepare uploaded image:', processingError)
        setLocalError(
          processingError instanceof Error
            ? processingError.message
            : 'Failed to process the uploaded image.'
        )
      })
    }
    reader.onerror = () => {
      setLocalError('Failed to read the selected file. Please try again.')
      setLocalFile(null)
      if (isUploadedImageActive) {
        clearImage()
      }
    }
    reader.readAsDataURL(file)
  }

  const handleLocalUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!localFile) {
      setLocalError('Please select an image to upload.')
      return
    }

    if (!isUploadedImageActive || !currentImage) {
      setLocalError('Please select an image to upload before submitting.')
      return
    }

    if (isProcessing) {
      setLocalError('Processed image not ready yet. Please wait a moment and try again.')
      return
    }

    const originalPreview = uploadedOriginalPreview
    const processedPreview = uploadedProcessedPreview

    if (!originalPreview || !processedPreview) {
      setLocalError('Image preview not ready yet. Please try again in a moment.')
      return
    }

    if (!storage) {
      setLocalError('Firebase Storage is not configured. Please contact the administrator.')
      return
    }

    try {
      setLocalUploading(true)
      setLocalError('')
      setOriginalStoragePath('')
      setProcessedStoragePath('')
      setOriginalDownloadUrl('')
      setProcessedDownloadUrl('')

      const now = new Date()
      const timestamp = now.toISOString().replace(/[:.]/g, '-')
      const basePath = `user-uploads/${user.uid}/${timestamp}`

      const originalExtension = localFile.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      const originalPath = `${basePath}/original.${originalExtension}`
      const originalRef = ref(storage, originalPath)

      await uploadBytes(originalRef, localFile, { contentType: localFile.type })

      const processedBlob = await (await fetch(processedPreview)).blob()
      const processedExtension = processedBlob.type.split('/')[1] ?? 'png'
      const processedPath = `${basePath}/processed-${filter}.${processedExtension}`
      const processedRef = ref(storage, processedPath)

      await uploadBytes(processedRef, processedBlob, { contentType: processedBlob.type })

      const [originalUrl, processedUrl] = await Promise.all([
        getDownloadURL(originalRef),
        getDownloadURL(processedRef),
      ])

      setOriginalStoragePath(originalPath)
      setProcessedStoragePath(processedPath)
      setOriginalDownloadUrl(originalUrl)
      setProcessedDownloadUrl(processedUrl)
    } catch (uploadError) {
      console.error('Failed to upload original and processed image:', uploadError)
      setLocalError(
        uploadError instanceof Error ? uploadError.message : 'Failed to upload the selected image.'
      )
    } finally {
      setLocalUploading(false)
    }
  }

  if (!user || !hasApproval) {
    return null
  }

  return (
    <div className="mx-auto mt-8 grid max-w-5xl gap-8 lg:grid-cols-2">
      <div className="h-full rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
        <h3 className="text-xl font-bold mb-2">Nano Banana Image Storage</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Paste the direct image URL returned from Nano Banana and we will download and store it securely in Firebase Storage for
          you.
        </p>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nano-banana-url" className="mb-1 block text-sm font-medium">
              Nano Banana Image URL
            </label>
            <input
              id="nano-banana-url"
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://nano-banana.app/images/12345"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
              required
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploading ? 'Saving to Firebase…' : 'Save to Firebase Storage'}
          </button>
        </form>

        {(storagePath || downloadUrl) && (
          <div className="mt-6 space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium">Storage path:</span> {storagePath}
            </p>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View stored image
            </a>
            {downloadUrl && (
              <div className="mt-4">
                <NextImage
                  src={downloadUrl}
                  alt="Stored Nano Banana preview"
                  width={512}
                  height={512}
                  sizes="(max-width: 768px) 100vw, 512px"
                  className="max-h-64 w-full rounded-md border border-gray-200 object-contain dark:border-gray-700"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-full rounded-2xl bg-white p-6 shadow-md dark:bg-gray-800">
        <h3 className="text-xl font-bold mb-2">Upload & Enhance Your Photo</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Upload a photo, apply a creative filter, and we&rsquo;ll store both the original and the edited image in Firebase Storage.
        </p>

        {localError && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">{localError}</div>
        )}

        <form onSubmit={handleLocalUpload} className="space-y-4">
          <div>
            <label htmlFor="local-image" className="mb-1 block text-sm font-medium">
              Select an image
            </label>
            <input
              id="local-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full cursor-pointer rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
            />
          </div>

          <div>
            <label htmlFor="image-filter" className="mb-1 block text-sm font-medium">
              Choose a filter
            </label>
            <select
              id="image-filter"
              value={filter}
              onChange={(event) => void applyFilter(event.target.value as ImageFilter)}
              disabled={!isUploadedImageActive || isProcessing}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="grayscale">Dramatic Grayscale</option>
              <option value="sepia">Warm Sepia</option>
              <option value="invert">Pop Art Invert</option>
              <option value="none">Keep Original Colors</option>
            </select>
          </div>

          {isUploadedImageActive && isProcessing && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Applying filter&hellip;</p>
          )}

          {isUploadedImageActive && canvasError && (
            <p className="text-sm text-red-600 dark:text-red-400">{canvasError}</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {uploadedOriginalPreview && (
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Original</p>
                <NextImage
                  src={uploadedOriginalPreview}
                  alt="Original upload preview"
                  width={400}
                  height={400}
                  sizes="(max-width: 768px) 100vw, 256px"
                  className="max-h-48 w-full rounded-md border border-gray-200 object-contain dark:border-gray-700"
                />
              </div>
            )}

            {uploadedProcessedPreview && (
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Edited</p>
                <NextImage
                  src={uploadedProcessedPreview}
                  alt="Processed upload preview"
                  width={400}
                  height={400}
                  sizes="(max-width: 768px) 100vw, 256px"
                  className="max-h-48 w-full rounded-md border border-gray-200 object-contain dark:border-gray-700"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={
              !localFile ||
              !isUploadedImageActive ||
              !uploadedProcessedPreview ||
              localUploading ||
              isProcessing
            }
            className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            {localUploading ? 'Uploading images…' : 'Upload both versions'}
          </button>
        </form>

        {(originalDownloadUrl || processedDownloadUrl) && (
          <div className="mt-6 space-y-4">
            {originalDownloadUrl && (
              <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:text-gray-200">
                <p className="font-medium text-gray-700 dark:text-gray-200">Original image</p>
                <p className="mt-1 break-all text-gray-600 dark:text-gray-300">{originalStoragePath}</p>
                <a
                  href={originalDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                >
                  View original
                </a>
              </div>
            )}

            {processedDownloadUrl && (
              <div className="rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:text-gray-200">
                <p className="font-medium text-gray-700 dark:text-gray-200">Edited image</p>
                <p className="mt-1 break-all text-gray-600 dark:text-gray-300">{processedStoragePath}</p>
                <a
                  href={processedDownloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-blue-600 hover:text-blue-800"
                >
                  View edited version
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import NextImage from 'next/image'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

interface NanoBananaResponse {
  contentType: string
  data: string
}

type ImageFilter = 'grayscale' | 'sepia' | 'invert' | 'none'

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

const applyFilterToImage = async (sourceDataUrl: string, filter: ImageFilter): Promise<string> =>
  new Promise((resolve, reject) => {
    if (filter === 'none') {
      resolve(sourceDataUrl)
      return
    }

    const imageElement = document.createElement('img')
    imageElement.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = imageElement.width
      canvas.height = imageElement.height

      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Unable to process image: Canvas not supported.'))
        return
      }

      context.drawImage(imageElement, 0, 0)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const { data } = imageData

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index]
        const green = data[index + 1]
        const blue = data[index + 2]

        if (filter === 'grayscale') {
          const average = 0.299 * red + 0.587 * green + 0.114 * blue
          data[index] = average
          data[index + 1] = average
          data[index + 2] = average
          continue
        }

        if (filter === 'sepia') {
          data[index] = Math.min(0.393 * red + 0.769 * green + 0.189 * blue, 255)
          data[index + 1] = Math.min(0.349 * red + 0.686 * green + 0.168 * blue, 255)
          data[index + 2] = Math.min(0.272 * red + 0.534 * green + 0.131 * blue, 255)
          continue
        }

        if (filter === 'invert') {
          data[index] = 255 - red
          data[index + 1] = 255 - green
          data[index + 2] = 255 - blue
        }
      }

      context.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }

    imageElement.onerror = () => {
      reject(new Error('Failed to load the selected image for processing.'))
    }

    imageElement.src = sourceDataUrl
  })

export default function NanoBananaImageUploader(): JSX.Element | null {
  const { user, approvalStatus } = useAuth()
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [storagePath, setStoragePath] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [originalPreview, setOriginalPreview] = useState('')
  const [processedPreview, setProcessedPreview] = useState('')
  const [filter, setFilter] = useState<ImageFilter>('grayscale')
  const [processingFilter, setProcessingFilter] = useState(false)
  const [localError, setLocalError] = useState('')
  const [localUploading, setLocalUploading] = useState(false)
  const [originalStoragePath, setOriginalStoragePath] = useState('')
  const [processedStoragePath, setProcessedStoragePath] = useState('')
  const [originalDownloadUrl, setOriginalDownloadUrl] = useState('')
  const [processedDownloadUrl, setProcessedDownloadUrl] = useState('')

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
      setOriginalPreview('')
      setProcessedPreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setLocalError('Only image files can be uploaded.')
      setLocalFile(null)
      setOriginalPreview('')
      setProcessedPreview('')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setLocalError('Please select an image that is 10MB or smaller.')
      setLocalFile(null)
      setOriginalPreview('')
      setProcessedPreview('')
      return
    }

    setLocalFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setOriginalPreview(result)
    }
    reader.onerror = () => {
      setLocalError('Failed to read the selected file. Please try again.')
      setLocalFile(null)
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    let isMounted = true

    if (!originalPreview) {
      setProcessedPreview('')
      return () => {
        isMounted = false
      }
    }

    setProcessingFilter(true)

    applyFilterToImage(originalPreview, filter)
      .then((result) => {
        if (isMounted) {
          setProcessedPreview(result)
          setLocalError('')
        }
      })
      .catch((processingError: unknown) => {
        console.error('Failed to process uploaded image:', processingError)
        if (isMounted) {
          setLocalError(
            processingError instanceof Error
              ? processingError.message
              : 'Failed to process the uploaded image.'
          )
          setProcessedPreview('')
        }
      })
      .finally(() => {
        if (isMounted) {
          setProcessingFilter(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [originalPreview, filter])

  const handleLocalUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!localFile || !originalPreview) {
      setLocalError('Please select an image to upload.')
      return
    }

    if (!processedPreview) {
      setLocalError('Processed image not ready yet. Please wait a moment and try again.')
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
              onChange={(event) => setFilter(event.target.value as ImageFilter)}
              disabled={!originalPreview || processingFilter}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="grayscale">Dramatic Grayscale</option>
              <option value="sepia">Warm Sepia</option>
              <option value="invert">Pop Art Invert</option>
              <option value="none">Keep Original Colors</option>
            </select>
          </div>

          {processingFilter && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Applying filter&hellip;</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {originalPreview && (
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Original</p>
                <NextImage
                  src={originalPreview}
                  alt="Original upload preview"
                  width={400}
                  height={400}
                  sizes="(max-width: 768px) 100vw, 256px"
                  className="max-h-48 w-full rounded-md border border-gray-200 object-contain dark:border-gray-700"
                />
              </div>
            )}

            {processedPreview && (
              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Edited</p>
                <NextImage
                  src={processedPreview}
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
            disabled={!localFile || processingFilter || !processedPreview || localUploading}
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

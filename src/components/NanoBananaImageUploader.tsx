'use client'

import { FormEvent, useState } from 'react'
import Image from 'next/image'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { useAuth } from '@/context/AuthContext'

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
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [storagePath, setStoragePath] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')

  const hasApproval = user && approvalStatus === 'approved'

  if (!user || !hasApproval) {
    return null
  }

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

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h3 className="text-xl font-bold mb-4">Nano Banana Image Storage</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Paste the direct image URL returned from Nano Banana and we will download and store it securely in Firebase Storage for
        you.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nano-banana-url" className="block text-sm font-medium mb-1">
            Nano Banana Image URL
          </label>
          <input
            id="nano-banana-url"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://nano-banana.app/images/12345"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
              <Image
                src={downloadUrl}
                alt="Stored Nano Banana preview"
                width={512}
                height={512}
                sizes="(max-width: 768px) 100vw, 512px"
                className="max-h-64 w-full object-contain rounded-md border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

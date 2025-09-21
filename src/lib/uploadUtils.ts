'use client'

import { ref, uploadBytes, getDownloadURL, UploadMetadata } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export interface UploadProgress {
  bytesTransferred: number
  totalBytes: number
  percentage: number
}

export interface ChunkedUploadOptions {
  chunkSize?: number
  onProgress?: (progress: UploadProgress) => void
  retries?: number
  metadata?: UploadMetadata
}

export const DEFAULT_CHUNK_SIZE = 1024 * 1024 // 1MB

/**
 * Compresses an image file to reduce upload size
 */
export async function compressImage(
  file: File, 
  maxWidth: number = 1920, 
  maxHeight: number = 1920, 
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image for compression'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validates file before upload
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Only image files are allowed' }
  }

  if (file.size > 50 * 1024 * 1024) { // 50MB limit
    return { isValid: false, error: 'File size must be less than 50MB' }
  }

  return { isValid: true }
}

/**
 * Simulates chunked upload with progress tracking for Firebase Storage
 * Note: Firebase doesn't support true chunked uploads, but this provides
 * better progress feedback for large files
 */
export async function uploadWithProgress(
  path: string,
  data: Uint8Array | Blob,
  options: ChunkedUploadOptions = {}
): Promise<string> {
  const { onProgress, metadata, retries = 3 } = options

  if (!storage) {
    throw new Error('Firebase Storage is not configured')
  }

  const storageRef = ref(storage, path)
  let lastError: Error | null = null

  // Retry logic
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Simulate progress for visual feedback
      if (onProgress) {
        const totalBytes = data instanceof Blob ? data.size : data.byteLength
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          const randomProgress = Math.min(90, Math.random() * 80 + 10)
          onProgress({
            bytesTransferred: Math.floor((randomProgress / 100) * totalBytes),
            totalBytes,
            percentage: randomProgress,
          })
        }, 200)

        const uploadResult = await uploadBytes(storageRef, data, metadata)
        clearInterval(progressInterval)

        // Final progress
        onProgress({
          bytesTransferred: totalBytes,
          totalBytes,
          percentage: 100,
        })

        return await getDownloadURL(uploadResult.ref)
      } else {
        const uploadResult = await uploadBytes(storageRef, data, metadata)
        return await getDownloadURL(uploadResult.ref)
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed')
      
      if (attempt === retries) {
        throw lastError
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  throw lastError
}

/**
 * Generates a unique file path for uploads
 */
export function generateUploadPath(
  userId: string, 
  category: string = 'uploads', 
  originalFileName?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const extension = originalFileName?.split('.').pop()?.toLowerCase() || 'jpg'
  const uniqueId = Math.random().toString(36).substring(2, 15)
  
  return `${category}/${userId}/${timestamp}-${uniqueId}.${extension}`
}

/**
 * Converts File to Uint8Array for upload
 */
export async function fileToUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = () => {
      const result = reader.result
      if (result instanceof ArrayBuffer) {
        resolve(new Uint8Array(result))
      } else {
        reject(new Error('Failed to convert file to Uint8Array'))
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}
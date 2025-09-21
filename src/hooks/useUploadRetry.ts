'use client'

import { useState, useCallback } from 'react'

interface UseUploadRetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number) => void
}

interface RetryState {
  attempt: number
  isRetrying: boolean
  error: string | null
}

export function useUploadRetry(options: UseUploadRetryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options
  const [retryState, setRetryState] = useState<RetryState>({
    attempt: 0,
    isRetrying: false,
    error: null,
  })

  const executeWithRetry = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          setRetryState({
            attempt,
            isRetrying: attempt > 1,
            error: null,
          })

          if (attempt > 1) {
            onRetry?.(attempt)
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt - 1)))
          }

          const result = await operation()
          
          setRetryState({
            attempt: 0,
            isRetrying: false,
            error: null,
          })

          return result
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown error')
          
          if (attempt === maxRetries) {
            setRetryState({
              attempt,
              isRetrying: false,
              error: lastError.message,
            })
            throw lastError
          }
        }
      }

      throw lastError
    },
    [maxRetries, retryDelay, onRetry]
  )

  const reset = useCallback(() => {
    setRetryState({
      attempt: 0,
      isRetrying: false,
      error: null,
    })
  }, [])

  return {
    executeWithRetry,
    retryState,
    reset,
  }
}
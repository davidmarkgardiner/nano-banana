'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getRandomPromptSuggestion } from '@/lib/promptSuggestions'
import type { PromptSuggestionResponse } from '@/types'

interface PromptInspirationProps {
  onUsePrompt: (prompt: string) => void
  isGenerating?: boolean
}

function sanitizePromptText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export default function PromptInspiration({ onUsePrompt, isGenerating = false }: PromptInspirationProps) {
  const initialSuggestion = useMemo(() => getRandomPromptSuggestion(), [])
  const [suggestion, setSuggestion] = useState<string>(initialSuggestion)
  const [source, setSource] = useState<'gemini' | 'fallback'>('fallback')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [message, setMessage] = useState<string | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchSuggestion = useCallback(async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/prompt-suggestion', {
        method: 'GET',
        cache: 'no-store'
      })

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }

      const data = (await response.json()) as PromptSuggestionResponse
      const cleaned = sanitizePromptText(data.prompt)

      if (!cleaned) {
        throw new Error('Empty prompt received')
      }

      if (!isMountedRef.current) {
        return
      }

      setSuggestion(cleaned)
      setSource(data.source)
      setMessage(data.warning ?? null)
    } catch (error) {
      console.error('Failed to load prompt inspiration:', error)

      if (!isMountedRef.current) {
        return
      }

      const fallbackPrompt = getRandomPromptSuggestion()
      setSuggestion(fallbackPrompt)
      setSource('fallback')
      setMessage('Using a curated prompt while AI suggestions are unavailable.')
    } finally {
      if (!isMountedRef.current) {
        return
      }

      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSuggestion()
  }, [fetchSuggestion])

  const handleUsePrompt = useCallback(() => {
    if (!suggestion || isLoading) {
      return
    }

    onUsePrompt(suggestion)
  }, [isLoading, onUsePrompt, suggestion])

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/60 p-5 shadow-lg backdrop-blur-md transition dark:border-white/5 dark:bg-gray-900/50">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-700 dark:text-blue-200">
              Prompt inspiration
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {source === 'gemini' ? 'Generated with Gemini' : 'Curated example'}
            </span>
          </div>

          <p className="text-base text-gray-900 transition dark:text-gray-100">{suggestion}</p>

          {isLoading && (
            <p className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              {source === 'gemini' ? 'Refreshing the idea...' : 'Finding a fresh idea...'}
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            onClick={handleUsePrompt}
            disabled={isLoading || !suggestion}
            className={`
              inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition
              ${
                isLoading || !suggestion
                  ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:from-blue-700 hover:to-purple-700 hover:shadow-xl'
              }
            `}
          >
            Use this prompt
          </button>

          <button
            onClick={fetchSuggestion}
            disabled={isLoading || isGenerating}
            className={`
              inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition
              ${
                isLoading || isGenerating
                  ? 'cursor-not-allowed border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600'
                  : 'border-blue-200 bg-white text-blue-600 hover:border-blue-300 hover:text-blue-700 dark:border-blue-900 dark:bg-transparent dark:text-blue-300 dark:hover:border-blue-700 dark:hover:text-blue-200'
              }
            `}
          >
            {isLoading ? 'Loading...' : 'New idea'}
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">{message}</p>
      )}
    </div>
  )
}

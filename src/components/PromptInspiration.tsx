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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
            AI Inspiration
          </p>
          <span className="text-[10px] font-medium text-slate-200/70">
            {source === 'gemini' ? 'Generated with Gemini' : 'Curated example'}
          </span>
        </div>
        <button
          onClick={fetchSuggestion}
          disabled={isLoading || isGenerating}
          className={`
            rounded-lg px-3 py-1 text-xs font-medium transition
            ${
              isLoading || isGenerating
                ? 'cursor-not-allowed bg-slate-800/50 text-slate-500'
                : 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30 hover:text-sky-100'
            }
          `}
        >
          {isLoading ? 'Loading...' : '✨ New idea'}
        </button>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleUsePrompt}
          disabled={isLoading || !suggestion}
          className="group w-full rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-left transition hover:border-white/40 hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <p className="text-sm font-medium text-sky-200 mb-1">
            {isLoading ? 'Loading inspiration...' : 'Tap to use this prompt'}
          </p>
          <p className="text-xs text-slate-200/80 group-hover:text-slate-100 leading-relaxed">
            {suggestion}
          </p>
        </button>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            {source === 'gemini' ? 'Refreshing the idea...' : 'Finding a fresh idea...'}
          </div>
        )}

        {message && (
          <p className="text-xs text-amber-300/80">{message}</p>
        )}
      </div>
    </div>
  )
}
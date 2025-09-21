'use client'

import { useCallback, useMemo, useState } from 'react'
import { getRandomPromptSuggestion } from '@/lib/promptSuggestions'
import type { PromptSuggestionResponse } from '@/types'

interface PromptInspirationProps {
  onUsePrompt: (prompt: string) => void
  isGenerating?: boolean
  className?: string
}

function sanitizePromptText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export default function PromptInspiration({ onUsePrompt, isGenerating = false }: PromptInspirationProps) {
  const initialSuggestion = useMemo(() => getRandomPromptSuggestion(), [])
  const [suggestion, setSuggestion] = useState<string>(initialSuggestion)
  const [source, setSource] = useState<'gemini' | 'fallback'>('fallback')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [justGenerated, setJustGenerated] = useState<boolean>(false)

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

      setSuggestion(cleaned)
      setSource(data.source)
      setMessage(data.warning ?? null)
      setJustGenerated(true)
      setTimeout(() => setJustGenerated(false), 2000) // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to load prompt inspiration:', error)

      const fallbackPrompt = getRandomPromptSuggestion()
      setSuggestion(fallbackPrompt)
      setSource('fallback')
      setMessage('Using a curated prompt while AI suggestions are unavailable.')
      setJustGenerated(true)
      setTimeout(() => setJustGenerated(false), 2000) // Reset after 2 seconds
    } finally {
      setIsLoading(false)
    }
  }, [])


  const handleUsePrompt = useCallback(() => {
    if (!suggestion || isLoading) {
      return
    }

    onUsePrompt(suggestion)
  }, [isLoading, onUsePrompt, suggestion])

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl">
      <div className="flex h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
              AI inspiration
            </p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${source === 'gemini'
              ? 'border-purple-400/40 bg-purple-400/10 text-purple-200'
              : 'border-slate-400/40 bg-slate-400/10 text-slate-200'
            }`}>
              {source === 'gemini' ? (
                <>
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  AI Generated
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  Human Curated
                </>
              )}
            </span>
          </div>
          <button
            onClick={fetchSuggestion}
            disabled={isLoading || isGenerating}
            className={`
              inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all duration-300 relative overflow-hidden group
              ${
                isLoading || isGenerating
                  ? 'cursor-not-allowed bg-slate-800/50 text-slate-500'
                  : 'bg-gradient-to-r from-sky-500/30 via-cyan-500/20 to-sky-500/30 text-sky-100 hover:from-sky-400/40 hover:via-cyan-400/30 hover:to-sky-400/40 hover:text-white shadow-lg hover:shadow-xl transform hover:scale-110 animate-pulse'
              }
              before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_2s_infinite] before:skew-x-12
            `}
          >
            {isLoading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </>
            ) : (
              <>
                <span className="text-lg mr-1 group-hover:animate-bounce" role="img" aria-hidden="true">
                  ✨
                </span>
                <span className="tracking-wide">New idea</span>
                <span className="text-lg ml-1 group-hover:animate-bounce animation-delay-100" role="img" aria-hidden="true">
                  🎯
                </span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleUsePrompt}
          disabled={isLoading || !suggestion}
          className={`group w-full flex-1 rounded-xl border border-white/10 bg-slate-900/40 p-4 text-left transition-all duration-300 hover:border-white/40 hover:bg-slate-900/60 disabled:cursor-not-allowed disabled:opacity-50 relative overflow-hidden ${
            justGenerated ? 'border-sky-400/60 bg-sky-900/30 shadow-lg shadow-sky-500/20 animate-pulse before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_1.5s_ease-in-out] before:skew-x-12' : ''
          }`}
        >
          <div className="flex h-full min-h-[120px] flex-col justify-between gap-3">
            <p className={`text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              justGenerated ? 'text-sky-100 animate-pulse' : 'text-sky-200'
            }`}>
              {justGenerated && <span className="animate-sparkle">✨</span>}
              {isLoading ? 'Loading inspiration...' : 'Tap to use this prompt'}
              {justGenerated && <span className="animate-sparkle animation-delay-100">💎</span>}
            </p>
            <p className={`text-sm leading-relaxed transition-all duration-300 group-hover:text-slate-100 ${
              justGenerated ? 'text-slate-100 animate-pulse' : 'text-slate-200/80'
            }`}>
              {suggestion}
            </p>
          </div>
        </button>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            {source === 'gemini' ? 'Refreshing the idea...' : 'Finding a fresh idea...'}
          </div>
        )}

        {message && <p className="text-xs text-amber-300/80">{message}</p>}
      </div>
    </div>
  )
}
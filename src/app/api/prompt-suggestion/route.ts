import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getRandomPromptSuggestion } from '@/lib/promptSuggestions'
import type { PromptSuggestionResponse } from '@/types'

const DEFAULT_PROMPT_MODEL = process.env.GEMINI_PROMPT_MODEL || 'gemini-1.5-flash'

function sanitizeSuggestion(raw: string | undefined): string {
  if (!raw) {
    return ''
  }

  const firstMeaningfulLine = raw
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^[*\-\d\.)\s]+/, ''))[0]

  if (!firstMeaningfulLine) {
    return ''
  }

  const trimmed = firstMeaningfulLine
    .replace(/^['"`]+/, '')
    .replace(/['"`]+$/, '')

  return trimmed.replace(/\s+/g, ' ').trim()
}

function buildFallbackResponse(warning?: string) {
  const payload: PromptSuggestionResponse = {
    prompt: getRandomPromptSuggestion(),
    source: 'fallback'
  }

  if (warning) {
    payload.warning = warning
  }

  return NextResponse.json(payload)
}

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return buildFallbackResponse('Gemini API key not configured. Showing a curated prompt instead.')
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: DEFAULT_PROMPT_MODEL })

    const generationPrompt = [
      'Create a unique, imaginative text-to-image prompt for an AI art generator.',
      'Choose a random subject, setting, and art style each time you are asked.',
      'Describe mood, lighting, and medium in 25-40 words.',
      'Return only the prompt sentence without numbering, prefixes, or additional commentary.'
    ].join(' ')

    const result = await model.generateContent(generationPrompt)
    const suggestion = sanitizeSuggestion(result.response.text())

    if (!suggestion) {
      throw new Error('Prompt suggestion was empty')
    }

    const payload: PromptSuggestionResponse = {
      prompt: suggestion,
      source: 'gemini'
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Prompt suggestion generation failed:', error)
    return buildFallbackResponse('Unable to fetch AI suggestion. Using a curated prompt instead.')
  }
}
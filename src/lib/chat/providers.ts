import type { ChatMessage } from '@/types'

export type ChatProvider = 'openai' | 'anthropic'

export interface ProviderOptions {
  model?: string
  temperature?: number
  maxOutputTokens?: number
}

interface ProviderResponse {
  role: 'assistant'
  content: string
  provider: ChatProvider
}

function splitSystemMessages(messages: ChatMessage[]): {
  system: string
  rest: ChatMessage[]
} {
  const systemParts: string[] = []
  const rest: ChatMessage[] = []

  for (const message of messages) {
    if (message.role === 'system') {
      systemParts.push(message.content)
    } else {
      rest.push(message)
    }
  }

  return { system: systemParts.join('\n\n'), rest }
}

async function callOpenAI(
  messages: ChatMessage[],
  options: ProviderOptions
): Promise<ProviderResponse> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const payload = {
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.3,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const choice = data.choices?.[0]?.message?.content

  if (!choice) {
    throw new Error('OpenAI response did not contain a message')
  }

  return {
    role: 'assistant',
    content: choice.trim(),
    provider: 'openai',
  }
}

async function callAnthropic(
  messages: ChatMessage[],
  options: ProviderOptions
): Promise<ProviderResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const { system, rest } = splitSystemMessages(messages)

  const payload = {
    model: options.model || process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    max_tokens: options.maxOutputTokens || 800,
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.3,
    system: system || undefined,
    messages: rest.map((message) => ({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: [
        {
          type: 'text',
          text: message.content,
        },
      ],
    })),
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text

  if (!content) {
    throw new Error('Anthropic response did not contain a message')
  }

  return {
    role: 'assistant',
    content: content.trim(),
    provider: 'anthropic',
  }
}

export async function sendChatToProvider(
  messages: ChatMessage[],
  preferredProvider?: ChatProvider,
  options: ProviderOptions = {}
): Promise<ProviderResponse> {
  const providerOrder: ChatProvider[] = preferredProvider
    ? [preferredProvider]
    : [
        process.env.OPENAI_API_KEY ? 'openai' : null,
        process.env.ANTHROPIC_API_KEY ? 'anthropic' : null,
      ].filter(Boolean) as ChatProvider[]

  if (!providerOrder.length) {
    throw new Error('No AI provider is configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY.')
  }

  let lastError: Error | null = null

  for (const provider of providerOrder) {
    try {
      if (provider === 'openai') {
        return await callOpenAI(messages, options)
      }

      if (provider === 'anthropic') {
        return await callAnthropic(messages, options)
      }
    } catch (error) {
      lastError = error as Error
    }
  }

  throw lastError ?? new Error('All providers failed to process the chat request.')
}

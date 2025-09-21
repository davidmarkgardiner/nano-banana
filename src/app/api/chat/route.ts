import { NextRequest, NextResponse } from 'next/server'

import { getRepositoryContext } from '@/lib/chat/repository'
import { searchWebSummary } from '@/lib/chat/web'
import { sendChatToProvider, type ChatProvider } from '@/lib/chat/providers'
import type { ChatDataSource, ChatMessage } from '@/types'

interface ChatRequestBody {
  messages: { role: string; content: string }[]
  mode?: ChatDataSource
  provider?: ChatProvider
}

function sanitizeMessages(rawMessages: ChatRequestBody['messages']): ChatMessage[] {
  if (!Array.isArray(rawMessages)) {
    return []
  }

  return rawMessages
    .filter((message) => typeof message === 'object' && message !== null)
    .map((message) => {
      const role = message.role === 'assistant' ? 'assistant' : 'user'
      const content = typeof message.content === 'string' ? message.content : ''

      return {
        role,
        content: content.slice(0, 4000),
      } as ChatMessage
    })
    .filter((message) => message.content.trim().length > 0)
    .slice(-12)
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody
    const messages = sanitizeMessages(body?.messages)

    if (!messages.length) {
      return NextResponse.json(
        { error: 'At least one message is required.' },
        { status: 400 }
      )
    }

    const mode: ChatDataSource = body.mode ?? 'general'
    const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')

    const augmentedMessages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are Nano Banana\'s AI guide. Answer questions about the project, provide help using the product, and be concise. ' +
          'If you cannot find an answer, clearly state that and suggest next steps. When repository or web context is provided, ' +
          'cite filenames or sources when relevant.',
      },
    ]

    const contextDetails: { repo?: boolean; web?: boolean } = {}

    if (lastUserMessage && mode === 'repo') {
      const repoContext = await getRepositoryContext(lastUserMessage.content)
      if (repoContext) {
        augmentedMessages.push({
          role: 'system',
          content: `Repository context:\n${repoContext}`,
        })
        contextDetails.repo = true
      }
    }

    if (lastUserMessage && mode === 'web') {
      const webSummary = await searchWebSummary(lastUserMessage.content)
      if (webSummary) {
        augmentedMessages.push({
          role: 'system',
          content: `Web search results:\n${webSummary}`,
        })
        contextDetails.web = true
      }
    }

    augmentedMessages.push(...messages)

    const response = await sendChatToProvider(augmentedMessages, body.provider, {
      temperature: mode === 'general' ? 0.4 : 0.2,
    })

    return NextResponse.json({
      message: response.content,
      provider: response.provider,
      context: contextDetails,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

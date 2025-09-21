'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'

import type { ChatDataSource, ChatMessage } from '@/types'

type ActiveView = 'assistant' | 'issue'

interface ChatResponse {
  message?: string
  provider?: string
  context?: {
    repo?: boolean
    web?: boolean
  }
  error?: string
}

interface IssueResponse {
  success?: boolean
  issueNumber?: number
  issueUrl?: string
  error?: string
}

const dataSources: { id: ChatDataSource; label: string; helper: string }[] = [
  {
    id: 'general',
    label: 'General',
    helper: 'Conversational mode powered by your configured AI provider.',
  },
  {
    id: 'repo',
    label: 'Repo',
    helper: 'Ground responses with snippets from the project repository.',
  },
  {
    id: 'web',
    label: 'Web',
    helper: 'Look up quick facts with a privacy-friendly web search.',
  },
]

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hi there! I'm the Nano Banana helper bot. Ask me about the project, the website, or switch to the issue tab if something looks off.",
  timestamp: Date.now(),
}

export default function ChatBotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeView, setActiveView] = useState<ActiveView>('assistant')
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [dataSource, setDataSource] = useState<ChatDataSource>('general')
  const [chatError, setChatError] = useState<string | null>(null)
  const [providerNotice, setProviderNotice] = useState<string | null>(null)

  const [issueTitle, setIssueTitle] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'high'>('medium')
  const [issueCategory, setIssueCategory] = useState<'bug' | 'feedback' | 'feature'>('bug')
  const [includeTranscript, setIncludeTranscript] = useState(true)
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false)
  const [issueStatus, setIssueStatus] = useState<{ type: 'idle' | 'success' | 'error'; message?: string }>({
    type: 'idle',
  })

  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const chatTranscriptForIssue = useMemo(() => {
    if (!includeTranscript) {
      return undefined
    }

    return messages.slice(-8)
  }, [includeTranscript, messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isSending) {
      return
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    const conversation = [...messages, userMessage]
    setMessages(conversation)
    setInput('')
    setIsSending(true)
    setChatError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.map(({ role, content }) => ({ role, content })),
          mode: dataSource,
        }),
      })

      const data = (await response.json()) as ChatResponse

      if (!response.ok || data.error || !data.message) {
        throw new Error(data.error || 'Unable to get a response right now.')
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      }

      setProviderNotice(
        [
          data.provider ? `Answered with ${data.provider}` : null,
          data.context?.repo ? 'using repository context' : null,
          data.context?.web ? 'using web search' : null,
        ]
          .filter(Boolean)
          .join(' ')
          .trim() || null
      )

      setMessages([...conversation, assistantMessage])
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsSending(false)
    }
  }

  const handleIssueSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!issueTitle.trim() || !issueDescription.trim() || isSubmittingIssue) {
      return
    }

    setIsSubmittingIssue(true)
    setIssueStatus({ type: 'idle' })

    try {
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: issueTitle.trim(),
          description: issueDescription.trim(),
          severity: issueSeverity,
          category: issueCategory,
          metadata: {
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            browser: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            chatTranscript: chatTranscriptForIssue,
          },
        }),
      })

      const data = (await response.json()) as IssueResponse

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to report the issue right now.')
      }

      setIssueStatus({
        type: 'success',
        message: data.issueUrl
          ? `Thanks! Issue #${data.issueNumber} created.`
          : 'Thanks! Your report was sent.',
      })
      setIssueTitle('')
      setIssueDescription('')
    } catch (error) {
      setIssueStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Something went wrong.',
      })
    } finally {
      setIsSubmittingIssue(false)
    }
  }

  const renderChatView = () => (
    <div className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur">
      <div className="border-b border-white/10 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-100">Ask Nano Bot</p>
          <div className="flex gap-2">
            {dataSources.map((source) => (
              <button
                key={source.id}
                onClick={() => setDataSource(source.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  dataSource === source.id
                    ? 'bg-sky-500 text-white shadow'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {source.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {dataSources.find((source) => source.id === dataSource)?.helper}
        </p>
        {providerNotice && (
          <p className="mt-1 text-xs text-emerald-300">{providerNotice}</p>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
        {messages.map((message, index) => (
          <div
            key={`${message.timestamp}-${index}`}
            className={`${
              message.role === 'assistant' ? 'space-y-2' : 'ml-auto'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-purple-400/40 bg-purple-400/10 text-purple-200">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  AI Response
                </span>
              </div>
            )}
            <div
              className={`rounded-2xl px-4 py-2 ${
                message.role === 'assistant'
                  ? 'bg-white/5 text-slate-100'
                  : 'ml-auto bg-sky-500/90 text-white'
              }`}
            >
              {message.content}
            </div>
            {message.role === 'user' && (
              <div className="flex justify-end mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-blue-400/40 bg-blue-400/10 text-blue-200">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Your Message
                </span>
              </div>
            )}
          </div>
        ))}
        {chatError && (
          <div className="rounded-2xl bg-rose-500/20 px-4 py-2 text-rose-200">
            {chatError}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
            placeholder="Ask a question or request help"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isSending}
          />
          <button
            onClick={handleSendMessage}
            disabled={isSending || !input.trim()}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isSending ? 'Sending…' : 'Send'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Tip: Switch to the issue tab to send bugs or feedback straight to the team.
        </p>
      </div>
    </div>
  )

  const renderIssueView = () => (
    <form
      onSubmit={handleIssueSubmit}
      className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl backdrop-blur"
    >
      <div className="border-b border-white/10 px-4 pb-3 pt-4">
        <p className="text-sm font-semibold text-slate-100">Report an issue</p>
        <p className="mt-2 text-xs text-slate-400">
          Share bugs, feedback, or feature ideas. We will create a GitHub issue for the team.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
            Summary
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
            placeholder="Short description"
            value={issueTitle}
            onChange={(event) => setIssueTitle(event.target.value)}
            disabled={isSubmittingIssue}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
            Details
          </label>
          <textarea
            className="mt-1 h-32 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
            placeholder="What happened? Share steps to reproduce, expected behaviour, or suggestions."
            value={issueDescription}
            onChange={(event) => setIssueDescription(event.target.value)}
            disabled={isSubmittingIssue}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
              Severity
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={issueSeverity}
              onChange={(event) => setIssueSeverity(event.target.value as 'low' | 'medium' | 'high')}
              disabled={isSubmittingIssue}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
              Category
            </label>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
              value={issueCategory}
              onChange={(event) => setIssueCategory(event.target.value as 'bug' | 'feedback' | 'feature')}
              disabled={isSubmittingIssue}
            >
              <option value="bug">Bug</option>
              <option value="feedback">Feedback</option>
              <option value="feature">Feature idea</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-white/20 bg-white/10"
            checked={includeTranscript}
            onChange={(event) => setIncludeTranscript(event.target.checked)}
            disabled={isSubmittingIssue}
          />
          Include the recent chat transcript for context
        </label>

        {issueStatus.type !== 'idle' && issueStatus.message && (
          <div
            className={`rounded-lg px-3 py-2 text-xs ${
              issueStatus.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-rose-500/20 text-rose-200'
            }`}
          >
            {issueStatus.message}
          </div>
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <button
          type="submit"
          disabled={
            isSubmittingIssue || !issueTitle.trim() || !issueDescription.trim()
          }
          className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isSubmittingIssue ? 'Sending…' : 'Send to GitHub'}
        </button>
        <p className="mt-2 text-[11px] text-slate-500">
          We will post this directly to GitHub using the credentials configured on the server.
        </p>
      </div>
    </form>
  )

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 text-slate-100">
      {isOpen ? (
        <div className="w-[360px] sm:w-[420px]">
          <div className="mb-2 flex items-center justify-between rounded-full border border-white/10 bg-slate-900/90 px-4 py-2 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-lg">🤖</span>
              <span>Nano Assistant</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                className={`rounded-full px-3 py-1 font-medium transition ${
                  activeView === 'assistant'
                    ? 'bg-sky-500 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
                onClick={() => setActiveView('assistant')}
              >
                Assistant
              </button>
              <button
                className={`rounded-full px-3 py-1 font-medium transition ${
                  activeView === 'issue'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
                onClick={() => setActiveView('issue')}
              >
                Report
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-white/10 px-2 py-1 text-sm text-slate-200 transition hover:bg-white/20"
                aria-label="Close chatbot"
              >
                ✕
              </button>
            </div>
          </div>
          {activeView === 'assistant' ? renderChatView() : renderIssueView()}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 rounded-full border border-sky-400/30 bg-slate-900/90 px-4 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur transition hover:border-sky-300 hover:bg-slate-800"
        >
          <span className="text-lg">💬</span>
          Ask Nano Bot
        </button>
      )}
    </div>
  )
}

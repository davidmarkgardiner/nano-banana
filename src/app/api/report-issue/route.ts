import { NextRequest, NextResponse } from 'next/server'

import type { IssueReportMetadata, IssueReportRequest } from '@/types'

function formatTranscript(transcript?: IssueReportMetadata['chatTranscript']) {
  if (!Array.isArray(transcript) || !transcript.length) {
    return null
  }

  const formatted = transcript
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n')

  return `Chat transcript:\n${formatted}`
}

function buildIssueBody(payload: IssueReportRequest): string {
  const sections: string[] = []

  if (payload.description) {
    sections.push(payload.description.trim())
  }

  const metadataLines: string[] = []

  if (payload.severity) {
    metadataLines.push(`Severity: ${payload.severity}`)
  }

  if (payload.category) {
    metadataLines.push(`Category: ${payload.category}`)
  }

  const metadata = payload.metadata

  if (metadata?.url) {
    metadataLines.push(`Page: ${metadata.url}`)
  }

  if (metadata?.browser) {
    metadataLines.push(`Browser: ${metadata.browser}`)
  }

  if (metadata?.additionalContext) {
    metadataLines.push(`Additional context: ${metadata.additionalContext}`)
  }

  if (metadataLines.length) {
    sections.push(metadataLines.join('\n'))
  }

  const transcript = formatTranscript(metadata?.chatTranscript)
  if (transcript) {
    sections.push(transcript)
  }

  return sections.join('\n\n')
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as IssueReportRequest

    if (!payload || !payload.title || !payload.description) {
      return NextResponse.json(
        { error: 'Title and description are required.' },
        { status: 400 }
      )
    }

    const token = process.env.GITHUB_TOKEN
    const repo = process.env.GITHUB_REPO
    const owner = process.env.GITHUB_OWNER

    if (!token || !repo || !owner) {
      return NextResponse.json(
        {
          error:
            'GitHub integration is not configured. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO.',
        },
        { status: 500 }
      )
    }

    const issueBody = buildIssueBody(payload)

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'nano-banana-chatbot',
        Accept: 'application/vnd.github+json',
      },
      body: JSON.stringify({
        title: payload.title,
        body: issueBody,
        labels: payload.category ? [payload.category] : undefined,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `GitHub request failed: ${response.status} ${errorText}` },
        { status: 502 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      issueNumber: data.number,
      issueUrl: data.html_url,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

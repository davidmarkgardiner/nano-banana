import { NextRequest, NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import OpenAI from 'openai'

import type { IssueReportMetadata, IssueReportRequest } from '@/types'

// Initialize OpenAI (conditionally)
let openai: OpenAI | null = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

// Enhanced issue template with AI expansion
async function expandUserFeedback(userPrompt: string, conversationId?: string, userAgent?: string) {
  try {
    // Check if OpenAI is available
    if (!openai) {
      console.log('OpenAI not available, using structured template fallback')
      return createStructuredIssue(userPrompt, conversationId, userAgent)
    }

    const prompt = `You are a technical issue analyst. A user has reported a problem with our application. Please expand their brief description into a well-structured GitHub issue with the following sections:

## Problem Summary
[Clear, concise summary of the issue]

## Steps to Reproduce
[Numbered list of specific steps]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Additional Context
[Any technical details, error messages, or other relevant information]

## Priority Assessment
[Low/Medium/High based on the issue description]

## Suggested Solution Approach
[Brief technical suggestion for how this might be addressed]

User's original feedback: "${userPrompt}"

Please provide a comprehensive, professional issue description while maintaining the user's core concerns. Focus on making it actionable for developers.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    })

    const expandedContent = completion.choices[0]?.message?.content || userPrompt

    // Add metadata section
    const metadata = [
      "---",
      "**🤖 AI-Generated Issue Report**",
      `**Conversation ID:** ${conversationId || 'N/A'}`,
      `**User Agent:** ${userAgent || 'N/A'}`,
      `**Generated:** ${new Date().toISOString()}`,
      "",
      "*This issue was automatically expanded from user feedback using AI to provide more structure and detail.*",
      "",
      "**Assigned to:** @claude for review and implementation"
    ].join('\n')

    return `${expandedContent}\n\n${metadata}`
  } catch (error) {
    console.error('AI expansion failed:', error)
    // Fallback to structured template if AI fails
    return createStructuredIssue(userPrompt, conversationId, userAgent)
  }
}

// Fallback structured issue creation when AI is not available
function createStructuredIssue(userPrompt: string, conversationId?: string, userAgent?: string) {
  const structuredIssue = [
    "## Problem Summary",
    userPrompt,
    "",
    "## Steps to Reproduce",
    "_To be determined - more information needed from user_",
    "",
    "## Expected Behavior",
    "_To be determined - user feedback needs clarification_",
    "",
    "## Actual Behavior",
    "_Based on user description above_",
    "",
    "## Additional Context",
    "_No additional technical details provided yet_",
    "",
    "## Priority Assessment",
    "_Needs triage and evaluation_",
    "",
    "## Next Steps",
    "- [ ] Gather more specific details from user",
    "- [ ] Reproduce the issue",
    "- [ ] Assign priority level",
    "- [ ] Plan implementation approach",
    "",
    "---",
    "**📝 Structured Issue Report**",
    `**Conversation ID:** ${conversationId || 'N/A'}`,
    `**User Agent:** ${userAgent || 'N/A'}`,
    `**Generated:** ${new Date().toISOString()}`,
    "",
    "*This issue was created from user feedback using a structured template. AI enhancement was not available.*",
    "",
    "**Assigned to:** @claude for review and implementation"
  ].join('\n')

  return structuredIssue
}

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

    // Use AI enhancement if description is simple, otherwise use original format
    let issueBody: string
    const isSimpleDescription = payload.description && payload.description.trim().length < 200 && !payload.metadata?.chatTranscript

    if (isSimpleDescription) {
      // Use AI enhancement for simple user feedback
      const conversationId = crypto.randomUUID()
      const userAgent = payload.metadata?.browser || 'Unknown'
      issueBody = await expandUserFeedback(payload.description, conversationId, userAgent)
    } else {
      // Use original format for complex submissions
      issueBody = buildIssueBody(payload)
    }

    const response = await octokit.rest.issues.create({
      owner: owner,
      repo: repo,
      title: payload.title,
      body: issueBody,
      labels: isSimpleDescription
        ? ['user-feedback', 'ai-enhanced', 'needs-triage']
        : (payload.category ? [payload.category] : undefined),
    })

    console.log(`✅ GitHub issue created: #${response.data.number}`)

    return NextResponse.json({
      success: true,
      issueNumber: response.data.number,
      issueUrl: response.data.html_url,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

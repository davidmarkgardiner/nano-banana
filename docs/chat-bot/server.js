import express from 'express';
import cors from 'cors';
import { Octokit } from '@octokit/rest';
import OpenAI from 'openai';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI and Octokit
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Enhanced issue template with AI expansion
async function expandUserFeedback(userPrompt, conversationId, userAgent) {
  try {
    // Check if OpenAI is available
    if (!openai) {
      console.log('OpenAI not available, using structured template fallback');
      return createStructuredIssue(userPrompt, conversationId, userAgent);
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

Please provide a comprehensive, professional issue description while maintaining the user's core concerns. Focus on making it actionable for developers.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    });

    const expandedContent = completion.choices[0]?.message?.content || userPrompt;

    // Add metadata section
    const metadata = [
      "---",
      "**🤖 AI-Generated Issue Report**",
      `**Conversation ID:** ${conversationId}`,
      `**User Agent:** ${userAgent}`,
      `**Generated:** ${new Date().toISOString()}`,
      "",
      "*This issue was automatically expanded from user feedback using AI to provide more structure and detail.*",
      "",
      "**Assigned to:** @claude for review and implementation"
    ].join('\n');

    return `${expandedContent}\n\n${metadata}`;
  } catch (error) {
    console.error('AI expansion failed:', error);
    // Fallback to structured template if AI fails
    return createStructuredIssue(userPrompt, conversationId, userAgent);
  }
}

// Fallback structured issue creation when AI is not available
function createStructuredIssue(userPrompt, conversationId, userAgent) {
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
    `**Conversation ID:** ${conversationId}`,
    `**User Agent:** ${userAgent}`,
    `**Generated:** ${new Date().toISOString()}`,
    "",
    "*This issue was created from user feedback using a structured template. AI enhancement was not available.*",
    "",
    "**Assigned to:** @claude for review and implementation"
  ].join('\n');

  return structuredIssue;
}

// Create GitHub issue with enhanced details and assignment
async function createGitHubIssue(title, userPrompt, conversationId, userAgent) {
  try {
    // Use AI to expand the user feedback
    const expandedBody = await expandUserFeedback(userPrompt, conversationId, userAgent);

    const issueData = {
      title: title,
      body: expandedBody,
      labels: ['user-feedback', 'ai-enhanced', 'needs-triage']
      // Note: Assignee will need to be set manually or configured with a valid GitHub username
      // For now, we'll create the issue and mention @claude in the body instead
    };

    const response = await octokit.rest.issues.create({
      owner: process.env.GITHUB_OWNER || 'davidmarkgardiner',
      repo: process.env.GITHUB_REPO || 'nano-banana',
      ...issueData
    });

    console.log(`✅ GitHub issue created: #${response.data.number}`);
    return {
      success: true,
      issueNumber: response.data.number,
      issueUrl: response.data.html_url,
      message: 'Issue created and assigned to @claude with AI-enhanced details'
    };
  } catch (error) {
    console.error('GitHub issue creation error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to create GitHub issue'
    };
  }
}

// API endpoint for creating issues from user feedback
app.post('/api/report-issue', async (req, res) => {
  try {
    const {
      title,
      description,
      conversationId = 'unknown',
      userAgent = 'Unknown'
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Title and description are required'
      });
    }

    const result = await createGitHubIssue(title, description, conversationId, userAgent);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Report issue endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Test endpoint to manually create an issue
app.post('/api/test-issue', async (_req, res) => {
  const result = await createGitHubIssue(
    'Test Issue from Enhanced Chatbot',
    'This is a test issue to verify the enhanced GitHub integration with AI expansion and @claude assignment.',
    'test-conversation-id',
    'Test User Agent'
  );
  res.json(result);
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      aiExpansion: !!process.env.OPENAI_API_KEY,
      githubIntegration: !!process.env.GITHUB_TOKEN
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Chatbot server running on port ${port}`);
  console.log(`AI Enhancement: ${process.env.OPENAI_API_KEY ? '✅ Enabled' : '❌ Disabled (missing OPENAI_API_KEY)'}`);
  console.log(`GitHub Integration: ${process.env.GITHUB_TOKEN ? '✅ Enabled' : '❌ Disabled (missing GITHUB_TOKEN)'}`);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
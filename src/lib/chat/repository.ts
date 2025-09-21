import { promises as fs } from 'fs'
import path from 'path'

interface RepoSnippet {
  file: string
  score: number
  snippet: string
}

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.mdx',
  '.txt',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.yml',
  '.yaml',
])

const SEARCH_ROOTS = [
  'README.md',
  'TESTING_REPORT.md',
  'FIREBASE_SETUP_COMPLETE.md',
  'docs',
  path.join('src', 'app'),
  path.join('src', 'components'),
  path.join('src', 'context'),
  path.join('src', 'lib'),
  path.join('src', 'hooks'),
]

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'public',
  'storage',
  'tests',
])

async function walkFiles(basePath: string): Promise<string[]> {
  const entries = await fs.readdir(basePath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const fullPath = path.join(basePath, entry.name)

    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) {
        continue
      }
      files.push(...(await walkFiles(fullPath)))
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (TEXT_EXTENSIONS.has(ext)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

async function collectCandidateFiles(): Promise<string[]> {
  const root = process.cwd()
  const candidates: string[] = []

  for (const relativePath of SEARCH_ROOTS) {
    const fullPath = path.join(root, relativePath)

    try {
      const stats = await fs.stat(fullPath)

      if (stats.isDirectory()) {
        candidates.push(...(await walkFiles(fullPath)))
      } else if (stats.isFile()) {
        const ext = path.extname(fullPath).toLowerCase()
        if (!ext || TEXT_EXTENSIONS.has(ext)) {
          candidates.push(fullPath)
        }
      }
    } catch {
      // Ignore missing paths
    }
  }

  return candidates
}

function buildSnippet(content: string, keyword: string, padding = 220): string {
  const lower = content.toLowerCase()
  const index = lower.indexOf(keyword)

  if (index === -1) {
    return content.slice(0, Math.min(content.length, padding))
  }

  const start = Math.max(index - padding / 2, 0)
  const end = Math.min(index + keyword.length + padding / 2, content.length)

  return content.slice(start, end)
}

function scoreContent(content: string, keywords: string[]): number {
  const lower = content.toLowerCase()
  let score = 0

  for (const keyword of keywords) {
    if (!keyword) continue
    const occurrences = lower.split(keyword).length - 1
    if (occurrences > 0) {
      score += occurrences * (keyword.length > 6 ? 4 : 2)
    }
  }

  return score
}

export async function getRepositoryContext(query: string, limit = 3): Promise<string | null> {
  const cleanedQuery = query.trim().toLowerCase()

  if (!cleanedQuery) {
    return null
  }

  const keywords = Array.from(
    new Set(
      cleanedQuery
        .split(/[^a-zA-Z0-9]+/)
        .map((token) => token.trim())
        .filter((token) => token.length > 2)
    )
  )

  if (!keywords.length) {
    return null
  }

  const files = await collectCandidateFiles()
  const snippets: RepoSnippet[] = []

  for (const filePath of files) {
    try {
      const rawContent = await fs.readFile(filePath, 'utf-8')
      const truncatedContent = rawContent.slice(0, 24_000)
      const score = scoreContent(truncatedContent, keywords)

      if (score <= 0) {
        continue
      }

      const bestKeyword = keywords.reduce<{ keyword: string; score: number }>(
        (acc, keyword) => {
          const occurrences = truncatedContent.toLowerCase().split(keyword).length - 1
          if (occurrences > acc.score) {
            return { keyword, score: occurrences }
          }
          return acc
        },
        { keyword: keywords[0], score: 0 }
      ).keyword

      snippets.push({
        file: path.relative(process.cwd(), filePath),
        score,
        snippet: buildSnippet(truncatedContent, bestKeyword),
      })
    } catch {
      // Ignore read errors
    }
  }

  snippets.sort((a, b) => b.score - a.score)
  const topSnippets = snippets.slice(0, limit)

  if (!topSnippets.length) {
    return null
  }

  const formatted = topSnippets
    .map(
      (snippet) =>
        `File: ${snippet.file}\nScore: ${snippet.score}\n---\n${snippet.snippet.trim()}\n`
    )
    .join('\n')

  return formatted
}

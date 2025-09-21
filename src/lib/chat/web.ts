interface WebSearchResult {
  title: string
  url: string
  description: string
}

const SEARCH_ENDPOINT = 'https://api.duckduckgo.com/'

export async function searchWebSummary(query: string): Promise<string | null> {
  const trimmed = query.trim()

  if (!trimmed) {
    return null
  }

  try {
    const params = new URLSearchParams({
      q: trimmed,
      format: 'json',
      no_html: '1',
      skip_disambig: '1',
    })

    const response = await fetch(`${SEARCH_ENDPOINT}?${params.toString()}`, {
      headers: {
        'User-Agent': 'nano-banana-chatbot/1.0',
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    const results: WebSearchResult[] = []

    if (data.AbstractText) {
      results.push({
        title: data.Heading || 'Summary',
        url: data.AbstractURL || '',
        description: data.AbstractText,
      })
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic && typeof topic === 'object') {
          if (Array.isArray(topic.Topics)) {
            for (const nested of topic.Topics) {
              if (nested && typeof nested === 'object' && nested.Text && nested.FirstURL) {
                results.push({
                  title: nested.Text,
                  url: nested.FirstURL,
                  description: nested.Text,
                })
              }
            }
          } else if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text,
              url: topic.FirstURL,
              description: topic.Text,
            })
          }
        }

        if (results.length >= 4) {
          break
        }
      }
    }

    if (!results.length) {
      return null
    }

    return results
      .slice(0, 4)
      .map((result, index) => {
        const label = result.title || `Result ${index + 1}`
        const link = result.url ? `\nLink: ${result.url}` : ''
        return `${label}${link}\n${result.description}`
      })
      .join('\n\n')
  } catch {
    return null
  }
}

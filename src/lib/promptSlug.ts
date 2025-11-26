const MAX_PROMPT_SLUG_LENGTH = 60

export const createPromptSlug = (text: string): string => {
  const normalized = text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/-+/g, '-')

  if (!normalized) {
    return 'prompt'
  }

  const abbreviated = normalized
    .split(' ')
    .filter(Boolean)
    .slice(0, 6)
    .join('-')
    .replace(/-+/g, '-')

  const slug = abbreviated.slice(0, MAX_PROMPT_SLUG_LENGTH).replace(/^-+|-+$/g, '')

  return slug || 'prompt'
}

export const formatTwoDigits = (value: number): string => value.toString().padStart(2, '0')

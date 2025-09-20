export const PROMPT_SUGGESTIONS = [
  'A professional headshot of a confident business woman in natural office lighting with soft shadows',
  'A scenic mountain landscape during golden hour with rolling hills and morning mist, shot with a wide-angle lens',
  'A candid street photography scene of people walking through a bustling city market on a sunny afternoon',
  'A close-up portrait of an elderly man with weathered hands reading a book by a window with natural light',
  'A minimalist architectural photograph of a modern glass building reflecting the blue sky and white clouds',
  'A nature photograph of a serene lake surrounded by autumn trees with their colorful reflection in the water',
  'A lifestyle photo of a young couple enjoying coffee at a cozy café with warm ambient lighting',
  'A wildlife photograph of a majestic eagle in flight against a clear blue sky, captured with telephoto lens',
  'A black and white street portrait of a musician playing guitar on a cobblestone street in the evening',
  'A macro photograph of morning dew drops on flower petals with soft natural lighting and shallow depth of field'
] as const

export type PromptSuggestion = (typeof PROMPT_SUGGESTIONS)[number]

export function getRandomPromptSuggestion(): PromptSuggestion {
  const index = Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)
  return PROMPT_SUGGESTIONS[index]
}
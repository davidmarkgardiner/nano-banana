export const PROMPT_SUGGESTIONS = [
  'A bioluminescent rainforest at midnight with misty waterfalls and glowing wildlife painted in vibrant watercolor strokes',
  'An ancient library carved into a mountainside, lit by floating candles and filled with swirling constellations',
  'A futuristic jazz club on a floating island with neon holographic musicians and Art Deco architecture',
  'A serene tea ceremony held by robots in a moss-covered Kyoto garden at golden hour',
  'An underwater metropolis built inside glowing coral domes with manta-ray taxis gliding through the streets',
  'A steampunk airship market at dawn with merchants selling clockwork creatures beneath billowing copper balloons',
  'A cozy cottage perched on a giant turtle traveling across a starlit desert with aurora-filled skies',
  'A retro-futuristic diner on the moon serving cosmic milkshakes under a panoramic view of Earthrise',
  'A crystalline ice palace orchestra performing for snow spirits during a swirling aurora borealis',
  'A whimsical botanical laboratory where plants float midair and emit soft pastel light in a dreamy oil painting style'
] as const

export type PromptSuggestion = (typeof PROMPT_SUGGESTIONS)[number]

export function getRandomPromptSuggestion(): PromptSuggestion {
  const index = Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)
  return PROMPT_SUGGESTIONS[index]
}
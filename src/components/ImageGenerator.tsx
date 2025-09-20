'use client'

import { User } from 'firebase/auth'
import { useImageGeneration } from '@/hooks/useImageGeneration'
import TextPromptInput from '@/components/TextPromptInput'
import ImageDisplay from '@/components/ImageDisplay'
import UserHeader from '@/components/UserHeader'
import PromptInspiration from '@/components/PromptInspiration'

interface ImageGeneratorProps {
  user: User
  onLogout: () => Promise<void>
}

const samplePrompts = [
  {
    label: 'Neon city rain',
    prompt:
      'Neon cyberpunk street at night with rain-slick reflections, glowing holographic signs, and umbrellas in motion'
  },
  {
    label: 'Astronaut escape',
    prompt:
      'An astronaut relaxing in a hammock on a tropical beach at sunset, painted in vibrant watercolor strokes'
  },
  {
    label: 'Cozy reading nook',
    prompt:
      'Golden morning light illuminating a cozy reading nook filled with lush plants, vintage books, and a sleeping cat'
  }
]

const quickTips = [
  {
    title: 'Paint the scene',
    description: 'Mention mood, lighting, color palette, and art style so the model understands the vibe you want.',
    accent: 'from-cyan-500/30 via-sky-500/10 to-sky-500/5',
    icon: '🎨'
  },
  {
    title: 'Tell a story',
    description: 'Describe an action or moment in time to add depth. Think about who is there, what is happening, and why.',
    accent: 'from-violet-500/30 via-fuchsia-500/10 to-fuchsia-500/5',
    icon: '📖'
  },
  {
    title: 'Work quickly',
    description: 'Press ⌘ + Enter (Mac) or Ctrl + Enter (PC) to generate instantly. Use Retry to refresh with the same idea.',
    accent: 'from-emerald-500/30 via-emerald-500/10 to-emerald-500/5',
    icon: '⌨️'
  }
]

const highlightPills = [
  { icon: '⚡', text: 'Live feedback while you generate' },
  { icon: '🖼️', text: '1024px high-definition output' },
  { icon: '⬇️', text: 'One-click download & share ready' }
]

export default function ImageGenerator({ user, onLogout }: ImageGeneratorProps) {
  const {
    prompt,
    setPrompt,
    generatedImage,
    isLoading,
    error,
    generateImage,
    clearError,
    reset
  } = useImageGeneration()

  const handleRetry = () => {
    clearError()
    void generateImage()
  }

  const handleClear = () => {
    reset()
  }

  const handleSamplePromptSelect = (value: string) => {
    if (isLoading) {
      return
    }
    clearError()
    setPrompt(value)
    void generateImage(value)
  }

  const handlePromptInspirationUse = (value: string) => {
    if (isLoading) {
      return
    }
    clearError()
    setPrompt(value)
    void generateImage(value)
  }

  const shouldShowTips = !generatedImage && !isLoading

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-10%] h-[480px] w-[480px] rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-[-30%] right-[-10%] h-[520px] w-[520px] rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-[320px] bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      <UserHeader
        user={user}
        onLogout={onLogout}
        className="relative z-20 mx-auto w-full max-w-7xl px-6 pt-8 lg:px-12"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col-reverse items-center gap-12 px-6 pb-20 pt-12 lg:flex-row lg:items-stretch lg:gap-16 lg:px-12">
        <div className="w-full lg:w-[420px] xl:w-[460px]">
          <div className="flex h-full flex-col gap-8 text-center lg:text-left">
            <div className="space-y-5">
              <span className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
                AI Canvas
              </span>
              <h2 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Create Your AI Image
              </h2>
              <p className="text-base text-slate-200/80">
                Describe your vision and watch the canvas come alive with color, texture, and light in just a few seconds.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              {highlightPills.map((pill) => (
                <span
                  key={pill.text}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-100 backdrop-blur-sm"
                >
                  <span className="text-base">{pill.icon}</span>
                  {pill.text}
                </span>
              ))}
            </div>

            <PromptInspiration onUsePrompt={handlePromptInspirationUse} isGenerating={isLoading} />

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-lg backdrop-blur-xl">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                  Prompt inspiration
                </p>
                <span className="text-[10px] font-medium text-slate-200/70">Tap to fill the editor</span>
              </div>
              <div className="mt-3 grid gap-2">
                {samplePrompts.map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => handleSamplePromptSelect(sample.prompt)}
                    className="group rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-left transition hover:border-white/40 hover:bg-slate-900/60"
                  >
                    <p className="text-sm font-semibold text-white">{sample.label}</p>
                    <p className="mt-1 text-xs text-slate-200/80 group-hover:text-slate-100">
                      {sample.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <TextPromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={generateImage}
              isLoading={isLoading}
              error={error}
              className="mx-0 max-w-none"
            />
          </div>
        </div>

        <div className="relative flex w-full flex-1 items-center justify-center">
          <div className="absolute -inset-10 hidden rounded-[48px] bg-gradient-to-br from-sky-500/20 via-purple-500/10 to-transparent blur-3xl lg:block" />
          <div className="relative w-full max-w-[620px]">
            <ImageDisplay
              imageUrl={generatedImage}
              isLoading={isLoading}
              error={error}
              prompt={prompt}
              onRetry={handleRetry}
              onRegenerate={handleRetry}
              onClear={handleClear}
              variant="hero"
            />

            {generatedImage && !isLoading && !error && (
              <div className="mt-6 flex justify-center lg:justify-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 shadow-[0_20px_60px_-30px_rgba(52,211,153,0.65)]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                  Image generated successfully!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {shouldShowTips && (
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 lg:px-12">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-100">Quick guidance</p>
                <h3 className="mt-3 text-2xl font-semibold text-white">
                  Craft prompts that glow with detail
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-200/80">
                  These tips help the model understand what matters most in your scene. Try combining them with the inspiration prompts above for instant results.
                </p>
              </div>
              <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quickTips.map((tip) => (
                  <div
                    key={tip.title}
                    className={`rounded-2xl border border-white/10 bg-gradient-to-br ${tip.accent} p-5 text-left shadow-lg backdrop-blur-xl`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{tip.icon}</span>
                      <span className="h-2 w-2 rounded-full bg-white/60" />
                    </div>
                    <h4 className="mt-4 text-base font-semibold text-white">{tip.title}</h4>
                    <p className="mt-2 text-sm text-slate-100/80">{tip.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
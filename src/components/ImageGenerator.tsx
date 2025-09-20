'use client'

import { FormEvent, ChangeEvent, useState } from 'react'
import { User } from 'firebase/auth'
import { useImageGeneration } from '@/hooks/useImageGeneration'
import TextPromptInput from '@/components/TextPromptInput'
import ImageDisplay from '@/components/ImageDisplay'
import UserHeader from '@/components/UserHeader'
import PromptInspiration from '@/components/PromptInspiration'
import { useCanvasImage } from '@/context/CanvasImageContext'
import { ImageFilter } from '@/lib/imageFilters'
import { useImageRemix } from '@/hooks/useImageRemix'

interface ImageGeneratorProps {
  user: User
  onLogout: () => Promise<void>
}


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
  const [tipsExpanded, setTipsExpanded] = useState(false)
  const {
    prompt,
    setPrompt,
    isLoading,
    error,
    generateImage,
    clearError,
    reset
  } = useImageGeneration()

  const {
    currentImage,
    filter,
    applyFilter,
    isProcessing,
    error: canvasError,
  } = useCanvasImage()

  const {
    instruction,
    setInstruction,
    isRemixing,
    error: remixError,
    lastInstruction,
    remixImage,
    clearError: clearRemixError,
  } = useImageRemix()


  const handleRetry = () => {
    clearError()
    void generateImage()
  }

  const handleClear = () => {
    reset()
  }


  const handlePromptInspirationUse = (value: string) => {
    if (isLoading) {
      return
    }
    clearError()
    setPrompt(value)
    void generateImage(value)
  }

  const shouldShowTips = !currentImage && !isLoading

  const handleFilterChange = async (value: ImageFilter) => {
    await applyFilter(value)
  }

  const promptLabel = currentImage?.source === 'uploaded' ? 'Image details' : 'Prompt'
  const displayPrompt = currentImage
    ? currentImage.prompt ?? (currentImage.source === 'uploaded' ? 'Uploaded photo' : prompt)
    : prompt
  const displayError = [error, canvasError].filter(Boolean).join(' ') || null

  const handleInstructionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (remixError) {
      clearRemixError()
    }
    setInstruction(event.target.value)
  }

  const handleRemixSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await remixImage()
  }

  const isRemixDisabled = isLoading || isProcessing || isRemixing

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

      <div className="relative z-10 mx-auto w-full px-6 pb-20 pt-12 lg:px-12">
        <div className="flex flex-col gap-12">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 text-center lg:items-start lg:text-left">
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

            <PromptInspiration onUsePrompt={handlePromptInspirationUse} isGenerating={isLoading} className="max-w-2xl mx-auto" />


            <TextPromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={generateImage}
              isLoading={isLoading}
              error={error}
              className="max-w-5xl lg:mx-0"
            />
          </div>
          <div className="relative flex w-full items-center justify-center">
            <div className="absolute -inset-10 hidden rounded-[48px] bg-gradient-to-br from-sky-500/20 via-purple-500/10 to-transparent blur-3xl lg:block" />
            <div className="relative w-full">
              <ImageDisplay
                imageUrl={currentImage?.displayUrl ?? null}
                isLoading={isLoading}
                error={displayError}
                prompt={displayPrompt}
                promptLabel={promptLabel}
                onRetry={currentImage?.source === 'generated' ? handleRetry : undefined}
                onRegenerate={currentImage?.source === 'generated' ? handleRetry : undefined}
                onClear={currentImage ? handleClear : undefined}
                variant="hero"
                className="max-w-none"
              />

              {currentImage?.source === 'generated' && !isLoading && !displayError && (
                <div className="mt-6 flex justify-center lg:justify-end">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 shadow-[0_20px_60px_-30px_rgba(52,211,153,0.65)]">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                    Image generated successfully!
                  </div>
                </div>
              )}

              {currentImage && (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-xl backdrop-blur-2xl">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                          Active canvas image
                        </p>
                        <h4 className="text-lg font-semibold text-white">
                          {currentImage.source === 'generated' ? 'AI generated result' : 'Uploaded photo'}
                        </h4>
                        <p className="text-sm text-slate-200/70">
                          Apply creative looks or send the canvas to Nano Banana for bespoke edits.
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label htmlFor="canvas-filter" className="text-sm font-medium text-slate-200">
                          Filter
                        </label>
                        <select
                          id="canvas-filter"
                          value={filter}
                          onChange={(event) => void handleFilterChange(event.target.value as ImageFilter)}
                          disabled={isProcessing}
                          className="min-w-[180px] rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100 backdrop-blur-lg transition-colors focus:border-white/40 focus:outline-none disabled:opacity-60"
                        >
                          <option value="none">Original colors</option>
                          <option value="grayscale">Dramatic grayscale</option>
                          <option value="sepia">Warm sepia</option>
                          <option value="invert">Pop art invert</option>
                        </select>
                        {isProcessing && (
                          <div className="flex items-center gap-2 text-sm text-slate-200/70">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                            Applying filter…
                          </div>
                        )}
                      </div>

                      {canvasError && (
                        <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                          {canvasError}
                        </p>
                      )}
                    </div>

                    <form onSubmit={handleRemixSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-30px_rgba(59,130,246,0.45)] backdrop-blur-xl">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">
                        <span className="h-2 w-2 rounded-full bg-emerald-300" />
                        Nano Banana edits
                      </div>
                      <h5 className="mt-3 text-lg font-semibold text-white">Describe the changes you need</h5>
                      <p className="mt-2 text-sm text-slate-200/70">
                        Tell Nano Banana what to adjust—like changing hat colors, swapping props, or updating the background. The current canvas is sent along with your instruction.
                      </p>

                      <label htmlFor="nano-banana-instruction" className="sr-only">
                        Editing instructions
                      </label>
                      <textarea
                        id="nano-banana-instruction"
                        value={instruction}
                        onChange={handleInstructionChange}
                        placeholder="Example: make the hat black and replace the flowers with bananas"
                        rows={4}
                        className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-white/30 focus:outline-none"
                        disabled={isRemixDisabled}
                      />

                      {remixError && (
                        <p className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
                          {remixError}
                        </p>
                      )}

                      {lastInstruction && !remixError && !instruction && (
                        <p className="mt-3 text-xs text-slate-300/70">
                          Last instruction applied: <span className="font-medium text-slate-100">{lastInstruction}</span>
                        </p>
                      )}

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="submit"
                          disabled={isRemixDisabled}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/20 px-5 py-2 text-sm font-semibold text-emerald-100 transition-all hover:border-emerald-400 hover:bg-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRemixing && (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-200 border-t-transparent" />
                          )}
                          {isRemixing ? 'Sending to Nano Banana…' : 'Apply Nano Banana edit'}
                        </button>
                        <p className="text-xs text-slate-300/70">
                          {isRemixing
                            ? 'Nano Banana is working on the transformation…'
                            : 'Edits typically take a few seconds.'}
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {shouldShowTips && (
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 lg:px-12">
          <div
            className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setTipsExpanded(true)}
            onMouseLeave={() => setTipsExpanded(false)}
            onClick={() => setTipsExpanded(!tipsExpanded)}
          >
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-100">Quick guidance</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    Craft prompts that glow with detail
                  </h3>
                  {!tipsExpanded && (
                    <p className="mt-2 text-sm text-slate-200/60">
                      Hover or click to see helpful tips
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl transition-transform duration-300 ${tipsExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {tipsExpanded && (
                <div className="mt-6 space-y-6">
                  <p className="max-w-2xl text-sm text-slate-200/80">
                    These tips help the model understand what matters most in your scene. Try combining them with the inspiration prompts above for instant results.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
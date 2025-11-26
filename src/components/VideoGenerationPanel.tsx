'use client'

import { useMemo } from 'react'
import { useVideoGeneration } from '@/hooks/useVideoGeneration'
import { useCanvasImage } from '@/context/CanvasImageContext'

interface VideoGenerationPanelProps {
  className?: string
}

const durationOptions: Array<{ label: string; value: 4 | 6 | 8; hint: string }> = [
  { label: '4s', value: 4, hint: 'Fast cut' },
  { label: '6s', value: 6, hint: 'Balanced' },
  { label: '8s', value: 8, hint: 'Longest (req for 1080p)' },
]

export default function VideoGenerationPanel({ className = '' }: VideoGenerationPanelProps) {
  const { currentImage } = useCanvasImage()
  const {
    prompt,
    setPrompt,
    aspectRatio,
    setAspectRatio,
    durationSeconds,
    setDurationSeconds,
    resolution,
    setResolution,
    negativePrompt,
    setNegativePrompt,
    allowPeople,
    setAllowPeople,
    model,
    setModel,
    useReferenceImage,
    setUseReferenceImage,
    referenceImageDataUrl,
    setReferenceImageDataUrl,
    setReferenceFromCanvas,
    isLoading,
    error,
    videoUrl,
    statusMessage,
    generateVideo,
    clearError,
    reset,
  } = useVideoGeneration()

  const resolutionNotice = useMemo(() => {
    if (resolution === '1080p') {
      return '1080p requires 16:9 at 8s'
    }
    return '720p recommended for quick previews'
  }, [resolution])

  const hasReferenceCandidate = Boolean(currentImage || referenceImageDataUrl)

  // Reference images require specific settings - disable controls when enabled
  const isAspectLocked = useReferenceImage
  const isDurationLocked = useReferenceImage

  // Generate download filename from prompt
  const downloadFilename = useMemo(() => {
    const slug = prompt
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 40)
    return `veo-${slug || 'video'}-${Date.now()}.mp4`
  }, [prompt])

  // Proxy URL for Gemini videos (requires API key authentication)
  const proxyVideoUrl = useMemo(() => {
    if (!videoUrl) return null
    if (videoUrl.includes('generativelanguage.googleapis.com')) {
      return `/api/video-proxy?url=${encodeURIComponent(videoUrl)}`
    }
    return videoUrl
  }, [videoUrl])

  return (
    <div
      className={[
        'rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-2xl',
        'text-left text-slate-100',
        className,
      ].join(' ')}
      role="region"
      aria-label="Video generation panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">New - Video beta</p>
          <h3 className="text-xl font-semibold text-white">Generate Veo videos</h3>
          <p className="text-sm text-slate-200/70">
            Craft a cinematic shot and render a short video with Gemini&apos;s Veo model.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={isLoading}
          aria-label="Reset video generation form"
          className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-white/30 disabled:opacity-60"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="text-sm font-medium text-slate-100">
            Prompt
            <textarea
              value={prompt}
              onChange={(event) => {
                if (error) clearError()
                setPrompt(event.target.value)
              }}
              rows={4}
              placeholder="Example: Drone shot of a surfer riding a golden wave at sunset, cinematic lighting, slow motion"
              className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
              disabled={isLoading}
              aria-describedby="prompt-hint"
            />
            <span id="prompt-hint" className="sr-only">
              Describe the video scene you want to generate. Be descriptive about camera angles, lighting, and motion.
            </span>
          </label>

          <label className="text-sm font-medium text-slate-100">
            Negative prompt (optional)
            <input
              value={negativePrompt}
              onChange={(event) => {
                if (error) clearError()
                setNegativePrompt(event.target.value)
              }}
              placeholder="Things to avoid (e.g., blur, artifacts)"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
              disabled={isLoading}
            />
          </label>

          <fieldset className="flex flex-wrap items-center gap-3">
            <legend className="text-sm font-medium text-slate-100">Allow people</legend>
            <button
              type="button"
              onClick={() => setAllowPeople(!allowPeople)}
              disabled={isLoading}
              aria-pressed={allowPeople}
              aria-label={`Allow people generation: ${allowPeople ? 'enabled' : 'disabled'}`}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                allowPeople
                  ? 'border-emerald-400/50 bg-emerald-400/10 text-emerald-100'
                  : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/30'
              } disabled:opacity-60`}
            >
              {allowPeople ? 'Enabled' : 'Disabled'}
            </button>
            <span className="text-xs text-slate-400">
              Respect content policies; 1080p only 16:9 at 8s.
            </span>
          </fieldset>

          <fieldset className="flex flex-wrap items-center gap-3">
            <legend className="text-sm font-medium text-slate-100">Use canvas image as reference</legend>
            <button
              type="button"
              onClick={() => {
                if (!hasReferenceCandidate) return
                const next = !useReferenceImage
                setUseReferenceImage(next)
                if (!useReferenceImage && hasReferenceCandidate) {
                  setAspectRatio('16:9')
                  setDurationSeconds(8)
                  void setReferenceFromCanvas()
                }
              }}
              disabled={isLoading || !hasReferenceCandidate}
              aria-pressed={useReferenceImage}
              aria-label={`Use reference image: ${useReferenceImage ? 'enabled' : 'disabled'}`}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                useReferenceImage
                  ? 'border-sky-400/50 bg-sky-400/10 text-sky-50'
                  : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/30'
              } disabled:opacity-60`}
            >
              {useReferenceImage ? 'Enabled' : hasReferenceCandidate ? 'Use current image' : 'No image available'}
            </button>
            <span className="text-xs text-slate-400">
              Reference requires 16:9 & 8s. Automatically enforced when enabled.
            </span>
            {!hasReferenceCandidate && (
              <span className="text-xs text-rose-200">Add a generated or uploaded image first.</span>
            )}
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="reference-upload" className="text-sm font-medium text-slate-100">
              Upload reference image (optional)
            </label>
            <input
              id="reference-upload"
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    if (error) clearError()
                    setReferenceImageDataUrl(reader.result)
                    setUseReferenceImage(true)
                    setAspectRatio('16:9')
                    setDurationSeconds(8)
                  }
                }
                reader.readAsDataURL(file)
              }}
              disabled={isLoading}
              className="block w-full cursor-pointer rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:border-white/30 disabled:opacity-60"
            />
            {referenceImageDataUrl && (
              <p className="text-xs text-emerald-200" role="status">Reference image attached.</p>
            )}
            {!referenceImageDataUrl && useReferenceImage && (
              <p className="text-xs text-rose-200" role="alert">No reference detected - upload a file or add a canvas image.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <fieldset className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
              <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Aspect</legend>
              <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Aspect ratio">
                {(['16:9', '9:16'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={aspectRatio === value}
                    onClick={() => setAspectRatio(value)}
                    disabled={isLoading || isAspectLocked}
                    title={isAspectLocked ? 'Locked to 16:9 when using reference image' : undefined}
                    className={`w-full rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      aspectRatio === value
                        ? 'border-sky-400/70 bg-sky-400/10 text-sky-100'
                        : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/30'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {isAspectLocked && (
                <p className="mt-2 text-xs text-amber-200">Locked to 16:9 for reference images</p>
              )}
            </fieldset>

            <fieldset className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
              <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Model</legend>
              <div className="mt-3 space-y-2" role="radiogroup" aria-label="Video model">
                {[
                  { value: 'veo-3.1-generate-preview', label: 'Veo 3.1 (Preview)' },
                  { value: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast' },
                  { value: 'veo-3.0-generate-001', label: 'Veo 3.0' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={model === option.value}
                    onClick={() => setModel(option.value)}
                    disabled={isLoading}
                    className={`w-full rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      model === option.value
                        ? 'border-purple-400/70 bg-purple-400/10 text-purple-100'
                        : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/30'
                    } disabled:opacity-60`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
              <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Resolution</legend>
              <div className="mt-3 space-y-2" role="radiogroup" aria-label="Video resolution">
                {(['720p', '1080p'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={resolution === value}
                    onClick={() => setResolution(value)}
                    disabled={isLoading || (value === '1080p' && (aspectRatio !== '16:9' || durationSeconds !== 8))}
                    className={`w-full rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      resolution === value
                        ? 'border-indigo-400/70 bg-indigo-400/10 text-indigo-100'
                        : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/30'
                    } disabled:opacity-60`}
                  >
                    {value}
                  </button>
                ))}
                <p className="text-xs text-slate-400">{resolutionNotice}</p>
              </div>
            </fieldset>
          </div>

          <fieldset className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
            <legend className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Duration</legend>
            <div className="mt-3 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Video duration">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={durationSeconds === option.value}
                  onClick={() => setDurationSeconds(option.value)}
                  disabled={isLoading || isDurationLocked}
                  title={isDurationLocked ? 'Locked to 8s when using reference image' : undefined}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    durationSeconds === option.value
                      ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-slate-100 hover:border-white/30'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span className="block">{option.label}</span>
                  <span className="text-[11px] font-normal text-slate-300/70">{option.hint}</span>
                </button>
              ))}
            </div>
            {isDurationLocked && (
              <p className="mt-2 text-xs text-amber-200">Locked to 8s for reference images</p>
            )}
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void generateVideo()}
              disabled={isLoading || !prompt.trim()}
              aria-busy={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-sky-500/50 disabled:opacity-60"
            >
              {isLoading && (
                <span
                  className="h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-transparent"
                  aria-hidden="true"
                />
              )}
              {isLoading ? 'Rendering...' : 'Generate video'}
            </button>
            <span className="text-xs text-slate-400" role="status" aria-live="polite">
              {statusMessage}
            </span>
          </div>

          {error && (
            <p
              className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
      </div>

      {videoUrl && proxyVideoUrl && (
        <div className="mt-8 space-y-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-100">Preview</p>
              <p className="text-sm text-slate-200/80">Your generated clip</p>
            </div>
            <a
              href={proxyVideoUrl}
              download={downloadFilename}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 hover:border-white/30"
            >
              Download
            </a>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
            <video
              src={proxyVideoUrl}
              controls
              className="h-full w-full"
              aria-label="Generated video preview"
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </div>
  )
}

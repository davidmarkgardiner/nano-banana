# Gemini / Veo Video Generation Design

Draft plan for adding video generation using Gemini (Veo) with the `generateVideos` long-running operation flow. This is design-only—no code has been changed yet.

## Goals
- Add a server endpoint and shared SDK helper that wrap `ai.models.generateVideos` and poll the operation to completion, then download the MP4.
- Provide a frontend experience with prompt + controls (aspect, duration, resolution) and a progress-aware UI that plays or downloads the generated video.
- Keep API parity with existing image routes, including error handling, validation, and optional Firebase Storage auto-save.

## API Shapes (proposed)
```ts
// Request from client to Next.js route
export interface VideoGenerationRequest {
  prompt: string
  aspectRatio: '16:9' | '9:16'
  durationSeconds: 4 | 6 | 8
  resolution?: '720p' | '1080p'  // default 720p; 1080p only for 16:9 + 8s
  negativePrompt?: string
  personGeneration?: boolean     // enable people generation (if allowed)
  referenceImageDataUrl?: string // single base64 data URL; enforces 16:9 + 8s
  model?: string                 // Veo model selection (veo-3.1-generate-preview, veo-3.0, veo-3.0-lite)
}

// Immediate response (polling-friendly)
export interface VideoGenerationQueued {
  operationId: string
  metadata: {
    model: string
    aspectRatio: '16:9' | '9:16'
    durationSeconds: 4 | 6 | 8
    resolution: '720p' | '1080p'
    prompt: string
    requestedAt: string
  }
}

// Polling response
export interface VideoGenerationStatus {
  operationId: string
  status: 'pending' | 'running' | 'succeeded' | 'failed'
  progressPct?: number
  videoUrl?: string              // signed URL or data URL when ready
  error?: string
  metadata?: {
    model: string
    aspectRatio: '16:9' | '9:16'
    durationSeconds: 4 | 6 | 8
    resolution: '720p' | '1080p'
    generatedAt?: string
  }
}

// Final resolved payload (if we skip polling or after status = succeeded)
export interface VideoGenerationResponse {
  videoUrl: string
  id: string
  metadata: {
    model: string
    durationSeconds: number
    aspectRatio: '16:9' | '9:16'
    resolution: '720p' | '1080p'
    generatedAt: string
    prompt: string
  }
}
```

## Backend Plan
- Route: `POST /api/generate-video` (returns `VideoGenerationQueued` or directly `VideoGenerationResponse` if we choose to await).
- Helper in `packages/nano-banana-api`: `handleVideoGeneration(request: NextRequest | Request)`.
- Flow:
  1) Validate request (prompt length 3–500, aspect/duration/resolution compatibility, optional negative prompt max length ~300).
  2) Instantiate `GoogleGenerativeAI` with `GEMINI_API_KEY`.
  3) Call `ai.models.generateVideos({ model: GEMINI_VIDEO_MODEL || 'veo-3.1-generate-preview', prompt, aspectRatio, durationSeconds, resolution, negativePrompt, personGeneration })`.
  4) Poll operation via `ai.operations.getVideosOperation({ operation })` until `done` or timeout (target 60–90s). Include small backoff (e.g., 5–10s).
  5) On success, `ai.files.download({ file: operation.response.generatedVideos[0].video })`, stream buffer to a data URL or temporary signed file (preferred: store in Firebase Storage if user is signed in, else return data URL or proxy stream).
  6) Return `VideoGenerationResponse` with metadata.
- Errors: map safety/recitation to 400, quota to 429, auth to 401, timeout to 408, generic 500.
- Rate limiting: reuse in-memory limiter from transfuse route (10 req/min/ip). Add `Content-Type: application/json` and `content-length` guard (<20MB).
- Auth: keep same guarded behavior as other API routes (if later gated by auth/role).

## Validation Matrix (from docs, conservatively enforced)
- `aspectRatio`: `16:9` or `9:16`.
- `durationSeconds`: `4 | 6 | 8` (8 required when using reference images or extensions; we will enforce 8 for any future referenceImages flag).
- `resolution`: `720p` default. `1080p` only when `aspectRatio === '16:9'` **and** `durationSeconds === 8`. Reject `1080p` for 9:16 or shorter durations.
- `prompt`: 3–500 chars. `negativePrompt`: 0–300 chars. Strip control chars and collapse whitespace.

## Frontend Hook Plan
- `useVideoGeneration` state: `prompt`, `aspectRatio`, `durationSeconds`, `resolution`, `negativePrompt`, `allowPeople`, `isLoading`, `status`, `videoUrl`, `error`.
- Behavior: POST to `/api/generate-video`, store `operationId`, poll `/api/generate-video/status?id=...` until ready, then render `<video controls>`; expose `reset` and `retry`.
- UI: “Video” tab with fields for prompt, aspect (selector), duration (radio), resolution (selector with disabled states per rules), negative prompt (optional), “Allow people” toggle, generate button, progress text, and final player + download link.

## Config
- `GEMINI_API_KEY` (existing).
- `GEMINI_VIDEO_MODEL` (default `veo-3.1-generate-preview`).
- `GEMINI_VIDEO_TIMEOUT_MS` (optional, default 90000).
- `NEXT_PUBLIC_USE_REAL_API` already controls mock vs real; extend it to video.

## Open Decisions
- Storage: return data URL vs. upload to Firebase Storage and return a signed URL. Preference: upload for signed-in users to keep payload small; fall back to data URL for anonymous.
- Progress UI: expose server-side polling endpoint vs. single long request. Lean toward polling endpoint for stability on Vercel.
- Reference images / extensions: punt for v1; reserve fields in request for future expansion.

## Next Steps (for implementation)
1) Add shared types to `src/types` and `packages/nano-banana-api/src/types`.
2) Implement `/api/generate-video` + optional `/api/generate-video/status`.
3) Extend `nanoBananaAPI` client with `generateVideo`.
4) Build `useVideoGeneration` + UI tab and player.
5) Add tests: validation unit tests, API integration mock, Playwright UI happy path.

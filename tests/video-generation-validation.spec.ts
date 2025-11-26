import { test, expect } from '@playwright/test'
import { validateVideoPayload, isValidationError } from '../src/lib/videoValidation'

test.describe('Video generation validation', () => {
  test('rejects missing prompt', () => {
    const result = validateVideoPayload({ prompt: '', aspectRatio: '16:9', durationSeconds: 4, resolution: '720p' })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('required')
    }
  })

  test('rejects prompt too short', () => {
    const result = validateVideoPayload({ prompt: 'hi', aspectRatio: '16:9', durationSeconds: 4, resolution: '720p' })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('between')
    }
  })

  test('accepts prompt at minimum boundary (3 chars)', () => {
    const result = validateVideoPayload({ prompt: 'abc', aspectRatio: '16:9', durationSeconds: 4, resolution: '720p' })
    expect(isValidationError(result)).toBeFalsy()
  })

  test('accepts prompt at maximum boundary (1200 chars)', () => {
    const longPrompt = 'a'.repeat(1200)
    const result = validateVideoPayload({ prompt: longPrompt, aspectRatio: '16:9', durationSeconds: 4, resolution: '720p' })
    expect(isValidationError(result)).toBeFalsy()
  })

  test('rejects prompt exceeding maximum (1201 chars)', () => {
    const tooLongPrompt = 'a'.repeat(1201)
    const result = validateVideoPayload({ prompt: tooLongPrompt, aspectRatio: '16:9', durationSeconds: 4, resolution: '720p' })
    expect(isValidationError(result)).toBeTruthy()
  })

  test('rejects invalid aspect ratio', () => {
    const result = validateVideoPayload({ prompt: 'hello', aspectRatio: '1:1', durationSeconds: 4, resolution: '720p' })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('aspectRatio')
    }
  })

  test('rejects invalid duration', () => {
    const result = validateVideoPayload({ prompt: 'hello there', aspectRatio: '16:9', durationSeconds: 10, resolution: '720p' })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('durationSeconds')
    }
  })

  test('rejects 1080p with 9:16 aspect', () => {
    const result = validateVideoPayload({ prompt: 'hello there', aspectRatio: '9:16', durationSeconds: 8, resolution: '1080p' })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('1080p')
    }
  })

  test('rejects 1080p with duration less than 8s', () => {
    const result = validateVideoPayload({ prompt: 'hello there', aspectRatio: '16:9', durationSeconds: 6, resolution: '1080p' })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('1080p')
    }
  })

  test('accepts valid 1080p combo (16:9 + 8s)', () => {
    const result = validateVideoPayload({ prompt: 'hello there', aspectRatio: '16:9', durationSeconds: 8, resolution: '1080p' })
    expect(isValidationError(result)).toBeFalsy()
    if (!isValidationError(result)) {
      expect(result.resolution).toBe('1080p')
    }
  })

  test('rejects unsupported model', () => {
    const result = validateVideoPayload({ prompt: 'hello there', aspectRatio: '16:9', durationSeconds: 8, resolution: '720p', model: 'not-a-veo' })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('model')
    }
  })

  test('accepts valid models', () => {
    const validModels = ['veo-3.1-generate-preview', 'veo-3.1-fast-generate-preview', 'veo-3.0-generate-001']
    for (const model of validModels) {
      const result = validateVideoPayload({ prompt: 'hello', aspectRatio: '16:9', durationSeconds: 4, resolution: '720p', model })
      expect(isValidationError(result)).toBeFalsy()
    }
  })

  test('rejects reference image with wrong aspect', () => {
    const result = validateVideoPayload({
      prompt: 'hello there',
      aspectRatio: '9:16',
      durationSeconds: 8,
      resolution: '720p',
      referenceImageDataUrl: 'data:image/png;base64,AAAA',
    })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('16:9')
    }
  })

  test('rejects reference image with wrong duration', () => {
    const result = validateVideoPayload({
      prompt: 'hello there',
      aspectRatio: '16:9',
      durationSeconds: 4,
      resolution: '720p',
      referenceImageDataUrl: 'data:image/png;base64,AAAA',
    })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('8')
    }
  })

  test('accepts reference image with correct settings', () => {
    const result = validateVideoPayload({
      prompt: 'hello there',
      aspectRatio: '16:9',
      durationSeconds: 8,
      resolution: '720p',
      referenceImageDataUrl: 'data:image/png;base64,AAAA',
    })
    expect(isValidationError(result)).toBeFalsy()
  })

  test('rejects invalid reference image data URL', () => {
    const result = validateVideoPayload({
      prompt: 'hello there',
      aspectRatio: '16:9',
      durationSeconds: 8,
      resolution: '720p',
      referenceImageDataUrl: 'not-a-data-url',
    })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('base64')
    }
  })

  test('rejects non-image data URL', () => {
    const result = validateVideoPayload({
      prompt: 'hello there',
      aspectRatio: '16:9',
      durationSeconds: 8,
      resolution: '720p',
      referenceImageDataUrl: 'data:text/plain;base64,AAAA',
    })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('image')
    }
  })

  test('accepts negative prompt at boundary (300 chars)', () => {
    const negativePrompt = 'a'.repeat(300)
    const result = validateVideoPayload({
      prompt: 'hello',
      aspectRatio: '16:9',
      durationSeconds: 4,
      resolution: '720p',
      negativePrompt,
    })
    expect(isValidationError(result)).toBeFalsy()
  })

  test('rejects negative prompt exceeding limit (301 chars)', () => {
    const negativePrompt = 'a'.repeat(301)
    const result = validateVideoPayload({
      prompt: 'hello',
      aspectRatio: '16:9',
      durationSeconds: 4,
      resolution: '720p',
      negativePrompt,
    })
    expect(isValidationError(result)).toBeTruthy()
    if (isValidationError(result)) {
      expect(result.error).toContain('negativePrompt')
    }
  })

  test('handles personGeneration flag', () => {
    const result = validateVideoPayload({
      prompt: 'hello',
      aspectRatio: '16:9',
      durationSeconds: 4,
      resolution: '720p',
      personGeneration: true,
    })
    expect(isValidationError(result)).toBeFalsy()
    if (!isValidationError(result)) {
      expect(result.personGeneration).toBe(true)
    }
  })

  test('accepts valid payload with all fields', () => {
    const result = validateVideoPayload({
      prompt: 'Drone shot of waves at sunrise',
      aspectRatio: '16:9',
      durationSeconds: 6,
      resolution: '720p',
      negativePrompt: 'blur, artifacts',
      personGeneration: false,
      model: 'veo-3.0-generate-001',
    })

    expect(isValidationError(result)).toBeFalsy()
    if (!isValidationError(result)) {
      expect(result.resolution).toBe('720p')
      expect(result.aspectRatio).toBe('16:9')
      expect(result.durationSeconds).toBe(6)
      expect(result.model).toBe('veo-3.0-generate-001')
      expect(result.negativePrompt).toBe('blur, artifacts')
    }
  })

  test('defaults resolution to 720p when not provided', () => {
    const result = validateVideoPayload({
      prompt: 'hello',
      aspectRatio: '16:9',
      durationSeconds: 4,
    })
    expect(isValidationError(result)).toBeFalsy()
    if (!isValidationError(result)) {
      expect(result.resolution).toBe('720p')
    }
  })

  test('defaults model when not provided', () => {
    const result = validateVideoPayload({
      prompt: 'hello',
      aspectRatio: '16:9',
      durationSeconds: 4,
      resolution: '720p',
    })
    expect(isValidationError(result)).toBeFalsy()
    if (!isValidationError(result)) {
      expect(result.model).toBeTruthy()
    }
  })
})

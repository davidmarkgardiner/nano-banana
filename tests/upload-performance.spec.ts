import { test, expect, Page } from '@playwright/test'

test.describe('Image Upload Performance', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    await page.goto('/')
  })

  test('should show upload progress for image uploads', async () => {
    // Create a test image file
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    
    // Mock file input
    await page.setInputFiles('input[type="file"]', {
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from(testImageData.split(',')[1], 'base64')
    })

    // Check if upload progress is shown
    await expect(page.locator('text=/\\d+%/')).toBeVisible({ timeout: 5000 })
  })

  test('should handle large file uploads with compression', async () => {
    // Mock a large file (we can't actually upload 10MB in tests, so we mock the behavior)
    await page.evaluate(() => {
      // Mock FileReader to simulate large file behavior
      const originalFileReader = window.FileReader
      window.FileReader = class extends originalFileReader {
        readAsDataURL(file: Blob) {
          setTimeout(() => {
            const event = new ProgressEvent('progress', {
              lengthComputable: true,
              loaded: 5000000,
              total: 10000000
            })
            this.onprogress?.(event)
          }, 100)
          
          setTimeout(() => {
            this.onload?.({
              target: { result: 'data:image/jpeg;base64,test' }
            } as any)
          }, 500)
        }
      }
    })

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'large-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(10 * 1024 * 1024) // 10MB buffer
    })

    // Should show progress
    await expect(page.locator('text=/\\d+%/')).toBeVisible({ timeout: 5000 })
  })

  test('should handle upload errors gracefully', async () => {
    // Mock FileReader to simulate error
    await page.evaluate(() => {
      const originalFileReader = window.FileReader
      window.FileReader = class extends originalFileReader {
        readAsDataURL(file: Blob) {
          setTimeout(() => {
            this.onerror?.(new Event('error'))
          }, 100)
        }
      }
    })

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'error-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('invalid-image-data')
    })

    // Should show error message
    await expect(page.locator('text=/failed/i')).toBeVisible({ timeout: 5000 })
  })

  test('should validate file types correctly', async () => {
    // Try to upload a non-image file
    const textFileBuffer = Buffer.from('This is not an image')
    
    await page.setInputFiles('input[type="file"]', {
      name: 'not-an-image.txt',
      mimeType: 'text/plain',
      buffer: textFileBuffer
    })

    // Should show validation error
    await expect(page.locator('text=/only image files/i')).toBeVisible({ timeout: 5000 })
  })

  test('should show retry attempts on upload failure', async () => {
    let attempts = 0
    
    await page.route('**/api/**', (route) => {
      attempts++
      if (attempts < 3) {
        route.fulfill({ status: 500, body: 'Server Error' })
      } else {
        route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
      }
    })

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-retry.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('test-image-data')
    })

    // Should eventually succeed after retries
    await expect(page.locator('text=/retry/i')).toBeVisible({ timeout: 10000 })
  })

  test('should disable upload button during upload', async () => {
    const uploadButton = page.locator('button:has-text("Upload")')
    
    // Mock slow upload
    await page.evaluate(() => {
      const originalFileReader = window.FileReader
      window.FileReader = class extends originalFileReader {
        readAsDataURL(file: Blob) {
          setTimeout(() => {
            this.onload?.({
              target: { result: 'data:image/jpeg;base64,test' }
            } as any)
          }, 2000) // 2 second delay
        }
      }
    })

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'slow-upload.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('test-image-data')
    })

    // Button should be disabled during upload
    await expect(uploadButton).toBeDisabled({ timeout: 1000 })
  })
})
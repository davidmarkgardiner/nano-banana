import { test, expect } from '@playwright/test'

test.describe('Video Generation UI Test', () => {
  test('test video generation from UI', async ({ page }) => {
    // Set a long timeout for video generation
    test.setTimeout(180000) // 3 minutes

    // Navigate to the app
    await page.goto('http://localhost:3000')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot of initial state
    await page.screenshot({ path: 'tests/screenshots/video-ui-1-initial.png', fullPage: true })

    // Look for the video generation panel
    const videoPanel = page.locator('text=Generate Veo videos')
    const videoPanelVisible = await videoPanel.isVisible().catch(() => false)

    console.log('Video panel visible:', videoPanelVisible)

    if (!videoPanelVisible) {
      // Maybe we need to scroll or find a tab
      console.log('Looking for video panel...')
      await page.screenshot({ path: 'tests/screenshots/video-ui-1b-looking.png', fullPage: true })

      // Check page content
      const content = await page.content()
      console.log('Page contains "video":', content.toLowerCase().includes('video'))
      console.log('Page contains "Veo":', content.includes('Veo'))
    }

    // Find and fill the prompt textarea
    const promptTextarea = page.locator('textarea[placeholder*="Drone shot"]')
    const promptVisible = await promptTextarea.isVisible().catch(() => false)
    console.log('Prompt textarea visible:', promptVisible)

    if (promptVisible) {
      await promptTextarea.fill('A beautiful sunset over the ocean with gentle waves')
      await page.screenshot({ path: 'tests/screenshots/video-ui-2-prompt-filled.png', fullPage: true })
    } else {
      // Try alternative selector
      const anyTextarea = page.locator('textarea').first()
      const anyTextareaVisible = await anyTextarea.isVisible().catch(() => false)
      console.log('Any textarea visible:', anyTextareaVisible)

      if (anyTextareaVisible) {
        await anyTextarea.fill('A beautiful sunset over the ocean with gentle waves')
      }
    }

    // Find the generate button
    const generateButton = page.locator('button:has-text("Generate video")')
    const buttonVisible = await generateButton.isVisible().catch(() => false)
    console.log('Generate button visible:', buttonVisible)

    if (buttonVisible) {
      const isDisabled = await generateButton.isDisabled()
      console.log('Generate button disabled:', isDisabled)

      await page.screenshot({ path: 'tests/screenshots/video-ui-3-before-click.png', fullPage: true })

      // Click generate
      await generateButton.click()
      console.log('Clicked generate button')

      // Wait a moment and screenshot
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'tests/screenshots/video-ui-4-after-click.png', fullPage: true })

      // Check for loading state
      const renderingText = page.locator('text=Rendering')
      const isRendering = await renderingText.isVisible().catch(() => false)
      console.log('Is rendering:', isRendering)

      // Check for error
      const errorElement = page.locator('[role="alert"]')
      const hasError = await errorElement.isVisible().catch(() => false)
      if (hasError) {
        const errorText = await errorElement.textContent()
        console.log('Error:', errorText)
      }

      // Monitor network requests
      page.on('response', response => {
        if (response.url().includes('generate-video')) {
          console.log('API Response:', response.status(), response.url())
        }
      })

      // Wait for completion or error (up to 2.5 minutes)
      try {
        await Promise.race([
          page.waitForSelector('text=Preview', { timeout: 150000 }),
          page.waitForSelector('[role="alert"]', { timeout: 150000 }),
        ])
      } catch (e) {
        console.log('Timeout waiting for result')
      }

      await page.screenshot({ path: 'tests/screenshots/video-ui-5-final.png', fullPage: true })

      // Check final state
      const previewVisible = await page.locator('text=Preview').isVisible().catch(() => false)
      const finalError = await errorElement.isVisible().catch(() => false)

      console.log('Preview visible:', previewVisible)
      console.log('Final error visible:', finalError)

      if (finalError) {
        const finalErrorText = await errorElement.textContent()
        console.log('Final error text:', finalErrorText)
      }
    } else {
      console.log('Generate button not found')
      await page.screenshot({ path: 'tests/screenshots/video-ui-error-no-button.png', fullPage: true })
    }
  })
})

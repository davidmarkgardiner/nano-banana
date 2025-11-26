import { test, expect } from '@playwright/test'

test.describe('Video Controls Test', () => {
  test('check if video controls are interactive', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Look for sign in button and click it
    const signInButton = page.locator('button:has-text("Sign in"), button:has-text("Continue with")')
    const hasSignIn = await signInButton.first().isVisible().catch(() => false)

    console.log('Has sign in button:', hasSignIn)

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/controls-1-initial.png', fullPage: true })

    // Try to find the video panel by looking for specific text
    const videoPanel = page.locator('text=Generate Veo videos')
    const videoPanelVisible = await videoPanel.isVisible().catch(() => false)
    console.log('Video panel visible:', videoPanelVisible)

    if (!videoPanelVisible) {
      console.log('Video panel not visible - user needs to be logged in')

      // Check what's on the page
      const pageText = await page.textContent('body')
      console.log('Page contains ImageGenerator:', pageText?.includes('Describe image') || false)
      return
    }

    // Check aspect ratio buttons
    const aspect16_9 = page.locator('button:has-text("16:9")').first()
    const aspect9_16 = page.locator('button:has-text("9:16")').first()

    const is16_9Disabled = await aspect16_9.isDisabled().catch(() => 'not found')
    const is9_16Disabled = await aspect9_16.isDisabled().catch(() => 'not found')

    console.log('16:9 button disabled:', is16_9Disabled)
    console.log('9:16 button disabled:', is9_16Disabled)

    // Check duration buttons
    const duration4s = page.locator('button:has-text("4s")').first()
    const duration6s = page.locator('button:has-text("6s")').first()
    const duration8s = page.locator('button:has-text("8s")').first()

    const is4sDisabled = await duration4s.isDisabled().catch(() => 'not found')
    const is6sDisabled = await duration6s.isDisabled().catch(() => 'not found')
    const is8sDisabled = await duration8s.isDisabled().catch(() => 'not found')

    console.log('4s button disabled:', is4sDisabled)
    console.log('6s button disabled:', is6sDisabled)
    console.log('8s button disabled:', is8sDisabled)

    // Check resolution buttons
    const res720p = page.locator('button:has-text("720p")').first()
    const res1080p = page.locator('button:has-text("1080p")').first()

    const is720pDisabled = await res720p.isDisabled().catch(() => 'not found')
    const is1080pDisabled = await res1080p.isDisabled().catch(() => 'not found')

    console.log('720p button disabled:', is720pDisabled)
    console.log('1080p button disabled:', is1080pDisabled)

    // Check "Use reference image" state
    const refButton = page.locator('button:has-text("Use current image"), button:has-text("No image available")')
    const refState = await refButton.first().textContent().catch(() => 'not found')
    console.log('Reference button text:', refState)

    await page.screenshot({ path: 'tests/screenshots/controls-2-panel.png', fullPage: true })
  })
})

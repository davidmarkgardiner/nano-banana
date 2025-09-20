import { test, expect } from '@playwright/test'

test('debug page content', async ({ page }) => {
  await page.goto('http://localhost:3000')

  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'debug-page.png', fullPage: true })

  // Log the page content
  const content = await page.content()
  console.log('Page HTML:', content.substring(0, 1000))

  // Check if there are any error messages
  const errorMessages = await page.locator('text=/error|Error|failed|Failed/').allTextContents()
  console.log('Error messages:', errorMessages)

  // Check what's actually on the page
  const bodyText = await page.locator('body').textContent()
  console.log('Body text:', bodyText?.substring(0, 500))
})
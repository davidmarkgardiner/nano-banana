import { test, expect } from '@playwright/test';

test('Take screenshot of nano banana app', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:3000');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Take a screenshot
  await page.screenshot({
    path: '/Users/davidgardiner/Desktop/repo/nano-banana/nano-banana-screenshot.png',
    fullPage: true
  });

  // Basic checks
  const title = await page.title();
  console.log('Page title:', title);

  const headingText = await page.locator('h1').textContent();
  console.log('Main heading:', headingText);

  // Check if Firebase is connected
  const firebaseStatus = await page.locator('text=Firebase connected and ready!').isVisible();
  console.log('Firebase status visible:', firebaseStatus);
});
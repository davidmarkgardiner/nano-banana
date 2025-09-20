import { test } from '@playwright/test';

test('take screenshot of login page', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  await page.screenshot({
    path: '/Users/davidgardiner/Desktop/repo/nano-banana/login-page-screenshot.png',
    fullPage: true
  });
});
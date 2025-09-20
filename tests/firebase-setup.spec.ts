import { test, expect } from '@playwright/test';

test.describe('Nano Banana Firebase Setup', () => {
  test('should load the main page with nano banana branding', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check that the page loads
    await expect(page).toHaveTitle(/Nano Banana/i);

    // Check for the main heading
    await expect(page.locator('h1')).toContainText('Nano Banana');

    // Check for the description
    await expect(page.locator('text=AI-powered image generation from text')).toBeVisible();

    // Check that Firebase status is shown
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible();

    // Check that login form is visible (since user is not authenticated)
    await expect(page.locator('form')).toBeVisible();
  });

  test('should show authentication form when not logged in', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Should show login/signup form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have Google sign-in button', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for Google sign-in button
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('should show feature cards with nano banana features', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check feature cards (more specific selectors)
    await expect(page.locator('h3:has-text("Authentication")')).toBeVisible();
    await expect(page.locator('h3:has-text("AI Images")')).toBeVisible();
    await expect(page.locator('h3:has-text("History")')).toBeVisible();
    await expect(page.locator('h3:has-text("Responsive")')).toBeVisible();
  });
});
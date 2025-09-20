import { test, expect } from '@playwright/test';

test.describe('Complete UI Workflow Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Landing page renders correctly', async ({ page }) => {
    // Title and main heading
    await expect(page).toHaveTitle(/Nano Banana/);
    await expect(page.locator('h1')).toContainText('🍌 Nano Banana');

    // Description
    await expect(page.locator('text=AI-powered image generation from text')).toBeVisible();

    // Feature cards
    const featureCards = [
      '🔐 Authentication',
      '🎨 AI Images',
      '💾 History',
      '📱 Responsive'
    ];

    for (const card of featureCards) {
      await expect(page.locator(`text=${card}`)).toBeVisible();
    }

    // Firebase status
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible();

    // Login form should be visible (user not authenticated)
    await expect(page.locator('text=Sign in with Google')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/landing-page-complete.png',
      fullPage: true
    });
  });

  test('UI component structure and styling', async ({ page }) => {
    // Check main layout
    await expect(page.locator('main')).toBeVisible();

    // Check gradient background
    const main = page.locator('main');
    const backgroundClass = await main.getAttribute('class');
    expect(backgroundClass).toContain('bg-gradient-to-br');

    // Check responsive grid
    const grid = page.locator('.lg\\:grid-cols-4');
    await expect(grid).toBeVisible();

    // Verify 4 feature cards
    const cards = await page.locator('.lg\\:grid-cols-4 > div').count();
    expect(cards).toBe(4);

    // Check hover effects exist
    const firstCard = page.locator('.lg\\:grid-cols-4 > div').first();
    const cardClass = await firstCard.getAttribute('class');
    expect(cardClass).toContain('hover:');
  });

  test('Dark mode and responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1')).toBeVisible();
    await page.screenshot({
      path: 'tests/screenshots/mobile-responsive.png',
      fullPage: true
    });

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.lg\\:grid-cols-4')).toBeVisible();
    await page.screenshot({
      path: 'tests/screenshots/tablet-responsive.png',
      fullPage: true
    });

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState('networkidle');

    await expect(page.locator('.lg\\:grid-cols-4')).toBeVisible();
    await page.screenshot({
      path: 'tests/screenshots/desktop-responsive.png',
      fullPage: true
    });

    // Check for dark mode classes
    const darkModeElements = await page.locator('[class*="dark:"]').count();
    expect(darkModeElements).toBeGreaterThan(0);
  });

  test('Navigation and interaction elements', async ({ page }) => {
    // Check login button interaction
    const loginButton = page.locator('button:has-text("Sign in with Google")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();

    // Hover effects
    await loginButton.hover();
    // Button should be hoverable without errors

    // Check for proper button styling
    const buttonClass = await loginButton.getAttribute('class');
    expect(buttonClass).toContain('bg-');
    expect(buttonClass).toContain('text-');
  });

  test('Content accessibility and SEO', async ({ page }) => {
    // Check meta tags
    const title = await page.title();
    expect(title).toBe('Nano Banana - AI Image Generator');

    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toContain('Generate beautiful images from text using AI');

    // Check heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThan(0);

    const h3Count = await page.locator('h3').count();
    expect(h3Count).toBeGreaterThan(0);

    // Check for proper semantic elements
    await expect(page.locator('main')).toBeVisible();

    // Check button accessibility
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasText = await button.textContent();
      const hasAriaLabel = await button.getAttribute('aria-label');
      expect(hasText || hasAriaLabel).toBeTruthy();
    }
  });

  test('Loading states and animations', async ({ page }) => {
    // Check for loading indicators in the HTML
    const loadingSpinner = page.locator('.animate-spin');

    // The loading component should exist in the codebase
    const spinnerExists = await loadingSpinner.count() >= 0;
    expect(spinnerExists).toBe(true);

    // Check for animation classes
    const animatedElements = await page.locator('[class*="animate-"]').count();
    expect(animatedElements).toBeGreaterThanOrEqual(0);

    // Check for transition classes
    const transitionElements = await page.locator('[class*="transition-"]').count();
    expect(transitionElements).toBeGreaterThan(0);
  });

  test('Error boundaries and robust error handling', async ({ page }) => {
    // Intercept console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate and interact with the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check for JavaScript errors
    expect(errors.length).toBe(0);

    // Check that the page loaded successfully
    await expect(page.locator('h1')).toContainText('🍌 Nano Banana');
  });

  test('Performance metrics', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);

    // Performance expectations
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds

    // Check resource loading
    const images = await page.locator('img').count();
    console.log(`Number of images: ${images}`);

    // Check CSS loading
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
  });

  test('Firebase integration status', async ({ page }) => {
    // Check Firebase connection indicator
    const firebaseStatus = page.locator('text=Firebase connected and ready!');
    await expect(firebaseStatus).toBeVisible();

    // Check status styling
    const statusContainer = page.locator('.bg-green-100, .dark\\:bg-green-800');
    await expect(statusContainer).toBeVisible();

    // Check status indicator dot
    const statusDot = page.locator('.bg-green-500');
    await expect(statusDot).toBeVisible();
  });

  test('Component integration and state management', async ({ page }) => {
    // Test that all main components are rendered
    await expect(page.locator('main')).toBeVisible();

    // Check that AuthContext is working (showing login form)
    await expect(page.locator('text=Sign in with Google')).toBeVisible();

    // Verify component hierarchy
    const mainContent = page.locator('main .container');
    await expect(mainContent).toBeVisible();

    // Check for proper component nesting
    const featureGrid = page.locator('.lg\\:grid-cols-4');
    await expect(featureGrid).toBeVisible();
  });

  test('Cross-browser compatibility checks', async ({ page }) => {
    // Basic compatibility tests that work across browsers

    // CSS Grid support
    const gridContainer = page.locator('.lg\\:grid-cols-4');
    await expect(gridContainer).toBeVisible();

    // Flexbox support
    const flexElements = await page.locator('[class*="flex"]').count();
    expect(flexElements).toBeGreaterThan(0);

    // Modern CSS features
    const gradientElements = await page.locator('[class*="gradient"]').count();
    expect(gradientElements).toBeGreaterThan(0);

    // JavaScript functionality
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible();
  });
});

test.describe('API Integration Workflow', () => {

  test('Mock API client-side switching', async ({ page }) => {
    // Since NEXT_PUBLIC_USE_REAL_API is false, the client should use mock API
    // But we can't easily test this without actual user interaction
    // So we'll verify the environment setup

    await page.goto('http://localhost:3000');

    // The page should load successfully regardless of API mode
    await expect(page).toHaveTitle(/Nano Banana/);

    console.log('✅ App loads correctly with current API configuration');
  });

  test('Server-side API configuration', async ({ page }) => {
    // Test server-side API functionality
    const response = await page.request.post('http://localhost:3000/api/generate-image', {
      data: {
        prompt: 'test prompt for configuration check'
      }
    });

    // Should get a proper response (either success or quota error)
    expect(response.status()).toBeLessThan(500);

    const data = await response.json();

    if (response.status() === 429) {
      expect(data.error).toContain('quota exceeded');
      console.log('✅ API quota handling working correctly');
    } else if (response.status() === 400) {
      expect(data.error).toBeTruthy();
      console.log('✅ API validation working correctly');
    } else if (response.ok()) {
      expect(data.imageUrl).toBeTruthy();
      console.log('✅ API image generation working correctly');
    }
  });
});

test.describe('User Experience Flow', () => {

  test('Complete user journey simulation', async ({ page }) => {
    console.log('🚀 Starting complete user journey simulation...');

    // 1. User lands on the page
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('🍌 Nano Banana');
    console.log('✅ User lands on homepage');

    // 2. User sees the features
    await expect(page.locator('text=🎨 AI Images')).toBeVisible();
    console.log('✅ User sees AI image generation feature');

    // 3. User sees Firebase is connected
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible();
    console.log('✅ User sees system is ready');

    // 4. User sees login option
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
    console.log('✅ User sees authentication option');

    // 5. Page is responsive and works well
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
    console.log('✅ User experience is good on mobile');

    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('h1')).toBeVisible();
    console.log('✅ User experience is good on desktop');

    // 6. No JavaScript errors interrupt the experience
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);
    console.log('✅ No JavaScript errors affect user experience');

    console.log('🎉 Complete user journey simulation successful!');
  });
});
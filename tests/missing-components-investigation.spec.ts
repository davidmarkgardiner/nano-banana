import { test, expect } from '@playwright/test';

test.describe('Missing Components Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      console.log('Page Error:', error.message);
    });

    // Listen for failed requests
    page.on('requestfailed', request => {
      console.log('Failed Request:', request.url(), request.failure()?.errorText);
    });
  });

  test('should identify missing components and errors', async ({ page }) => {
    console.log('Starting missing components investigation...');

    // Go to the application
    await page.goto('http://localhost:3000');

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Check if the page has the expected content
    const pageTitle = await page.title();
    console.log('Page Title:', pageTitle);

    // Check for the main application content
    const hasMainContent = await page.locator('main').count() > 0;
    console.log('Has main content:', hasMainContent);

    // Check for specific components that should be present
    const components = [
      { name: 'AuthProvider wrapper', selector: 'main' },
      { name: 'Loading state', selector: '[class*="animate-spin"]' },
      { name: 'Login form', selector: 'form, [id="auth"]' },
      { name: 'Features section', selector: '[id="features"]' },
      { name: 'Nano Banana branding', selector: 'text=Nano Banana' }
    ];

    for (const component of components) {
      const exists = await page.locator(component.selector).count() > 0;
      console.log(`${component.name}: ${exists ? 'Found' : 'MISSING'}`);

      if (!exists) {
        console.log(`❌ Missing component: ${component.name} (selector: ${component.selector})`);
      }
    }

    // Check for error messages on the page
    const errorTexts = [
      'missing required error components',
      'refreshing',
      'Error',
      'error',
      'Failed',
      'failed',
      'not found',
      'Not Found'
    ];

    for (const errorText of errorTexts) {
      const hasError = await page.locator(`text=${errorText}`).count() > 0;
      if (hasError) {
        console.log(`⚠️ Found error text: "${errorText}"`);

        // Get the full context of the error
        const errorElement = page.locator(`text=${errorText}`).first();
        const errorParent = errorElement.locator('..');
        const errorContext = await errorParent.textContent();
        console.log(`Error context: ${errorContext}`);
      }
    }

    // Check console for React/JavaScript errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        logs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });

    // Wait a bit for any async operations to complete
    await page.waitForTimeout(3000);

    // Take a screenshot for debugging
    await page.screenshot({
      path: 'tests/screenshots/missing-components-investigation.png',
      fullPage: true
    });

    // Check network requests
    const responses: any[] = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
    });

    // Refresh the page to see if that triggers the "refreshing" message
    await page.reload();
    await page.waitForTimeout(2000);

    // Check if there's a "refreshing" message after reload
    const hasRefreshingMessage = await page.locator('text=refreshing').count() > 0;
    if (hasRefreshingMessage) {
      console.log('🔄 Found "refreshing" message after page reload');

      // Get the context of the refreshing message
      const refreshingElement = page.locator('text=refreshing').first();
      const refreshingParent = refreshingElement.locator('..');
      const refreshingContext = await refreshingParent.textContent();
      console.log(`Refreshing context: ${refreshingContext}`);
    }

    // Log all console messages collected
    if (logs.length > 0) {
      console.log('\n📝 Console Messages:');
      logs.forEach(log => console.log(log));
    }

    // Log network responses with errors
    const failedResponses = responses.filter(r => r.status >= 400);
    if (failedResponses.length > 0) {
      console.log('\n🌐 Failed Network Requests:');
      failedResponses.forEach(response => {
        console.log(`${response.status} ${response.statusText}: ${response.url}`);
      });
    }

    // Check for missing React components by looking at the DOM structure
    const bodyContent = await page.locator('body').textContent();
    if (bodyContent?.includes('missing required error components')) {
      console.log('🚨 Found the specific "missing required error components" message!');

      // Try to find the exact element containing this text
      const errorComponent = page.locator('text=missing required error components');
      const errorExists = await errorComponent.count() > 0;

      if (errorExists) {
        const errorHTML = await errorComponent.innerHTML();
        console.log('Error component HTML:', errorHTML);

        // Get parent elements to understand the context
        const parentElement = errorComponent.locator('..');
        const parentHTML = await parentElement.innerHTML();
        console.log('Parent element HTML:', parentHTML);
      }
    }

    console.log('\n✅ Missing components investigation completed');
  });

  test('should check Firebase initialization and auth state', async ({ page }) => {
    console.log('Checking Firebase and Auth initialization...');

    // Go to the application
    await page.goto('http://localhost:3000');

    // Wait for initial load
    await page.waitForTimeout(2000);

    // Check if Firebase is properly initialized by looking for auth-related elements
    const hasAuthSection = await page.locator('[id="auth"]').count() > 0;
    console.log('Has auth section:', hasAuthSection);

    // Check for loading states
    const hasLoadingSpinner = await page.locator('[class*="animate-spin"]').count() > 0;
    console.log('Has loading spinner:', hasLoadingSpinner);

    // Check for login form elements
    const loginFormElements = [
      'input[type="email"]',
      'input[type="password"]',
      'button[type="submit"]'
    ];

    for (const selector of loginFormElements) {
      const exists = await page.locator(selector).count() > 0;
      console.log(`Login form element ${selector}: ${exists ? 'Found' : 'Missing'}`);
    }

    // Check for Firebase errors in console
    const firebaseErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('firebase')) {
        firebaseErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    if (firebaseErrors.length > 0) {
      console.log('\n🔥 Firebase Errors:');
      firebaseErrors.forEach(error => console.log(error));
    }

    console.log('\n✅ Firebase and Auth check completed');
  });
});
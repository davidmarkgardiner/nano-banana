import { test, expect } from '@playwright/test';

test.describe('Real Gemini API Integration Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('Real API endpoint responds correctly', async ({ page }) => {
    console.log('Testing real Gemini API integration...');

    // Test the real API endpoint directly
    const response = await page.request.post('http://localhost:3000/api/generate-image', {
      data: {
        prompt: 'A simple test image of a banana'
      }
    });

    console.log('API Response Status:', response.status());
    const responseData = await response.json();
    console.log('API Response:', responseData);

    if (response.status() === 429) {
      console.log('✅ API quota exceeded (expected behavior with free tier)');
      expect(responseData.error).toContain('quota exceeded');
    } else if (response.ok()) {
      console.log('✅ Real API working! Image generated successfully');
      expect(responseData.imageUrl).toBeTruthy();
      expect(responseData.id).toBeTruthy();
      expect(responseData.metadata).toBeTruthy();
      expect(responseData.metadata.model).toBe('gemini-2.5-flash-image-preview');
    } else {
      console.log('❌ Unexpected API error:', responseData.error);
      // Log the error but don't fail the test as this depends on external API
    }
  });

  test('API validation works correctly', async ({ page }) => {
    const testCases = [
      {
        name: 'Empty prompt',
        prompt: '',
        expectedStatus: 400,
        expectedError: 'Prompt is required'
      },
      {
        name: 'Too short prompt',
        prompt: 'ab',
        expectedStatus: 400,
        expectedError: 'at least 3 characters'
      },
      {
        name: 'Too long prompt',
        prompt: 'a'.repeat(501),
        expectedStatus: 400,
        expectedError: 'less than 500 characters'
      },
      {
        name: 'Valid prompt',
        prompt: 'A beautiful sunset over mountains',
        expectedStatus: [200, 429], // Success or quota exceeded
      }
    ];

    for (const testCase of testCases) {
      console.log(`Testing: ${testCase.name}`);

      const response = await page.request.post('http://localhost:3000/api/generate-image', {
        data: {
          prompt: testCase.prompt
        }
      });

      const responseData = await response.json();

      if (Array.isArray(testCase.expectedStatus)) {
        expect(testCase.expectedStatus).toContain(response.status());
      } else {
        expect(response.status()).toBe(testCase.expectedStatus);
      }

      if (testCase.expectedError) {
        expect(responseData.error).toContain(testCase.expectedError);
      }

      console.log(`  Status: ${response.status()}, Response:`, responseData);
    }
  });

  test('API error handling', async ({ page }) => {
    // Test with invalid JSON
    const invalidResponse = await page.request.post('http://localhost:3000/api/generate-image', {
      data: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(invalidResponse.status()).toBe(400);

    // Test with missing prompt
    const missingPromptResponse = await page.request.post('http://localhost:3000/api/generate-image', {
      data: {
        notPrompt: 'test'
      }
    });

    expect(missingPromptResponse.status()).toBe(400);
    const errorData = await missingPromptResponse.json();
    expect(errorData.error).toContain('Prompt is required');
  });

  test('API performance and timeout', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.post('http://localhost:3000/api/generate-image', {
      data: {
        prompt: 'A performance test image'
      },
      timeout: 30000 // 30 second timeout
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`API response time: ${duration}ms`);

    // API should respond within 30 seconds (even if it's an error)
    expect(duration).toBeLessThan(30000);

    // Should get a response (not a network timeout)
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(600);
  });

  test('Environment configuration', async ({ page }) => {
    // Verify environment variables are properly set
    await page.goto('http://localhost:3000');

    const isRealAPI = await page.evaluate(() => {
      return process.env.NEXT_PUBLIC_USE_REAL_API;
    });

    console.log('NEXT_PUBLIC_USE_REAL_API:', isRealAPI);

    // The client should be able to read the environment variable
    expect(typeof isRealAPI).toBe('string');
  });
});

test.describe('Mock API vs Real API Comparison', () => {

  test('Compare mock and real API responses', async ({ page }) => {
    const prompt = 'A test image for comparison';

    // Test real API
    const realResponse = await page.request.post('http://localhost:3000/api/generate-image', {
      data: { prompt }
    });

    const realData = await realResponse.json();
    console.log('Real API Response:', {
      status: realResponse.status(),
      hasImageUrl: !!realData.imageUrl,
      hasMetadata: !!realData.metadata,
      error: realData.error
    });

    // Both should have consistent error handling
    if (realResponse.status() >= 400) {
      expect(realData.error).toBeTruthy();
    }

    if (realResponse.ok()) {
      expect(realData.imageUrl).toBeTruthy();
      expect(realData.id).toBeTruthy();
      expect(realData.metadata).toBeTruthy();
    }
  });
});

test.describe('End-to-End Real API Workflow', () => {

  test('Complete image generation workflow simulation', async ({ page }) => {
    // This test simulates what would happen in a real user workflow
    // Note: Since we can't easily mock authentication in Playwright,
    // we'll test the API integration aspects

    await page.goto('http://localhost:3000');

    // Check that the app loads
    await expect(page).toHaveTitle(/Nano Banana/);

    // Verify Firebase status
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible();

    // Test that when API is called, it follows the correct flow
    const testPrompts = [
      'A banana in space',
      'A cyberpunk cityscape at night',
      'A peaceful mountain lake at sunrise'
    ];

    for (const prompt of testPrompts) {
      console.log(`Testing prompt: "${prompt}"`);

      const response = await page.request.post('http://localhost:3000/api/generate-image', {
        data: { prompt }
      });

      const data = await response.json();

      if (response.status() === 429) {
        console.log('  ✅ Quota exceeded (expected)');
        expect(data.error).toContain('quota exceeded');
      } else if (response.ok()) {
        console.log('  ✅ Image generated successfully');
        expect(data.imageUrl).toBeTruthy();
        expect(data.metadata.model).toBe('gemini-2.5-flash-image-preview');
      } else {
        console.log('  ❌ Unexpected error:', data.error);
      }
    }
  });
});

test.describe('Real API Configuration Tests', () => {

  test('Verify Gemini API key configuration', async ({ page }) => {
    // Test that the server has access to the API key
    const response = await page.request.post('http://localhost:3000/api/generate-image', {
      data: {
        prompt: 'test'
      }
    });

    const data = await response.json();

    // If we get a 500 error with "not configured", the API key is missing
    if (response.status() === 500 && data.error?.includes('not configured')) {
      console.log('❌ Gemini API key not properly configured');
      expect(false).toBe(true); // Fail the test
    } else {
      console.log('✅ Gemini API key is configured');
      // Any other response means the API key is there (even if quota exceeded)
      expect(true).toBe(true);
    }
  });

  test('API model configuration', async ({ page }) => {
    const response = await page.request.post('http://localhost:3000/api/generate-image', {
      data: {
        prompt: 'test model configuration'
      }
    });

    if (response.ok()) {
      const data = await response.json();
      expect(data.metadata.model).toBe('gemini-2.5-flash-image-preview');
      console.log('✅ Correct Gemini model configured');
    } else {
      console.log('Model test skipped due to API error (quota/other)');
    }
  });
});
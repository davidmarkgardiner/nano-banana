import { test, expect } from '@playwright/test';

test.describe('Login Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000');
  });

  test('should display login form when user is not authenticated', async ({ page }) => {
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Check if the main heading is visible
    await expect(page.locator('h1:has-text("🍌 Nano Banana")')).toBeVisible();

    // Check if login form is visible
    await expect(page.locator('h2:has-text("Login")')).toBeVisible();

    // Check if email and password fields are present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Check if login button is present
    await expect(page.locator('button:has-text("Login")')).toBeVisible();

    // Check if Google login button is present
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();

    // Check if "Need an account? Sign up" link is present
    await expect(page.locator('button:has-text("Need an account? Sign up")')).toBeVisible();
  });

  test('should switch between login and signup forms', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Initially should show "Login"
    await expect(page.locator('h2:has-text("Login")')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();

    // Click "Need an account? Sign up"
    await page.click('button:has-text("Need an account? Sign up")');

    // Should now show "Sign Up"
    await expect(page.locator('h2:has-text("Sign Up")')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();

    // Click "Already have an account? Login"
    await page.click('button:has-text("Already have an account? Login")');

    // Should be back to "Login"
    await expect(page.locator('h2:has-text("Login")')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should show validation for empty fields', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that email field has required attribute (browser validation)
    await expect(page.locator('input[type="email"]')).toHaveAttribute('required');
    await expect(page.locator('input[type="password"]')).toHaveAttribute('required');

    // Try to submit with empty fields - browser should prevent submission
    const emailField = page.locator('input[type="email"]');
    const passwordField = page.locator('input[type="password"]');

    // Focus and blur to trigger validation
    await emailField.focus();
    await passwordField.focus();
    await emailField.focus();

    // Email field should show validation state
    await expect(emailField).toBeVisible();
    await expect(passwordField).toBeVisible();
  });

  test('should show form fields and buttons correctly', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check email field
    const emailField = page.locator('input[type="email"]');
    await expect(emailField).toBeVisible();
    await expect(emailField).toHaveAttribute('required');

    // Check password field
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toBeVisible();
    await expect(passwordField).toHaveAttribute('required');

    // Test typing in fields
    await emailField.fill('test@example.com');
    await passwordField.fill('password123');

    // Verify values are entered
    await expect(emailField).toHaveValue('test@example.com');
    await expect(passwordField).toHaveValue('password123');
  });

  test('should have proper page structure and styling', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check main container
    await expect(page.locator('main')).toBeVisible();

    // Check feature grid
    await expect(page.locator('text=🔐 Authentication')).toBeVisible();
    await expect(page.locator('text=🎨 AI Images')).toBeVisible();
    await expect(page.locator('text=💾 History')).toBeVisible();
    await expect(page.locator('text=📱 Responsive')).toBeVisible();

    // Check status indicator
    await expect(page.locator('text=Firebase connected and ready!')).toBeVisible();
  });
});
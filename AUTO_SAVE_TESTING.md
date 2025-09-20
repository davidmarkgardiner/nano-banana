# Auto-Save Functionality Testing Guide

This document provides instructions for testing the auto-save functionality in the nano-banana app using the comprehensive Playwright tests.

## Test Files Created

1. **`tests/auto-save-functionality.spec.ts`** - Basic auto-save functionality tests
2. **`tests/auto-save-enhanced.spec.ts`** - Enhanced tests with comprehensive mocking and logging

## Prerequisites

1. Ensure the nano-banana app is running on `localhost:3000`
2. Make sure Playwright is installed and configured
3. Ensure Firebase is properly configured in your app

## Running the Tests

### Start the Development Server

First, start your nano-banana app:

```bash
npm run dev
```

The app should be accessible at `http://localhost:3000`

### Run Auto-Save Tests

Run the specific auto-save test files:

```bash
# Run basic auto-save tests
npx playwright test tests/auto-save-functionality.spec.ts

# Run enhanced auto-save tests with detailed logging
npx playwright test tests/auto-save-enhanced.spec.ts

# Run both test files
npx playwright test tests/auto-save-functionality.spec.ts tests/auto-save-enhanced.spec.ts

# Run with visible browser (headed mode)
npx playwright test tests/auto-save-enhanced.spec.ts --headed

# Run with debug mode
npx playwright test tests/auto-save-enhanced.spec.ts --debug
```

## What the Tests Validate

### Basic Auto-Save Tests (`auto-save-functionality.spec.ts`)

1. **Console Log Verification**: Checks for "Auto-saving image to Firebase Storage" logs
2. **Network Request Monitoring**: Verifies POST requests to `/api/nano-banana-image`
3. **Firebase Storage Operations**: Monitors Firebase-related network activity
4. **Error Handling**: Tests auto-save failure scenarios
5. **Authentication Requirement**: Ensures auto-save only works when authenticated
6. **Storage Path Validation**: Verifies correct file naming and path structure

### Enhanced Auto-Save Tests (`auto-save-enhanced.spec.ts`)

1. **Complete Auto-Save Flow**: End-to-end testing with mocked responses
2. **Invalid API Response Handling**: Tests resilience to malformed data
3. **Unauthenticated User Behavior**: Confirms no auto-save without authentication
4. **Firebase Storage Path Format**: Validates the `nano-banana/{userId}/{date-timestamp}` pattern
5. **Comprehensive Logging**: Detailed console and network request monitoring

## Test Features

### Authentication Mocking

The tests include sophisticated Firebase authentication mocking:

```javascript
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true
}
```

### Network Request Interception

Tests monitor and can mock:
- `/api/nano-banana-image` API calls
- Firebase Storage operations
- Authentication requests

### Console Log Monitoring

Tests capture and analyze:
- Auto-save initiation messages
- Firebase Storage operation logs
- Error handling messages
- Success/failure notifications

## Expected Auto-Save Flow

1. **User Authentication**: User must be logged in via Firebase Auth
2. **Image Generation**: User generates an image using the prompt interface
3. **Auto-Save Trigger**: If authenticated, auto-save begins automatically
4. **API Call**: POST request to `/api/nano-banana-image` with the generated image URL
5. **Data Processing**: API fetches image data and converts to base64
6. **Firebase Upload**: Image data uploaded to Firebase Storage with path `nano-banana/{userId}/{timestamp}`
7. **Success Logging**: Console log shows successful auto-save with download URL

## Troubleshooting Test Failures

### Test Skipped: "Image generation interface not found"

- **Cause**: The test cannot find the prompt input or generate button
- **Solution**: Ensure the app is running and the UI matches expected selectors
- **Check**: Look for `textarea` with prompt placeholder text and `button` with "Generate" text

### No Auto-Save Logs Found

- **Cause**: Auto-save may not be triggering
- **Check**: Verify user authentication is working
- **Debug**: Run tests with `--headed` to see UI interactions

### API Request Not Found

- **Cause**: The `/api/nano-banana-image` endpoint may not be called
- **Check**: Verify the `useImageGeneration` hook is properly implemented
- **Debug**: Check browser network tab during manual testing

### Firebase Errors

- **Cause**: Firebase configuration issues
- **Check**: Verify Firebase config in `src/lib/firebase.ts`
- **Debug**: Check Firebase console for project settings

## Manual Testing

To manually verify auto-save functionality:

1. Open the app at `http://localhost:3000`
2. Log in with a valid account
3. Open browser DevTools (Console and Network tabs)
4. Generate an image with a prompt
5. Watch for:
   - Console log: "Auto-saving image to Firebase Storage..."
   - Network request to `/api/nano-banana-image`
   - Success log with Firebase Storage URL

## Test Configuration

The tests are configured to:
- Use chromium browser by default
- Run with base URL `http://localhost:3000`
- Include detailed console and network logging
- Handle authentication mocking
- Provide flexible UI element selection

## Integration with CI/CD

To run these tests in a CI environment:

```bash
# In GitHub Actions or similar
- name: Run Auto-Save Tests
  run: |
    npm ci
    npm run build
    npx playwright install chromium
    npm run dev &
    sleep 5
    npx playwright test tests/auto-save-functionality.spec.ts tests/auto-save-enhanced.spec.ts
```

## Customization

To modify tests for your specific needs:

1. **UI Selectors**: Update `findPromptInput()` and `findGenerateButton()` helper functions
2. **Authentication**: Modify the `mockAuthentication()` function
3. **API Endpoints**: Change route interception patterns
4. **Logging**: Adjust console log filtering and expectations

## Support

If you encounter issues with these tests:

1. Verify your app structure matches the expected UI elements
2. Check that the auto-save code in `src/hooks/useImageGeneration.ts` is implemented
3. Ensure Firebase is properly configured
4. Run tests in headed mode (`--headed`) to see browser interactions
5. Check the detailed console output for debugging information
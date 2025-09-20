# Auto-Save Test Setup Guide

This guide explains how to run the comprehensive auto-save tests for the nano-banana application.

## Test Files Created

1. **`auto-save-real-authentication.spec.ts`** - Main comprehensive test with real email/password authentication
2. **`auto-save-google-auth.spec.ts`** - Google OAuth specific test
3. **`auto-save-functionality.spec.ts`** - Original test with mocked authentication (existing)

## Prerequisites

### 1. Application Setup
- Nano-banana app running at `http://localhost:3000`
- Firebase project configured with:
  - Authentication enabled (Email/Password + Google)
  - Firebase Storage configured
  - Firestore configured

### 2. Test Account Credentials

Create a test Firebase account or use environment variables:

```bash
# Option 1: Set environment variables
export TEST_EMAIL="your-test-email@example.com"
export TEST_PASSWORD="YourTestPassword123!"

# Option 2: Update the test file directly
# Edit the TEST_EMAIL and TEST_PASSWORD constants in auto-save-real-authentication.spec.ts
```

### 3. Firebase Configuration
Ensure your Firebase project has:
- Storage bucket created and accessible
- Authentication providers enabled:
  - Email/Password ✅
  - Google OAuth ✅ (for Google auth tests)
- Proper security rules for testing

## Running the Tests

### Run All Auto-Save Tests
```bash
npm run test auto-save
```

### Run Specific Tests
```bash
# Main comprehensive test
npx playwright test auto-save-real-authentication.spec.ts

# Google OAuth test
npx playwright test auto-save-google-auth.spec.ts

# Original mocked test
npx playwright test auto-save-functionality.spec.ts

# Run with UI mode for debugging
npx playwright test auto-save-real-authentication.spec.ts --ui

# Run in headed mode to watch the browser
npx playwright test auto-save-real-authentication.spec.ts --headed
```

## Test Features

### Main Test (`auto-save-real-authentication.spec.ts`)

**What it does:**
1. ✅ **Real Authentication** - Performs actual email/password login
2. ✅ **Image Generation** - Tests actual image generation via nano-banana API
3. ✅ **Auto-Save Monitoring** - Monitors console logs for auto-save messages
4. ✅ **Network Monitoring** - Tracks API calls to `/api/nano-banana-image`
5. ✅ **Firebase Storage Tracking** - Monitors Firebase Storage requests
6. ✅ **Comprehensive Logging** - Detailed debugging output
7. ✅ **Screenshot Capture** - Takes screenshots at key points
8. ✅ **Error Analysis** - Detects and reports errors

**Key Monitoring Points:**
- Console logs containing "Auto-saving image to Firebase Storage"
- API calls to `/api/nano-banana-image` endpoint
- Firebase Storage upload requests
- Download URL generation logs
- Error messages and handling

### Google OAuth Test (`auto-save-google-auth.spec.ts`)

**What it does:**
1. ✅ **Google OAuth Flow** - Attempts Google sign-in
2. ✅ **Manual Intervention Support** - Handles cases requiring manual OAuth completion
3. ✅ **Auto-Save Verification** - Same monitoring as main test
4. ✅ **Fallback Handling** - Continues testing even if OAuth is incomplete

## Understanding Test Results

### Success Indicators
The test will show these positive signs if auto-save is working:

```
✅ AUTO-SAVE SUCCESS: Found auto-save success log
✅ Found X API call(s) to /api/nano-banana-image
✅ Firebase Storage requests detected
✅ Images generated: X
🎉 OVERALL RESULT: AUTO-SAVE APPEARS TO BE WORKING
```

### Failure Indicators
If auto-save is not working, you'll see:

```
❌ No auto-save API calls detected
❌ No Firebase Storage requests detected
⚠️  OVERALL RESULT: IMAGE GENERATION WORKS BUT AUTO-SAVE IS NOT FUNCTIONING
```

### Diagnostic Information
The test provides detailed diagnosis when auto-save fails:

```
🔍 DIAGNOSIS: Auto-save is not working. Possible causes:
   1. User authentication may not be properly established
   2. Firebase Storage may not be configured correctly
   3. Auto-save logic may have a bug
   4. Network/CORS issues preventing API calls
   5. Firebase permissions may be blocking uploads
```

## Debugging Tips

### 1. Check Test Screenshots
Screenshots are saved to `/tests/screenshots/`:
- `auto-save-test-start.png` - Initial page state
- `auto-save-test-complete.png` - After image generation
- `auto-save-test-final.png` - Final state

### 2. Review Console Output
The test provides extensive console logging:
- Browser console messages are prefixed with `Browser Console [TYPE]:`
- Network requests are logged for API and Firebase calls
- Progress updates every 2 seconds during generation

### 3. Check Network Tab
If running in headed mode (`--headed`), you can:
- Open browser developer tools
- Monitor Network tab for Firebase Storage uploads
- Check Console tab for JavaScript errors

### 4. Authentication Issues
If authentication fails:
- Verify Firebase Auth is enabled in Firebase Console
- Check that test credentials are valid
- Ensure the login form elements are being found correctly

### 5. Auto-Save Issues
If auto-save isn't working:
- Check Firebase Storage rules and permissions
- Verify the `/api/nano-banana-image` endpoint is accessible
- Check browser console for Firebase errors
- Ensure user is properly authenticated before image generation

## Common Issues and Solutions

### Issue: "Login form not found"
- **Solution**: Check if the app is properly loaded at localhost:3000
- **Solution**: Verify the login form selectors in the test match your UI

### Issue: "Image generation interface not found"
- **Solution**: Ensure user authentication is working
- **Solution**: Check that the generate button and prompt input exist in your UI

### Issue: "No auto-save activity detected"
- **Solution**: Check Firebase Storage configuration
- **Solution**: Verify the `useImageGeneration` hook auto-save logic
- **Solution**: Check network connectivity and CORS settings

### Issue: Google OAuth not working
- **Solution**: Use the manual test and complete OAuth manually
- **Solution**: Configure OAuth redirect URLs in Firebase Console
- **Solution**: Run test in headed mode to interact with OAuth popup

## Test File Structure

```
tests/
├── auto-save-real-authentication.spec.ts    # Main comprehensive test
├── auto-save-google-auth.spec.ts            # Google OAuth test
├── auto-save-functionality.spec.ts          # Original mocked test
├── screenshots/                             # Test screenshots
└── AUTO_SAVE_TEST_SETUP.md                  # This guide
```

## Next Steps

1. **Run the main test first**: `npx playwright test auto-save-real-authentication.spec.ts --headed`
2. **Check the console output** for detailed diagnostics
3. **Review screenshots** if issues occur
4. **Iterate based on findings** - the test will tell you exactly what's working and what isn't

The test is designed to be highly informative - it will guide you to the exact issue if auto-save is not working properly.
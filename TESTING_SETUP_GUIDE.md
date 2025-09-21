# 🧪 Nano Banana Testing Setup Guide

## Overview
This guide provides standardized testing procedures and organization for the Nano Banana AI image generation application.

## Testing Infrastructure

### Configuration
- **Framework**: Playwright Test
- **Configuration File**: `playwright.config.ts`
- **Test Directory**: `/tests`
- **Base URL**: `http://localhost:3000` (standardized across all tests)
- **Auto Server**: Tests automatically start Next.js dev server

### Key Features
- ✅ Automated web server startup during tests
- ✅ Standardized port configuration (3000)
- ✅ Comprehensive error handling verification
- ✅ Cross-browser testing (Chromium)
- ✅ Trace collection on test failures

## Test Organization

### 📂 Test Categories

#### Core Functionality Tests
- `basic-functionality.spec.ts` - Basic app loading and UI
- `comprehensive-test-report.spec.ts` - Full end-to-end functionality
- `ui-workflow-complete.spec.ts` - Complete user interface workflows

#### Authentication Tests
- `auth-bypass-verification.spec.ts` - Authentication bypass verification
- `auto-save-google-auth.spec.ts` - Google authentication integration
- `login-functionality.spec.ts` - Login form functionality

#### API Integration Tests
- `api-integration.spec.ts` - General API integration
- `real-api-integration.spec.ts` - Real API testing
- `client-error-handling.spec.ts` - Error handling verification
- `image-generation.spec.ts` - Image generation API tests

#### Feature-Specific Tests
- `image-transfusion-*.spec.ts` - Image transfusion functionality
- `approval-system-*.spec.ts` - Approval system testing
- `auto-save-*.spec.ts` - Auto-save functionality
- `prompt-inspiration.spec.ts` - Prompt suggestion features

#### Debug & Investigation Tests
- `debug*.spec.ts` - Debugging specific issues
- `*-investigation.spec.ts` - Investigation and troubleshooting

## Running Tests

### Prerequisites
```bash
npm install  # Install dependencies
```

### Test Commands
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/basic-functionality.spec.ts

# Run tests matching pattern
npx playwright test --grep "authentication"
```

### Environment Setup
- Tests automatically start the Next.js development server
- Firebase configuration must be properly set up
- Environment variables should be configured for API integrations

## Test Standards

### Port Configuration
- **Standard Port**: 3000 (all tests use `http://localhost:3000`)
- **Consistency**: All test files updated to use standard port
- **Configuration**: Playwright config manages server startup

### Test Structure
```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Navigation handled by baseURL configuration
    await page.waitForLoadState('networkidle')
  })

  test('should test specific functionality', async ({ page }) => {
    // Test implementation
  })
})
```

### Error Handling
- Tests verify proper handling of non-JSON responses
- Console error monitoring included
- Graceful degradation testing implemented

## Fixed Issues

### ✅ Resolved Problems

1. **Port Configuration Mismatch**
   - Fixed `playwright.config.ts` baseURL from 3002 → 3000
   - Updated 8 test files using incorrect port
   - Standardized across entire test suite

2. **Web Server Configuration**
   - Enabled automatic server startup in Playwright config
   - Removed manual navigation inconsistencies
   - Improved test reliability

3. **Test Organization**
   - Categorized tests by functionality
   - Documented purpose of each test category
   - Created standardized testing procedures

## Known Limitations

- Some tests require network access for Firebase/API integration
- API quota limitations may affect image generation tests
- Authentication tests may require specific Firebase configuration

## Maintenance

### Adding New Tests
1. Place in appropriate category folder structure
2. Use standard port configuration (localhost:3000)
3. Follow established naming conventions
4. Include proper error handling

### Test Cleanup
Consider consolidating similar tests:
- Multiple auto-save tests could be merged
- Similar API integration tests could be organized
- Debug tests should be temporary and removed after issues are resolved

## Troubleshooting

### Common Issues
- **Port conflicts**: Ensure port 3000 is available
- **Server startup**: Check Next.js build is successful
- **Firebase config**: Verify environment variables are set
- **API limits**: Monitor API quota usage during tests

### Debug Mode
Use `npm run test:headed` to see browser interactions and debug test failures visually.

---

**Last Updated**: January 2025  
**Status**: Production Ready Testing Suite
#!/usr/bin/env node

/**
 * Auto-Save Test Runner
 *
 * This script provides an easy way to run the auto-save tests with different configurations.
 * Usage: node tests/run-auto-save-tests.js [options]
 */

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.bold}${description}${colors.reset}`, 'blue');
  log(`Running: ${command}`, 'cyan');

  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function showUsage() {
  log('\n📋 Auto-Save Test Runner Usage:', 'bold');
  log('node tests/run-auto-save-tests.js [option]\n');

  log('Options:', 'cyan');
  log('  --all          Run all auto-save tests');
  log('  --main         Run main comprehensive test (email/password auth)');
  log('  --google       Run Google OAuth test');
  log('  --mocked       Run original mocked auth test');
  log('  --ui           Run main test in UI mode');
  log('  --headed       Run main test in headed mode');
  log('  --debug        Run with maximum debugging output');
  log('  --help         Show this help message');
  log('\nExamples:');
  log('  node tests/run-auto-save-tests.js --main');
  log('  node tests/run-auto-save-tests.js --ui');
  log('  node tests/run-auto-save-tests.js --all');
}

function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'blue');

  // Check if app is running on localhost:3000
  const checkApp = () => {
    try {
      const { execSync } = require('child_process');
      execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };

  if (!checkApp()) {
    log('❌ App is not running on http://localhost:3000', 'red');
    log('Please start the app with: npm run dev', 'yellow');
    return false;
  }

  log('✅ App is running on localhost:3000', 'green');
  return true;
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    showUsage();
    return;
  }

  log('🍌 Nano Banana Auto-Save Test Runner', 'bold');

  if (!checkPrerequisites()) {
    process.exit(1);
  }

  const option = args[0];
  let success = false;

  switch (option) {
    case '--all':
      log('\n🚀 Running ALL auto-save tests...', 'bold');
      success = runCommand(
        'npx playwright test auto-save-real-authentication.spec.ts auto-save-google-auth.spec.ts auto-save-functionality.spec.ts',
        'All auto-save tests'
      );
      break;

    case '--main':
      success = runCommand(
        'npx playwright test auto-save-real-authentication.spec.ts',
        'Main comprehensive auto-save test'
      );
      break;

    case '--google':
      success = runCommand(
        'npx playwright test auto-save-google-auth.spec.ts',
        'Google OAuth auto-save test'
      );
      break;

    case '--mocked':
      success = runCommand(
        'npx playwright test auto-save-functionality.spec.ts',
        'Mocked authentication auto-save test'
      );
      break;

    case '--ui':
      success = runCommand(
        'npx playwright test auto-save-real-authentication.spec.ts --ui',
        'Main test in UI mode'
      );
      break;

    case '--headed':
      success = runCommand(
        'npx playwright test auto-save-real-authentication.spec.ts --headed',
        'Main test in headed mode'
      );
      break;

    case '--debug':
      success = runCommand(
        'npx playwright test auto-save-real-authentication.spec.ts --headed --debug',
        'Main test with maximum debugging'
      );
      break;

    default:
      log(`❌ Unknown option: ${option}`, 'red');
      showUsage();
      process.exit(1);
  }

  if (success) {
    log('\n🎉 Test run completed successfully!', 'green');
    log('\n📸 Check screenshots in: tests/screenshots/', 'cyan');
    log('📋 Review setup guide: tests/AUTO_SAVE_TEST_SETUP.md', 'cyan');
  } else {
    log('\n❌ Test run failed. Check the output above for details.', 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
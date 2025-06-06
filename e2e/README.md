# End-to-End Testing with Playwright

This directory contains end-to-end tests using Playwright, configured with mock authentication to simplify testing.

## Overview

The tests use a mock authentication system that bypasses the actual GitHub OAuth flow:

1. The global setup script (`config/globalSetup.ts`) creates a mock authentication cookie
2. This cookie is saved to a storage state file (`storageState.json`)
3. Each test browser loads this storage state, starting in an authenticated state
4. No UI login steps are needed in the tests

## Running Tests Locally

### Full Test Suite

To run the complete test suite across all browsers:

```bash
# With the development server running separately
NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true npm run test:e2e

# Or let Playwright start the server for you (recommended)
npm run test:e2e
```

### Running Specific Tests

To run specific test files:

```bash
npx playwright test e2e/dashboard.spec.ts
```

### UI Mode

For interactive debugging:

```bash
npm run test:e2e:ui
```

## CI Configuration

The tests are configured to run in CI with the following setup:

1. The CI workflow starts the application server with the necessary environment variables
2. A health check ensures the server is ready before tests start
3. Playwright tests run against the running server
4. Test results and artifacts are uploaded for review

### Environment Variables

The following environment variables control the mock authentication:

- `NODE_ENV=test` - Enables test mode
- `E2E_MOCK_AUTH_ENABLED=true` - Explicitly enables mock authentication
- `CI=true` - Set automatically in CI environments
- `NEXTAUTH_SECRET` - Used for secure cookie handling

## Debugging Failed Tests

When tests fail in CI, you can examine:

1. The test report (uploaded as an artifact)
2. Screenshots of failed tests (uploaded on failure)
3. The authentication storage state (uploaded for debugging)

For comprehensive troubleshooting of authentication issues, see the **[Authentication Troubleshooting Guide](../docs/testing/AUTHENTICATION_TROUBLESHOOTING.md)**.

## Adding New Tests

When adding new tests:

1. No need to include login steps - tests start authenticated
2. Use `isMockAuthEnabled()` to conditionally skip tests that require authentication
3. For tests that need to verify unauthenticated behavior, use:
   ```typescript
   test.use({ storageState: { cookies: [], origins: [] } });
   ```

For more information on the mock authentication system, see `BROWSER_VERIFICATION.md`.
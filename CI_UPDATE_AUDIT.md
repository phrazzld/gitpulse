# CI Update Audit

## Overview

The recent changes made to fix the CI pipeline have improved the situation but still haven't fully resolved all issues. This document provides an analysis of the current failures and recommendations for next steps.

## Status of CI Checks

1. **Playwright E2E Tests** - Still failing
2. **build-and-test** - Still failing
3. **Chromatic Visual Testing** - Failing with startup error
4. **Storybook Accessibility** - Still failing

## Root Cause Analysis

### 1. Playwright E2E Tests

Our implementation of mock authentication for Playwright has a security issue:

```
Error: page.evaluate: SecurityError: The operation is insecure.
   at helpers/mockAuth.ts:38
```

The specific issue is in our `setupMockAuth` function, which is trying to use `localStorage` in a way that's causing security errors in the browser. This happens because:

- When running tests in CI, browsers have stricter security settings
- We're attempting to access `localStorage` in an insecure context
- The browsers (all three - Chromium, Firefox, and WebKit) are blocking this operation

### 2. build-and-test Job

The specific failure is not clear from the logs we've examined, but likely related to:
- Possible test failures caused by similar authentication issues
- Potential configuration issues that haven't been fully resolved

### 3. Chromatic Visual Testing

Despite configuring the Chromatic project token in GitHub secrets, the workflow is experiencing a startup failure:
```
completed   startup_failure   Implement Atomic Design pattern and Storybook integration   Chromatic Visual Testing
```

This suggests the workflow is not correctly configured to handle the token, or there are other initialization issues.

### 4. Storybook Accessibility

The Storybook accessibility tests are still failing, even after our changes to the workflow. This suggests that:
- The removal of the global CLI installation wasn't enough
- There may be additional configuration issues with how the tests are run

## Recommended Fixes

### 1. Fix E2E Test Authentication (High Priority)

Replace the current localStorage-based mock auth with a cookie-based approach:

```typescript
// Instead of using localStorage
export async function setupMockAuth(page: Page, mockUser: MockUser = defaultMockUser) {
  // Set cookies instead of using localStorage
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: Buffer.from(JSON.stringify({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        accessToken: 'mock-github-token',
        installationId: 12345678
      })).toString('base64'),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    }
  ]);

  // Keep the API route interception as is
  await page.route('**/api/auth/session', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: mockUser,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        accessToken: 'mock-github-token',
        installationId: 12345678
      })
    });
  });
}
```

### 2. Fix Chromatic Configuration (Medium Priority)

Ensure the Chromatic token is properly set in GitHub secrets and the workflow configuration:

1. Double-check that `CHROMATIC_PROJECT_TOKEN` is correctly set as a repository secret
2. Update the conditional check in the Chromatic workflow to handle secrets more gracefully:

```yaml
jobs:
  chromatic-deployment:
    runs-on: ubuntu-latest
    # Fix the conditional check for secrets
    if: ${{ env.CHROMATIC_PROJECT_TOKEN != '' }}
    env:
      CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

### 3. Update Storybook A11y Testing (Medium Priority)

Further improve the Storybook A11y workflow:

1. Add more detailed error handling to identify the root cause
2. Consider adding a build step before running the tests:

```yaml
- name: Build Storybook
  run: npm run build-storybook

- name: Run Storybook A11y checks
  run: |
    echo "Running A11y checks on built Storybook..."
    npx storybook test --url=file://${{ github.workspace }}/storybook-static
  continue-on-error: true # To help diagnose issues
```

## Next Steps

1. Update the mock authentication implementation to use cookies instead of localStorage
2. Review and fix the Chromatic configuration
3. Add better error handling to the Storybook A11y workflow
4. Consider adding more granular conditional test skipping based on environment
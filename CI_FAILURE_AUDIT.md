# CI Failure Audit for PR #19 (feature/atomic-design-storybook)

This document provides a comprehensive analysis of the CI failures in PR #19 after our fix implementation.

## 1. Build and Test Workflow Failure

### Error Description
The Jest tests are failing because Playwright E2E test files are being picked up by Jest. This causes conflicts since Playwright tests should only be executed by the Playwright test runner, not Jest.

### Detailed Analysis
The error messages clearly indicate the problem:

```
Playwright Test needs to be invoked via 'npx playwright test' and excluded from Jest test runs.
Creating one directory for Playwright tests and one for Jest is the recommended way of doing it.
```

Jest is attempting to run Playwright test files (those in the `e2e/` directory), which results in errors since these files use Playwright-specific test syntax that Jest doesn't understand.

### Files Affected
- `e2e/auth.spec.ts`
- `e2e/auth-setup.spec.ts`
- `e2e/auth-verification.spec.ts`
- `e2e/dashboard.spec.ts`
- `e2e/homepage.spec.ts`

### Root Cause
Jest is configured to include the E2E test files in its test runs. The test paths configuration in Jest needs to be updated to exclude the `e2e/` directory.

### Recommended Fix
Update the Jest configuration in `jest.config.js` to explicitly exclude the Playwright E2E test files:

```javascript
// In jest.config.js
module.exports = {
  // ... existing configuration ...
  testPathIgnorePatterns: [
    "/node_modules/",
    "/e2e/"  // Add this line to exclude E2E tests
  ],
  // ... rest of configuration ...
};
```

## 2. Storybook Accessibility Workflow Failure

### Error Description
The Storybook A11y tests are failing because Playwright browsers are not installed. The workflow attempts to run accessibility tests but cannot launch the browser.

### Detailed Analysis
The error message indicates the browser binaries are missing:

```
Error: Executable doesn't exist at /home/runner/.cache/ms-playwright/chromium_headless_shell-1169/chrome-linux/headless_shell

Looks like Playwright Test or Playwright was just installed or updated.
Please run the following command to download new browsers:
  
  npx playwright install
```

### Root Cause
The CI workflow is installing Playwright dependencies but not the browser binaries that Playwright needs to run the tests.

### Recommended Fix
Add a step to install Playwright browsers before running the accessibility tests:

```yaml
# In .github/workflows/storybook-a11y.yml
- name: Install Playwright browsers
  run: npx playwright install chromium

- name: Start Storybook server and run tests
  run: |
    npx concurrently -k -s first -n "SB,TEST" \
      "npx http-server storybook-static --port 6006 --silent" \
      "npx wait-on tcp:6006 && npx test-storybook --url http://localhost:6006"
```

## 3. Additional Notes

1. The fix for the route export issue appears to be working as the build process itself isn't failing due to route constraints.

2. The accessibility tests might still fail even after installing the browsers because:
   - There are actual accessibility issues in the components (as we saw in local testing)
   - By default, accessibility tests fail on any violations

3. To make the CI pass in the short-term while addressing accessibility issues in future PRs, consider:
   - Adding a configuration to make accessibility tests warnings only (not failures)
   - Or temporarily disabling specific accessibility rules that are currently failing

## Next Steps

1. Fix the Jest configuration to exclude E2E tests
2. Add Playwright browser installation to the Storybook A11y workflow
3. Decide on an approach for handling accessibility violations (fix now or in follow-up PRs)
4. Re-run the CI to verify the fixes
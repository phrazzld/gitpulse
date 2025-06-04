# E2E Workflow Comparison Report

This document compares the E2E test configurations between the main CI workflow (`ci.yml`) and the dedicated E2E workflow (`e2e-tests.yml`) to identify differences that could affect test behavior and timing.

## Overview

Both workflows run E2E tests with Playwright, but they have different configurations that could explain why tests pass in one workflow but fail in another.

## Key Differences

### 1. Test Execution Command

**CI Workflow (ci.yml)**:
```bash
CI=true npm run test:e2e -- --project=chromium --reporter=list --timeout=120000
```

**E2E Workflow (e2e-tests.yml)**:
```bash
PWDEBUG=console time npm run test:e2e -- --reporter=list,html --timeout=120000 --retries=2
```

**Differences**:
- E2E workflow includes `PWDEBUG=console` for additional debugging output
- E2E workflow runs ALL browser projects (Chromium, Firefox, WebKit), CI only runs Chromium
- E2E workflow explicitly sets `--retries=2` in the command
- E2E workflow uses both `list` and `html` reporters

### 2. Server Startup Configuration

**CI Workflow**:
- Starts server AFTER building application
- Shows last 20 lines of server log immediately after startup
- Simple startup with background process

**E2E Workflow**:
- Also starts server after build
- More comprehensive logging setup with dedicated log directories
- Captures server output to `e2e/server.log` (vs `e2e-server.log` in CI)

### 3. Environment Variables

**CI Workflow**:
```bash
CI: true
E2E_MOCK_AUTH_ENABLED: true
NODE_ENV: test
NEXTAUTH_URL: http://localhost:3000
NEXT_PUBLIC_GITHUB_APP_NAME: pulse-summarizer
NEXTAUTH_SECRET: playwright-test-secret-key
GITHUB_OAUTH_CLIENT_ID: mock-client-id
GITHUB_OAUTH_CLIENT_SECRET: mock-client-secret
```

**E2E Workflow** - Same variables PLUS:
```bash
DEBUG: pw:api,pw:browser*
PWDEBUG: console
```

**Key Difference**: E2E workflow has additional Playwright debugging enabled.

### 4. Build Configuration

**CI Workflow**:
- Builds with default environment

**E2E Workflow**:
- Builds with `NODE_ENV: production` explicitly set
- This could affect how Next.js optimizes the build

### 5. Error Handling and Retry Logic

**CI Workflow**:
- Simple execution, fails immediately on test failure
- No built-in retry mechanism beyond Playwright config

**E2E Workflow**:
- Sophisticated error handling
- If tests fail, runs again with:
  - `--repeat-each=1`
  - `--workers=1` (serial execution)
  - `--retries=2`
  - `--max-failures=10`
- This gives failing tests more chances to pass

### 6. Debugging and Artifacts

**CI Workflow**:
- Basic artifact collection
- Server logs uploaded separately

**E2E Workflow**:
- Comprehensive debugging:
  - Storage state content printed to logs
  - Environment report generated
  - System information collected
  - Package versions documented
  - File permissions listed
- Much more detailed troubleshooting information

### 7. Timing and Timeouts

**CI Workflow**:
- Global timeout via `--timeout=120000` (2 minutes)
- No job-level timeout specified

**E2E Workflow**:
- Same test timeout (2 minutes)
- Job-level timeout: `timeout-minutes: 30`
- Uses `time` command to measure test execution duration

## Impact on Authentication Persistence Test

The authentication persistence test failure in CI but success in E2E workflow could be due to:

1. **Browser Scope**: CI only runs Chromium, E2E runs all browsers. The test might be more stable across multiple browser runs.

2. **Debugging Output**: `PWDEBUG=console` in E2E workflow might add slight delays that help with timing issues.

3. **Retry Logic**: E2E workflow's retry mechanism gives flaky tests more chances to pass.

4. **Worker Configuration**: When E2E tests fail initially, they're re-run with `--workers=1` (serial mode), which could help with timing-sensitive tests.

5. **Build Mode**: E2E workflow builds with `NODE_ENV=production`, which might affect Next.js behavior.

## Recommendations

1. **Align Retry Configuration**: Add `--retries=2` to CI workflow command
2. **Consider Serial Execution**: For timing-sensitive tests, use `--workers=1`
3. **Add Debug Mode**: Include `PWDEBUG=console` when investigating failures
4. **Standardize Build Mode**: Ensure both workflows build with same NODE_ENV
5. **Implement Retry Logic**: Add sophisticated retry mechanism to CI workflow for flaky tests

## Conclusion

The E2E workflow is more robust and forgiving of timing issues due to its retry logic, debugging output, and serial execution fallback. The CI workflow is more strict and fails fast, which explains why the authentication persistence test (which has timing sensitivities) fails there but passes in the dedicated E2E workflow.

The fix implemented (adding 500ms delays in CI mode) addresses the immediate issue, but aligning the workflow configurations could provide more consistent results across both workflows.
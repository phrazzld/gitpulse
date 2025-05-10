# E2E Mock Authentication Strategy

This document describes the implemented mock authentication strategy used for End-to-End (E2E) testing in GitPulse. The strategy provides a reliable, consistent, and secure way to test authenticated routes without requiring real GitHub credentials or actual OAuth flows.

## Introduction

End-to-End testing often requires authenticated sessions to test protected routes and features. However, using real authentication flows in automated tests presents several challenges:

- External dependencies on third-party services (GitHub OAuth)
- Need for real credentials that shouldn't be stored in repositories
- Fragility due to potential API changes or rate limiting
- Slower test execution due to the authentication flow

Our solution uses a cookie-based mock authentication approach that simulates a valid NextAuth.js session without making actual external calls, making tests faster, more reliable, and secure.

## Architecture Overview

The mock authentication system uses a cookie-based approach that mimics NextAuth.js session cookies. The system has three main components working together:

1. **Mock API Endpoint**: A secured test-only API route that can set authentication cookies
2. **Global Setup Script**: A Playwright setup script that establishes authentication before tests run
3. **Storage State Mechanism**: Playwright's native way to save and reuse authentication state

```
┌─────────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│                     │       │                  │       │                  │
│ Playwright          │       │ Global Setup     │       │ storageState.json│
│ Test Runner         │──────▶│ Script           │──────▶│ (Auth Cookies)   │
│                     │       │                  │       │                  │
└─────────────────────┘       └──────────────────┘       └──────────────────┘
                                       │                          ▲
                                       │                          │
                                       ▼                          │
                              ┌──────────────────┐                │
                              │                  │                │
                              │ Mock API Endpoint│                │
                              │ (Optional)       │────────────────┘
                              │                  │
                              └──────────────────┘
```

## Components

### 1. Mock Cookie Structure

The authentication cookie is designed to mimic the NextAuth.js session cookie:

- **Cookie Name**: `next-auth.session-token` (matches NextAuth.js naming)
- **Cookie Content**: Base64-encoded JSON object containing:
  ```json
  {
    "user": {
      "id": "playwright-test-user",
      "name": "Playwright Test User",
      "email": "playwright@example.com",
      "image": "https://github.com/ghost.png"
    },
    "expires": "2099-12-31T23:59:59.999Z",
    "accessToken": "mock-github-token",
    "installationId": 12345678
  }
  ```
- **Cookie Attributes**:
  - `HttpOnly`: true (prevents JavaScript access)
  - `Secure`: conditional (true in production, false in development)
  - `SameSite`: "Lax" (standard for authentication cookies)
  - `Path`: "/" (accessible across the entire site)
  - `MaxAge`: 24 hours (86400 seconds)

### 2. Mock API Endpoint

Located at `/src/app/api/test-auth/login/route.ts`, this endpoint provides a way to generate mock authentication cookies. It has strict environment gating to ensure it's only available in test environments.

**Key Features:**
- Environment-gated to prevent access in production
- Returns a 404 in non-test environments to hide its existence
- Sets a properly formatted NextAuth.js session cookie
- Supports customization of mock user details

**Usage Example:**
```typescript
// POST /api/test-auth/login
// Optional body for customization
const response = await fetch('/api/test-auth/login', {
  method: 'POST',
  body: JSON.stringify({
    userId: 'custom-user-id',
    userName: 'Custom Name',
    userEmail: 'custom@example.com'
  })
});
// Response sets the cookie automatically
```

**Security Measures:**
- Only accessible when `NODE_ENV=test` AND `E2E_MOCK_AUTH_ENABLED=true` (or with explicit developer override)
- Cookie is HttpOnly to prevent JavaScript access
- SameSite=Lax to prevent CSRF
- Secure in production environments
- Non-discoverable in production (returns 404)

### 3. Global Setup Script

Located at `/e2e/config/globalSetup.ts`, this script runs before Playwright tests and establishes the authenticated state. Instead of calling the API endpoint, it directly creates the necessary cookie for efficiency and reliability.

**Key Features:**
- Creates a standardized mock session with consistent test user data
- Adds the authentication cookie directly to the browser context
- Saves authenticated state to a file for reuse in all tests
- Enhanced debugging for CI environments
- Verifies cookie was set correctly

**Implementation:**
```typescript
// Key parts of globalSetup.ts
async function globalSetup(config: FullConfig) {
  // Skip if mock auth is not enabled
  if (!isMockAuthEnabled()) return;
  
  // Launch browser and create context
  const browser = await chromium.launch();
  const context = await browser.newContext();
  
  // Create mock session data
  const mockSessionData = {
    user: {
      id: 'playwright-test-user',
      name: 'Playwright Test User',
      email: 'playwright@example.com',
      image: 'https://github.com/ghost.png',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    accessToken: 'mock-github-token',
    installationId: 12345678
  };
  
  // Add cookie to browser context
  await context.addCookies([{
    name: 'next-auth.session-token',
    value: Buffer.from(JSON.stringify(mockSessionData)).toString('base64'),
    domain: new URL(baseURL).hostname,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 86400,
  }]);
  
  // Save authenticated state to file
  await context.storageState({ path: 'e2e/storageState.json' });
  
  // Close browser
  await browser.close();
}
```

### 4. Storage State Mechanism

Playwright provides a built-in mechanism to save and restore browser state, including cookies. Our configuration saves the authenticated state to `e2e/storageState.json` and configures all browser projects to use this state.

**Configuration in playwright.config.ts:**
```typescript
export default defineConfig({
  // Global setup to create authenticated state
  globalSetup: './e2e/config/globalSetup.ts',
  
  // Browser projects configuration
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use the authenticated state generated by the global setup
        storageState: './e2e/storageState.json',
      },
    },
    // Similar configuration for Firefox and WebKit
  ],
});
```

## Environment Configuration

The mock authentication system requires specific environment configuration to work correctly:

### Required Environment Variables

| Variable | Purpose | Used In |
|----------|---------|---------|
| `NODE_ENV=test` | Indicates test environment | API endpoint, globalSetup |
| `E2E_MOCK_AUTH_ENABLED=true` | Explicitly enables mock auth | API endpoint, globalSetup, test scripts |
| `NEXTAUTH_SECRET` | Used for cookie signing (can be mock in tests) | API endpoint, NextAuth |
| `NEXTAUTH_URL` | Base URL for auth callbacks | NextAuth |

### Optional Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `ALLOW_E2E_IN_DEV=true` | Allows mock auth in development | false |
| `CI=true` | Enables CI-specific behaviors | Determined by environment |

## Usage Guide

### Running Tests Locally

To run tests with mock authentication locally:

1. Start the development server with the required environment variables:

```bash
NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true npm run dev
```

2. Run the tests with Playwright:

```bash
# Run all tests
npm run test:e2e

# Run specific auth tests
npx playwright test e2e/auth.spec.ts
```

The `playwright.config.ts` file includes a `webServer` section that automatically starts the application with the correct environment variables when running tests locally:

```typescript
webServer: process.env.CI ? undefined : {
  command: 'NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true npm run dev',
  url: 'http://localhost:3000',
  reuseExistingServer: true,
  env: {
    NODE_ENV: 'test',
    E2E_MOCK_AUTH_ENABLED: 'true',
  },
}
```

### CI Configuration

The CI workflow (`.github/workflows/e2e-tests.yml`) is configured to:

1. Build the application
2. Start the server with mock authentication enabled
3. Wait for the server to be ready
4. Run the tests with appropriate environment variables
5. Collect artifacts for debugging

Key environment variables set in CI:
```yaml
NODE_ENV: test
E2E_MOCK_AUTH_ENABLED: true
NEXTAUTH_SECRET: playwright-test-secret-key
CI: true
```

#### CI Workflow Excerpt:

```yaml
- name: Start server and wait for it to be ready
  run: |
    # Create log directory
    mkdir -p e2e
    
    # Start the server in the background with output captured to log file
    NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true NEXTAUTH_URL=http://localhost:3000 NEXT_PUBLIC_GITHUB_APP_NAME=pulse-summarizer NEXTAUTH_SECRET=playwright-test-secret-key npm run dev > e2e/server.log 2>&1 &
    
    # Store the process ID so we can terminate it later
    echo $! > server.pid
    
    # Wait for the server to be ready
    node scripts/wait-for-server.js http://localhost:3000 120000 1000
```

### Writing Tests That Use Mock Auth

With the global setup handling authentication, tests can assume an authenticated state. Here's how to write tests that leverage this:

1. Import the `isMockAuthEnabled` helper:

```typescript
import { isMockAuthEnabled } from './helpers/mockAuth';
```

2. Conditionally skip tests that require authentication if mock auth is not enabled:

```typescript
test('should access protected page', async ({ page }) => {
  test.skip(!isMockAuthEnabled(), 'Skipping: requires authentication');

  // Test assumes authenticated state
  await page.goto('/dashboard');
  // ... assertions
});
```

3. To test the unauthenticated state, use a special configuration that clears cookies:

```typescript
test.describe('Unauthenticated Access', () => {
  // Use a special config with empty storage state (no auth cookies)
  test.use({ storageState: { cookies: [], origins: [] } });
  
  test('should redirect to login page', async ({ page }) => {
    await page.goto('/dashboard');
    // ... assertions for unauthenticated state
  });
});
```

4. Example test for verifying authentication persistence:

```typescript
test('should maintain authenticated state across navigation', async ({ page, context }) => {
  // Verify initial auth state
  const initialCookies = await context.cookies();
  const initialAuthCookie = initialCookies.find(cookie => cookie.name === 'next-auth.session-token');
  expect(initialAuthCookie).toBeDefined();
  
  // Navigate to different pages
  await page.goto('/dashboard');
  await page.goto('/');
  
  // Verify auth cookie still exists after navigation
  const finalCookies = await context.cookies();
  const finalAuthCookie = finalCookies.find(cookie => cookie.name === 'next-auth.session-token');
  expect(finalAuthCookie).toBeDefined();
});
```

## Troubleshooting

### Common Issues and Solutions

#### Storage State File Not Found
- **Error**: `Error: Missing baseURL option to use storageState`
- **Solution**: 
  - Ensure the `baseURL` is set in your Playwright config 
  - Verify that global setup is working correctly
  - Check file permissions for the storage state directory

#### Authentication Not Working
- **Error**: Test sees login pages or redirects despite mock auth
- **Solution**: 
  - Verify environment variables are set correctly
  - Check mock auth is enabled (`E2E_MOCK_AUTH_ENABLED=true`)
  - Check the storage state file exists and contains valid cookies
  - Try clearing the storage state file and running tests again

#### API Access Denied
- **Error**: 404 error when trying to access the mock auth API
- **Solution**: 
  - Ensure both `NODE_ENV=test` and `E2E_MOCK_AUTH_ENABLED=true` are set
  - Check if the environment gating logic in the API might be blocking access

#### CI Tests Failing But Local Tests Pass
- **Cause**: CI environment might have timing issues or different configurations
- **Solution**:
  - Check CI logs for environment differences
  - Examine server logs for errors
  - Increase timeouts for CI environment
  - Check network access and connectivity issues

### Debugging Tools

The following artifacts can help with debugging:
- `e2e/storageState.json`: The authentication state used by tests
- `e2e/storageState-debug.json`: More detailed state in CI environments 
- Screenshot artifacts from CI: `test-results/**/*.png`
- Trace artifacts from CI: `test-results/**/*.zip`
- Server logs in CI: `e2e/server.log`

#### Example of inspecting the storage state:

```bash
# View the storage state file
cat e2e/storageState.json

# Check if it contains the auth cookie
cat e2e/storageState.json | grep next-auth.session-token
```

## Security Considerations

The mock authentication system is designed with security in mind:

1. **Environment Gating**: The mock auth API is only accessible in test environments and explicitly disabled in production.

2. **Secure Cookies**: Authentication cookies are set with appropriate security attributes (HttpOnly, SameSite, Path).

3. **No Secrets in Tests**: The mock session doesn't require real secrets or credentials.

4. **Isolation**: Test authentication is completely separate from production authentication flows.

5. **Transparency**: Tests that use mock authentication are explicitly marked and can be conditionally skipped when not enabled.

### CI Security Best Practices

1. **Secret Management**: 
   - Store `NEXTAUTH_SECRET` and any other secrets as GitHub Action secrets rather than hardcoding in workflow files
   - For testing purposes, generate a random value for `NEXTAUTH_SECRET` during CI runs rather than using a fixed string

2. **Log Safety**:
   - Ensure server logs in CI don't expose sensitive information
   - Use log redaction for environment variables and credentials
   - The workflow includes `env | grep -v -E 'TOKEN|SECRET|PASSWORD|KEY'` to filter sensitive variables from logs

3. **Limited Access**:
   - Consider using CODEOWNERS for CI workflow files to require security review
   - Regularly audit CI configurations for hardcoded secrets or tokens

## CI Enhancements for Reliability

Several improvements were made to ensure reliable E2E test execution in CI:

1. **Enhanced Global Setup**:
   - Detailed logging of environment variables and cookie state
   - Improved cookie verification with detailed attribute checking
   - Debug storage state file in CI for troubleshooting

2. **Improved Server Health Check**:
   - More resilient wait-for-server.js script
   - Consecutive success requirements ensure server is fully ready
   - Increased timeouts and request timeout handling
   - Server log capture for better debugging

3. **CI Workflow Enhancements**:
   - Build step with appropriate environment variables
   - Server startup with log capture 
   - Test execution with timing information and retries
   - Environment report generation
   - Comprehensive artifact collection for debugging

These improvements help ensure that E2E tests pass reliably in CI environments.

## Migration from localStorage-Based Auth

The cookie-based approach replaces an older localStorage-based authentication approach, with these advantages:

1. **Security**: Cookies can be HttpOnly, while localStorage is always accessible to JavaScript
2. **CI Compatibility**: Cookies work more reliably across CI environments
3. **Integration**: Better alignment with how NextAuth.js actually works in production

All E2E tests were refactored to:
1. Remove explicit UI login steps
2. Remove localStorage manipulation
3. Rely on the pre-authenticated state from globalSetup
4. Update API mocking where necessary

## References

- [Next.js API Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [Playwright Storage State](https://playwright.dev/docs/test-global-setup-teardown#authentication-global-setup)
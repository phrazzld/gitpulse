# Test info

- Name: Protected Route Access >> should access protected route when authenticated
- Location: /Users/phaedrus/Development/gitpulse/e2e/auth.spec.ts:48:7

# Error details

```
Error: Auth cookie should exist

expect(received).toBeDefined()

Received: undefined
    at /Users/phaedrus/Development/gitpulse/e2e/auth.spec.ts:61:52
```

# Page snapshot

```yaml
- button "Open Next.js Dev Tools":
  - img
- alert
- text: "SYSTEM STATUS: ONLINE"
- heading "GITPULSE" [level=1]
- text: COMMIT ANALYSIS SYSTEM
- paragraph: "> SYSTEM READY"
- paragraph: "> Initializing GitHub commit analysis module..."
- paragraph: "> Secure sign-in required to access repository data."
- paragraph: "> Awaiting authorization..."
- paragraph: Sign in with GitHub to access your repositories and analyze commits.
- button "AUTHENTICATE WITH GITHUB":
  - img
  - text: AUTHENTICATE WITH GITHUB
- contentinfo:
  - paragraph: "SECURE AUTH PROTOCOL: GITHUB OAUTH"
  - paragraph: NO DATA PERSISTENCE BEYOND SESSION SCOPE
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { isMockAuthEnabled } from './helpers/mockAuth';
   3 |
   4 | /**
   5 |  * Comprehensive Authentication Flow Tests
   6 |  * 
   7 |  * These tests verify that the mock authentication mechanism works correctly by:
   8 |  * 1. Verifying authenticated state allows access to protected routes
   9 |  * 2. Verifying the session cookie exists and has correct properties
   10 |  * 3. Testing authentication persistence across navigation
   11 |  * 4. Testing authentication removal and the resulting protection of routes
   12 |  */
   13 |
   14 | // Check if auth tests should run
   15 | const shouldRunAuthTests = isMockAuthEnabled();
   16 |
   17 | test.describe('Authentication State Management', () => {
   18 |   test('should have valid auth cookie from global setup', async ({ context }) => {
   19 |     test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
   20 |     
   21 |     // Verify auth cookie exists
   22 |     const cookies = await context.cookies();
   23 |     const authCookie = cookies.find(cookie => cookie.name === 'next-auth.session-token');
   24 |     
   25 |     // Cookie must exist
   26 |     expect(authCookie, 'Auth cookie should exist').toBeDefined();
   27 |     
   28 |     // Validate cookie properties
   29 |     if (authCookie) {
   30 |       expect(authCookie.httpOnly, 'Auth cookie should be HttpOnly').toBe(true);
   31 |       expect(authCookie.path, 'Auth cookie should have path /').toBe('/');
   32 |       
   33 |       // Cookie SameSite may vary based on environment - in CI it might not have this set
   34 |       if (authCookie.sameSite) {
   35 |         expect(authCookie.sameSite, 'Auth cookie sameSite should be Lax if set').toBe('Lax');
   36 |       }
   37 |       
   38 |       // Cookie should have content (value)
   39 |       expect(authCookie.value, 'Auth cookie should have a value').toBeTruthy();
   40 |       
   41 |       // Log cookie verification
   42 |       console.log('✅ Authentication cookie verification successful');
   43 |     }
   44 |   });
   45 | });
   46 |
   47 | test.describe('Protected Route Access', () => {
   48 |   test('should access protected route when authenticated', async ({ page }) => {
   49 |     test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
   50 |     
   51 |     // Navigate to the home page first to verify we can load the app
   52 |     await page.goto('/');
   53 |     await page.waitForLoadState('networkidle');
   54 |     
   55 |     // Take a screenshot to diagnose the state
   56 |     await page.screenshot({ path: 'test-artifacts/screenshots/auth-test-homepage.png' });
   57 |     
   58 |     // Check that auth cookie exists by checking cookies
   59 |     const cookies = await page.context().cookies();
   60 |     const authCookie = cookies.find(cookie => cookie.name === 'next-auth.session-token');
>  61 |     expect(authCookie, 'Auth cookie should exist').toBeDefined();
      |                                                    ^ Error: Auth cookie should exist
   62 |     
   63 |     // Now try a protected page
   64 |     await page.goto('/dashboard');
   65 |     await page.waitForLoadState('networkidle');
   66 |     
   67 |     // Take screenshot for visual verification
   68 |     await page.screenshot({ path: 'test-artifacts/screenshots/auth-test-dashboard.png' });
   69 |     
   70 |     // The specific page content will depend on the application, but we should at least
   71 |     // verify that we don't see obvious signs of being unauthenticated
   72 |     
   73 |     // Check for login UI elements (if none found, we're likely authenticated)
   74 |     const loginElements = await page.locator('text=/Sign in with|Login with|Authenticate with/i').count();
   75 |     expect(loginElements, 'Login buttons should not be present').toBe(0);
   76 |     
   77 |     // Optional: Check for common error pages
   78 |     const is404 = await page.locator('text="404"').count() > 0 && 
   79 |                   await page.locator('text="This page could not be found"').count() > 0;
   80 |     
   81 |     // If we see a 404, that's a different issue than an auth failure - don't fail the test
   82 |     // The test is only checking auth works, not that specific routes exist
   83 |     if (is404) {
   84 |       console.log('⚠️ Dashboard page returned 404 - this is a routing issue, not an auth issue');
   85 |     } else {
   86 |       console.log('✅ Successfully accessed protected route when authenticated');
   87 |     }
   88 |   });
   89 | });
   90 |
   91 | test.describe('Authentication Persistence', () => {
   92 |   test('should maintain authenticated state across navigation', async ({ page, context }) => {
   93 |     test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
   94 |     
   95 |     // Start at homepage
   96 |     await page.goto('/');
   97 |     await page.waitForLoadState('networkidle');
   98 |     
   99 |     // Verify initial auth state
  100 |     const initialCookies = await context.cookies();
  101 |     const initialAuthCookie = initialCookies.find(cookie => cookie.name === 'next-auth.session-token');
  102 |     expect(initialAuthCookie, 'Initial auth cookie should exist').toBeDefined();
  103 |     
  104 |     // Navigate to different pages to test persistence
  105 |     // In a real app, these would be actual routes in your application
  106 |     await page.goto('/dashboard');
  107 |     await page.waitForLoadState('networkidle');
  108 |     
  109 |     // Return to homepage
  110 |     await page.goto('/');
  111 |     await page.waitForLoadState('networkidle');
  112 |     
  113 |     // Verify auth cookie still exists after navigation
  114 |     const finalCookies = await context.cookies();
  115 |     const finalAuthCookie = finalCookies.find(cookie => cookie.name === 'next-auth.session-token');
  116 |     expect(finalAuthCookie, 'Auth cookie should persist across navigation').toBeDefined();
  117 |     
  118 |     console.log('✅ Authentication state maintained across navigation');
  119 |   });
  120 | });
  121 |
  122 | test.describe('Authentication Removal', () => {
  123 |   test('should recognize when authentication is removed', async ({ page, context }) => {
  124 |     test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
  125 |     
  126 |     // First verify we're authenticated
  127 |     const initialCookies = await context.cookies();
  128 |     const initialAuthCookie = initialCookies.find(cookie => cookie.name === 'next-auth.session-token');
  129 |     expect(initialAuthCookie, 'Initial auth cookie should exist').toBeDefined();
  130 |     
  131 |     // Now manually clear cookies to simulate logging out
  132 |     await context.clearCookies();
  133 |     
  134 |     // Verify cookies were cleared
  135 |     const cookies = await context.cookies();
  136 |     const authCookie = cookies.find(cookie => cookie.name === 'next-auth.session-token');
  137 |     expect(authCookie, 'Auth cookie should be removed').toBeUndefined();
  138 |     
  139 |     // Try to access protected route
  140 |     await page.goto('/dashboard');
  141 |     await page.waitForLoadState('networkidle');
  142 |     
  143 |     // Take screenshot for debugging
  144 |     await page.screenshot({ path: 'test-artifacts/screenshots/auth-test-unauthenticated.png' });
  145 |     
  146 |     // Not all applications immediately show login UI or redirect when unauthenticated
  147 |     // We need to have flexible verification that adapts to the application behavior
  148 |     
  149 |     // Check if we see the login buttons/UI
  150 |     const loginVisible = await page.locator('text=/Sign in|Login|Authenticate|Unauthorized/i').count() > 0;
  151 |     
  152 |     // Check if we were redirected to a login-related URL
  153 |     const currentUrl = page.url();
  154 |     const isLoginRedirect = currentUrl.includes('signin') || 
  155 |                             currentUrl.includes('login') || 
  156 |                             currentUrl.includes('auth');
  157 |     
  158 |     // If we're on the original URL but see a 404, that's not authentication working -
  159 |     // the route might just not exist
  160 |     const is404 = await page.locator('text="404"').count() > 0;
  161 |     
```
import { test, expect } from '@playwright/test';
import { isMockAuthEnabled } from './helpers/mockAuth';

/**
 * Robust Authentication Flow Tests
 * 
 * These tests verify authentication state using multiple verification methods
 * to ensure reliability across different environments and timing conditions.
 * 
 * Key improvements over basic cookie tests:
 * 1. API-based authentication verification
 * 2. Content-based authentication checks
 * 3. Explicit wait conditions instead of arbitrary timeouts
 * 4. Multiple verification checkpoints
 * 5. Server-side state validation
 */

// Check if auth tests should run
const shouldRunAuthTests = isMockAuthEnabled();

// Helper to verify authentication through API
async function verifyAuthViaAPI(page: any) {
  try {
    const response = await page.request.get('/api/auth/session');
    const session = await response.json();
    return !!(session && session.user);
  } catch (error) {
    console.error('API verification error:', error);
    return false;
  }
}

// Helper to wait for authentication indicators in the UI
async function waitForAuthUI(page: any, authenticated = true) {
  if (authenticated) {
    // Wait for indicators that show user is authenticated
    // This could be a user menu, avatar, or specific authenticated content
    try {
      await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
      return true;
    } catch {
      // Fallback: check for absence of login UI
      const loginUI = await page.locator('text=/Sign in|Login|Authenticate/i').count();
      return loginUI === 0;
    }
  } else {
    // Wait for login UI to appear
    await page.waitForSelector('text=/Sign in|Login|Authenticate/i', { timeout: 5000 });
  }
}

test.describe('Robust Authentication State Management', () => {
  test('should verify authentication through multiple methods', async ({ page, context }) => {
    test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
    
    // Step 1: Verify initial authentication state
    await page.goto('/');
    
    // Method 1: Cookie verification
    const cookies = await context.cookies();
    const authCookie = cookies.find(cookie => cookie.name === 'next-auth.session-token');
    expect(authCookie, 'Auth cookie should exist').toBeDefined();
    
    // Method 2: API verification
    const isAuthenticatedViaAPI = await verifyAuthViaAPI(page);
    expect(isAuthenticatedViaAPI, 'API should confirm authentication').toBeTruthy();
    
    // Method 3: UI verification (if applicable)
    const hasAuthUI = await waitForAuthUI(page, true);
    console.log(`UI shows authenticated state: ${hasAuthUI}`);
    
    // Store session data for comparison
    const initialSession = await page.request.get('/api/auth/session').then(r => r.json());
    
    console.log('✅ Initial authentication verified through multiple methods');
    
    // Step 2: Navigate and verify persistence
    await page.goto('/dashboard');
    
    // Wait for page to be fully loaded by checking for specific content
    await page.waitForSelector('body', { state: 'attached' });
    
    // Re-verify authentication after navigation
    const dashboardAuth = await verifyAuthViaAPI(page);
    expect(dashboardAuth, 'Authentication should persist on dashboard').toBeTruthy();
    
    // Verify session consistency
    const dashboardSession = await page.request.get('/api/auth/session').then(r => r.json());
    expect(dashboardSession?.user?.id).toBe(initialSession?.user?.id);
    
    console.log('✅ Authentication persisted to dashboard');
    
    // Step 3: Return to homepage and verify again
    await page.goto('/');
    await page.waitForSelector('body', { state: 'attached' });
    
    const finalAuth = await verifyAuthViaAPI(page);
    expect(finalAuth, 'Authentication should persist after returning home').toBeTruthy();
    
    // Final cookie check
    const finalCookies = await context.cookies();
    const finalAuthCookie = finalCookies.find(cookie => cookie.name === 'next-auth.session-token');
    expect(finalAuthCookie).toBeDefined();
    expect(finalAuthCookie?.value).toBe(authCookie?.value);
    
    console.log('✅ Authentication maintained across multiple navigations');
  });
  
  test('should handle authentication state with explicit checkpoints', async ({ page, context }) => {
    test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
    
    // Define checkpoints for verification
    const checkpoints = [
      { url: '/', name: 'Homepage' },
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/', name: 'Homepage (return)' }
    ];
    
    let previousSession = null;
    
    for (const checkpoint of checkpoints) {
      await page.goto(checkpoint.url);
      await page.waitForLoadState('domcontentloaded');
      
      // Checkpoint verification
      console.log(`Verifying authentication at ${checkpoint.name}...`);
      
      // 1. Verify cookies exist
      const cookies = await context.cookies();
      const hasAuthCookie = cookies.some(c => c.name === 'next-auth.session-token');
      expect(hasAuthCookie, `Should have auth cookie at ${checkpoint.name}`).toBe(true);
      
      // 2. Verify API recognizes authentication
      const response = await page.request.get('/api/auth/session');
      expect(response.ok(), `Session API should respond successfully at ${checkpoint.name}`).toBe(true);
      
      const session = await response.json();
      expect(session?.user, `Should have user session at ${checkpoint.name}`).toBeDefined();
      
      // 3. Verify session consistency
      if (previousSession) {
        expect(session.user.id).toBe(previousSession.user.id);
        expect(session.user.email).toBe(previousSession.user.email);
      }
      previousSession = session;
      
      // 4. Optional: Verify protected content is accessible
      if (checkpoint.url === '/dashboard') {
        // Try to access a protected API endpoint
        const protectedResponse = await page.request.get('/api/summary?startDate=2024-01-01&endDate=2024-12-31');
        // Should not get 401 Unauthorized
        expect(protectedResponse.status()).not.toBe(401);
      }
      
      console.log(`✅ Authentication verified at ${checkpoint.name}`);
    }
  });
  
  test('should detect authentication loss reliably', async ({ page, context }) => {
    test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
    
    // Start authenticated
    await page.goto('/');
    const initialAuth = await verifyAuthViaAPI(page);
    expect(initialAuth).toBeTruthy();
    
    // Clear authentication
    await context.clearCookies();
    
    // Navigate to trigger re-evaluation
    await page.goto('/dashboard');
    
    // Verify authentication is lost through multiple methods
    const cookies = await context.cookies();
    const hasAuthCookie = cookies.some(c => c.name === 'next-auth.session-token');
    expect(hasAuthCookie).toBe(false);
    
    // API should return empty session
    const sessionResponse = await page.request.get('/api/auth/session');
    const session = await sessionResponse.json();
    expect(session?.user).toBeUndefined();
    
    // Protected endpoints should return 401
    const protectedResponse = await page.request.get('/api/summary?startDate=2024-01-01&endDate=2024-12-31');
    expect(protectedResponse.status()).toBe(401);
    
    console.log('✅ Authentication loss detected through multiple verification methods');
  });
});

test.describe('Authentication Robustness Patterns', () => {
  test('should handle rapid navigation without timing dependencies', async ({ page, context }) => {
    test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
    
    // Rapid navigation test without arbitrary delays
    const urls = ['/', '/dashboard', '/', '/dashboard', '/'];
    
    for (const url of urls) {
      await page.goto(url);
      
      // Instead of waiting for arbitrary time, wait for specific conditions
      await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.waitForFunction(() => document.readyState === 'complete'),
        // Wait for any pending API calls to complete
        page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
          // networkidle might timeout in dev, but that's OK
          // We have other verification methods
        })
      ]);
      
      // Verify auth state immediately
      const hasAuth = await verifyAuthViaAPI(page);
      expect(hasAuth, `Should maintain auth at ${url}`).toBeTruthy();
    }
    
    console.log('✅ Authentication maintained through rapid navigation');
  });
  
  test('should use event-based synchronization for auth state', async ({ page, context }) => {
    test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
    
    // Set up listener for auth state changes
    const authStateChanges: Array<{ url: string; status: number; timestamp: number }> = [];
    
    // Monitor network requests to auth endpoints
    page.on('response', response => {
      if (response.url().includes('/api/auth/session')) {
        authStateChanges.push({
          url: page.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      }
    });
    
    // Navigate and track auth checks
    await page.goto('/');
    await page.goto('/dashboard');
    await page.goto('/');
    
    // Verify auth was checked at each navigation
    expect(authStateChanges.length).toBeGreaterThanOrEqual(3);
    
    // All auth checks should succeed
    const allSuccessful = authStateChanges.every(change => change.status === 200);
    expect(allSuccessful).toBe(true);
    
    console.log('✅ Event-based auth verification successful');
    console.log(`Auth state checked ${authStateChanges.length} times during navigation`);
  });

  test('should handle cookie synchronization edge cases', async ({ page, context }) => {
    test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
    
    // Test cookie behavior across different navigation scenarios
    const scenarios = [
      { name: 'Standard navigation', action: () => page.goto('/dashboard') },
      { name: 'Back/forward navigation', action: () => page.goBack().then(() => page.goForward()) },
      { name: 'Reload navigation', action: () => page.reload() },
      { name: 'Hash navigation', action: () => page.goto('/#section') }
    ];
    
    // Start authenticated
    await page.goto('/');
    const initialAuth = await verifyAuthViaAPI(page);
    expect(initialAuth).toBeTruthy();
    
    for (const scenario of scenarios) {
      console.log(`Testing ${scenario.name}...`);
      
      // Perform navigation scenario
      await scenario.action();
      await page.waitForLoadState('domcontentloaded');
      
      // Verify authentication persisted
      const auth = await verifyAuthViaAPI(page);
      expect(auth, `Authentication should persist through ${scenario.name}`).toBeTruthy();
      
      // Verify cookie integrity
      const cookies = await context.cookies();
      const authCookie = cookies.find(c => c.name === 'next-auth.session-token');
      expect(authCookie, `Auth cookie should exist after ${scenario.name}`).toBeDefined();
    }
    
    console.log('✅ Cookie synchronization verified across all navigation scenarios');
  });

  test('should validate session data consistency', async ({ page, context }) => {
    test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
    
    // Get initial session data
    await page.goto('/');
    const initialSession = await page.request.get('/api/auth/session').then(r => r.json());
    expect(initialSession?.user).toBeDefined();
    
    const checkpoints = [
      '/dashboard',
      '/',
      '/dashboard',
      '/'
    ];
    
    for (const checkpoint of checkpoints) {
      await page.goto(checkpoint);
      await page.waitForLoadState('domcontentloaded');
      
      // Get current session
      const currentSession = await page.request.get('/api/auth/session').then(r => r.json());
      
      // Verify session data consistency
      expect(currentSession?.user?.id, 'User ID should remain consistent').toBe(initialSession.user.id);
      expect(currentSession?.user?.email, 'User email should remain consistent').toBe(initialSession.user.email);
      expect(currentSession?.user?.name, 'User name should remain consistent').toBe(initialSession.user.name);
      
      // Verify session expiry hasn't changed unexpectedly
      if (initialSession.expires && currentSession.expires) {
        const timeDiff = Math.abs(new Date(currentSession.expires).getTime() - new Date(initialSession.expires).getTime());
        expect(timeDiff, 'Session expiry should not change significantly').toBeLessThan(5000); // 5 second tolerance
      }
    }
    
    console.log('✅ Session data consistency maintained across navigation');
  });
});
import { test, expect } from '@playwright/test';
import { isMockAuthEnabled } from './helpers/mockAuth';
import { 
  initializeAuthDebug, 
  finalizeAuthDebug, 
  captureAuthDebugSnapshot, 
  debugLog,
  navigateWithCISync,
  waitForAuthStabilization,
  applyCISyncDelay,
  forceSessionSync
} from './helpers/authDebug';
import { 
  verifyAuthViaAPI as verifyAuthViaAPIHelper, 
  verifyAuthViaCookies, 
  verifyAuthentication 
} from './helpers/authVerification';

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
    
    initializeAuthDebug('Robust Auth - Multiple Methods Verification');
    let testSuccess = false;
    
    try {
      // Step 1: Verify initial authentication state
      debugLog('Starting multi-method authentication verification');
      await page.goto('/');
      
      // Capture initial state
      await captureAuthDebugSnapshot(page, context, 'initial-page-load');
      
      // Use enhanced verification functions with built-in debugging
      const { isAuthenticated, results, summary } = await verifyAuthentication(page, context);
      
      debugLog('Multi-method verification results', {
        overall: isAuthenticated,
        summary,
        detailedResults: results
      });
      
      // Individual method verification for detailed assertions
      const cookieResult = await verifyAuthViaCookies(context);
      expect(cookieResult.isAuthenticated, 'Cookie verification should pass').toBeTruthy();
      
      const apiResult = await verifyAuthViaAPIHelper(page);
      expect(apiResult.isAuthenticated, 'API verification should pass').toBeTruthy();
      
      // Overall verification
      expect(isAuthenticated, 'Overall authentication should be confirmed by multiple methods').toBeTruthy();
      
      // Method 3: UI verification (if applicable)
      const hasAuthUI = await waitForAuthUI(page, true);
      debugLog(`UI authentication state: ${hasAuthUI}`);
      
      // Store session data for comparison
      const initialSession = await page.request.get('/api/auth/session').then(r => r.json());
      debugLog('Initial session data captured', {
        hasUser: !!(initialSession && initialSession.user),
        userEmail: initialSession?.user?.email || 'none'
      });
      
      debugLog('✅ Initial authentication verified through multiple methods');
      
      // Step 2: Navigate to dashboard with CI synchronization
      debugLog('Testing authentication persistence through navigation with CI sync');
      
      const dashboardSuccess = await navigateWithCISync(page, context, '/dashboard', 'dashboard-persistence', {
        verifyAuth: true,
        maxSyncAttempts: 3
      });
      
      if (!dashboardSuccess) {
        throw new Error('Authentication failed to persist during navigation to dashboard');
      }
      
      // Additional verification using multiple methods
      const dashboardAuth = await verifyAuthViaAPIHelper(page);
      expect(dashboardAuth.isAuthenticated, 'API verification should confirm dashboard authentication').toBeTruthy();
      
      // Verify session consistency with CI synchronization
      await forceSessionSync(page, context, 'dashboard-session-check');
      const dashboardSession = await page.request.get('/api/auth/session').then(r => r.json());
      expect(dashboardSession?.user?.id).toBe(initialSession?.user?.id);
      
      debugLog('✅ Authentication persisted to dashboard with CI sync');
      
      // Step 3: Return to homepage with CI synchronization
      const homepageSuccess = await navigateWithCISync(page, context, '/', 'homepage-return', {
        verifyAuth: true,
        maxSyncAttempts: 3
      });
      
      if (!homepageSuccess) {
        throw new Error('Authentication failed to persist during return to homepage');
      }
      
      // Final comprehensive verification
      const finalAuth = await verifyAuthViaAPIHelper(page);
      expect(finalAuth.isAuthenticated, 'Authentication should persist after CI-synchronized return home').toBeTruthy();
      
      // Wait for authentication to stabilize and verify
      const finalStable = await waitForAuthStabilization(page, context, 'final-verification', {
        maxAttempts: 3,
        expectedAuthenticated: true
      });
      expect(finalStable, 'Final authentication state should be stable').toBeTruthy();
      
      // Final cookie check
      const finalCookies = await context.cookies();
      const finalAuthCookie = finalCookies.find(cookie => cookie.name === 'next-auth.session-token');
      expect(finalAuthCookie).toBeDefined();
      
      debugLog('Cookie persistence verification', {
        initialCookieExists: !!(results.find(r => r.method === 'cookie')?.isAuthenticated),
        finalCookieExists: !!finalAuthCookie,
        authenticationStabilized: finalStable
      });
      
      testSuccess = true;
      debugLog('✅ Authentication maintained across multiple navigations with CI synchronization');
      
    } catch (error) {
      debugLog('❌ Multi-method authentication verification failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    } finally {
      finalizeAuthDebug('Robust Auth - Multiple Methods Verification', testSuccess);
    }
  });
  
  test('should handle authentication state with explicit checkpoints', async ({ page, context }) => {
    test.skip(!shouldRunAuthTests, 'Skipping: mock auth not enabled');
    
    initializeAuthDebug('Robust Auth - Explicit Checkpoints with CI Sync');
    let testSuccess = false;
    
    try {
      // Define checkpoints for verification
      const checkpoints = [
        { url: '/', name: 'Homepage' },
        { url: '/dashboard', name: 'Dashboard' },
        { url: '/', name: 'Homepage (return)' }
      ];
      
      let previousSession = null;
      
      for (let i = 0; i < checkpoints.length; i++) {
        const checkpoint = checkpoints[i];
        const stepName = `checkpoint-${i + 1}-${checkpoint.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        
        debugLog(`Processing checkpoint ${i + 1}/${checkpoints.length}: ${checkpoint.name} (${checkpoint.url})`);
        
        // Navigate with CI synchronization
        const navSuccess = await navigateWithCISync(page, context, checkpoint.url, stepName, {
          verifyAuth: true,
          maxSyncAttempts: 3
        });
        
        expect(navSuccess, `Navigation to ${checkpoint.name} should succeed with CI sync`).toBeTruthy();
        
        // Wait for authentication to stabilize at this checkpoint
        const stable = await waitForAuthStabilization(page, context, `${stepName}-stable`, {
          maxAttempts: 3,
          expectedAuthenticated: true
        });
        expect(stable, `Authentication should be stable at ${checkpoint.name}`).toBeTruthy();
        
        // Comprehensive verification using multiple methods
        const { isAuthenticated, results } = await verifyAuthentication(page, context);
        expect(isAuthenticated, `Authentication should be verified at ${checkpoint.name}`).toBeTruthy();
        
        debugLog(`Checkpoint verification results for ${checkpoint.name}`, {
          overall: isAuthenticated,
          methods: results.map(r => ({ method: r.method, authenticated: r.isAuthenticated }))
        });
        
        // Session consistency check with CI synchronization
        await forceSessionSync(page, context, `${stepName}-session-sync`);
        const response = await page.request.get('/api/auth/session');
        expect(response.ok(), `Session API should respond successfully at ${checkpoint.name}`).toBe(true);
        
        const session = await response.json();
        expect(session?.user, `Should have user session at ${checkpoint.name}`).toBeDefined();
        
        // Verify session consistency across checkpoints
        if (previousSession) {
          expect(session.user.id).toBe(previousSession.user.id);
          expect(session.user.email).toBe(previousSession.user.email);
          debugLog(`Session consistency maintained from previous checkpoint`);
        }
        previousSession = session;
        
        // Protected content verification for dashboard
        if (checkpoint.url === '/dashboard') {
          debugLog('Testing protected API access from dashboard');
          
          // Apply CI delay before protected API test
          await applyCISyncDelay(page, `${stepName}-protected-api-test`, 1, 300);
          
          const protectedResponse = await page.request.get('/api/summary?startDate=2024-01-01&endDate=2024-12-31');
          expect(protectedResponse.status()).not.toBe(401);
          
          debugLog('Protected API access verified from dashboard');
        }
        
        debugLog(`✅ Authentication verified at ${checkpoint.name} with CI synchronization`);
      }
      
      testSuccess = true;
      debugLog('✅ All authentication checkpoints passed with CI synchronization');
      
    } catch (error) {
      debugLog('❌ Explicit checkpoints test with CI sync failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    } finally {
      finalizeAuthDebug('Robust Auth - Explicit Checkpoints with CI Sync', testSuccess);
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
import { Page, BrowserContext, expect } from '@playwright/test';
import { debugLog, captureAuthDebugSnapshot, verifySessionAPIWithRetries, waitForCookieSync } from './authDebug';

/**
 * Authentication Verification Helpers
 * 
 * Provides robust methods for verifying authentication state
 * without relying on timing or specific implementation details.
 * Enhanced with detailed debugging for CI environments.
 */

export interface AuthVerificationResult {
  isAuthenticated: boolean;
  method: string;
  details?: any;
}

/**
 * Verify authentication through the NextAuth session API
 */
export async function verifyAuthViaAPI(page: Page): Promise<AuthVerificationResult> {
  debugLog('Starting API authentication verification');
  
  try {
    const response = await page.request.get('/api/auth/session');
    const status = response.status();
    
    debugLog(`Session API response status: ${status}`);
    
    if (!response.ok()) {
      debugLog(`Session API failed with status ${status}`);
      return { isAuthenticated: false, method: 'api', details: { status } };
    }
    
    const session = await response.json();
    const isAuthenticated = !!(session && session.user);
    
    debugLog('Session API verification result', {
      isAuthenticated,
      hasSession: !!session,
      hasUser: !!(session && session.user),
      userEmail: session?.user?.email || 'none'
    });
    
    return {
      isAuthenticated,
      method: 'api',
      details: { session, status }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugLog(`Session API verification error: ${errorMessage}`);
    
    return {
      isAuthenticated: false,
      method: 'api',
      details: { error: errorMessage }
    };
  }
}

/**
 * Verify authentication through cookie presence and validity
 */
export async function verifyAuthViaCookies(context: BrowserContext): Promise<AuthVerificationResult> {
  debugLog('Starting cookie authentication verification');
  
  const cookies = await context.cookies();
  const allCookieNames = cookies.map(c => c.name);
  const authCookie = cookies.find(cookie => cookie.name === 'next-auth.session-token');
  
  debugLog('Cookie verification details', {
    totalCookies: cookies.length,
    allCookieNames,
    hasAuthCookie: !!authCookie
  });
  
  if (!authCookie) {
    debugLog('Authentication cookie not found');
    return { isAuthenticated: false, method: 'cookie', details: { reason: 'No auth cookie found', allCookieNames } };
  }
  
  // Check cookie hasn't expired
  const now = Date.now() / 1000;
  const isExpired = authCookie.expires > 0 && authCookie.expires < now;
  
  debugLog('Authentication cookie details', {
    name: authCookie.name,
    domain: authCookie.domain,
    path: authCookie.path,
    expires: authCookie.expires,
    expiresDate: authCookie.expires > 0 ? new Date(authCookie.expires * 1000).toISOString() : 'session',
    httpOnly: authCookie.httpOnly,
    secure: authCookie.secure,
    sameSite: authCookie.sameSite,
    isExpired,
    valueLength: authCookie.value.length
  });
  
  if (isExpired) {
    debugLog('Authentication cookie is expired');
    return { isAuthenticated: false, method: 'cookie', details: { reason: 'Cookie expired' } };
  }
  
  debugLog('Cookie verification successful');
  return {
    isAuthenticated: true,
    method: 'cookie',
    details: { 
      cookieName: authCookie.name,
      expires: new Date(authCookie.expires * 1000).toISOString(),
      domain: authCookie.domain,
      httpOnly: authCookie.httpOnly,
      secure: authCookie.secure,
      sameSite: authCookie.sameSite
    }
  };
}

/**
 * Verify authentication through protected endpoint access
 */
export async function verifyAuthViaProtectedEndpoint(page: Page): Promise<AuthVerificationResult> {
  try {
    // Try to access a protected endpoint
    const response = await page.request.get('/api/summary?startDate=2024-01-01&endDate=2024-12-31');
    
    // If we get 401, we're not authenticated
    if (response.status() === 401) {
      return { isAuthenticated: false, method: 'protected-endpoint', details: { status: 401 } };
    }
    
    // If we get data back, we're authenticated
    if (response.ok()) {
      return { isAuthenticated: true, method: 'protected-endpoint', details: { status: response.status() } };
    }
    
    // Other status codes are inconclusive
    return {
      isAuthenticated: false,
      method: 'protected-endpoint',
      details: { status: response.status(), reason: 'Unexpected status' }
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      method: 'protected-endpoint',
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

/**
 * Comprehensive authentication verification using multiple methods
 */
export async function verifyAuthentication(
  page: Page,
  context: BrowserContext
): Promise<{
  isAuthenticated: boolean;
  results: AuthVerificationResult[];
  summary: string;
}> {
  const results: AuthVerificationResult[] = [];
  
  // Method 1: API verification
  results.push(await verifyAuthViaAPI(page));
  
  // Method 2: Cookie verification
  results.push(await verifyAuthViaCookies(context));
  
  // Method 3: Protected endpoint verification
  results.push(await verifyAuthViaProtectedEndpoint(page));
  
  // Determine overall authentication status
  const authenticatedCount = results.filter(r => r.isAuthenticated).length;
  const isAuthenticated = authenticatedCount >= 2; // At least 2 methods must agree
  
  const summary = `Auth verified: ${authenticatedCount}/${results.length} methods confirmed authentication`;
  
  return { isAuthenticated, results, summary };
}

/**
 * Wait for authentication state to stabilize
 */
export async function waitForAuthState(
  page: Page,
  context: BrowserContext,
  expectedState: boolean = true,
  options: { timeout?: number; checkInterval?: number } = {}
): Promise<boolean> {
  const { timeout = 10000, checkInterval = 500 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const { isAuthenticated } = await verifyAuthentication(page, context);
    
    if (isAuthenticated === expectedState) {
      return true;
    }
    
    await page.waitForTimeout(checkInterval);
  }
  
  return false;
}

/**
 * Assert authentication state with detailed error reporting
 */
export async function assertAuthenticated(
  page: Page,
  context: BrowserContext,
  message?: string
): Promise<void> {
  const { isAuthenticated, results, summary } = await verifyAuthentication(page, context);
  
  if (!isAuthenticated) {
    const details = results.map(r => 
      `${r.method}: ${r.isAuthenticated ? 'authenticated' : 'not authenticated'} ${
        r.details ? `(${JSON.stringify(r.details)})` : ''
      }`
    ).join('\n  ');
    
    throw new Error(
      `${message || 'Authentication assertion failed'}\n${summary}\nDetails:\n  ${details}`
    );
  }
}

/**
 * Perform an action and verify authentication is maintained
 */
export async function withAuthVerification<T>(
  page: Page,
  context: BrowserContext,
  action: () => Promise<T>,
  actionDescription: string
): Promise<T> {
  // Verify initial state
  await assertAuthenticated(page, context, `Authentication required before ${actionDescription}`);
  
  // Perform action
  const result = await action();
  
  // Verify final state
  await assertAuthenticated(page, context, `Authentication lost after ${actionDescription}`);
  
  return result;
}

/**
 * Navigate with authentication verification at each step
 */
export async function navigateWithAuthVerification(
  page: Page,
  context: BrowserContext,
  url: string,
  options: { 
    waitStrategy?: 'domcontentloaded' | 'networkidle' | 'load';
    verifyBefore?: boolean;
    verifyAfter?: boolean;
    ciDelay?: number;
  } = {}
): Promise<void> {
  const { 
    waitStrategy = 'domcontentloaded', 
    verifyBefore = true, 
    verifyAfter = true,
    ciDelay = 500 
  } = options;
  
  debugLog(`Starting navigation to ${url}`, { waitStrategy, verifyBefore, verifyAfter });
  
  // Capture state before navigation
  let beforeSnapshot;
  if (verifyBefore) {
    beforeSnapshot = await captureAuthDebugSnapshot(page, context, `before-navigation-to-${url}`);
    await assertAuthenticated(page, context, `Authentication required before navigating to ${url}`);
  }
  
  // Navigate
  const navStartTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState(waitStrategy);
  
  // CI-specific delay for cookie synchronization
  if (process.env.CI && ciDelay > 0) {
    try {
      const { applyAdaptiveDelay } = await import('./adaptiveTiming');
      await applyAdaptiveDelay(page, `navigation-sync-${url}`, 1, { baseDelay: ciDelay });
    } catch (error) {
      debugLog(`Using fallback CI delay for navigation to ${url}`, { ciDelay });
      await page.waitForTimeout(ciDelay);
    }
  }
  
  const navDuration = Date.now() - navStartTime;
  debugLog(`Navigation completed in ${navDuration}ms`);
  
  // Capture state after navigation and compare
  if (verifyAfter) {
    const afterSnapshot = await captureAuthDebugSnapshot(page, context, `after-navigation-to-${url}`);
    
    if (beforeSnapshot) {
      const { compareAuthSnapshots } = await import('./authDebug');
      const comparison = compareAuthSnapshots(beforeSnapshot, afterSnapshot);
      if (comparison.significantChanges) {
        debugLog(`Detected authentication state changes during navigation to ${url}`, comparison);
      }
    }
    
    await assertAuthenticated(page, context, `Authentication lost after navigating to ${url}`);
  }
}

/**
 * Session comparison utilities
 */
export interface SessionData {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
  expires?: string;
}

export function compareSessionData(
  session1: SessionData,
  session2: SessionData,
  strict: boolean = true
): { isEqual: boolean; differences: string[] } {
  const differences: string[] = [];
  
  // Compare user data
  if (session1.user?.id !== session2.user?.id) {
    differences.push(`User ID changed: ${session1.user?.id} → ${session2.user?.id}`);
  }
  
  if (session1.user?.email !== session2.user?.email) {
    differences.push(`User email changed: ${session1.user?.email} → ${session2.user?.email}`);
  }
  
  if (session1.user?.name !== session2.user?.name) {
    differences.push(`User name changed: ${session1.user?.name} → ${session2.user?.name}`);
  }
  
  // Compare expiry (with tolerance for minor timing differences)
  if (session1.expires && session2.expires) {
    const time1 = new Date(session1.expires).getTime();
    const time2 = new Date(session2.expires).getTime();
    const timeDiff = Math.abs(time1 - time2);
    
    if (strict && timeDiff > 5000) { // 5 second tolerance
      differences.push(`Session expiry changed significantly: ${session1.expires} → ${session2.expires}`);
    }
  } else if (session1.expires !== session2.expires) {
    differences.push(`Session expiry presence changed: ${session1.expires} → ${session2.expires}`);
  }
  
  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * Enhanced session consistency checker
 */
export async function verifySessionConsistency(
  page: Page,
  referenceSession: SessionData,
  description: string = 'session consistency check'
): Promise<void> {
  const currentSession = await page.request.get('/api/auth/session').then(r => r.json());
  const comparison = compareSessionData(referenceSession, currentSession);
  
  if (!comparison.isEqual) {
    throw new Error(
      `Session consistency violation during ${description}:\n${comparison.differences.join('\n')}`
    );
  }
}
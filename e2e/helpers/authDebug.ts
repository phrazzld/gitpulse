import { Page, BrowserContext } from '@playwright/test';

/**
 * Enhanced Authentication Debugging Utilities
 * 
 * Provides detailed debugging and logging for authentication issues
 * in CI environments, particularly focusing on cookie synchronization
 * and timing-related failures.
 */

export interface CookieDebugInfo {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: string | undefined;
  expiresDate: string;
  isExpired: boolean;
}

export interface AuthDebugSnapshot {
  timestamp: string;
  step: string;
  cookies: CookieDebugInfo[];
  sessionAPI: any;
  storageState: any;
  timing: {
    stepDuration?: number;
    totalDuration?: number;
  };
}

let debugStartTime: number = Date.now();
let lastStepTime: number = Date.now();

/**
 * Check if debugging should be enabled
 */
export function isDebugEnabled(): boolean {
  return !!(process.env.CI || process.env.AUTH_DEBUG || process.env.DEBUG);
}

/**
 * Log debug information conditionally
 */
export function debugLog(message: string, data?: any): void {
  if (isDebugEnabled()) {
    const timestamp = new Date().toISOString();
    console.log(`[AUTH-DEBUG ${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Parse cookie into debug-friendly format
 */
export function parseCookieForDebug(cookie: any): CookieDebugInfo {
  const now = Date.now() / 1000;
  const expiresDate = cookie.expires > 0 ? new Date(cookie.expires * 1000).toISOString() : 'session';
  const isExpired = cookie.expires > 0 && cookie.expires < now;

  return {
    name: cookie.name,
    value: cookie.value.substring(0, 20) + '...', // Truncate for security
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    expiresDate,
    isExpired
  };
}

/**
 * Capture comprehensive authentication state for debugging
 */
export async function captureAuthDebugSnapshot(
  page: Page,
  context: BrowserContext,
  step: string
): Promise<AuthDebugSnapshot> {
  const now = Date.now();
  const stepDuration = now - lastStepTime;
  const totalDuration = now - debugStartTime;
  lastStepTime = now;

  // Capture cookies
  const allCookies = await context.cookies();
  const cookieDebugInfo = allCookies.map(parseCookieForDebug);

  // Capture session API response
  let sessionAPI = null;
  try {
    const response = await page.request.get('/api/auth/session');
    sessionAPI = {
      status: response.status(),
      data: response.ok() ? await response.json() : null,
      headers: response.headers()
    };
  } catch (error) {
    sessionAPI = { error: error instanceof Error ? error.message : String(error) };
  }

  // Capture storage state
  let storageState = null;
  try {
    storageState = await context.storageState();
  } catch (error) {
    storageState = { error: error instanceof Error ? error.message : String(error) };
  }

  const snapshot: AuthDebugSnapshot = {
    timestamp: new Date().toISOString(),
    step,
    cookies: cookieDebugInfo,
    sessionAPI,
    storageState,
    timing: {
      stepDuration,
      totalDuration
    }
  };

  if (isDebugEnabled()) {
    debugLog(`Authentication Debug Snapshot - ${step}`, snapshot);
  }

  return snapshot;
}

/**
 * Compare two debug snapshots for differences
 */
export function compareAuthSnapshots(
  before: AuthDebugSnapshot,
  after: AuthDebugSnapshot
): {
  cookieChanges: string[];
  sessionChanges: string[];
  significantChanges: boolean;
} {
  const cookieChanges: string[] = [];
  const sessionChanges: string[] = [];

  // Compare cookies
  const beforeCookies = new Map(before.cookies.map(c => [c.name, c]));
  const afterCookies = new Map(after.cookies.map(c => [c.name, c]));

  // Check for added/removed cookies
  for (const [name, cookie] of beforeCookies) {
    if (!afterCookies.has(name)) {
      cookieChanges.push(`Cookie removed: ${name}`);
    }
  }

  for (const [name, cookie] of afterCookies) {
    if (!beforeCookies.has(name)) {
      cookieChanges.push(`Cookie added: ${name}`);
    } else {
      const beforeCookie = beforeCookies.get(name)!;
      if (beforeCookie.value !== cookie.value) {
        cookieChanges.push(`Cookie value changed: ${name}`);
      }
      if (beforeCookie.expires !== cookie.expires) {
        cookieChanges.push(`Cookie expiry changed: ${name} (${beforeCookie.expiresDate} → ${cookie.expiresDate})`);
      }
    }
  }

  // Compare session data
  if (before.sessionAPI?.data?.user?.id !== after.sessionAPI?.data?.user?.id) {
    sessionChanges.push(`User ID changed: ${before.sessionAPI?.data?.user?.id} → ${after.sessionAPI?.data?.user?.id}`);
  }

  if (before.sessionAPI?.status !== after.sessionAPI?.status) {
    sessionChanges.push(`Session API status changed: ${before.sessionAPI?.status} → ${after.sessionAPI?.status}`);
  }

  const significantChanges = cookieChanges.length > 0 || sessionChanges.length > 0;

  if (isDebugEnabled() && significantChanges) {
    debugLog(`Authentication state changes detected between "${before.step}" and "${after.step}"`, {
      cookieChanges,
      sessionChanges,
      timingDelta: after.timing.totalDuration! - before.timing.totalDuration!
    });
  }

  return { cookieChanges, sessionChanges, significantChanges };
}

/**
 * Wait for cookie synchronization with debugging
 */
export async function waitForCookieSync(
  page: Page,
  context: BrowserContext,
  cookieName: string = 'next-auth.session-token',
  options: {
    timeout?: number;
    checkInterval?: number;
    expectedPresent?: boolean;
  } = {}
): Promise<boolean> {
  const { timeout = 5000, checkInterval = 250, expectedPresent = true } = options;
  const startTime = Date.now();

  debugLog(`Waiting for cookie synchronization: ${cookieName} (expected: ${expectedPresent ? 'present' : 'absent'})`);

  while (Date.now() - startTime < timeout) {
    const cookies = await context.cookies();
    const targetCookie = cookies.find(c => c.name === cookieName);
    const isPresent = !!targetCookie;

    if (isPresent === expectedPresent) {
      debugLog(`Cookie synchronization completed: ${cookieName} is ${isPresent ? 'present' : 'absent'} as expected`);
      return true;
    }

    debugLog(`Cookie sync check: ${cookieName} is ${isPresent ? 'present' : 'absent'}, expected ${expectedPresent ? 'present' : 'absent'}`);
    await page.waitForTimeout(checkInterval);
  }

  debugLog(`Cookie synchronization timeout: ${cookieName} failed to reach expected state within ${timeout}ms`);
  return false;
}

/**
 * Verify session API with retries and debugging
 */
export async function verifySessionAPIWithRetries(
  page: Page,
  expectedAuthenticated: boolean = true,
  options: {
    retries?: number;
    retryInterval?: number;
    timeout?: number;
  } = {}
): Promise<{ success: boolean; attempts: number; lastError?: any }> {
  const { retries = 3, retryInterval = 500, timeout = 1000 } = options;
  
  debugLog(`Verifying session API: expecting authenticated=${expectedAuthenticated}, retries=${retries}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await page.request.get('/api/auth/session', {
        timeout
      });

      clearTimeout(timeoutId);

      const sessionData = response.ok() ? await response.json() : null;
      const isAuthenticated = !!(sessionData && sessionData.user);

      debugLog(`Session API attempt ${attempt}/${retries}`, {
        status: response.status(),
        isAuthenticated,
        expected: expectedAuthenticated,
        success: isAuthenticated === expectedAuthenticated
      });

      if (isAuthenticated === expectedAuthenticated) {
        debugLog(`Session API verification successful on attempt ${attempt}`);
        return { success: true, attempts: attempt };
      }

      if (attempt < retries) {
        debugLog(`Session API verification failed, retrying in ${retryInterval}ms...`);
        await page.waitForTimeout(retryInterval);
      }

    } catch (error) {
      debugLog(`Session API attempt ${attempt} failed with error`, error);
      
      if (attempt === retries) {
        return { 
          success: false, 
          attempts: attempt, 
          lastError: error instanceof Error ? error.message : String(error) 
        };
      }
      
      if (attempt < retries) {
        await page.waitForTimeout(retryInterval);
      }
    }
  }

  debugLog(`Session API verification failed after ${retries} attempts`);
  return { success: false, attempts: retries };
}

/**
 * Initialize debugging for a test
 */
export function initializeAuthDebug(testName: string): void {
  debugStartTime = Date.now();
  lastStepTime = Date.now();
  
  if (isDebugEnabled()) {
    debugLog(`=== Starting Authentication Debug for: ${testName} ===`);
    debugLog(`Environment: CI=${!!process.env.CI}, NODE_ENV=${process.env.NODE_ENV}`);
  }
}

/**
 * Finalize debugging for a test
 */
export function finalizeAuthDebug(testName: string, success: boolean): void {
  const totalDuration = Date.now() - debugStartTime;
  
  if (isDebugEnabled()) {
    debugLog(`=== Completed Authentication Debug for: ${testName} ===`, {
      success,
      totalDuration: `${totalDuration}ms`,
      timestamp: new Date().toISOString()
    });
  }
}
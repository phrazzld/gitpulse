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
  confidence: number; // 0-1 scale, how confident this method is
  details?: any;
  retryAttempts?: number;
  responseTime?: number;
}

/**
 * Verify authentication through the NextAuth session API with retry logic
 */
export async function verifyAuthViaAPI(
  page: Page, 
  options: { maxRetries?: number; timeout?: number } = {}
): Promise<AuthVerificationResult> {
  const { maxRetries = 3, timeout = 5000 } = options;
  debugLog('Starting API authentication verification with retries', { maxRetries, timeout });
  
  const startTime = Date.now();
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const attemptStart = Date.now();
      const response = await page.request.get('/api/auth/session', { timeout });
      const status = response.status();
      const responseTime = Date.now() - attemptStart;
      
      debugLog(`Session API response status: ${status} (attempt ${attempt}, ${responseTime}ms)`);
      
      if (!response.ok()) {
        if (attempt === maxRetries) {
          debugLog(`Session API failed with status ${status} after ${maxRetries} attempts`);
          return { 
            isAuthenticated: false, 
            method: 'api', 
            confidence: 0.1,
            details: { status, attempts: attempt },
            retryAttempts: attempt,
            responseTime
          };
        }
        
        // Retry on server errors, but not on auth failures (401)
        if (status >= 500) {
          debugLog(`Retrying API verification after ${status} error (attempt ${attempt + 1}/${maxRetries})`);
          await page.waitForTimeout(Math.min(100 * attempt, 1000)); // Progressive backoff
          continue;
        }
      }
      
      const session = await response.json();
      const isAuthenticated = !!(session && session.user);
      
      // High confidence for successful API responses
      const confidence = response.ok() && isAuthenticated ? 0.95 : 
                        response.ok() && !isAuthenticated ? 0.9 : 0.1;
      
      debugLog('Session API verification result', {
        isAuthenticated,
        confidence,
        hasSession: !!session,
        hasUser: !!(session && session.user),
        userEmail: session?.user?.email || 'none',
        attempts: attempt,
        responseTime
      });
      
      return {
        isAuthenticated,
        method: 'api',
        confidence,
        details: { session, status, attempts: attempt },
        retryAttempts: attempt,
        responseTime
      };
      
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog(`Session API verification error (attempt ${attempt}/${maxRetries}): ${errorMessage}`);
      
      if (attempt < maxRetries) {
        await page.waitForTimeout(Math.min(200 * attempt, 2000)); // Progressive backoff
      }
    }
  }
  
  const totalTime = Date.now() - startTime;
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  debugLog(`Session API verification failed after ${maxRetries} attempts (${totalTime}ms)`);
  
  return {
    isAuthenticated: false,
    method: 'api',
    confidence: 0.05, // Very low confidence after failures
    details: { error: errorMessage, attempts: maxRetries },
    retryAttempts: maxRetries,
    responseTime: totalTime
  };
}

/**
 * Verify authentication through cookie presence and validity
 */
export async function verifyAuthViaCookies(context: BrowserContext): Promise<AuthVerificationResult> {
  const startTime = Date.now();
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
    return { 
      isAuthenticated: false, 
      method: 'cookie', 
      confidence: 0.95, // High confidence in absence of cookie
      details: { reason: 'No auth cookie found', allCookieNames },
      responseTime: Date.now() - startTime
    };
  }
  
  // Check cookie validity with comprehensive analysis
  const now = Date.now() / 1000;
  const isExpired = authCookie.expires > 0 && authCookie.expires < now;
  const timeUntilExpiry = authCookie.expires > 0 ? authCookie.expires - now : null;
  const isNearExpiry = timeUntilExpiry !== null && timeUntilExpiry < 300; // 5 minutes
  
  // Calculate confidence based on cookie characteristics
  let confidence = 0.8; // Base confidence for cookie presence
  
  if (isExpired) {
    confidence = 0.95; // High confidence cookie is invalid
  } else if (isNearExpiry) {
    confidence = 0.6; // Lower confidence for soon-to-expire cookies
  } else if (!authCookie.httpOnly || !authCookie.secure) {
    confidence = 0.7; // Slightly lower confidence for insecure cookies
  } else if (authCookie.value.length < 10) {
    confidence = 0.5; // Low confidence for suspiciously short cookies
  }
  
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
    isNearExpiry,
    timeUntilExpiry,
    valueLength: authCookie.value.length,
    confidence
  });
  
  if (isExpired) {
    debugLog('Authentication cookie is expired');
    return { 
      isAuthenticated: false, 
      method: 'cookie', 
      confidence,
      details: { reason: 'Cookie expired', expiryTime: authCookie.expires },
      responseTime: Date.now() - startTime
    };
  }
  
  debugLog('Cookie verification successful');
  return {
    isAuthenticated: true,
    method: 'cookie',
    confidence,
    details: { 
      cookieName: authCookie.name,
      expires: authCookie.expires > 0 ? new Date(authCookie.expires * 1000).toISOString() : 'session',
      domain: authCookie.domain,
      httpOnly: authCookie.httpOnly,
      secure: authCookie.secure,
      sameSite: authCookie.sameSite,
      timeUntilExpiry,
      isNearExpiry
    },
    responseTime: Date.now() - startTime
  };
}

/**
 * Verify authentication through protected endpoint access with retry logic
 */
export async function verifyAuthViaProtectedEndpoint(
  page: Page,
  options: { maxRetries?: number; timeout?: number } = {}
): Promise<AuthVerificationResult> {
  const { maxRetries = 2, timeout = 8000 } = options;
  const startTime = Date.now();
  let lastError: any = null;
  
  debugLog('Starting protected endpoint authentication verification', { maxRetries, timeout });
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const attemptStart = Date.now();
      // Try to access a protected endpoint
      const response = await page.request.get('/api/summary?startDate=2024-01-01&endDate=2024-12-31', { timeout });
      const status = response.status();
      const responseTime = Date.now() - attemptStart;
      
      debugLog(`Protected endpoint response: ${status} (attempt ${attempt}, ${responseTime}ms)`);
      
      // Calculate confidence based on response
      let confidence = 0.7; // Base confidence for endpoint verification
      let isAuthenticated = false;
      
      if (status === 401) {
        // Clear indication of no authentication
        isAuthenticated = false;
        confidence = 0.9; // High confidence in 401 response
      } else if (response.ok()) {
        // Successful response indicates authentication
        isAuthenticated = true;
        confidence = 0.85; // High confidence in successful response
      } else if (status === 403) {
        // Forbidden - authenticated but not authorized (still authenticated)
        isAuthenticated = true;
        confidence = 0.75; // Good confidence in 403 response
      } else if (status >= 500) {
        // Server error - inconclusive, should retry
        if (attempt < maxRetries) {
          debugLog(`Retrying protected endpoint after ${status} error (attempt ${attempt + 1}/${maxRetries})`);
          await page.waitForTimeout(Math.min(500 * attempt, 2000));
          continue;
        }
        confidence = 0.2; // Low confidence due to server error
      } else {
        // Other status codes (404, etc.) are inconclusive
        confidence = 0.3;
      }
      
      return {
        isAuthenticated,
        method: 'protected-endpoint',
        confidence,
        details: { status, attempts: attempt },
        retryAttempts: attempt,
        responseTime
      };
      
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      debugLog(`Protected endpoint verification error (attempt ${attempt}/${maxRetries}): ${errorMessage}`);
      
      if (attempt < maxRetries) {
        await page.waitForTimeout(Math.min(750 * attempt, 3000));
      }
    }
  }
  
  const totalTime = Date.now() - startTime;
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  debugLog(`Protected endpoint verification failed after ${maxRetries} attempts (${totalTime}ms)`);
  
  return {
    isAuthenticated: false,
    method: 'protected-endpoint',
    confidence: 0.1, // Low confidence after failures
    details: { error: errorMessage, attempts: maxRetries },
    retryAttempts: maxRetries,
    responseTime: totalTime
  };
}

/**
 * Verify authentication through client-side storage (localStorage/sessionStorage)
 */
export async function verifyAuthViaStorage(page: Page): Promise<AuthVerificationResult> {
  const startTime = Date.now();
  debugLog('Starting client storage authentication verification');
  
  try {
    // Check for common authentication tokens in storage
    const storageData = await page.evaluate(() => {
      const localStorage = window.localStorage;
      const sessionStorage = window.sessionStorage;
      
      // Common auth token keys to check
      const authKeys = [
        'next-auth.session-token',
        'next-auth.callback-url',
        'next-auth.csrf-token',
        'auth-token',
        'access-token',
        'session',
        'user',
        'auth'
      ];
      
      const foundTokens: Array<{key: string, storage: string, hasValue: boolean, valueLength: number}> = [];
      
      // Check localStorage
      authKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          foundTokens.push({
            key,
            storage: 'localStorage',
            hasValue: true,
            valueLength: value.length
          });
        }
      });
      
      // Check sessionStorage
      authKeys.forEach(key => {
        const value = sessionStorage.getItem(key);
        if (value) {
          foundTokens.push({
            key,
            storage: 'sessionStorage',
            hasValue: true,
            valueLength: value.length
          });
        }
      });
      
      return {
        foundTokens,
        localStorageLength: localStorage.length,
        sessionStorageLength: sessionStorage.length
      };
    });
    
    const hasAuthTokens = storageData.foundTokens.length > 0;
    const hasSignificantTokens = storageData.foundTokens.some(token => token.valueLength > 10);
    
    // Calculate confidence based on storage findings
    let confidence = 0.3; // Base confidence for storage verification (lower than cookies/API)
    
    if (!hasAuthTokens) {
      confidence = 0.4; // Moderate confidence when no tokens found (not definitive)
    } else if (hasSignificantTokens) {
      confidence = 0.6; // Higher confidence when substantial tokens found
    } else {
      confidence = 0.2; // Lower confidence for suspicious small tokens
    }
    
    const responseTime = Date.now() - startTime;
    
    debugLog('Client storage verification result', {
      hasAuthTokens,
      hasSignificantTokens,
      foundTokens: storageData.foundTokens,
      confidence,
      responseTime
    });
    
    return {
      isAuthenticated: hasAuthTokens,
      method: 'storage',
      confidence,
      details: {
        foundTokens: storageData.foundTokens,
        localStorageLength: storageData.localStorageLength,
        sessionStorageLength: storageData.sessionStorageLength,
        hasSignificantTokens
      },
      responseTime
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    debugLog(`Client storage verification error: ${errorMessage}`);
    
    return {
      isAuthenticated: false,
      method: 'storage',
      confidence: 0.1, // Low confidence on error
      details: { error: errorMessage },
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Comprehensive authentication verification using multiple methods with weighted consensus
 */
export async function verifyAuthentication(
  page: Page,
  context: BrowserContext,
  options: {
    includeStorage?: boolean;
    timeoutOptions?: { maxRetries?: number; timeout?: number };
    confidenceThreshold?: number;
  } = {}
): Promise<{
  isAuthenticated: boolean;
  results: AuthVerificationResult[];
  summary: string;
  confidence: number;
  consensusDetails: {
    weightedScore: number;
    simpleConsensus: boolean;
    confidenceConsensus: boolean;
  };
}> {
  const { 
    includeStorage = true, 
    timeoutOptions = {}, 
    confidenceThreshold = 0.6 
  } = options;
  
  debugLog('Starting comprehensive authentication verification', {
    includeStorage,
    timeoutOptions,
    confidenceThreshold
  });
  
  const results: AuthVerificationResult[] = [];
  
  // Method 1: API verification (highest reliability)
  results.push(await verifyAuthViaAPI(page, timeoutOptions));
  
  // Method 2: Cookie verification (high reliability)
  results.push(await verifyAuthViaCookies(context));
  
  // Method 3: Protected endpoint verification (good reliability)
  results.push(await verifyAuthViaProtectedEndpoint(page, timeoutOptions));
  
  // Method 4: Storage verification (supplementary)
  if (includeStorage) {
    results.push(await verifyAuthViaStorage(page));
  }
  
  // Calculate weighted consensus
  const authenticatedResults = results.filter(r => r.isAuthenticated);
  const unauthenticatedResults = results.filter(r => !r.isAuthenticated);
  
  // Simple consensus (majority rule)
  const simpleConsensus = authenticatedResults.length > unauthenticatedResults.length;
  
  // Weighted consensus (confidence-based)
  const totalAuthenticatedWeight = authenticatedResults.reduce((sum, r) => sum + r.confidence, 0);
  const totalUnauthenticatedWeight = unauthenticatedResults.reduce((sum, r) => sum + r.confidence, 0);
  const totalWeight = totalAuthenticatedWeight + totalUnauthenticatedWeight;
  
  const weightedScore = totalWeight > 0 ? totalAuthenticatedWeight / totalWeight : 0;
  const confidenceConsensus = weightedScore >= confidenceThreshold;
  
  // Final decision: Use weighted consensus if there's high confidence, otherwise fall back to simple consensus
  const highConfidenceResults = results.filter(r => r.confidence >= 0.7);
  const useWeightedConsensus = highConfidenceResults.length >= 2;
  
  const isAuthenticated = useWeightedConsensus ? confidenceConsensus : simpleConsensus;
  
  // Calculate overall confidence
  const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const consensusStrength = Math.abs(weightedScore - 0.5) * 2; // 0-1 scale of how decisive the result is
  const overallConfidence = Math.min(averageConfidence * consensusStrength, 1.0);
  
  const consensusDetails = {
    weightedScore,
    simpleConsensus,
    confidenceConsensus
  };
  
  const summary = `Auth ${isAuthenticated ? 'authenticated' : 'not authenticated'}: ` +
    `${authenticatedResults.length}/${results.length} methods agree ` +
    `(weighted: ${Math.round(weightedScore * 100)}%, confidence: ${Math.round(overallConfidence * 100)}%)`;
  
  debugLog('Authentication verification completed', {
    isAuthenticated,
    simpleConsensus,
    confidenceConsensus,
    weightedScore,
    overallConfidence,
    useWeightedConsensus,
    methodResults: results.map(r => ({
      method: r.method,
      isAuthenticated: r.isAuthenticated,
      confidence: r.confidence,
      responseTime: r.responseTime
    }))
  });
  
  return { 
    isAuthenticated, 
    results, 
    summary, 
    confidence: overallConfidence,
    consensusDetails
  };
}

/**
 * Wait for authentication state to stabilize with adaptive timing integration
 */
export async function waitForAuthState(
  page: Page,
  context: BrowserContext,
  expectedState: boolean = true,
  options: { 
    timeout?: number; 
    checkInterval?: number;
    confidenceThreshold?: number;
    useAdaptiveTiming?: boolean;
  } = {}
): Promise<boolean> {
  const { 
    timeout = 10000, 
    checkInterval = 500, 
    confidenceThreshold = 0.7,
    useAdaptiveTiming = true
  } = options;
  
  debugLog('Waiting for authentication state to stabilize', {
    expectedState,
    timeout,
    checkInterval,
    confidenceThreshold,
    useAdaptiveTiming
  });
  
  const startTime = Date.now();
  
  // Try to use adaptive timing if available
  if (useAdaptiveTiming) {
    try {
      const { waitWithAdaptiveTiming } = await import('./adaptiveTiming');
      
      const result = await waitWithAdaptiveTiming(
        async () => {
          const verification = await verifyAuthentication(page, context);
          const matchesExpected = verification.isAuthenticated === expectedState;
          const hasHighConfidence = verification.confidence >= confidenceThreshold;
          
          debugLog('Auth state check (adaptive)', {
            isAuthenticated: verification.isAuthenticated,
            expectedState,
            matchesExpected,
            confidence: verification.confidence,
            hasHighConfidence,
            summary: verification.summary
          });
          
          return matchesExpected && hasHighConfidence ? true : null;
        },
        {
          step: `auth-state-${expectedState ? 'authenticated' : 'unauthenticated'}`,
          maxAttempts: Math.ceil(timeout / checkInterval),
          successCondition: (result) => result === true
        }
      );
      
      if (result) {
        debugLog('Authentication state stabilized using adaptive timing');
        return true;
      }
    } catch (error) {
      debugLog('Failed to use adaptive timing, falling back to regular polling', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Fallback to regular polling
  while (Date.now() - startTime < timeout) {
    const verification = await verifyAuthentication(page, context);
    const matchesExpected = verification.isAuthenticated === expectedState;
    const hasHighConfidence = verification.confidence >= confidenceThreshold;
    
    debugLog('Auth state check (regular)', {
      isAuthenticated: verification.isAuthenticated,
      expectedState,
      matchesExpected,
      confidence: verification.confidence,
      hasHighConfidence,
      summary: verification.summary
    });
    
    if (matchesExpected && hasHighConfidence) {
      debugLog('Authentication state stabilized');
      return true;
    }
    
    await page.waitForTimeout(checkInterval);
  }
  
  debugLog('Authentication state failed to stabilize within timeout');
  return false;
}

/**
 * Assert authentication state with enhanced error reporting and confidence analysis
 */
export async function assertAuthenticated(
  page: Page,
  context: BrowserContext,
  message?: string,
  options: { confidenceThreshold?: number; includeStorage?: boolean } = {}
): Promise<void> {
  const { confidenceThreshold = 0.6, includeStorage = true } = options;
  
  const verification = await verifyAuthentication(page, context, {
    includeStorage,
    confidenceThreshold
  });
  
  const { isAuthenticated, results, summary, confidence, consensusDetails } = verification;
  
  if (!isAuthenticated || confidence < confidenceThreshold) {
    const details = results.map(r => 
      `${r.method}: ${r.isAuthenticated ? 'authenticated' : 'not authenticated'} ` +
      `(confidence: ${Math.round(r.confidence * 100)}%${r.responseTime ? `, ${r.responseTime}ms` : ''}) ` +
      `${r.details ? `- ${JSON.stringify(r.details)}` : ''}`
    ).join('\n  ');
    
    const consensusInfo = [
      `Simple consensus: ${consensusDetails.simpleConsensus ? 'authenticated' : 'not authenticated'}`,
      `Weighted consensus: ${consensusDetails.confidenceConsensus ? 'authenticated' : 'not authenticated'} (${Math.round(consensusDetails.weightedScore * 100)}%)`,
      `Overall confidence: ${Math.round(confidence * 100)}%`
    ].join('\n  ');
    
    const failureReason = !isAuthenticated ? 'Authentication failed' : 
                         `Authentication confidence too low (${Math.round(confidence * 100)}% < ${Math.round(confidenceThreshold * 100)}%)`;
    
    throw new Error(
      `${message || 'Authentication assertion failed'}\n` +
      `Reason: ${failureReason}\n` +
      `${summary}\n\n` +
      `Consensus Analysis:\n  ${consensusInfo}\n\n` +
      `Method Details:\n  ${details}`
    );
  }
  
  debugLog('Authentication assertion passed', {
    isAuthenticated,
    confidence: Math.round(confidence * 100),
    methodCount: results.length,
    summary
  });
}

/**
 * Perform an action and verify authentication is maintained with enhanced verification
 */
export async function withAuthVerification<T>(
  page: Page,
  context: BrowserContext,
  action: () => Promise<T>,
  actionDescription: string,
  options: { 
    confidenceThreshold?: number; 
    includeStorage?: boolean;
    captureMetrics?: boolean;
  } = {}
): Promise<T> {
  const { confidenceThreshold = 0.7, includeStorage = true, captureMetrics = true } = options;
  
  debugLog(`Starting action with authentication verification: ${actionDescription}`);
  
  // Capture initial state
  const beforeVerification = captureMetrics ? 
    await verifyAuthentication(page, context, { includeStorage, confidenceThreshold }) : null;
  
  // Verify initial state
  await assertAuthenticated(
    page, 
    context, 
    `Authentication required before ${actionDescription}`,
    { confidenceThreshold, includeStorage }
  );
  
  // Perform action with timing
  const actionStart = Date.now();
  const result = await action();
  const actionDuration = Date.now() - actionStart;
  
  // Verify final state
  await assertAuthenticated(
    page, 
    context, 
    `Authentication lost after ${actionDescription}`,
    { confidenceThreshold, includeStorage }
  );
  
  // Capture final state for comparison
  if (captureMetrics && beforeVerification) {
    const afterVerification = await verifyAuthentication(page, context, { includeStorage, confidenceThreshold });
    
    const confidenceChange = afterVerification.confidence - beforeVerification.confidence;
    const significantConfidenceChange = Math.abs(confidenceChange) > 0.1;
    
    if (significantConfidenceChange) {
      debugLog(`Authentication confidence changed significantly during ${actionDescription}`, {
        before: Math.round(beforeVerification.confidence * 100),
        after: Math.round(afterVerification.confidence * 100),
        change: Math.round(confidenceChange * 100),
        actionDuration
      });
    }
  }
  
  debugLog(`Action completed with authentication maintained: ${actionDescription}`, {
    actionDuration,
    capturedMetrics: captureMetrics
  });
  
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
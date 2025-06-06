import { Page, BrowserContext } from '@playwright/test';
import { debugLog, captureAuthDebugSnapshot, AuthDebugSnapshot } from './authDebug';
import { verifyAuthentication, AuthVerificationResult } from './authVerification';

/**
 * Enhanced Authentication Error Reporting
 * 
 * Provides comprehensive error context, screenshots, trace information,
 * and actionable debugging guidance for authentication test failures.
 */

export interface AuthFailureContext {
  timestamp: string;
  testName: string;
  failureType: AuthFailureType;
  errorMessage: string;
  currentUrl: string;
  authState: {
    snapshot: AuthDebugSnapshot;
    verificationResults: AuthVerificationResult[];
    isAuthenticated: boolean;
    summary: string;
  };
  environment: {
    isCI: boolean;
    userAgent: string;
    viewportSize: { width: number; height: number } | null;
  };
  artifacts: {
    screenshotPath?: string;
    tracePath?: string;
    debugLogPath?: string;
  };
  debugging: {
    possibleCauses: string[];
    suggestedActions: string[];
    relatedIssues: string[];
  };
}

export enum AuthFailureType {
  COOKIE_LOST = 'cookie_lost',
  SESSION_API_FAILED = 'session_api_failed',
  PROTECTED_ENDPOINT_FAILED = 'protected_endpoint_failed',
  NAVIGATION_TIMING = 'navigation_timing',
  SERVER_UNAVAILABLE = 'server_unavailable',
  UNKNOWN = 'unknown'
}

/**
 * Analyze authentication failure to determine specific failure type
 */
export function analyzeAuthFailure(
  verificationResults: AuthVerificationResult[],
  errorMessage: string
): {
  failureType: AuthFailureType;
  possibleCauses: string[];
  suggestedActions: string[];
  relatedIssues: string[];
} {
  const cookieResult = verificationResults.find(r => r.method === 'cookie');
  const apiResult = verificationResults.find(r => r.method === 'api');
  const endpointResult = verificationResults.find(r => r.method === 'protected-endpoint');

  // Analyze failure patterns
  const hasCookie = cookieResult?.isAuthenticated ?? false;
  const hasValidSession = apiResult?.isAuthenticated ?? false;
  const hasEndpointAccess = endpointResult?.isAuthenticated ?? false;

  if (!hasCookie && !hasValidSession) {
    return {
      failureType: AuthFailureType.COOKIE_LOST,
      possibleCauses: [
        'Authentication cookie was cleared or expired',
        'Browser context lost cookie state during navigation',
        'Cookie synchronization issue in CI environment',
        'Session expired due to timing issues'
      ],
      suggestedActions: [
        'Check if global setup properly established authentication',
        'Verify cookie persistence across navigation',
        'Review CI timing delays and synchronization',
        'Check server logs for session invalidation'
      ],
      relatedIssues: [
        'CI cookie synchronization timing',
        'NextAuth session management',
        'Playwright browser context handling'
      ]
    };
  }

  if (hasCookie && !hasValidSession) {
    return {
      failureType: AuthFailureType.SESSION_API_FAILED,
      possibleCauses: [
        'Session API endpoint returned error or invalid data',
        'NextAuth session validation failed',
        'Server-side authentication state inconsistency',
        'API timing issues in CI environment'
      ],
      suggestedActions: [
        'Check session API response status and data',
        'Verify NextAuth configuration and secrets',
        'Review server logs for authentication errors',
        'Test session API endpoint manually'
      ],
      relatedIssues: [
        'NextAuth API configuration',
        'Server-side session validation',
        'Environment variable configuration'
      ]
    };
  }

  if (hasValidSession && !hasEndpointAccess) {
    return {
      failureType: AuthFailureType.PROTECTED_ENDPOINT_FAILED,
      possibleCauses: [
        'Protected endpoint authorization logic failed',
        'Authentication middleware not working correctly',
        'API route protection implementation issue',
        'Request timing or race condition'
      ],
      suggestedActions: [
        'Check protected endpoint implementation',
        'Verify authentication middleware setup',
        'Test protected endpoints with valid session',
        'Review API authorization logic'
      ],
      relatedIssues: [
        'API route protection',
        'Authentication middleware',
        'Authorization logic'
      ]
    };
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('timing')) {
    return {
      failureType: AuthFailureType.NAVIGATION_TIMING,
      possibleCauses: [
        'Navigation completed before authentication state stabilized',
        'CI environment timing variations',
        'Server response delays affecting cookie synchronization',
        'Race condition between navigation and session validation'
      ],
      suggestedActions: [
        'Increase CI synchronization delays',
        'Add authentication stabilization waits',
        'Review navigation timing in CI environment',
        'Implement more robust timing strategies'
      ],
      relatedIssues: [
        'CI timing optimization',
        'Navigation synchronization',
        'Authentication state stabilization'
      ]
    };
  }

  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
    return {
      failureType: AuthFailureType.SERVER_UNAVAILABLE,
      possibleCauses: [
        'Development server not running or not ready',
        'Network connectivity issues',
        'Server crashed or became unresponsive',
        'Port conflicts or server startup failures'
      ],
      suggestedActions: [
        'Verify server is running and accessible',
        'Check server logs for errors or crashes',
        'Test server health endpoints',
        'Verify port availability and network connectivity'
      ],
      relatedIssues: [
        'Server startup and health',
        'CI environment networking',
        'Development server stability'
      ]
    };
  }

  return {
    failureType: AuthFailureType.UNKNOWN,
    possibleCauses: [
      'Unidentified authentication issue',
      'Multiple simultaneous authentication problems',
      'Test logic or implementation error',
      'Environmental or infrastructure issue'
    ],
    suggestedActions: [
      'Review full error context and debug logs',
      'Manually reproduce the authentication flow',
      'Check for recent changes to authentication logic',
      'Analyze authentication state snapshots'
    ],
    relatedIssues: [
      'Authentication system investigation',
      'Test implementation review',
      'Infrastructure debugging'
    ]
  };
}

/**
 * Capture comprehensive authentication failure context
 */
export async function captureAuthFailureContext(
  page: Page,
  context: BrowserContext,
  testName: string,
  error: Error,
  step: string = 'unknown'
): Promise<AuthFailureContext> {
  const timestamp = new Date().toISOString();
  
  debugLog(`Capturing authentication failure context for ${testName}`, {
    step,
    error: error.message,
    timestamp
  });

  // Capture current authentication state
  const authSnapshot = await captureAuthDebugSnapshot(page, context, `failure-${step}`);
  const { isAuthenticated, results, summary } = await verifyAuthentication(page, context);
  
  // Analyze failure type and generate debugging guidance
  const failureAnalysis = analyzeAuthFailure(results, error.message);

  // Capture environment information
  const viewportSize = await page.viewportSize();
  const userAgent = await page.evaluate(() => navigator.userAgent);
  const currentUrl = page.url();

  // Generate artifact paths
  const sanitizedTestName = testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const sanitizedStep = step.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const artifactPrefix = `auth-failure-${sanitizedTestName}-${sanitizedStep}-${Date.now()}`;

  const failureContext: AuthFailureContext = {
    timestamp,
    testName,
    failureType: failureAnalysis.failureType,
    errorMessage: error.message,
    currentUrl,
    authState: {
      snapshot: authSnapshot,
      verificationResults: results,
      isAuthenticated,
      summary
    },
    environment: {
      isCI: !!process.env.CI,
      userAgent,
      viewportSize
    },
    artifacts: {
      screenshotPath: `test-artifacts/screenshots/${artifactPrefix}.png`,
      tracePath: `test-artifacts/traces/${artifactPrefix}.zip`,
      debugLogPath: `test-artifacts/logs/${artifactPrefix}.json`
    },
    debugging: {
      possibleCauses: failureAnalysis.possibleCauses,
      suggestedActions: failureAnalysis.suggestedActions,
      relatedIssues: failureAnalysis.relatedIssues
    }
  };

  debugLog('Authentication failure context captured', {
    failureType: failureContext.failureType,
    currentUrl: failureContext.currentUrl,
    isAuthenticated: failureContext.authState.isAuthenticated,
    artifactPaths: failureContext.artifacts
  });

  return failureContext;
}

/**
 * Capture screenshot for authentication failure
 */
export async function captureFailureScreenshot(
  page: Page,
  screenshotPath: string
): Promise<boolean> {
  try {
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true,
      type: 'png'
    });
    
    debugLog(`Authentication failure screenshot captured: ${screenshotPath}`);
    return true;
  } catch (error) {
    debugLog('Failed to capture authentication failure screenshot', {
      path: screenshotPath,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Save authentication failure context to JSON file
 */
export async function saveFailureContext(
  failureContext: AuthFailureContext
): Promise<boolean> {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Ensure directory exists
    const logDir = path.dirname(failureContext.artifacts.debugLogPath!);
    await fs.mkdir(logDir, { recursive: true });
    
    // Save context as formatted JSON
    await fs.writeFile(
      failureContext.artifacts.debugLogPath,
      JSON.stringify(failureContext, null, 2),
      'utf8'
    );
    
    debugLog(`Authentication failure context saved: ${failureContext.artifacts.debugLogPath}`);
    return true;
  } catch (error) {
    debugLog('Failed to save authentication failure context', {
      path: failureContext.artifacts.debugLogPath,
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

/**
 * Generate enhanced error message with failure context
 */
export function generateEnhancedErrorMessage(
  failureContext: AuthFailureContext,
  originalError: Error
): string {
  const { failureType, testName, currentUrl, authState, debugging } = failureContext;
  
  const failureTypeDescription = {
    [AuthFailureType.COOKIE_LOST]: 'Authentication Cookie Lost',
    [AuthFailureType.SESSION_API_FAILED]: 'Session API Failure',
    [AuthFailureType.PROTECTED_ENDPOINT_FAILED]: 'Protected Endpoint Access Denied',
    [AuthFailureType.NAVIGATION_TIMING]: 'Navigation Timing Issue',
    [AuthFailureType.SERVER_UNAVAILABLE]: 'Server Unavailable',
    [AuthFailureType.UNKNOWN]: 'Unknown Authentication Failure'
  }[failureType];

  const lines = [
    `🔴 ${failureTypeDescription} in ${testName}`,
    '',
    `📍 Context:`,
    `  • URL: ${currentUrl}`,
    `  • Timestamp: ${failureContext.timestamp}`,
    `  • Environment: ${failureContext.environment.isCI ? 'CI' : 'Local'}`,
    '',
    `🔍 Authentication State:`,
    `  • Overall Status: ${authState.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}`,
    `  • Verification Summary: ${authState.summary}`,
    '',
    `📊 Method Results:`,
    ...authState.verificationResults.map(r => 
      `  • ${r.method}: ${r.isAuthenticated ? '✅' : '❌'} ${r.details ? `(${JSON.stringify(r.details)})` : ''}`
    ),
    '',
    `🔧 Possible Causes:`,
    ...debugging.possibleCauses.map(cause => `  • ${cause}`),
    '',
    `💡 Suggested Actions:`,
    ...debugging.suggestedActions.map(action => `  • ${action}`),
    '',
    `📁 Debug Artifacts:`,
    `  • Screenshot: ${failureContext.artifacts.screenshotPath}`,
    `  • Debug Log: ${failureContext.artifacts.debugLogPath}`,
    failureContext.artifacts.tracePath ? `  • Trace: ${failureContext.artifacts.tracePath}` : '',
    '',
    `❌ Original Error: ${originalError.message}`
  ].filter(line => line !== '');

  return lines.join('\\n');
}

/**
 * Main function to handle authentication test failures with enhanced reporting
 */
export async function handleAuthenticationFailure(
  page: Page,
  context: BrowserContext,
  testName: string,
  error: Error,
  step: string = 'unknown'
): Promise<never> {
  debugLog(`🔴 Authentication failure detected in ${testName}`, {
    step,
    error: error.message
  });

  try {
    // Capture comprehensive failure context
    const failureContext = await captureAuthFailureContext(page, context, testName, error, step);
    
    // Ensure artifacts directory exists
    const fs = require('fs').promises;
    await fs.mkdir('test-artifacts/screenshots', { recursive: true });
    await fs.mkdir('test-artifacts/logs', { recursive: true });
    
    // Capture screenshot
    await captureFailureScreenshot(page, failureContext.artifacts.screenshotPath!);
    
    // Save failure context
    await saveFailureContext(failureContext);
    
    // Generate enhanced error message
    const enhancedErrorMessage = generateEnhancedErrorMessage(failureContext, error);
    
    debugLog('Authentication failure reporting completed', {
      artifacts: failureContext.artifacts,
      failureType: failureContext.failureType
    });
    
    // Throw enhanced error
    const enhancedError = new Error(enhancedErrorMessage);
    enhancedError.stack = error.stack;
    throw enhancedError;
    
  } catch (reportingError) {
    debugLog('Failed to generate enhanced error report', {
      reportingError: reportingError instanceof Error ? reportingError.message : String(reportingError),
      originalError: error.message
    });
    
    // Fall back to original error if reporting fails
    throw error;
  }
}

/**
 * Wrapper for authentication assertions with enhanced error reporting
 */
export async function assertAuthenticatedWithEnhancedReporting(
  page: Page,
  context: BrowserContext,
  testName: string,
  step: string,
  message?: string
): Promise<void> {
  try {
    const { isAuthenticated, results, summary } = await verifyAuthentication(page, context);
    
    if (!isAuthenticated) {
      const errorMessage = message || `Authentication assertion failed at ${step}`;
      const error = new Error(errorMessage);
      await handleAuthenticationFailure(page, context, testName, error, step);
    }
  } catch (error) {
    if (error instanceof Error) {
      await handleAuthenticationFailure(page, context, testName, error, step);
    }
    throw error;
  }
}
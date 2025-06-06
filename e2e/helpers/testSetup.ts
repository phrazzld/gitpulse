import { Page, BrowserContext } from '@playwright/test';
import { initializeAdaptiveTiming, getCurrentTimingProfile } from './adaptiveTiming';
import { initializeAuthDebug, debugLog } from './authDebug';

/**
 * Enhanced Test Setup Utilities
 * 
 * Provides intelligent test initialization that adapts to the current
 * environment and optimizes timing configuration automatically.
 */

export interface TestSetupOptions {
  testName: string;
  enableAdaptiveTiming?: boolean;
  forceTimingDetection?: boolean;
  enableAuthDebugging?: boolean;
  skipPerformanceDetection?: boolean;
}

export interface TestSetupResult {
  timingProfile: any;
  environmentMetrics: any;
  setupDuration: number;
  recommendations: {
    navigation: any;
    api: any;
    authentication: any;
  };
}

/**
 * Initialize test with adaptive timing and authentication debugging
 */
export async function setupEnhancedTest(
  page: Page,
  context: BrowserContext,
  options: TestSetupOptions
): Promise<TestSetupResult> {
  const startTime = Date.now();
  
  debugLog(`Setting up enhanced test: ${options.testName}`, {
    options,
    isCI: !!process.env.CI
  });

  // Initialize authentication debugging if enabled
  if (options.enableAuthDebugging !== false) {
    initializeAuthDebug(options.testName);
  }

  let timingProfile = null;
  let environmentMetrics = null;
  let recommendations = null;

  // Initialize adaptive timing if enabled
  if (options.enableAdaptiveTiming !== false && !options.skipPerformanceDetection) {
    try {
      const { initializeAdaptiveTiming, getTimingRecommendations } = await import('./adaptiveTiming');
      
      timingProfile = await initializeAdaptiveTiming(
        page, 
        context, 
        options.forceTimingDetection || false
      );
      
      // Get timing recommendations for common operations
      recommendations = {
        navigation: getTimingRecommendations('navigation'),
        api: getTimingRecommendations('api'),
        authentication: getTimingRecommendations('authentication')
      };
      
      debugLog('Adaptive timing initialized for test', {
        profile: timingProfile.name,
        recommendations
      });
      
    } catch (error) {
      debugLog('Failed to initialize adaptive timing, using defaults', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Fallback to current profile
      timingProfile = getCurrentTimingProfile();
      
      // Fallback recommendations
      recommendations = {
        navigation: { timeout: 30000, retries: 3, pollInterval: 500, description: 'Fallback navigation timing' },
        api: { timeout: 10000, retries: 2, pollInterval: 250, description: 'Fallback API timing' },
        authentication: { timeout: 15000, retries: 4, pollInterval: 500, description: 'Fallback authentication timing' }
      };
    }
  } else {
    timingProfile = getCurrentTimingProfile();
    
    recommendations = {
      navigation: { timeout: 30000, retries: 3, pollInterval: 500, description: 'Default navigation timing' },
      api: { timeout: 10000, retries: 2, pollInterval: 250, description: 'Default API timing' },
      authentication: { timeout: 15000, retries: 4, pollInterval: 500, description: 'Default authentication timing' }
    };
  }

  const setupDuration = Date.now() - startTime;
  
  const result: TestSetupResult = {
    timingProfile,
    environmentMetrics,
    setupDuration,
    recommendations
  };

  debugLog(`Enhanced test setup completed for ${options.testName}`, {
    setupDuration: `${setupDuration}ms`,
    profile: timingProfile?.name || 'unknown',
    hasRecommendations: !!recommendations
  });

  return result;
}

/**
 * Cleanup test resources and finalize debugging
 */
export async function cleanupEnhancedTest(
  testName: string,
  testSuccess: boolean
): Promise<void> {
  debugLog(`Cleaning up enhanced test: ${testName}`, {
    testSuccess,
    timestamp: new Date().toISOString()
  });

  try {
    const { finalizeAuthDebug } = await import('./authDebug');
    finalizeAuthDebug(testName, testSuccess);
  } catch (error) {
    debugLog('Failed to finalize auth debug', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Create timing-aware test wrapper
 */
export function withEnhancedTiming(testName: string, options: Partial<TestSetupOptions> = {}) {
  return {
    setup: async (page: Page, context: BrowserContext) => {
      return await setupEnhancedTest(page, context, {
        testName,
        ...options
      });
    },
    cleanup: async (testSuccess: boolean) => {
      return await cleanupEnhancedTest(testName, testSuccess);
    }
  };
}

/**
 * Get environment-optimized timeouts for Playwright operations
 */
export function getOptimizedTimeouts(): {
  navigation: number;
  expectTimeout: number;
  testTimeout: number;
  actionTimeout: number;
} {
  const profile = getCurrentTimingProfile();
  const isCI = !!process.env.CI;
  
  const baseTimeouts = {
    navigation: isCI ? 45000 : 30000,
    expectTimeout: isCI ? 10000 : 5000,
    testTimeout: isCI ? 60000 : 30000,
    actionTimeout: isCI ? 15000 : 10000
  };

  // Adjust based on timing profile
  const multiplier = profile.timeoutMultiplier || 1.0;
  
  return {
    navigation: Math.round(baseTimeouts.navigation * multiplier),
    expectTimeout: Math.round(baseTimeouts.expectTimeout * multiplier),
    testTimeout: Math.round(baseTimeouts.testTimeout * multiplier),
    actionTimeout: Math.round(baseTimeouts.actionTimeout * multiplier)
  };
}

/**
 * Enhanced page navigation with optimal timing
 */
export async function navigateWithOptimalTiming(
  page: Page,
  url: string,
  options: {
    waitStrategy?: 'domcontentloaded' | 'networkidle' | 'load';
    timeout?: number;
    retries?: number;
  } = {}
): Promise<void> {
  const profile = getCurrentTimingProfile();
  const timeouts = getOptimizedTimeouts();
  
  const {
    waitStrategy = 'domcontentloaded',
    timeout = timeouts.navigation,
    retries = profile.maxRetries
  } = options;

  debugLog(`Navigating to ${url} with optimal timing`, {
    waitStrategy,
    timeout,
    retries,
    profile: profile.name
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await page.goto(url, { timeout });
      await page.waitForLoadState(waitStrategy, { timeout });
      
      debugLog(`Navigation to ${url} succeeded on attempt ${attempt}`);
      return;
      
    } catch (error) {
      if (attempt === retries) {
        debugLog(`Navigation to ${url} failed after ${retries} attempts`, {
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
      
      debugLog(`Navigation attempt ${attempt} failed, retrying...`, {
        error: error instanceof Error ? error.message : String(error),
        nextAttempt: attempt + 1
      });
      
      // Wait before retry using adaptive timing
      try {
        const { applyAdaptiveDelay } = await import('./adaptiveTiming');
        await applyAdaptiveDelay(page, `navigation-retry-${url}`, attempt);
      } catch {
        // Fallback delay
        await page.waitForTimeout(profile.baseDelay * attempt);
      }
    }
  }
}
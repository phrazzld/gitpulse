import { Page, BrowserContext } from '@playwright/test';
import { debugLog } from './authDebug';

/**
 * Adaptive Timing System for E2E Tests
 * 
 * Provides environment-aware timing configurations that adapt to
 * actual performance characteristics rather than using fixed delays.
 * 
 * Key Features:
 * - Environment speed detection
 * - Dynamic timeout adjustment
 * - Smart polling intervals
 * - Named timing profiles
 * - Performance-based optimization
 */

export interface TimingProfile {
  name: string;
  baseDelay: number;
  maxDelay: number;
  timeoutMultiplier: number;
  pollInterval: number;
  maxRetries: number;
  description: string;
}

export interface EnvironmentMetrics {
  averageNavigationTime: number;
  averageAPIResponseTime: number;
  environmentType: 'fast' | 'moderate' | 'slow' | 'very-slow';
  performanceScore: number; // 0-100, higher is better
  detectedAt: number;
}

export interface AdaptiveTimingOptions {
  profile?: string;
  baseDelay?: number;
  maxAttempts?: number;
  timeoutMultiplier?: number;
  forceProfile?: boolean;
}

// Predefined timing profiles for different scenarios
export const TIMING_PROFILES: Record<string, TimingProfile> = {
  'fast-local': {
    name: 'fast-local',
    baseDelay: 100,
    maxDelay: 500,
    timeoutMultiplier: 1.0,
    pollInterval: 100,
    maxRetries: 2,
    description: 'Optimized for fast local development environments'
  },
  'local-dev': {
    name: 'local-dev',
    baseDelay: 250,
    maxDelay: 1000,
    timeoutMultiplier: 1.2,
    pollInterval: 200,
    maxRetries: 3,
    description: 'Standard local development environment'
  },
  'ci-fast': {
    name: 'ci-fast',
    baseDelay: 300,
    maxDelay: 1500,
    timeoutMultiplier: 1.5,
    pollInterval: 250,
    maxRetries: 3,
    description: 'Fast CI environment (e.g., GitHub Actions with good resources)'
  },
  'ci-standard': {
    name: 'ci-standard',
    baseDelay: 500,
    maxDelay: 2000,
    timeoutMultiplier: 2.0,
    pollInterval: 300,
    maxRetries: 4,
    description: 'Standard CI environment with moderate resources'
  },
  'ci-slow': {
    name: 'ci-slow',
    baseDelay: 750,
    maxDelay: 3000,
    timeoutMultiplier: 2.5,
    pollInterval: 500,
    maxRetries: 5,
    description: 'Slow CI environment or resource-constrained systems'
  },
  'robust': {
    name: 'robust',
    baseDelay: 1000,
    maxDelay: 5000,
    timeoutMultiplier: 3.0,
    pollInterval: 1000,
    maxRetries: 6,
    description: 'Maximum reliability for unstable environments'
  }
};

// Global environment metrics cache
let environmentMetrics: EnvironmentMetrics | null = null;
let currentProfile: TimingProfile | null = null;

/**
 * Detect environment performance characteristics
 */
export async function detectEnvironmentPerformance(
  page: Page, 
  context: BrowserContext
): Promise<EnvironmentMetrics> {
  debugLog('Starting environment performance detection');
  
  const startTime = Date.now();
  const measurements = {
    navigationTimes: [] as number[],
    apiResponseTimes: [] as number[]
  };
  
  try {
    // Test 1: Measure navigation performance
    for (let i = 0; i < 3; i++) {
      const navStart = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const navTime = Date.now() - navStart;
      measurements.navigationTimes.push(navTime);
      
      debugLog(`Navigation test ${i + 1}: ${navTime}ms`);
    }
    
    // Test 2: Measure API response performance  
    for (let i = 0; i < 3; i++) {
      const apiStart = Date.now();
      try {
        await page.request.get('/api/auth/session');
        const apiTime = Date.now() - apiStart;
        measurements.apiResponseTimes.push(apiTime);
        
        debugLog(`API test ${i + 1}: ${apiTime}ms`);
      } catch (error) {
        debugLog(`API test ${i + 1} failed:`, error);
        // Use a penalty time for failed requests
        measurements.apiResponseTimes.push(2000);
      }
    }
    
  } catch (error) {
    debugLog('Environment performance detection failed', error);
    // Return conservative defaults on failure
    return {
      averageNavigationTime: 2000,
      averageAPIResponseTime: 1000,
      environmentType: 'slow',
      performanceScore: 25,
      detectedAt: Date.now()
    };
  }
  
  // Calculate averages
  const avgNavTime = measurements.navigationTimes.reduce((a, b) => a + b, 0) / measurements.navigationTimes.length;
  const avgApiTime = measurements.apiResponseTimes.reduce((a, b) => a + b, 0) / measurements.apiResponseTimes.length;
  
  // Determine environment type based on performance
  let environmentType: EnvironmentMetrics['environmentType'];
  let performanceScore: number;
  
  if (avgNavTime < 500 && avgApiTime < 200) {
    environmentType = 'fast';
    performanceScore = 85 + Math.random() * 15; // 85-100
  } else if (avgNavTime < 1000 && avgApiTime < 500) {
    environmentType = 'moderate';
    performanceScore = 60 + Math.random() * 25; // 60-85
  } else if (avgNavTime < 2000 && avgApiTime < 1000) {
    environmentType = 'slow';
    performanceScore = 30 + Math.random() * 30; // 30-60
  } else {
    environmentType = 'very-slow';
    performanceScore = Math.random() * 30; // 0-30
  }
  
  const metrics: EnvironmentMetrics = {
    averageNavigationTime: avgNavTime,
    averageAPIResponseTime: avgApiTime,
    environmentType,
    performanceScore,
    detectedAt: Date.now()
  };
  
  const detectionTime = Date.now() - startTime;
  debugLog('Environment performance detection completed', {
    ...metrics,
    detectionTime: `${detectionTime}ms`,
    measurements
  });
  
  return metrics;
}

/**
 * Select optimal timing profile based on environment metrics
 */
export function selectOptimalTimingProfile(metrics: EnvironmentMetrics): TimingProfile {
  debugLog('Selecting optimal timing profile', {
    environmentType: metrics.environmentType,
    performanceScore: metrics.performanceScore,
    isCI: !!process.env.CI
  });
  
  // CI-specific profile selection
  if (process.env.CI) {
    if (metrics.performanceScore >= 70) {
      return TIMING_PROFILES['ci-fast'];
    } else if (metrics.performanceScore >= 40) {
      return TIMING_PROFILES['ci-standard'];
    } else {
      return TIMING_PROFILES['ci-slow'];
    }
  }
  
  // Local environment profile selection
  switch (metrics.environmentType) {
    case 'fast':
      return TIMING_PROFILES['fast-local'];
    case 'moderate':
      return TIMING_PROFILES['local-dev'];
    case 'slow':
      return TIMING_PROFILES['ci-standard'];
    case 'very-slow':
      return TIMING_PROFILES['robust'];
    default:
      return TIMING_PROFILES['local-dev'];
  }
}

/**
 * Initialize adaptive timing system
 */
export async function initializeAdaptiveTiming(
  page: Page, 
  context: BrowserContext,
  forceDetection: boolean = false
): Promise<TimingProfile> {
  debugLog('Initializing adaptive timing system', {
    forceDetection,
    hasExistingMetrics: !!environmentMetrics,
    hasCurrentProfile: !!currentProfile
  });
  
  // Use cached metrics if available and not forcing detection
  if (!forceDetection && environmentMetrics && currentProfile) {
    const age = Date.now() - environmentMetrics.detectedAt;
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    if (age < maxAge) {
      debugLog('Using cached environment metrics and timing profile', {
        profile: currentProfile.name,
        age: `${Math.round(age / 1000)}s`
      });
      return currentProfile;
    }
  }
  
  // Detect environment performance
  environmentMetrics = await detectEnvironmentPerformance(page, context);
  
  // Select optimal profile
  currentProfile = selectOptimalTimingProfile(environmentMetrics);
  
  debugLog('Adaptive timing system initialized', {
    metrics: environmentMetrics,
    selectedProfile: currentProfile.name,
    profileDetails: currentProfile
  });
  
  return currentProfile;
}

/**
 * Get current timing profile (with fallback)
 */
export function getCurrentTimingProfile(): TimingProfile {
  if (currentProfile) {
    return currentProfile;
  }
  
  // Fallback profile selection based on environment
  if (process.env.CI) {
    return TIMING_PROFILES['ci-standard'];
  } else {
    return TIMING_PROFILES['local-dev'];
  }
}

/**
 * Calculate adaptive delay based on current profile and attempt number
 */
export function calculateAdaptiveDelay(
  attempt: number = 1,
  options: AdaptiveTimingOptions = {}
): number {
  const profile = options.profile ? 
    TIMING_PROFILES[options.profile] || getCurrentTimingProfile() :
    getCurrentTimingProfile();
  
  const baseDelay = options.baseDelay || profile.baseDelay;
  const maxDelay = profile.maxDelay;
  const timeoutMultiplier = options.timeoutMultiplier || profile.timeoutMultiplier;
  
  // Progressive delay with exponential backoff
  const progressiveDelay = baseDelay * Math.pow(1.5, attempt - 1);
  const adjustedDelay = Math.min(progressiveDelay * timeoutMultiplier, maxDelay);
  
  debugLog(`Calculated adaptive delay for attempt ${attempt}`, {
    profile: profile.name,
    baseDelay,
    progressiveDelay,
    adjustedDelay,
    maxDelay
  });
  
  return Math.round(adjustedDelay);
}

/**
 * Apply adaptive delay with intelligent timing
 */
export async function applyAdaptiveDelay(
  page: Page,
  step: string,
  attempt: number = 1,
  options: AdaptiveTimingOptions = {}
): Promise<void> {
  const delay = calculateAdaptiveDelay(attempt, options);
  
  debugLog(`Applying adaptive delay for ${step}`, {
    attempt,
    delay: `${delay}ms`,
    profile: getCurrentTimingProfile().name,
    reason: 'Adaptive timing optimization'
  });
  
  await page.waitForTimeout(delay);
}

/**
 * Wait for condition with adaptive timing
 */
export async function waitWithAdaptiveTiming<T>(
  checkFunction: () => Promise<T | null>,
  options: {
    step: string;
    maxAttempts?: number;
    customProfile?: string;
    successCondition?: (result: T) => boolean;
  }
): Promise<T | null> {
  const profile = options.customProfile ? 
    TIMING_PROFILES[options.customProfile] || getCurrentTimingProfile() :
    getCurrentTimingProfile();
  
  const maxAttempts = options.maxAttempts || profile.maxRetries;
  const pollInterval = profile.pollInterval;
  
  debugLog(`Starting adaptive wait for ${options.step}`, {
    maxAttempts,
    pollInterval: `${pollInterval}ms`,
    profile: profile.name
  });
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await checkFunction();
      
      if (result !== null) {
        if (!options.successCondition || options.successCondition(result)) {
          debugLog(`Adaptive wait succeeded on attempt ${attempt}`, {
            step: options.step,
            profile: profile.name
          });
          return result;
        }
      }
      
      if (attempt < maxAttempts) {
        debugLog(`Adaptive wait attempt ${attempt} failed, retrying in ${pollInterval}ms`, {
          step: options.step
        });
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
      
    } catch (error) {
      debugLog(`Adaptive wait attempt ${attempt} threw error`, {
        step: options.step,
        error: error instanceof Error ? error.message : String(error)
      });
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
  
  debugLog(`Adaptive wait failed after ${maxAttempts} attempts`, {
    step: options.step,
    profile: profile.name
  });
  
  return null;
}

/**
 * Get timing recommendations for specific operations
 */
export function getTimingRecommendations(operationType: 'navigation' | 'api' | 'authentication' | 'general'): {
  timeout: number;
  retries: number;
  pollInterval: number;
  description: string;
} {
  const profile = getCurrentTimingProfile();
  const metrics = environmentMetrics;
  
  const baseRecommendations = {
    navigation: {
      timeout: Math.max(profile.maxDelay * 2, 5000),
      retries: profile.maxRetries,
      pollInterval: profile.pollInterval,
      description: 'Navigation timing optimized for current environment'
    },
    api: {
      timeout: Math.max(profile.maxDelay, 3000),
      retries: Math.max(profile.maxRetries - 1, 2),
      pollInterval: Math.max(profile.pollInterval / 2, 100),
      description: 'API call timing optimized for current environment'
    },
    authentication: {
      timeout: profile.maxDelay * 3,
      retries: profile.maxRetries + 1,
      pollInterval: profile.pollInterval,
      description: 'Authentication timing with extra reliability'
    },
    general: {
      timeout: profile.maxDelay,
      retries: profile.maxRetries,
      pollInterval: profile.pollInterval,
      description: 'General purpose timing for current environment'
    }
  };
  
  const recommendation = baseRecommendations[operationType];
  
  // Adjust based on actual environment metrics if available
  if (metrics) {
    if (operationType === 'navigation') {
      recommendation.timeout = Math.max(recommendation.timeout, metrics.averageNavigationTime * 3);
    } else if (operationType === 'api') {
      recommendation.timeout = Math.max(recommendation.timeout, metrics.averageAPIResponseTime * 5);
    }
  }
  
  debugLog(`Generated timing recommendations for ${operationType}`, {
    profile: profile.name,
    recommendations: recommendation,
    basedOnMetrics: !!metrics
  });
  
  return recommendation;
}

/**
 * Reset timing system (useful for testing)
 */
export function resetAdaptiveTiming(): void {
  environmentMetrics = null;
  currentProfile = null;
  debugLog('Adaptive timing system reset');
}
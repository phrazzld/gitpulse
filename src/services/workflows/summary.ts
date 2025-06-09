/**
 * Effect-based summary service for GitPulse
 * Orchestrates validation, data fetching, and statistics calculation
 * All side effects are deferred until execution
 */

import { 
  Effect, 
  IOEffect, 
  ioEffect, 
  succeed, 
  fail, 
  mapEffect, 
  flatMapEffect, 
  catchEffect
} from '../effects/types';
import { Result, success, failure } from '../../lib/result/index';
import { pipe } from '../../lib/functional/index';
import { validateSummaryRequest, type ValidationConfig } from '../../core/validation/summary';
import { createValidationConfig } from '../../core/config/index';
import { 
  analyzeCommits,
  applyCommitFilters
} from '../../core/github/commits';
import { calculateSummaryStats } from '../../core/summary/generator';
import type { 
  SummaryRequest, 
  CommitData, 
  SummaryStats, 
  ValidationError 
} from '../../core/types/index';

/**
 * Data provider interface for dependency injection
 * Allows testing with pure functions by injecting test data providers
 */
export interface DataProvider {
  /**
   * Fetch commits for given repositories within date range
   * Returns an IOEffect to defer the actual API call
   */
  fetchCommits(
    repositories: readonly string[],
    dateRange: { start: Date; end: Date },
    branch?: string
  ): IOEffect<readonly CommitData[]>;
}

/**
 * Summary service configuration
 */
export interface SummaryServiceConfig {
  validation?: ValidationConfig;
  maxConcurrentRequests?: number;
  requestTimeout?: number;
}

/**
 * Create a summary workflow that defers all side effects
 * Pure function that returns an Effect representing the workflow
 */
export const createSummaryWorkflow = (
  request: unknown,
  dataProvider: DataProvider,
  config: SummaryServiceConfig = {}
): Effect<SummaryStats> => {
  // Start with validation - convert Result to Effect
  const validationConfig = config.validation || createValidationConfig();
  const validationResult = validateSummaryRequest(request, validationConfig);
  
  if (!validationResult.success) {
    return fail(new ValidationAggregateError(validationResult.error));
  }

  const validatedRequest = validationResult.data;

  // Create effect for fetching commits
  const fetchEffect = dataProvider.fetchCommits(
    validatedRequest.repositories,
    validatedRequest.dateRange,
    validatedRequest.branch
  );

  // Chain data processing
  const processedDataEffect = pipe(
    fetchEffect,
    mapEffect((commits: readonly CommitData[]) => {
      // Apply user filter if specified
      if (validatedRequest.users && validatedRequest.users.length > 0) {
        return applyCommitFilters(
          undefined, // Date range already applied by provider
          validatedRequest.users,
          undefined  // Repositories already filtered by provider
        )(commits);
      }
      return commits;
    })
  );

  // Calculate statistics
  const statsEffect = pipe(
    processedDataEffect,
    mapEffect((commits: readonly CommitData[]) => calculateSummaryStats(commits))
  );

  // Add error recovery
  return pipe(
    statsEffect,
    catchEffect((error: Error): SummaryStats => {
      // Transform known errors to user-friendly messages
      if (error instanceof ValidationAggregateError) {
        throw new Error(`Validation failed: ${error.message}`);
      }
      
      // Network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new Error('Failed to fetch data from GitHub. Please check your connection and try again.');
      }
      
      // Timeout errors
      if (error.message.includes('timeout')) {
        throw new Error('Request timed out. Try selecting fewer repositories or a shorter date range.');
      }
      
      // Re-throw other errors
      throw error;
    })
  );
};

/**
 * Summary service with dependency injection
 * Returns effects that can be executed by the imperative shell
 */
export const summaryService = {
  /**
   * Generate summary statistics for the given request
   * Returns an Effect that defers all computation and I/O
   */
  generateSummary: (
    request: unknown,
    dataProvider: DataProvider,
    config?: SummaryServiceConfig
  ): Effect<SummaryStats> => {
    return createSummaryWorkflow(request, dataProvider, config);
  },

  /**
   * Validate a summary request without executing it
   * Useful for pre-validation in UI
   */
  validateRequest: (
    request: unknown,
    config?: ValidationConfig
  ): Result<SummaryRequest, ValidationError[]> => {
    const validationConfig = config || createValidationConfig();
    return validateSummaryRequest(request, validationConfig);
  }
};

/**
 * Custom error class for validation failures
 */
export class ValidationAggregateError extends Error {
  constructor(public readonly errors: readonly ValidationError[]) {
    const messages = errors.map(e => `${e.field}: ${e.message}`);
    super(messages.join('; '));
    this.name = 'ValidationAggregateError';
  }
}

/**
 * Type guard for Effect
 */
export const isEffect = <T>(value: unknown): value is Effect<T> => {
  return typeof value === 'function';
};

/**
 * Type guard for IOEffect
 */
export const isIOEffect = <T>(value: unknown): value is IOEffect<T> => {
  return isEffect(value) && '_tag' in value && value._tag === 'IOEffect';
};
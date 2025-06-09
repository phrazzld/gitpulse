/**
 * Enhanced summary service with structured logging
 * Demonstrates integration of effect-based logging with existing services
 */

import { 
  Effect, 
  IOEffect, 
  ioEffect,
  effect,
  succeed, 
  fail, 
  mapEffect, 
  flatMapEffect, 
  catchEffect
} from '../effects/types';
import { 
  withLogging, 
  createLoggingContext, 
  withCorrelationId,
  logInfo,
  logError
} from '../effects/logging';
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
 * Enhanced data provider interface with logging support
 */
export interface LoggedDataProvider {
  /**
   * Fetch commits with automatic logging
   */
  fetchCommits(
    repositories: readonly string[],
    dateRange: { start: Date; end: Date },
    branch?: string
  ): IOEffect<readonly CommitData[]>;
}

/**
 * Enhanced summary service configuration with logging options
 */
export interface LoggedSummaryServiceConfig {
  validation?: ValidationConfig;
  maxConcurrentRequests?: number;
  requestTimeout?: number;
  enableDetailedLogging?: boolean;
  correlationId?: string;
}

/**
 * Create a summary workflow with comprehensive logging
 * Demonstrates how to add structured logging to existing effect workflows
 */
export const createLoggedSummaryWorkflow = (
  request: unknown,
  dataProvider: LoggedDataProvider,
  config: LoggedSummaryServiceConfig = {}
): Effect<SummaryStats> => {
  const workflowEffect = effect(async (): Promise<SummaryStats> => {
    // Log workflow initiation
    await logInfo('Starting summary workflow', {
      repositoryCount: Array.isArray((request as any)?.repositories) 
        ? (request as any).repositories.length 
        : 'unknown',
      hasDateRange: !!(request as any)?.dateRange,
      config: {
        enableDetailedLogging: config.enableDetailedLogging,
        maxConcurrentRequests: config.maxConcurrentRequests
      }
    })();

    try {
      // Validation step with logging
      const validationConfig = config.validation || createValidationConfig();
      const validationEffect = withLogging('request-validation')(succeed(
        validateSummaryRequest(request, validationConfig)
      ));
      
      const validationResult = await validationEffect() as Result<SummaryRequest, ValidationError[]>;
      
      if (!validationResult.success) {
        await logError('Validation failed', undefined, {
          errors: validationResult.error,
          requestType: typeof request
        })();
        throw new ValidationAggregateError(validationResult.error);
      }

      await logInfo('Request validation successful', {
        repositories: validationResult.data.repositories.length,
        dateRange: {
          start: validationResult.data.dateRange.start.toISOString(),
          end: validationResult.data.dateRange.end.toISOString()
        },
        users: validationResult.data.users?.length || 0
      })();

      const validatedRequest = validationResult.data;

      // Data fetching with logging
      const fetchEffect = withLogging('github-data-fetch')(
        dataProvider.fetchCommits(
          validatedRequest.repositories,
          validatedRequest.dateRange,
          validatedRequest.branch
        )
      );

      const commits = await fetchEffect() as readonly CommitData[];
      
      await logInfo('Data fetch completed', {
        totalCommits: commits.length,
        repositories: [...new Set(commits.map(c => c.repository))].length,
        authors: [...new Set(commits.map(c => c.author))].length,
        dateRange: {
          earliest: commits.length > 0 
            ? new Date(Math.min(...commits.map(c => new Date(c.date).getTime()))).toISOString()
            : null,
          latest: commits.length > 0 
            ? new Date(Math.max(...commits.map(c => new Date(c.date).getTime()))).toISOString()
            : null
        }
      })();

      // Data processing with logging
      const processingEffect = withLogging('data-processing')(succeed(
        (() => {
          // Apply user filter if specified
          if (validatedRequest.users && validatedRequest.users.length > 0) {
            const filteredCommits = applyCommitFilters(
              undefined, // Date range already applied by provider
              validatedRequest.users,
              undefined  // Repositories already filtered by provider
            )(commits);
            
            if (config.enableDetailedLogging) {
              return filteredCommits;
            }
            return filteredCommits;
          }
          return commits;
        })()
      ));

      const processedCommits = await processingEffect() as readonly CommitData[];

      if (config.enableDetailedLogging) {
        await logInfo('Data processing completed', {
          originalCommits: commits.length,
          processedCommits: processedCommits.length,
          filteringApplied: !!validatedRequest.users?.length
        })();
      }

      // Statistics calculation with logging  
      const calculationEffect = withLogging('statistics-calculation')(succeed(
        calculateSummaryStats(processedCommits)
      ));

      const stats = await calculationEffect() as SummaryStats;

      await logInfo('Summary workflow completed successfully', {
        statistics: {
          totalCommits: stats.totalCommits,
          uniqueAuthors: stats.uniqueAuthors,
          repositories: stats.repositories.length,
          mostActiveDay: stats.mostActiveDay
        },
        performance: {
          commitsProcessed: processedCommits.length,
          calculationCompleted: true
        }
      })();

      return stats;
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      await logError('Summary workflow failed', err, {
        errorType: err.constructor.name,
        stage: 'unknown', // Could be enhanced to track which stage failed
        request: {
          type: typeof request,
          hasRepositories: !!(request as any)?.repositories,
          hasDateRange: !!(request as any)?.dateRange
        }
      })();

      // Transform known errors to user-friendly messages
      if (error instanceof ValidationAggregateError) {
        throw new Error(`Validation failed: ${err.message}`);
      }
      
      // Network errors
      if (err.message.includes('fetch') || err.message.includes('network')) {
        throw new Error('Failed to fetch data from GitHub. Please check your connection and try again.');
      }
      
      // Timeout errors
      if (err.message.includes('timeout')) {
        throw new Error('Request timed out. Try selecting fewer repositories or a shorter date range.');
      }
      
      // Re-throw other errors
      throw err;
    }
  });
  
  return withLogging<SummaryStats>('summary-workflow')(workflowEffect);
};

/**
 * Enhanced summary service with structured logging
 */
export const loggedSummaryService = {
  /**
   * Generate summary statistics with comprehensive logging
   */
  generateSummary: (
    request: unknown,
    dataProvider: LoggedDataProvider,
    config?: LoggedSummaryServiceConfig
  ): Effect<SummaryStats> => {
    // Create correlation context if not provided
    const correlationId = config?.correlationId || undefined;
    const loggingContext = createLoggingContext('summary-service', correlationId);
    
    // Execute workflow within correlation context
    return withCorrelationId<SummaryStats>(loggingContext)(
      createLoggedSummaryWorkflow(request, dataProvider, config)
    );
  },

  /**
   * Validate a summary request with logging
   */
  validateRequest: (
    request: unknown,
    config?: ValidationConfig
  ): Result<SummaryRequest, ValidationError[]> => {
    const validationConfig = config || createValidationConfig();
    return validateSummaryRequest(request, validationConfig);
  },

  /**
   * Generate summary with request-scoped correlation ID
   * Useful for tracking requests across multiple service calls
   */
  generateSummaryWithCorrelation: (
    correlationId: string,
    request: unknown,
    dataProvider: LoggedDataProvider,
    config?: Omit<LoggedSummaryServiceConfig, 'correlationId'>
  ): Effect<SummaryStats> => {
    return loggedSummaryService.generateSummary(
      request,
      dataProvider,
      { ...config, correlationId }
    );
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
 * Helper to create a logged data provider from an existing data provider
 */
export const withDataProviderLogging = (
  baseProvider: {
    fetchCommits(
      repositories: readonly string[],
      dateRange: { start: Date; end: Date },
      branch?: string
    ): IOEffect<readonly CommitData[]>;
  }
): LoggedDataProvider => ({
  fetchCommits: (repositories, dateRange, branch) => 
    withLogging('data-provider-fetch')(
      baseProvider.fetchCommits(repositories, dateRange, branch)
    ) as IOEffect<readonly CommitData[]>
});
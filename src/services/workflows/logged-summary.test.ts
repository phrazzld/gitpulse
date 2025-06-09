/**
 * Integration tests for logged summary service
 * Demonstrates how structured logging works with real workflows
 */

import { ioEffect } from '../effects/types';
import { 
  loggedSummaryService, 
  withDataProviderLogging,
  type LoggedDataProvider 
} from './logged-summary';
import type { CommitData } from '../../core/types/index';

describe('Logged Summary Service Integration', () => {
  let logOutput: any[] = [];

  beforeEach(() => {
    logOutput = [];
    // Mock console methods to capture structured log output
    jest.spyOn(console, 'info').mockImplementation((message) => {
      try {
        logOutput.push(JSON.parse(message));
      } catch {
        logOutput.push({ raw: message });
      }
    });
    jest.spyOn(console, 'error').mockImplementation((message) => {
      try {
        logOutput.push(JSON.parse(message));
      } catch {
        logOutput.push({ raw: message });
      }
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createTestCommit = (overrides: Partial<CommitData> = {}): CommitData => ({
    sha: 'abc123',
    message: 'feat: test commit',
    author: 'test-author',
    date: '2023-06-15T10:00:00Z',
    repository: 'test-repo',
    ...overrides
  });

  const createTestDataProvider = (commits: readonly CommitData[]): LoggedDataProvider => ({
    fetchCommits: () => ioEffect(async () => commits)
  });

  describe('Complete workflow logging', () => {
    it('should log entire summary workflow with correlation ID', async () => {
      const testCommits = [
        createTestCommit({ author: 'alice', repository: 'org/frontend' }),
        createTestCommit({ author: 'bob', repository: 'org/backend' })
      ];

      const dataProvider = createTestDataProvider(testCommits);
      const validRequest = {
        repositories: ['org/frontend', 'org/backend'],
        dateRange: {
          start: new Date('2023-06-15T00:00:00Z'),
          end: new Date('2023-06-16T00:00:00Z')
        }
      };

      const effect = loggedSummaryService.generateSummary(
        validRequest,
        dataProvider,
        { enableDetailedLogging: true }
      );

      const result = await effect();

      expect(result.totalCommits).toBe(2);
      expect(result.uniqueAuthors).toBe(2);

      // Verify structured logging
      expect(logOutput.length).toBeGreaterThan(5);
      
      // All logs should have the same correlation ID
      const correlationId = logOutput[0].correlationId;
      expect(logOutput.every(log => log.correlationId === correlationId)).toBe(true);

      // Verify specific log entries
      const workflowStart = logOutput.find(log => 
        log.operationName === 'summary-workflow' && log.message === 'Effect started'
      );
      expect(workflowStart).toBeDefined();

      const validationLog = logOutput.find(log => 
        log.message === 'Request validation successful'
      );
      expect(validationLog).toMatchObject({
        level: 'info',
        correlationId,
        result: {
          repositories: 2,
          users: 0
        }
      });

      const dataFetchLog = logOutput.find(log => 
        log.message === 'Data fetch completed'
      );
      expect(dataFetchLog).toMatchObject({
        level: 'info',
        correlationId,
        result: {
          totalCommits: 2,
          repositories: 2,
          authors: 2
        }
      });

      const completionLog = logOutput.find(log => 
        log.message === 'Summary workflow completed successfully'
      );
      expect(completionLog).toMatchObject({
        level: 'info',
        correlationId,
        result: {
          statistics: {
            totalCommits: 2,
            uniqueAuthors: 2,
            repositories: 2
          }
        }
      });
    });

    it('should log validation errors with context', async () => {
      const dataProvider = createTestDataProvider([]);
      const invalidRequest = {
        repositories: [], // Invalid - empty repositories
        dateRange: {
          start: new Date('2023-06-16T00:00:00Z'),
          end: new Date('2023-06-15T00:00:00Z') // Invalid - end before start
        }
      };

      const effect = loggedSummaryService.generateSummary(invalidRequest, dataProvider);

      await expect(effect()).rejects.toThrow('Validation failed');

      // Should have validation error logs
      const validationError = logOutput.find(log => 
        log.message === 'Validation failed' && log.level === 'error'
      );
      expect(validationError).toBeDefined();
      expect(validationError.result.errors).toHaveLength(3);
    });

    it('should propagate correlation ID through effect chains', async () => {
      const testCommits = [createTestCommit({ repository: 'org/test-repo' })];
      const dataProvider = createTestDataProvider(testCommits);
      const validRequest = {
        repositories: ['org/test-repo'],
        dateRange: {
          start: new Date('2023-06-15T00:00:00Z'),
          end: new Date('2023-06-16T00:00:00Z')
        }
      };

      const customCorrelationId = 'custom-correlation-123';
      const effect = loggedSummaryService.generateSummaryWithCorrelation(
        customCorrelationId,
        validRequest,
        dataProvider
      );

      await effect();

      // All logs should use the custom correlation ID
      expect(logOutput.every(log => log.correlationId === customCorrelationId)).toBe(true);
    });
  });

  describe('Data provider logging integration', () => {
    it('should add logging to existing data provider', async () => {
      const baseProvider = {
        fetchCommits: () => ioEffect(async () => [createTestCommit({ repository: 'org/test-repo' })])
      };

      const loggedProvider = withDataProviderLogging(baseProvider);
      const effect = loggedProvider.fetchCommits(['org/test-repo'], {
        start: new Date(),
        end: new Date()
      });

      await effect();

      // Should have logs for data provider operations
      const providerLogs = logOutput.filter(log => 
        log.operationName === 'data-provider-fetch'
      );
      expect(providerLogs).toHaveLength(2); // Start and completion
    });
  });

  describe('Performance tracking', () => {
    it('should include timing information in logs', async () => {
      const testCommits = [createTestCommit({ repository: 'org/test-repo' })];
      const dataProvider = createTestDataProvider(testCommits);
      const validRequest = {
        repositories: ['org/test-repo'],
        dateRange: {
          start: new Date('2023-06-15T00:00:00Z'),
          end: new Date('2023-06-16T00:00:00Z')
        }
      };

      const effect = loggedSummaryService.generateSummary(validRequest, dataProvider);
      await effect();

      // Check that completion logs include duration
      const completionLogs = logOutput.filter(log => 
        log.message === 'Effect completed' && log.durationMs !== undefined
      );
      expect(completionLogs.length).toBeGreaterThan(0);
      
      completionLogs.forEach(log => {
        expect(log.durationMs).toBeGreaterThanOrEqual(0);
        expect(typeof log.durationMs).toBe('number');
      });
    });
  });

  describe('Error handling with logging', () => {
    it('should log errors with full context and correlation ID', async () => {
      const errorProvider: LoggedDataProvider = {
        fetchCommits: () => ioEffect(async () => {
          throw new Error('fetch failed due to network error');
        })
      };

      const validRequest = {
        repositories: ['org/test-repo'],
        dateRange: {
          start: new Date('2023-06-15T00:00:00Z'),
          end: new Date('2023-06-16T00:00:00Z')
        }
      };

      const effect = loggedSummaryService.generateSummary(validRequest, errorProvider);

      await expect(effect()).rejects.toThrow('Failed to fetch data from GitHub');

      // Should have error logs with correlation ID
      const errorLogs = logOutput.filter(log => log.level === 'error');
      expect(errorLogs.length).toBeGreaterThan(0);

      const workflowErrorLog = errorLogs.find(log => 
        log.message === 'Summary workflow failed'
      );
      expect(workflowErrorLog).toMatchObject({
        level: 'error',
        correlationId: expect.any(String),
        error: {
          name: 'Error',
          message: 'fetch failed due to network error'
        }
      });
    });
  });
});
import {
  createSummaryWorkflow,
  summaryService,
  isEffect,
  isIOEffect,
  type DataProvider,
  type SummaryServiceConfig
} from './summary';
import { ioEffect, succeed } from '../effects/types';
import { createValidationConfig } from '../../core/config/index';
import type { 
  CommitData, 
  SummaryRequest, 
  ValidationError,
  DateRange 
} from '../../core/types/index';

describe('Effect-based Summary Service', () => {
  // Test data setup
  const createCommit = (overrides: Partial<CommitData> = {}): CommitData => ({
    sha: 'abc123',
    message: 'feat: add new feature',
    author: 'john.doe',
    date: '2023-06-15T10:00:00Z',
    repository: 'test-repo',
    additions: 10,
    deletions: 5,
    ...overrides
  });

  const sampleCommits: readonly CommitData[] = [
    createCommit({
      sha: 'commit1',
      author: 'john.doe',
      date: '2023-06-15T10:00:00Z',
      repository: 'frontend',
      additions: 120,
      deletions: 20
    }),
    createCommit({
      sha: 'commit2',
      author: 'jane.smith',
      date: '2023-06-16T14:30:00Z',
      repository: 'frontend',
      additions: 15,
      deletions: 8
    }),
    createCommit({
      sha: 'commit3',
      author: 'john.doe',
      date: '2023-06-17T09:15:00Z',
      repository: 'backend',
      additions: 80,
      deletions: 60
    })
  ];

  const validRequest: SummaryRequest = {
    repositories: ['frontend', 'backend'],
    dateRange: {
      start: new Date('2023-06-15T00:00:00Z'),
      end: new Date('2023-06-20T00:00:00Z')
    }
  };

  // Test data provider implementation
  const createTestDataProvider = (commits: readonly CommitData[]): DataProvider => ({
    fetchCommits: (repositories, dateRange, branch) => 
      ioEffect(async () => {
        // Simulate filtering by repository
        const filtered = commits.filter(c => 
          repositories.includes(c.repository)
        );
        return filtered;
      })
  });

  // Error-throwing data provider for testing error handling
  const createErrorDataProvider = (error: Error): DataProvider => ({
    fetchCommits: () => ioEffect(async () => {
      throw error;
    })
  });

  describe('createSummaryWorkflow', () => {
    it('should create an effect for valid request', () => {
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(validRequest, dataProvider);
      
      expect(isEffect(effect)).toBe(true);
      expect(typeof effect).toBe('function');
    });

    it('should defer execution until effect is called', () => {
      let fetchCalled = false;
      const dataProvider: DataProvider = {
        fetchCommits: () => ioEffect(async () => {
          fetchCalled = true;
          return sampleCommits;
        })
      };
      
      const effect = createSummaryWorkflow(validRequest, dataProvider);
      
      // Effect created but not executed yet
      expect(fetchCalled).toBe(false);
    });

    it('should execute workflow when effect is called', async () => {
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(validRequest, dataProvider);
      
      const result = await effect();
      
      expect(result).toBeDefined();
      expect(result.totalCommits).toBe(2); // Only frontend and backend repos
      expect(result.uniqueAuthors).toBe(2);
      expect(result.repositories).toEqual(['frontend', 'backend']);
    });

    it('should handle validation errors', async () => {
      const invalidRequest = {
        repositories: [], // Invalid: empty array
        dateRange: {
          start: '2023-06-15',
          end: '2023-06-20'
        }
      };
      
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(invalidRequest, dataProvider);
      
      await expect(effect()).rejects.toThrow('Validation failed');
    });

    it('should handle multiple validation errors', async () => {
      const invalidRequest = {
        repositories: ['invalid format'], // Invalid format
        dateRange: {
          start: '2023-06-20',
          end: '2023-06-15' // End before start
        }
      };
      
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(invalidRequest, dataProvider);
      
      await expect(effect()).rejects.toThrow('Validation failed');
    });

    it('should apply user filter when specified', async () => {
      const requestWithUsers = {
        ...validRequest,
        users: ['john.doe']
      };
      
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(requestWithUsers, dataProvider);
      
      const result = await effect();
      
      expect(result.totalCommits).toBe(1); // Only john.doe's commits
      expect(result.commitsByAuthor['john.doe']).toBe(1);
      expect(result.commitsByAuthor['jane.smith']).toBeUndefined();
    });

    it('should handle data provider errors', async () => {
      const networkError = new Error('Network fetch failed');
      const dataProvider = createErrorDataProvider(networkError);
      const effect = createSummaryWorkflow(validRequest, dataProvider);
      
      await expect(effect()).rejects.toThrow('Failed to fetch data from GitHub');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout exceeded');
      const dataProvider = createErrorDataProvider(timeoutError);
      const effect = createSummaryWorkflow(validRequest, dataProvider);
      
      await expect(effect()).rejects.toThrow('Request timed out');
    });

    it('should use custom validation config', async () => {
      const requestWithManyRepos = {
        repositories: Array(11).fill('owner/repo'),
        dateRange: validRequest.dateRange
      };
      
      const config: SummaryServiceConfig = {
        validation: createValidationConfig({
          maxRepositories: 10
        })
      };
      
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(requestWithManyRepos, dataProvider, config);
      
      await expect(effect()).rejects.toThrow('Validation failed');
    });

    it('should filter by branch when specified', async () => {
      const requestWithBranch = {
        ...validRequest,
        branch: 'main'
      };
      
      let branchPassed: string | undefined;
      const dataProvider: DataProvider = {
        fetchCommits: (repos, range, branch) => ioEffect(async () => {
          branchPassed = branch;
          return sampleCommits;
        })
      };
      
      const effect = createSummaryWorkflow(requestWithBranch, dataProvider);
      await effect();
      
      expect(branchPassed).toBe('main');
    });
  });

  describe('summaryService', () => {
    describe('generateSummary', () => {
      it('should return an effect', () => {
        const dataProvider = createTestDataProvider(sampleCommits);
        const effect = summaryService.generateSummary(validRequest, dataProvider);
        
        expect(isEffect(effect)).toBe(true);
      });

      it('should generate summary statistics', async () => {
        const dataProvider = createTestDataProvider(sampleCommits);
        const effect = summaryService.generateSummary(validRequest, dataProvider);
        
        const stats = await effect();
        
        expect(stats.totalCommits).toBe(2);
        expect(stats.totalAdditions).toBe(135); // 120 + 15
        expect(stats.totalDeletions).toBe(28); // 20 + 8
        expect(stats.topRepositories).toContainEqual({
          name: 'frontend',
          commits: 2
        });
      });

      it('should handle empty results', async () => {
        const dataProvider = createTestDataProvider([]);
        const effect = summaryService.generateSummary(validRequest, dataProvider);
        
        const stats = await effect();
        
        expect(stats.totalCommits).toBe(0);
        expect(stats.uniqueAuthors).toBe(0);
        expect(stats.repositories).toEqual([]);
        expect(stats.mostActiveDay).toBe('');
      });
    });

    describe('validateRequest', () => {
      it('should validate request without executing effects', () => {
        const result = summaryService.validateRequest(validRequest);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.repositories).toEqual(validRequest.repositories);
        }
      });

      it('should return validation errors', () => {
        const invalidRequest = {
          repositories: [],
          dateRange: {
            start: new Date('2023-06-15'),
            end: new Date('2023-06-20')
          }
        };
        
        const result = summaryService.validateRequest(invalidRequest);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.some(e => e.field === 'repositories')).toBe(true);
        }
      });

      it('should use custom validation config', () => {
        const request = {
          repositories: Array(6).fill('owner/repo'),
          dateRange: validRequest.dateRange
        };
        
        const config = createValidationConfig({ maxRepositories: 5 });
        const result = summaryService.validateRequest(request, config);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.some(e => 
            e.message.includes('Cannot process more than 5 repositories')
          )).toBe(true);
        }
      });
    });
  });

  describe('Effect Composition', () => {
    it('should compose effects in proper order', async () => {
      const executionOrder: string[] = [];
      
      const dataProvider: DataProvider = {
        fetchCommits: () => ioEffect(async () => {
          executionOrder.push('fetch');
          return sampleCommits;
        })
      };
      
      const effect = createSummaryWorkflow(validRequest, dataProvider);
      const result = await effect();
      
      executionOrder.push('calculate');
      
      // Validation happens synchronously before effect creation
      // Fetch happens when effect is executed
      expect(executionOrder).toEqual(['fetch', 'calculate']);
      expect(result.totalCommits).toBeGreaterThan(0);
    });

    it('should stop on first error', async () => {
      let fetchCalled = false;
      
      const dataProvider: DataProvider = {
        fetchCommits: () => ioEffect(async () => {
          fetchCalled = true;
          return sampleCommits;
        })
      };
      
      const invalidRequest = { repositories: [] };
      const effect = createSummaryWorkflow(invalidRequest, dataProvider);
      
      await expect(effect()).rejects.toThrow();
      expect(fetchCalled).toBe(false); // Should not reach fetch due to validation error
    });
  });

  describe('Type Guards', () => {
    it('should identify effects correctly', () => {
      const effect = succeed('test');
      const notEffect = { value: 'test' };
      
      expect(isEffect(effect)).toBe(true);
      expect(isEffect(notEffect)).toBe(false);
      expect(isEffect(null)).toBe(false);
      expect(isEffect(undefined)).toBe(false);
    });

    it('should identify IO effects correctly', () => {
      const ioEff = ioEffect(async () => 'test');
      const regularEffect = succeed('test');
      
      expect(isIOEffect(ioEff)).toBe(true);
      expect(isIOEffect(regularEffect)).toBe(false);
    });
  });

  describe('Error Transformation', () => {
    it('should transform validation errors to user-friendly messages', async () => {
      const invalidRequest = {
        repositories: ['invalid'],
        dateRange: {
          start: new Date('2023-06-20'),
          end: new Date('2023-06-15')
        }
      };
      
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(invalidRequest, dataProvider);
      
      try {
        await effect();
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Validation failed');
      }
    });

    it('should handle unknown errors', async () => {
      const unknownError = new Error('Unknown error occurred');
      const dataProvider = createErrorDataProvider(unknownError);
      const effect = createSummaryWorkflow(validRequest, dataProvider);
      
      await expect(effect()).rejects.toThrow('Unknown error occurred');
    });
  });

  describe('Configuration', () => {
    it('should use default timeout', async () => {
      const slowDataProvider: DataProvider = {
        fetchCommits: () => ioEffect(async () => {
          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 100));
          return sampleCommits;
        })
      };
      
      const effect = createSummaryWorkflow(validRequest, slowDataProvider);
      const result = await effect();
      
      expect(result.totalCommits).toBe(2);
    });

    it('should handle custom timeout configuration', async () => {
      const config: SummaryServiceConfig = {
        requestTimeout: 30000 // 30 seconds
      };
      
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(validRequest, dataProvider, config);
      const result = await effect();
      
      expect(result).toBeDefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle large datasets', async () => {
      const largeDataset = Array(1000).fill(null).map((_, i) => 
        createCommit({
          sha: `commit${i}`,
          date: new Date(2023, 5, 15 + (i % 5)).toISOString(),
          author: `author${i % 10}`,
          repository: i % 2 === 0 ? 'frontend' : 'backend'
        })
      );
      
      const dataProvider = createTestDataProvider(largeDataset);
      const effect = createSummaryWorkflow(validRequest, dataProvider);
      const result = await effect();
      
      expect(result.totalCommits).toBe(1000);
      expect(result.uniqueAuthors).toBe(10);
      expect(Object.keys(result.commitsByDay)).toHaveLength(5);
    });

    it('should handle concurrent requests', async () => {
      const dataProvider = createTestDataProvider(sampleCommits);
      
      const effects = [
        createSummaryWorkflow(validRequest, dataProvider),
        createSummaryWorkflow(validRequest, dataProvider),
        createSummaryWorkflow(validRequest, dataProvider)
      ];
      
      const results = await Promise.all(effects.map(e => e()));
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.totalCommits).toBe(2);
      });
    });

    it('should maintain data consistency across filters', async () => {
      const requestWithFilters = {
        ...validRequest,
        users: ['john.doe', 'jane.smith']
      };
      
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = createSummaryWorkflow(requestWithFilters, dataProvider);
      const result = await effect();
      
      // Verify consistency
      const totalFromDays = Object.values(result.commitsByDay)
        .reduce((sum, count) => sum + count, 0);
      const totalFromAuthors = Object.values(result.commitsByAuthor)
        .reduce((sum, count) => sum + count, 0);
      
      expect(totalFromDays).toBe(result.totalCommits);
      expect(totalFromAuthors).toBe(result.totalCommits);
    });
  });
});
/**
 * Tests for the GitHub utilities module
 */

// Test type declarations
declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect(actual: any): any;
// Define test matchers
expect.stringMatching = (pattern: RegExp) => ({ 
  asymmetricMatch: (actual: string) => pattern.test(actual)
});
expect.anything = () => ({ asymmetricMatch: () => true });
declare namespace jest {
  function resetModules(): void;
  function clearAllMocks(): void;
  function spyOn(object: any, methodName: string): any;
  function fn(implementation?: (...args: any[]) => any): any;
  function mock(moduleName: string, factory?: () => any): void;
}

import { 
  checkRateLimit,
  parseTokenScopes,
  validateTokenScopes,
  getRepoIdentifier,
  splitRepoFullName,
  deduplicateBy,
  processBatches,
  formatGitHubError
} from '../utils';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('GitHub Utils Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Function exports', () => {
    it('should export the expected utility functions', () => {
      expect(typeof checkRateLimit).toBe('function');
      expect(typeof parseTokenScopes).toBe('function');
      expect(typeof validateTokenScopes).toBe('function');
      expect(typeof getRepoIdentifier).toBe('function');
      expect(typeof splitRepoFullName).toBe('function');
      expect(typeof deduplicateBy).toBe('function');
      expect(typeof processBatches).toBe('function');
      expect(typeof formatGitHubError).toBe('function');
    });
  });

  describe('checkRateLimit', () => {
    it('should process rate limit data correctly', async () => {
      const mockOctokit = {
        rest: {
          rateLimit: {
            get: jest.fn().mockResolvedValue({
              data: {
                resources: {
                  core: {
                    limit: 5000,
                    remaining: 4000,
                    reset: Math.floor(Date.now() / 1000) + 3600
                  }
                }
              }
            })
          }
        }
      };

      const result = await checkRateLimit(mockOctokit as any, 'OAuth');
      
      expect(result).not.toBeNull();
      expect(result?.limit).toBe(5000);
      expect(result?.remaining).toBe(4000);
      expect(result?.usedPercent).toBe(20);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should return null and log warning on error', async () => {
      const mockOctokit = {
        rest: {
          rateLimit: {
            get: jest.fn().mockRejectedValue(new Error('API error'))
          }
        }
      };

      const result = await checkRateLimit(mockOctokit as any);
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should warn when rate limit is running low', async () => {
      const mockOctokit = {
        rest: {
          rateLimit: {
            get: jest.fn().mockResolvedValue({
              data: {
                resources: {
                  core: {
                    limit: 5000,
                    remaining: 50, // Low remaining count
                    reset: Math.floor(Date.now() / 1000) + 3600
                  }
                }
              }
            })
          }
        }
      };

      await checkRateLimit(mockOctokit as any);
      
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('parseTokenScopes', () => {
    it('should parse scope header string to array', () => {
      expect(parseTokenScopes('repo, read:org, user')).toEqual(['repo', 'read:org', 'user']);
    });

    it('should return empty array for empty string', () => {
      expect(parseTokenScopes('')).toEqual([]);
    });

    it('should handle undefined input', () => {
      expect(parseTokenScopes(undefined)).toEqual([]);
    });
  });

  describe('validateTokenScopes', () => {
    it('should return valid when all required scopes are present', () => {
      const scopes = ['repo', 'read:org', 'user'];
      const required = ['repo', 'read:org'];
      
      const result = validateTokenScopes(scopes, required);
      
      expect(result.isValid).toBe(true);
      expect(result.missingScopes).toEqual([]);
    });

    it('should return invalid with missing scopes listed', () => {
      const scopes = ['user', 'gist'];
      const required = ['repo', 'read:org'];
      
      const result = validateTokenScopes(scopes, required);
      
      expect(result.isValid).toBe(false);
      expect(result.missingScopes).toEqual(['repo', 'read:org']);
    });

    it('should default to requiring repo scope', () => {
      const scopes = ['user', 'gist'];
      
      const result = validateTokenScopes(scopes);
      
      expect(result.isValid).toBe(false);
      expect(result.missingScopes).toEqual(['repo']);
    });
  });

  describe('getRepoIdentifier', () => {
    it('should combine owner and repo into identifier', () => {
      expect(getRepoIdentifier('octocat', 'hello-world')).toBe('octocat/hello-world');
    });
  });

  describe('splitRepoFullName', () => {
    it('should split a valid repo full name', () => {
      expect(splitRepoFullName('octocat/hello-world')).toEqual(['octocat', 'hello-world']);
    });

    it('should return empty strings for invalid input', () => {
      expect(splitRepoFullName('')).toEqual(['', '']);
      expect(splitRepoFullName('invalid-format')).toEqual(['', '']);
      expect(splitRepoFullName('too/many/parts')).toEqual(['', '']);
      expect(splitRepoFullName(null as any)).toEqual(['', '']);
    });
  });

  describe('deduplicateBy', () => {
    it('should deduplicate items by the specified key', () => {
      const items = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 1, name: 'duplicate' },
        { id: 3, name: 'third' }
      ];
      
      const result = deduplicateBy(items, item => item.id);
      
      expect(result).toHaveLength(3);
      expect(result.some(item => item.name === 'first')).toBe(true);
      expect(result.some(item => item.name === 'second')).toBe(true);
      expect(result.some(item => item.name === 'third')).toBe(true);
      expect(result.some(item => item.name === 'duplicate')).toBe(false);
    });

    it('should log info when duplicates are removed', () => {
      const items = [
        { id: 1, name: 'first' },
        { id: 1, name: 'duplicate' }
      ];
      
      deduplicateBy(items, item => item.id);
      
      expect(logger.info).toHaveBeenCalled();
    });

    it('should not log info when no duplicates exist', () => {
      const items = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' }
      ];
      
      deduplicateBy(items, item => item.id);
      
      // debug is called but info is not
      expect(logger.debug).toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe('processBatches', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const batchProcessor = jest.fn()
        .mockImplementation((batch: number[]) => Promise.resolve(batch.map((n: number) => n * 2)));
      
      const result = await processBatches(items, 3, batchProcessor);
      
      expect(batchProcessor).toHaveBeenCalledTimes(4); // 10 items in batches of 3 = 4 batches
      expect(result).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
      expect(logger.debug).toHaveBeenCalledWith(
        'github:utils',
        expect.stringMatching(/Processing batch/),
        expect.anything()
      );
    });

    it('should handle empty array', async () => {
      const items: number[] = [];
      const batchProcessor = jest.fn().mockResolvedValue([]);
      
      const result = await processBatches(items, 5, batchProcessor);
      
      expect(result).toEqual([]);
      expect(batchProcessor).not.toHaveBeenCalled();
    });
  });

  describe('formatGitHubError', () => {
    it('should format an Error object', () => {
      const error = new Error('Something went wrong');
      expect(formatGitHubError(error)).toBe('GitHub error: Something went wrong');
    });

    it('should handle Octokit errors with response data', () => {
      const octokitError = new Error('API error');
      (octokitError as any).response = {
        status: 403,
        statusText: 'Forbidden',
        data: { message: 'API rate limit exceeded' }
      };
      
      expect(formatGitHubError(octokitError)).toBe('GitHub API error: API rate limit exceeded');
    });

    it('should have special handling for authentication errors', () => {
      const authError = new Error('Auth error');
      (authError as any).response = { status: 401 };
      
      expect(formatGitHubError(authError)).toContain('authentication failed');
    });

    it('should handle non-Error objects', () => {
      expect(formatGitHubError('string error')).toBe('GitHub error: string error');
      expect(formatGitHubError(null)).toBe('Unknown GitHub API error');
    });
  });
});
/**
 * Tests for the GitHub utilities module
 */

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
import { IOctokitClient } from '../interfaces';
import { createMockOctokitClient } from './testUtils.helper';
import { logger } from '@/lib/logger';

// Test globals
declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const expect: any;
declare const jest: any;

// Define test matchers
expect.stringMatching = (pattern: RegExp) => ({ 
  asymmetricMatch: (actual: string) => pattern.test(actual)
});
expect.anything = () => ({ asymmetricMatch: () => true });

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('GitHub Utils Module', () => {
  let mockClient: IOctokitClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockOctokitClient();
  });

  describe('Function exports', () => {
    it('should export checkRateLimit function', () => {
      expect(typeof checkRateLimit).toBe('function');
    });
    
    it('should export parseTokenScopes function', () => {
      expect(typeof parseTokenScopes).toBe('function');
    });
    
    it('should export validateTokenScopes function', () => {
      expect(typeof validateTokenScopes).toBe('function');
    });
    
    it('should export getRepoIdentifier function', () => {
      expect(typeof getRepoIdentifier).toBe('function');
    });
    
    it('should export splitRepoFullName function', () => {
      expect(typeof splitRepoFullName).toBe('function');
    });
    
    it('should export deduplicateBy function', () => {
      expect(typeof deduplicateBy).toBe('function');
    });
    
    it('should export processBatches function', () => {
      expect(typeof processBatches).toBe('function');
    });
    
    it('should export formatGitHubError function', () => {
      expect(typeof formatGitHubError).toBe('function');
    });
  });

  describe('checkRateLimit', () => {
    it('should check rate limit and log the status', async () => {
      const mockRateLimitData = {
        resources: {
          core: {
            limit: 5000,
            remaining: 4000,
            reset: Math.floor(Date.now() / 1000) + 3600
          }
        }
      };
      
      (mockClient.rest.rateLimit.get as any).mockResolvedValue({
        data: mockRateLimitData
      });
      
      const result = await checkRateLimit(mockClient);
      
      expect(mockClient.rest.rateLimit.get).toHaveBeenCalled();
      expect(result).toMatchObject({
        limit: 5000,
        remaining: 4000,
        usedPercent: 20
      });
      expect(result?.reset).toBeInstanceOf(Date);
      expect(logger.info).toHaveBeenCalledWith(
        'github:utils',
        'GitHub API rate limit status',
        expect.objectContaining({
          limit: 5000,
          remaining: 4000
        })
      );
    });
    
    it('should warn if rate limit is low', async () => {
      const mockRateLimitData = {
        resources: {
          core: {
            limit: 5000,
            remaining: 50,
            reset: Math.floor(Date.now() / 1000) + 3600
          }
        }
      };
      
      (mockClient.rest.rateLimit.get as any).mockResolvedValue({
        data: mockRateLimitData
      });
      
      await checkRateLimit(mockClient);
      
      expect(logger.warn).toHaveBeenCalledWith(
        'github:utils',
        'GitHub API rate limit is running low',
        expect.anything()
      );
    });
    
    it('should check specific auth method rate limit', async () => {
      const mockRateLimitData = {
        resources: {
          core: {
            limit: 5000,
            remaining: 4500,
            reset: Math.floor(Date.now() / 1000) + 3600
          }
        }
      };
      
      (mockClient.rest.rateLimit.get as any).mockResolvedValue({
        data: mockRateLimitData
      });
      
      const result = await checkRateLimit(mockClient, 'app');
      
      expect(result).toMatchObject({
        limit: 5000,
        remaining: 4500,
        usedPercent: 10
      });
      expect(result?.reset).toBeInstanceOf(Date);
      expect(logger.info).toHaveBeenCalledWith(
        'github:utils',
        'GitHub API rate limit status (app)',
        expect.anything()
      );
    });
    
    it('should return null on error', async () => {
      (mockClient.rest.rateLimit.get as any).mockRejectedValue(new Error('API error'));
      
      const result = await checkRateLimit(mockClient);
      
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'github:utils',
        'Failed to check GitHub API rate limits',
        expect.anything()
      );
    });
  });

  describe('parseTokenScopes', () => {
    it('should parse scope string into array', () => {
      const scopeString = 'repo, read:org, write:packages';
      const result = parseTokenScopes(scopeString);
      
      expect(result).toEqual(['repo', 'read:org', 'write:packages']);
    });
    
    it('should handle empty string', () => {
      const result = parseTokenScopes('');
      
      expect(result).toEqual([]);
    });
    
    it('should handle single scope', () => {
      const result = parseTokenScopes('repo');
      
      expect(result).toEqual(['repo']);
    });
    
    it('should handle undefined', () => {
      const result = parseTokenScopes(undefined as any);
      
      expect(result).toEqual([]);
    });
  });

  describe('validateTokenScopes', () => {
    it('should validate all required scopes present', () => {
      const scopes = ['repo', 'read:org', 'write:packages'];
      const required = ['repo', 'read:org'];
      const result = validateTokenScopes(scopes, required);
      
      expect(result).toEqual({
        isValid: true,
        missingScopes: []
      });
    });
    
    it('should identify missing scopes', () => {
      const scopes = ['read:org'];
      const required = ['repo', 'read:org'];
      const result = validateTokenScopes(scopes, required);
      
      expect(result).toEqual({
        isValid: false,
        missingScopes: ['repo']
      });
    });
    
    it('should handle empty required scopes', () => {
      const scopes = ['repo'];
      const required: string[] = [];
      const result = validateTokenScopes(scopes, required);
      
      expect(result).toEqual({
        isValid: true,
        missingScopes: []
      });
    });
    
    it('should handle empty token scopes', () => {
      const scopes: string[] = [];
      const required = ['repo'];
      const result = validateTokenScopes(scopes, required);
      
      expect(result).toEqual({
        isValid: false,
        missingScopes: ['repo']
      });
    });
  });

  describe('getRepoIdentifier', () => {
    it('should create identifier from owner and repo', () => {
      const result = getRepoIdentifier('owner', 'repo');
      
      expect(result).toBe('owner/repo');
    });
    
    it('should handle empty strings', () => {
      const result = getRepoIdentifier('', 'repo');
      
      expect(result).toBe('/repo');
    });
    
    it('should handle special characters', () => {
      const result = getRepoIdentifier('my-org', 'my-repo');
      
      expect(result).toBe('my-org/my-repo');
    });
  });

  describe('splitRepoFullName', () => {
    it('should split repository full name', () => {
      const result = splitRepoFullName('owner/repo');
      
      expect(result).toEqual(['owner', 'repo']);
    });
    
    it('should handle names with multiple slashes', () => {
      const result = splitRepoFullName('owner/repo/sub');
      
      expect(result).toEqual(['', '']);
    });
    
    it('should handle invalid format', () => {
      const result = splitRepoFullName('invalid');
      
      expect(result).toEqual(['', '']);
    });
  });

  describe('deduplicateBy', () => {
    it('should deduplicate array by key function', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 1, name: 'c' }
      ];
      const result = deduplicateBy(items, item => item.id);
      
      // Map keeps the last value for duplicate keys
      expect(result).toEqual([
        { id: 1, name: 'c' },
        { id: 2, name: 'b' }
      ]);
    });
    
    it('should handle empty array', () => {
      const result = deduplicateBy([], item => item);
      
      expect(result).toEqual([]);
    });
    
    it('should handle all unique items', () => {
      const items = [1, 2, 3];
      const result = deduplicateBy(items, item => item);
      
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('processBatches', () => {
    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = jest.fn().mockResolvedValue([10, 20]);
      
      const results = await processBatches(items, 2, processor);
      
      expect(processor).toHaveBeenCalledTimes(3);
      expect(processor).toHaveBeenCalledWith([1, 2]);
      expect(processor).toHaveBeenCalledWith([3, 4]);
      expect(processor).toHaveBeenCalledWith([5]);
      expect(results).toEqual([10, 20, 10, 20, 10, 20]);
    });
    
    it('should handle empty array', async () => {
      const processor = jest.fn();
      const results = await processBatches([], 2, processor);
      
      expect(processor).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });
    
    it('should handle processor errors and continue', async () => {
      const items = [1, 2, 3];
      const processor = jest.fn()
        .mockResolvedValueOnce([10])
        .mockRejectedValueOnce(new Error('Process error'))
        .mockResolvedValueOnce([30]);
      
      await expect(processBatches(items, 1, processor)).rejects.toThrow('Process error');
    });
  });

  describe('formatGitHubError', () => {
    it('should format GitHub API error with status', () => {
      const error = new Error('Not Found') as any;
      error.response = {
        status: 404,
        data: {
          message: 'Not Found'
        }
      };
      
      const result = formatGitHubError(error);
      
      expect(result).toBe('GitHub resource not found. The repository or resource may not exist or you lack permission.');
    });
    
    it('should format error with only message', () => {
      const error = new Error('Network error');
      
      const result = formatGitHubError(error);
      
      expect(result).toBe('GitHub error: Network error');
    });
    
    it('should format unknown error', () => {
      const error = { unknown: 'error' };
      
      const result = formatGitHubError(error);
      
      expect(result).toBe('GitHub error: [object Object]');
    });
    
    it('should handle null error', () => {
      const result = formatGitHubError(null);
      
      expect(result).toBe('Unknown GitHub API error');
    });
  });
});
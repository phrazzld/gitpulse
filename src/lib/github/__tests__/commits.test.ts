/**
 * Tests for the GitHub commits module
 */

import { 
  fetchRepositoryCommitsOAuth, 
  fetchRepositoryCommitsApp, 
  fetchRepositoryCommits,
  fetchCommitsForRepositories
} from '../commits';
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

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('GitHub Commits Module', () => {
  let mockClient: IOctokitClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockOctokitClient();
  });

  describe('Function exports', () => {
    it('should export fetchRepositoryCommitsOAuth function', () => {
      expect(typeof fetchRepositoryCommitsOAuth).toBe('function');
    });
    
    it('should export fetchRepositoryCommitsApp function', () => {
      expect(typeof fetchRepositoryCommitsApp).toBe('function');
    });
    
    it('should export fetchRepositoryCommits function', () => {
      expect(typeof fetchRepositoryCommits).toBe('function');
    });
    
    it('should export fetchCommitsForRepositories function', () => {
      expect(typeof fetchCommitsForRepositories).toBe('function');
    });
  });

  describe('fetchRepositoryCommitsOAuth', () => {
    it('should fetch commits using the provided client', async () => {
      const mockCommits = [
        { sha: '123abc', commit: { message: 'Test commit' }, html_url: 'https://github.com/test/repo/commit/123abc' }
      ];
      
      (mockClient.paginate as any).mockResolvedValue(mockCommits);
      
      const result = await fetchRepositoryCommitsOAuth(mockClient, 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(mockClient.paginate).toHaveBeenCalledWith(
        mockClient.rest.repos.listCommits,
        expect.objectContaining({
          owner: 'owner',
          repo: 'repo',
          since: '2023-01-01',
          until: '2023-12-31',
          per_page: 100
        })
      );
      expect(result[0].repository).toEqual({ full_name: 'owner/repo' });
    });
    
    it('should add repository information to each commit', async () => {
      const mockCommits = [
        { sha: '123abc', commit: { message: 'Test commit 1' }, html_url: 'https://github.com/test/repo/commit/123abc' },
        { sha: '456def', commit: { message: 'Test commit 2' }, html_url: 'https://github.com/test/repo/commit/456def' }
      ];
      
      (mockClient.paginate as any).mockResolvedValue(mockCommits);
      
      const result = await fetchRepositoryCommitsOAuth(mockClient, 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(result.length).toBe(2);
      expect(result[0].repository).toEqual({ full_name: 'owner/repo' });
      expect(result[1].repository).toEqual({ full_name: 'owner/repo' });
    });
    
    it('should return empty array on error', async () => {
      (mockClient.paginate as any).mockRejectedValue(new Error('API error'));
      
      const result = await fetchRepositoryCommitsOAuth(mockClient, 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('fetchRepositoryCommitsApp', () => {
    it('should fetch commits using the provided client', async () => {
      const mockCommits = [
        { sha: '123abc', commit: { message: 'Test commit' }, html_url: 'https://github.com/test/repo/commit/123abc' }
      ];
      
      (mockClient.paginate as any).mockResolvedValue(mockCommits);
      
      const result = await fetchRepositoryCommitsApp(mockClient, 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(mockClient.paginate).toHaveBeenCalledWith(
        mockClient.rest.repos.listCommits,
        expect.objectContaining({
          owner: 'owner',
          repo: 'repo',
          since: '2023-01-01',
          until: '2023-12-31',
          per_page: 100
        })
      );
      expect(result[0].repository).toEqual({ full_name: 'owner/repo' });
    });
    
    it('should pass author parameter when provided', async () => {
      (mockClient.paginate as any).mockResolvedValue([]);
      
      await fetchRepositoryCommitsApp(mockClient, 'owner', 'repo', '2023-01-01', '2023-12-31', 'testuser');
      
      expect(mockClient.paginate).toHaveBeenCalledWith(
        mockClient.rest.repos.listCommits,
        expect.objectContaining({
          author: 'testuser'
        })
      );
    });
  });

  describe('fetchRepositoryCommits', () => {
    it('should call OAuth method when auth method is oauth', async () => {
      const mockCommits = [{ sha: '123', commit: { message: 'Test' }, html_url: 'http://test.com' }];
      (mockClient.paginate as any).mockResolvedValue(mockCommits);
      
      const result = await fetchRepositoryCommits(mockClient, 'oauth', 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(result).toHaveLength(1);
      expect(result[0].repository).toEqual({ full_name: 'owner/repo' });
    });
    
    it('should call App method when auth method is app', async () => {
      const mockCommits = [{ sha: '456', commit: { message: 'Test' }, html_url: 'http://test.com' }];
      (mockClient.paginate as any).mockResolvedValue(mockCommits);
      
      const result = await fetchRepositoryCommits(mockClient, 'app', 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(result).toHaveLength(1);
      expect(result[0].repository).toEqual({ full_name: 'owner/repo' });
    });
    
    it('should throw error for unsupported auth method', async () => {
      await expect(
        fetchRepositoryCommits(mockClient, 'unsupported' as any, 'owner', 'repo', '2023-01-01', '2023-12-31')
      ).rejects.toThrow('Unsupported auth method: unsupported');
    });
  });

  describe('fetchCommitsForRepositories', () => {
    it('should fetch commits for multiple repositories', async () => {
      const mockRepoCommits = [
        { sha: '123', commit: { message: 'Test 1' }, html_url: 'http://test.com', repository: { full_name: 'owner/repo1' } },
        { sha: '456', commit: { message: 'Test 2' }, html_url: 'http://test.com', repository: { full_name: 'owner/repo2' } }
      ];
      
      (mockClient.paginate as any).mockResolvedValue([mockRepoCommits[0]])
        .mockResolvedValueOnce([mockRepoCommits[0]])
        .mockResolvedValueOnce([mockRepoCommits[1]]);
      
      const result = await fetchCommitsForRepositories(
        mockClient, 
        'oauth',
        ['owner/repo1', 'owner/repo2'], 
        '2023-01-01', 
        '2023-12-31'
      );
      
      expect(result).toHaveLength(2);
      expect(mockClient.paginate).toHaveBeenCalledTimes(2);
    });
    
    it('should batch repository requests for app auth', async () => {
      const repos = Array.from({ length: 50 }, (_, i) => `owner/repo${i}`);
      (mockClient.paginate as any).mockResolvedValue([]);
      
      await fetchCommitsForRepositories(mockClient, 'app', repos, '2023-01-01', '2023-12-31');
      
      // Should fetch commits for all 50 repositories, with batching handled in parallel
      expect(mockClient.paginate).toHaveBeenCalledTimes(50);
    });
    
    it('should handle empty repository list', async () => {
      const result = await fetchCommitsForRepositories(mockClient, 'oauth', [], '2023-01-01', '2023-12-31');
      
      expect(result).toEqual([]);
      expect(mockClient.paginate).not.toHaveBeenCalled();
    });
    
    it('should handle repository processing errors', async () => {
      (mockClient.paginate as any).mockRejectedValue(new Error('API error'));
      
      const result = await fetchCommitsForRepositories(
        mockClient, 
        'oauth',
        ['owner/repo1'], 
        '2023-01-01', 
        '2023-12-31'
      );
      
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
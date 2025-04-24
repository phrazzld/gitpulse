/**
 * Tests for the GitHub commits module
 */

// Test type declarations
declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect(actual: any): any;
declare namespace jest {
  function resetModules(): void;
  function clearAllMocks(): void;
  function spyOn(object: any, methodName: string): any;
  function fn(implementation?: (...args: any[]) => any): any;
  function mock(moduleName: string, factory?: () => any): void;
}

import { 
  fetchRepositoryCommitsOAuth, 
  fetchRepositoryCommitsApp, 
  fetchRepositoryCommits,
  fetchCommitsForRepositories
} from '../commits';
import { createOAuthOctokit, getInstallationOctokit } from '../auth';
import { logger } from '@/lib/logger';

// Mock the dependencies
jest.mock('../auth', () => ({
  createOAuthOctokit: jest.fn(),
  getInstallationOctokit: jest.fn()
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('GitHub Commits Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    it('should call createOAuthOctokit with the correct token', async () => {
      // Set up mock octokit instance
      const mockOctokit = {
        paginate: jest.fn().mockResolvedValue([
          { sha: '123abc', commit: { message: 'Test commit' }, html_url: 'https://github.com/test/repo/commit/123abc' }
        ]),
        rest: { repos: { listCommits: jest.fn() } }
      };
      
      (createOAuthOctokit as any).mockReturnValue(mockOctokit);
      
      await fetchRepositoryCommitsOAuth('test-token', 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(createOAuthOctokit).toHaveBeenCalledWith('test-token');
      expect(mockOctokit.paginate).toHaveBeenCalled();
    });
    
    it('should add repository information to each commit', async () => {
      const mockCommits = [
        { sha: '123abc', commit: { message: 'Test commit 1' }, html_url: 'https://github.com/test/repo/commit/123abc' },
        { sha: '456def', commit: { message: 'Test commit 2' }, html_url: 'https://github.com/test/repo/commit/456def' }
      ];
      
      const mockOctokit = {
        paginate: jest.fn().mockResolvedValue(mockCommits),
        rest: { repos: { listCommits: jest.fn() } }
      };
      
      (createOAuthOctokit as any).mockReturnValue(mockOctokit);
      
      const result = await fetchRepositoryCommitsOAuth('test-token', 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(result.length).toBe(2);
      expect(result[0].repository).toEqual({ full_name: 'owner/repo' });
      expect(result[1].repository).toEqual({ full_name: 'owner/repo' });
    });
    
    it('should return empty array on error', async () => {
      const mockOctokit = {
        paginate: jest.fn().mockRejectedValue(new Error('API error')),
        rest: { repos: { listCommits: jest.fn() } }
      };
      
      (createOAuthOctokit as any).mockReturnValue(mockOctokit);
      
      const result = await fetchRepositoryCommitsOAuth('test-token', 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('fetchRepositoryCommitsApp', () => {
    it('should call getInstallationOctokit with the installation ID', async () => {
      // Set up mock octokit instance
      const mockOctokit = {
        paginate: jest.fn().mockResolvedValue([]),
        rest: { repos: { listCommits: jest.fn() } }
      };
      
      (getInstallationOctokit as any).mockResolvedValue(mockOctokit);
      
      await fetchRepositoryCommitsApp(12345, 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      expect(getInstallationOctokit).toHaveBeenCalledWith(12345);
    });
  });

  describe('fetchRepositoryCommits', () => {
    it('should call fetchRepositoryCommitsApp when installation ID is provided', async () => {
      // Set up mock for getInstallationOctokit and octokit
      const mockOctokit = {
        paginate: jest.fn().mockResolvedValue([]),
        rest: { repos: { listCommits: jest.fn() } }
      };
      
      (getInstallationOctokit as any).mockResolvedValue(mockOctokit);
      
      await fetchRepositoryCommits('token', 12345, 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      // Verify getInstallationOctokit was called (indicating fetchRepositoryCommitsApp was used)
      expect(getInstallationOctokit).toHaveBeenCalledWith(12345);
      
      // Verify the logger shows we're using GitHub App installation
      expect(logger.info).toHaveBeenCalledWith(
        'github:commits',
        'Using GitHub App installation for commit access',
        { installationId: 12345 }
      );
    });
    
    it('should call fetchRepositoryCommitsOAuth when only access token is provided', async () => {
      // Set up mock for createOAuthOctokit and octokit
      const mockOctokit = {
        paginate: jest.fn().mockResolvedValue([]),
        rest: { repos: { listCommits: jest.fn() } }
      };
      
      (createOAuthOctokit as any).mockReturnValue(mockOctokit);
      
      await fetchRepositoryCommits('token', undefined, 'owner', 'repo', '2023-01-01', '2023-12-31');
      
      // Verify createOAuthOctokit was called (indicating fetchRepositoryCommitsOAuth was used)
      expect(createOAuthOctokit).toHaveBeenCalledWith('token');
      
      // Verify the logger shows we're using OAuth
      expect(logger.info).toHaveBeenCalledWith(
        'github:commits',
        'Using OAuth token for commit access'
      );
    });
    
    it('should throw error when no authentication is provided', async () => {
      await expect(fetchRepositoryCommits(undefined, undefined, 'owner', 'repo')).rejects.toThrow(
        'No GitHub authentication available'
      );
    });
  });

  describe('fetchCommitsForRepositories', () => {
    it('should call fetchRepositoryCommits for each repository', async () => {
      // Create spies for fetchRepositoryCommits
      const fetchSpy = jest.spyOn(await import('../commits'), 'fetchRepositoryCommits')
        .mockResolvedValue([]);
      
      await fetchCommitsForRepositories('token', undefined, ['owner1/repo1', 'owner2/repo2'], '2023-01-01', '2023-12-31');
      
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(fetchSpy).toHaveBeenCalledWith('token', undefined, 'owner1', 'repo1', '2023-01-01', '2023-12-31', undefined);
      expect(fetchSpy).toHaveBeenCalledWith('token', undefined, 'owner2', 'repo2', '2023-01-01', '2023-12-31', undefined);
    });
    
    it('should try fallback approaches when no commits are found with the provided author', async () => {
      const fetchSpy = jest.spyOn(await import('../commits'), 'fetchRepositoryCommits');
      
      // First call returns empty array (no commits found with author)
      fetchSpy.mockResolvedValueOnce([]);
      // Second call with fallback author returns commits
      fetchSpy.mockResolvedValueOnce([
        { sha: '123abc', commit: { message: 'Test commit' }, repository: { full_name: 'owner/repo' } }
      ] as any);
      
      const result = await fetchCommitsForRepositories(
        'token', 
        undefined, 
        ['owner/repo'], 
        '2023-01-01', 
        '2023-12-31',
        'non-existent-author'
      );
      
      expect(result.length).toBe(1);
      expect(logger.info).toHaveBeenCalledWith(
        'github:commits',
        'No commits found with provided author name; retrying with the repo owner as author'
      );
    });
    
    it('should throw error when no authentication is provided', async () => {
      await expect(fetchCommitsForRepositories()).rejects.toThrow(
        'No GitHub authentication available'
      );
    });
  });
});
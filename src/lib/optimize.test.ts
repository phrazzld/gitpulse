/**
 * Tests for the optimize.ts module with a focus on naming convention standardization
 */
import {
  MinimalRepository,
  MinimalCommit,
  MinimalContributor,
  ContributorLike,
  optimizeRepository,
  optimizeCommit,
  optimizeContributor
} from './optimize';

describe('optimize.ts module with camelCase naming conventions', () => {
  
  describe('optimizeRepository', () => {
    it('should convert Repository to MinimalRepository with camelCase properties', () => {
      // Mock GitHub API Repository object with snake_case properties
      const mockRepo = {
        id: 123,
        name: 'test-repo',
        full_name: 'owner/test-repo',
        owner: {
          login: 'owner'
        },
        private: false,
        language: 'TypeScript',
        html_url: 'https://github.com/owner/test-repo',
        description: 'A test repository'
      };

      // Expected result with camelCase properties
      const result = optimizeRepository(mockRepo);

      // Assert correct property conversion
      expect(result.id).toBe(123);
      expect(result.name).toBe('test-repo');
      expect(result.fullName).toBe('owner/test-repo'); // camelCase
      expect(result.ownerLogin).toBe('owner'); // camelCase
      expect(result.private).toBe(false);
      expect(result.language).toBe('TypeScript');
      expect(result.htmlUrl).toBe('https://github.com/owner/test-repo'); // camelCase
    });

    it('should handle null language correctly', () => {
      const mockRepo = {
        id: 456,
        name: 'no-language',
        full_name: 'owner/no-language',
        owner: {
          login: 'owner'
        },
        private: true,
        language: null,
        html_url: 'https://github.com/owner/no-language',
        description: null
      };

      const result = optimizeRepository(mockRepo);
      
      expect(result.language).toBeNull();
    });
  });

  describe('optimizeCommit', () => {
    it('should convert Commit to MinimalCommit with camelCase properties', () => {
      // Mock GitHub API Commit object with snake_case properties
      const mockCommit = {
        sha: 'abc123',
        commit: {
          message: 'Test commit',
          author: {
            name: 'Test User',
            date: '2023-01-01T00:00:00Z'
          }
        },
        author: {
          login: 'testuser',
          avatar_url: 'https://avatar.url'
        },
        html_url: 'https://github.com/owner/repo/commit/abc123',
        repository: {
          full_name: 'owner/repo'
        }
      };

      // Expected result with camelCase properties
      const result = optimizeCommit(mockCommit);

      // Assert correct property conversion
      expect(result.sha).toBe('abc123');
      expect(result.message).toBe('Test commit');
      expect(result.authorName).toBe('Test User'); // camelCase
      expect(result.authorDate).toBe('2023-01-01T00:00:00Z'); // camelCase
      expect(result.authorLogin).toBe('testuser'); // camelCase
      expect(result.authorAvatar).toBe('https://avatar.url'); // camelCase
      expect(result.repoName).toBe('owner/repo'); // camelCase
      expect(result.htmlUrl).toBe('https://github.com/owner/repo/commit/abc123'); // camelCase
    });

    it('should handle missing author and repository information', () => {
      // Mock GitHub API Commit object with minimal properties
      const mockCommit = {
        sha: 'def456',
        commit: {
          message: 'Test commit'
        },
        html_url: 'https://github.com/owner/repo/commit/def456'
      };

      const result = optimizeCommit(mockCommit as any);
      
      expect(result.sha).toBe('def456');
      expect(result.message).toBe('Test commit');
      expect(result.authorName).toBe('Unknown');
      expect(typeof result.authorDate).toBe('string'); // Should default to current date
    });
  });

  describe('optimizeContributor', () => {
    it('should convert snake_case ContributorLike properties to camelCase', () => {
      // Mock contributor with snake_case properties
      const mockContributor: ContributorLike = {
        login: 'testuser',
        name: 'Test User',
        avatar_url: 'https://avatar.url',
        commit_count: 42
      };

      // Expected result with camelCase properties
      const result = optimizeContributor(mockContributor);

      // Assert correct property conversion
      expect(result.username).toBe('testuser');
      expect(result.displayName).toBe('Test User'); // camelCase
      expect(result.avatarUrl).toBe('https://avatar.url'); // camelCase
      expect(result.commitCount).toBe(42); // camelCase
    });

    it('should convert camelCase ContributorLike properties correctly', () => {
      // Mock contributor with camelCase properties
      const mockContributor: ContributorLike = {
        username: 'testuser',
        displayName: 'Test User',
        avatarUrl: 'https://avatar.url',
        commitCount: 42
      };

      // Expected result with camelCase properties
      const result = optimizeContributor(mockContributor);

      // Assert correct property conversion
      expect(result.username).toBe('testuser');
      expect(result.displayName).toBe('Test User'); 
      expect(result.avatarUrl).toBe('https://avatar.url');
      expect(result.commitCount).toBe(42);
    });

    it('should handle mixed case properties and provide fallbacks', () => {
      // Mock contributor with mixed property styles
      const mockContributor: ContributorLike = {
        username: 'testuser',
        avatar_url: 'https://avatar.url', // snake_case
        commitCount: 42 // camelCase
      };

      // Expected result with camelCase properties
      const result = optimizeContributor(mockContributor);

      // Assert correct property conversion and fallbacks
      expect(result.username).toBe('testuser');
      expect(result.displayName).toBe('testuser'); // Falls back to username
      expect(result.avatarUrl).toBe('https://avatar.url'); // Converts from snake_case
      expect(result.commitCount).toBe(42); // Uses camelCase directly
    });
  });
});
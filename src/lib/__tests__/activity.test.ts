import { transformApiCommit, prepareActivityCommit, formatActivityCommits } from '../activity';
import { ActivityCommit } from '@/components/ActivityFeed';

describe('activity.ts transformation functions', () => {
  // Sample input data with snake_case properties (simulating GitHub API response)
  const mockApiCommit = {
    sha: 'abc123',
    html_url: 'https://github.com/org/repo/commit/abc123',
    commit: {
      message: 'Test commit message',
      author: {
        name: 'Test User',
        date: '2023-01-01T00:00:00Z'
      }
    },
    repository: {
      name: 'repo',
      full_name: 'org/repo',
      html_url: 'https://github.com/org/repo'
    },
    contributor: {
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png'
    }
  };

  // Sample input data with camelCase properties (could come from internal transformation)
  const mockCamelCaseCommit = {
    sha: 'abc123',
    htmlUrl: 'https://github.com/org/repo/commit/abc123',
    commit: {
      message: 'Test commit message',
      author: {
        name: 'Test User',
        date: '2023-01-01T00:00:00Z'
      }
    },
    repository: {
      name: 'repo',
      fullName: 'org/repo',
      htmlUrl: 'https://github.com/org/repo'
    },
    contributor: {
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png'
    }
  };

  // Sample input with mixed properties (simulating real-world data)
  const mockMixedCommit = {
    sha: 'abc123',
    html_url: 'https://github.com/org/repo/commit/abc123', // snake_case
    commit: {
      message: 'Test commit message',
      author: {
        name: 'Test User',
        date: '2023-01-01T00:00:00Z'
      }
    },
    repository: {
      name: 'repo',
      fullName: 'org/repo', // camelCase
      html_url: 'https://github.com/org/repo' // snake_case
    },
    contributor: {
      username: 'testuser',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png'
    }
  };

  describe('transformApiCommit', () => {
    it('should transform snake_case properties to camelCase', () => {
      const result = transformApiCommit(mockApiCommit);

      // Ensure properties are transformed correctly
      expect(result.sha).toBe(mockApiCommit.sha);
      expect(result.htmlUrl).toBe(mockApiCommit.html_url);
      
      // Test nested property transformation
      expect(result.repository?.name).toBe(mockApiCommit.repository.name);
      expect(result.repository?.fullName).toBe(mockApiCommit.repository.full_name);
      expect(result.repository?.htmlUrl).toBe(mockApiCommit.repository.html_url);
    });

    it('should handle missing properties gracefully', () => {
      const incompleteCommit = { 
        sha: 'def456',
        commit: {
          message: 'Incomplete commit',
          author: null
        }
      };

      const result = transformApiCommit(incompleteCommit);

      expect(result.sha).toBe('def456');
      expect(result.htmlUrl).toBeUndefined();
      expect(result.repository).toBeUndefined();
    });

    it('should handle mixed property naming', () => {
      const result = transformApiCommit(mockMixedCommit);

      expect(result.htmlUrl).toBe(mockMixedCommit.html_url);
      expect(result.repository?.fullName).toBe(mockMixedCommit.repository.fullName);
    });
  });

  describe('prepareActivityCommit', () => {
    it('should transform camelCase properties to ActivityCommit format', () => {
      const internalCommit = transformApiCommit(mockApiCommit);
      const result = prepareActivityCommit(internalCommit);

      // Ensure the result matches the ActivityCommit type structure
      expect(result.sha).toBe(mockApiCommit.sha);
      expect(result.html_url).toBe(mockApiCommit.html_url);
      
      // Check nested properties
      expect(result.repository?.name).toBe(mockApiCommit.repository.name);
      expect(result.repository?.full_name).toBe(mockApiCommit.repository.full_name);
      expect(result.repository?.html_url).toBe(mockApiCommit.repository.html_url);
    });

    it('should handle missing properties gracefully', () => {
      const incompleteInternalCommit = transformApiCommit({
        sha: 'def456',
        commit: {
          message: 'Incomplete commit',
          author: null
        }
      });

      const result = prepareActivityCommit(incompleteInternalCommit);

      expect(result.sha).toBe('def456');
      expect(result.html_url).toBeUndefined();
      expect(result.repository).toBeUndefined();
    });
  });

  describe('formatActivityCommits', () => {
    it('should handle an array of snake_case commits', () => {
      const commits = [mockApiCommit, mockApiCommit];
      const result = formatActivityCommits(commits);

      expect(result.length).toBe(2);
      expect(result[0].sha).toBe(mockApiCommit.sha);
      expect(result[0].html_url).toBe(mockApiCommit.html_url);
      expect(result[0].repository?.full_name).toBe(mockApiCommit.repository.full_name);
    });

    it('should handle an array of camelCase commits', () => {
      const commits = [mockCamelCaseCommit, mockCamelCaseCommit];
      const result = formatActivityCommits(commits);

      expect(result.length).toBe(2);
      expect(result[0].sha).toBe(mockCamelCaseCommit.sha);
      expect(result[0].html_url).toBe(mockCamelCaseCommit.htmlUrl);
      expect(result[0].repository?.full_name).toBe(mockCamelCaseCommit.repository.fullName);
    });

    it('should handle an array of mixed property naming', () => {
      const commits = [mockApiCommit, mockCamelCaseCommit, mockMixedCommit];
      const result = formatActivityCommits(commits);

      expect(result.length).toBe(3);
      
      // First commit (snake_case)
      expect(result[0].html_url).toBe(mockApiCommit.html_url);
      
      // Second commit (camelCase)
      expect(result[1].html_url).toBe(mockCamelCaseCommit.htmlUrl);
      
      // Third commit (mixed)
      expect(result[2].html_url).toBe(mockMixedCommit.html_url);
    });

    it('should handle empty arrays', () => {
      const result = formatActivityCommits([]);
      expect(result).toEqual([]);
    });

    it('should handle non-array inputs', () => {
      // @ts-ignore - Testing runtime behavior with invalid input
      const result = formatActivityCommits(null);
      expect(result).toEqual([]);
      
      // @ts-ignore - Testing runtime behavior with invalid input
      const result2 = formatActivityCommits({});
      expect(result2).toEqual([]);
    });
  });
});
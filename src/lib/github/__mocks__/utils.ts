/**
 * Mock for the GitHub utils module
 * 
 * This provides mock implementations of GitHub API utility functions
 * to prevent test failures when using Octokit with ESM imports.
 */

// Mock function for extractAuthorMetadata
export const extractAuthorMetadata = jest.fn(
  (commit: any) => {
    return {
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      date: '2023-01-01T00:00:00Z'
    };
  }
);

// Mock function for extractCommitMetadata
export const extractCommitMetadata = jest.fn(
  (commit: any) => {
    return {
      sha: '1234567890abcdef',
      message: 'Test commit message',
      url: 'https://github.com/example/repo/commit/1234567890abcdef',
      repoName: 'example/repo'
    };
  }
);
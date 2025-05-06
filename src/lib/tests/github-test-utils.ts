/**
 * GitHub Testing Utilities
 *
 * This module provides standardized mocking utilities for GitHub-related tests.
 * It offers factory functions to create mock data objects and helper functions
 * to set up and clean up GitHub module mocks.
 */

import { jest } from '@jest/globals';
import { AppInstallation, Commit, Repository } from '../github/types';

// Type definitions for mock factories
export type MockFactory<T> = (overrides?: Partial<T>) => T;

/**
 * Creates a mock GitHub commit
 * @param overrides - Optional properties to override defaults
 * @returns A mock commit object
 */
export const createMockCommit: MockFactory<Commit> = (overrides = {}) => ({
  sha: 'abcdef1234567890',
  commit: {
    message: 'Test commit message',
    author: {
      name: 'Test User',
      email: 'test@example.com',
      date: '2023-01-01T00:00:00Z'
    }
  },
  html_url: 'https://github.com/org/repo/commit/abcdef1234567890',
  author: {
    login: 'testuser',
    avatar_url: 'https://github.com/testuser.png',
    name: 'Test User'
  },
  repository: {
    full_name: 'org/repo'
  },
  ...overrides
});

/**
 * Creates a mock GitHub repository
 * @param overrides - Optional properties to override defaults
 * @returns A mock repository object
 */
export const createMockRepository: MockFactory<Repository> = (overrides = {}) => ({
  id: 12345,
  name: 'repo',
  full_name: 'org/repo',
  private: false,
  owner: {
    login: 'org',
    avatar_url: 'https://github.com/org.png',
    type: 'Organization'
  },
  html_url: 'https://github.com/org/repo',
  description: 'Test repository',
  updated_at: '2023-01-01T00:00:00Z',
  language: 'TypeScript',
  ...overrides
});

/**
 * Creates a mock GitHub App installation
 * @param overrides - Optional properties to override defaults
 * @returns A mock installation object
 */
export const createMockInstallation: MockFactory<AppInstallation> = (overrides = {}) => ({
  id: 123456,
  account: {
    login: 'org',
    type: 'Organization',
    avatarUrl: 'https://github.com/org.png'
  },
  appSlug: 'gitpulse',
  appId: 12345,
  repositorySelection: 'all',
  targetType: 'Organization',
  ...overrides
});

/**
 * Sets up mock implementations for GitHub modules
 * @returns An object with all the mocked functions
 */
export const setupGitHubMocks = () => {
  // Store original modules for later restoration
  const originalModules = {
    auth: jest.requireActual('../github/auth'),
    commits: jest.requireActual('../github/commits'),
    repositories: jest.requireActual('../github/repositories'),
    utils: jest.requireActual('../github/utils'),
    index: jest.requireActual('../github')
  };

  // Create mock functions with default implementations
  const mockAuth = {
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    getAllAppInstallations: jest.fn().mockResolvedValue([createMockInstallation()]),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly  
    checkAppInstallation: jest.fn().mockResolvedValue(true),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    getInstallationOctokit: jest.fn().mockResolvedValue({}),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/123456'),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    createOAuthOctokit: jest.fn().mockReturnValue({}),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    validateOAuthToken: jest.fn().mockResolvedValue(true)
  };

  const mockCommits = {
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    fetchRepositoryCommitsOAuth: jest.fn().mockResolvedValue([createMockCommit()]),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    fetchRepositoryCommitsApp: jest.fn().mockResolvedValue([createMockCommit()]),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    fetchRepositoryCommits: jest.fn().mockResolvedValue([createMockCommit()]),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    fetchCommitsForRepositories: jest.fn().mockResolvedValue([createMockCommit()])
  };

  const mockRepositories = {
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    fetchUserRepositories: jest.fn().mockResolvedValue([createMockRepository()]),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    fetchInstallationRepositories: jest.fn().mockResolvedValue([createMockRepository()]),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    fetchOrganizationRepositories: jest.fn().mockResolvedValue([createMockRepository()]),
    // @ts-ignore - Work around TypeScript not handling jest.fn() return types properly
    getAllRepositories: jest.fn().mockResolvedValue([createMockRepository()])
  };

  const mockUtils = {
    extractAuthorMetadata: jest.fn().mockReturnValue({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      date: '2023-01-01T00:00:00Z'
    }),
    extractCommitMetadata: jest.fn().mockReturnValue({
      sha: 'abcdef1234567890',
      message: 'Test commit message',
      url: 'https://github.com/org/repo/commit/abcdef1234567890',
      repoName: 'org/repo'
    })
  };

  // Mock the modules
  jest.mock('../github/auth', () => mockAuth);
  jest.mock('../github/commits', () => mockCommits);
  jest.mock('../github/repositories', () => mockRepositories);
  jest.mock('../github/utils', () => mockUtils);
  jest.mock('../github', () => ({
    MODULE_NAME: 'github',
    ...mockCommits,
    ...mockRepositories,
    ...mockAuth,
    getInstallationManagementUrl: mockAuth.getInstallationManagementUrl
  }));

  return {
    mocks: {
      auth: mockAuth,
      commits: mockCommits,
      repositories: mockRepositories,
      utils: mockUtils
    },
    originals: originalModules,

    /**
     * Resets all mock functions
     */
    reset() {
      Object.values(mockAuth).forEach(mock => mock.mockClear());
      Object.values(mockCommits).forEach(mock => mock.mockClear());
      Object.values(mockRepositories).forEach(mock => mock.mockClear());
      Object.values(mockUtils).forEach(mock => mock.mockClear());
    },

    /**
     * Restores original modules (call in afterAll)
     */
    restore() {
      jest.unmock('../github/auth');
      jest.unmock('../github/commits');
      jest.unmock('../github/repositories');
      jest.unmock('../github/utils');
      jest.unmock('../github');
    }
  };
};

/**
 * Helper to create an array of mock commits
 * @param count - Number of commits to create
 * @param baseOverrides - Base overrides to apply to all commits
 * @returns Array of mock commits
 */
export const createMockCommits = (count: number, baseOverrides: Partial<Commit> = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockCommit({
      sha: `commit${index}`,
      ...baseOverrides,
    })
  );
};

/**
 * Helper to create an array of mock repositories
 * @param count - Number of repositories to create
 * @param baseOverrides - Base overrides to apply to all repositories
 * @returns Array of mock repositories
 */
export const createMockRepositories = (count: number, baseOverrides: Partial<Repository> = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockRepository({
      id: 12345 + index,
      name: `repo${index}`,
      full_name: `org/repo${index}`,
      ...baseOverrides,
    })
  );
};

/**
 * Helper to create an array of mock installations
 * @param count - Number of installations to create
 * @param baseOverrides - Base overrides to apply to all installations
 * @returns Array of mock installations
 */
export const createMockInstallations = (count: number, baseOverrides: Partial<AppInstallation> = {}) => {
  return Array.from({ length: count }, (_, index) => 
    createMockInstallation({
      id: 123456 + index,
      account: {
        login: `org${index}`,
        type: 'Organization',
        avatarUrl: `https://github.com/org${index}.png`
      },
      ...baseOverrides,
    })
  );
};
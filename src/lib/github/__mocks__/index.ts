/**
 * Mock for the GitHub index module
 * 
 * This provides mock implementations of GitHub API functions to prevent
 * test failures when using Octokit with ESM imports.
 */

import { Commit, Repository, AppInstallation } from '../types';

// Define mock functions that match the API of the GitHub module

export const MODULE_NAME = 'github';

// Mock repositories
export const mockRepositories: Repository[] = [
  {
    id: 1,
    full_name: 'org1/repo1',
    name: 'repo1',
    owner: { login: 'org1' },
    private: false,
    html_url: 'https://github.com/org1/repo1',
    description: 'Test repository 1'
  },
  {
    id: 2,
    full_name: 'org1/repo2',
    name: 'repo2',
    owner: { login: 'org1' },
    private: true,
    html_url: 'https://github.com/org1/repo2',
    description: 'Test repository 2'
  }
];

// Mock commits
export const mockCommits: Commit[] = [
  {
    sha: 'abc123',
    commit: {
      author: {
        name: 'Test User',
        email: 'test@example.com',
        date: '2023-01-01T12:00:00Z'
      },
      message: 'Test commit 1'
    },
    author: {
      login: 'testuser',
      avatar_url: 'https://avatars.githubusercontent.com/u/1234'
    },
    html_url: 'https://github.com/org1/repo1/commit/abc123',
    repository: { full_name: 'org1/repo1' }
  },
  {
    sha: 'def456',
    commit: {
      author: {
        name: 'Another User',
        email: 'another@example.com',
        date: '2023-01-02T12:00:00Z'
      },
      message: 'Test commit 2'
    },
    author: {
      login: 'anotheruser',
      avatar_url: 'https://avatars.githubusercontent.com/u/5678'
    },
    html_url: 'https://github.com/org1/repo2/commit/def456',
    repository: { full_name: 'org1/repo2' }
  }
];

// Mock installations
export const mockInstallations: AppInstallation[] = [
  {
    id: 101,
    account: { login: 'org1' },
    appSlug: 'test-app',
    appId: 12345,
    repositorySelection: 'all',
    targetType: 'Organization'
  },
  {
    id: 102,
    account: { login: 'org2' },
    appSlug: 'test-app',
    appId: 12345,
    repositorySelection: 'all',
    targetType: 'Organization'
  }
];

// Mock function for fetchCommitsForRepositories
export const fetchCommitsForRepositories = jest.fn(
  async (
    accessToken?: string, 
    installationId?: number, 
    repositories?: string[], 
    since?: string, 
    until?: string,
    author?: string
  ): Promise<Commit[]> => {
    return mockCommits;
  }
);

// Mock function for fetchUserRepositories
export const fetchUserRepositories = jest.fn(
  async (
    accessToken: string, 
    options?: { per_page?: number; page?: number }
  ): Promise<Repository[]> => {
    return mockRepositories;
  }
);

// Mock function for fetchInstallationRepositories
export const fetchInstallationRepositories = jest.fn(
  async (
    accessToken: string, 
    installationId: number, 
    options?: { per_page?: number; page?: number }
  ): Promise<Repository[]> => {
    return mockRepositories;
  }
);

// Mock function for getAllAppInstallations
export const getAllAppInstallations = jest.fn(
  async (
    accessToken: string
  ): Promise<AppInstallation[]> => {
    return mockInstallations;
  }
);

// Export fetchAllRepositories as well
export const fetchAllRepositories = jest.fn(
  async (
    accessToken?: string,
    installationId?: number
  ): Promise<Repository[]> => {
    return mockRepositories;
  }
);

// Mock function for checkAppInstallation
export const checkAppInstallation = jest.fn(
  async (
    accessToken: string, 
    installationId: number
  ): Promise<boolean> => {
    return true;
  }
);

// Mock function for getInstallationOctokit
export const getInstallationOctokit = jest.fn(
  async (
    accessToken: string, 
    installationId: number
  ): Promise<any> => {
    return {};
  }
);

// Mock function for getInstallationManagementUrl
export const getInstallationManagementUrl = jest.fn(
  (
    installationId: number, 
    accountLogin: string, 
    accountType: string
  ): string => {
    return accountType === 'Organization'
      ? `https://github.com/organizations/${accountLogin}/settings/installations/${installationId}`
      : `https://github.com/settings/installations/${installationId}`;
  }
);

// Mock function for createOAuthOctokit
export const createOAuthOctokit = jest.fn(
  (
    accessToken: string
  ): any => {
    return {};
  }
);

// Mock function for validateOAuthToken
export const validateOAuthToken = jest.fn(
  async (
    accessToken: string
  ): Promise<boolean> => {
    return true;
  }
);
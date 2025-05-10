/**
 * Type Definitions for GitHub Modules
 *
 * This file defines TypeScript interfaces for the GitHub modules
 * to provide proper typing for test mocks.
 */

// Mock type for Octokit to avoid direct dependency in tests
export type MockOctokit = Record<string, any>;
import { AppInstallation, Commit, Repository } from '../github/types';

/**
 * Interface for the GitHub Auth module
 */
export interface GitHubAuthModule {
  getAllAppInstallations: (options?: { 
    force?: boolean; 
    includeToken?: boolean; 
  }) => Promise<AppInstallation[]>;
  
  checkAppInstallation: (
    accessToken: string
  ) => Promise<number | null>;
  
  getInstallationOctokit: (
    installationId: number
  ) => Promise<MockOctokit>;
  
  getInstallationManagementUrl: (
    installationId: number
  ) => string;
  
  createOAuthOctokit: (
    accessToken: string
  ) => MockOctokit;
  
  validateOAuthToken: (
    accessToken: string
  ) => Promise<{ valid: boolean; user?: { login: string; name?: string; } }>;
}

/**
 * Interface for the GitHub Commits module
 */
export interface GitHubCommitsModule {
  fetchRepositoryCommitsOAuth: (
    octokit: MockOctokit,
    owner: string,
    repo: string,
    options?: { since?: string; until?: string; }
  ) => Promise<Commit[]>;
  
  fetchRepositoryCommitsApp: (
    installationOctokit: MockOctokit,
    owner: string,
    repo: string,
    options?: { since?: string; until?: string; }
  ) => Promise<Commit[]>;
  
  fetchRepositoryCommits: (
    owner: string,
    repo: string,
    options?: { 
      accessToken?: string;
      installationId?: number;
      since?: string;
      until?: string;
    }
  ) => Promise<Commit[]>;
  
  fetchCommitsForRepositories: (
    repositories: Repository[],
    options?: { 
      accessToken?: string;
      installationId?: number;
      since?: string;
      until?: string;
    }
  ) => Promise<Commit[]>;
}

/**
 * Interface for the GitHub Repositories module
 */
export interface GitHubRepositoriesModule {
  fetchUserRepositories: (
    octokit: MockOctokit,
    options?: { type?: string; sort?: string; }
  ) => Promise<Repository[]>;
  
  fetchInstallationRepositories: (
    installationOctokit: MockOctokit,
    options?: { type?: string; sort?: string; }
  ) => Promise<Repository[]>;
  
  fetchOrganizationRepositories: (
    octokit: MockOctokit,
    org: string,
    options?: { type?: string; sort?: string; }
  ) => Promise<Repository[]>;
  
  getAllRepositories: (
    options?: { 
      accessToken?: string;
      installationId?: number;
      organizations?: string[];
    }
  ) => Promise<Repository[]>;
}

/**
 * Interface for the GitHub Utils module
 */
export interface GitHubUtilsModule {
  extractAuthorMetadata: (commit: Commit) => {
    name: string;
    email: string | null;
    username: string | null;
    date: string;
  };
  
  extractCommitMetadata: (commit: Commit) => {
    sha: string;
    message: string;
    url: string | null;
    repoName: string | null;
  };
}

/**
 * Interface for the main GitHub module (combined functionality)
 */
export interface GitHubModule extends 
  GitHubCommitsModule, 
  GitHubRepositoriesModule, 
  Partial<GitHubAuthModule>, 
  Partial<GitHubUtilsModule> {
  MODULE_NAME: string;
}
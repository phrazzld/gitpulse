/**
 * Mock for the GitHub commits module
 * 
 * This provides mock implementations of GitHub API commit functions
 * to prevent test failures when using Octokit with ESM imports.
 */

import { Commit } from '../types';

// Mock function for fetchRepositoryCommitsOAuth
export const fetchRepositoryCommitsOAuth = jest.fn(
  async (
    accessToken: string,
    owner: string,
    repo: string,
    since: string,
    until: string,
    author?: string,
  ): Promise<Commit[]> => {
    return [];
  }
);

// Mock function for fetchRepositoryCommitsApp
export const fetchRepositoryCommitsApp = jest.fn(
  async (
    installationId: number,
    owner: string,
    repo: string,
    since: string,
    until: string,
    author?: string,
  ): Promise<Commit[]> => {
    return [];
  }
);

// Mock function for fetchRepositoryCommits
export const fetchRepositoryCommits = jest.fn(
  async (
    accessToken?: string,
    installationId?: number,
    owner: string = "",
    repo: string = "",
    since: string = "",
    until: string = "",
    author?: string,
  ): Promise<Commit[]> => {
    return [];
  }
);

// Mock function for fetchCommitsForRepositories
export const fetchCommitsForRepositories = jest.fn(
  async (
    accessToken?: string,
    installationId?: number,
    repositories: string[] = [],
    since: string = "",
    until: string = "",
    author?: string,
  ): Promise<Commit[]> => {
    return [];
  }
);
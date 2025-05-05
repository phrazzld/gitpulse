/**
 * Mock for the GitHub index module
 * 
 * This provides mock implementations of GitHub API functions to prevent
 * test failures when using Octokit with ESM imports.
 */

import { Commit, Repository, AppInstallation } from '../types';

// Define mock functions that match the API of the GitHub module

export const MODULE_NAME = 'github';

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
    return [];
  }
);

// Mock function for fetchUserRepositories
export const fetchUserRepositories = jest.fn(
  async (
    accessToken: string, 
    options?: { per_page?: number; page?: number }
  ): Promise<Repository[]> => {
    return [];
  }
);

// Mock function for fetchInstallationRepositories
export const fetchInstallationRepositories = jest.fn(
  async (
    accessToken: string, 
    installationId: number, 
    options?: { per_page?: number; page?: number }
  ): Promise<Repository[]> => {
    return [];
  }
);

// Mock function for getAllAppInstallations
export const getAllAppInstallations = jest.fn(
  async (
    accessToken: string
  ): Promise<AppInstallation[]> => {
    return [];
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
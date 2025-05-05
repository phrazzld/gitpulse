/**
 * Mock for the GitHub auth module
 * 
 * This provides mock implementations of GitHub API authentication functions
 * to prevent test failures when using Octokit with ESM imports.
 */

import { AppInstallation } from '../types';

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
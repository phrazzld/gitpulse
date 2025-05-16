/**
 * Mock for the GitHub repositories module
 * 
 * This provides mock implementations of GitHub API repository functions
 * to prevent test failures when using Octokit with ESM imports.
 */

import { Repository } from '../types';

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
    installationId: number, 
    options?: { per_page?: number; page?: number }
  ): Promise<Repository[]> => {
    return [];
  }
);

// Mock function for fetchOrganizationRepositories
export const fetchOrganizationRepositories = jest.fn(
  async (
    accessToken: string,
    organization: string,
    options?: { per_page?: number; page?: number }
  ): Promise<Repository[]> => {
    return [];
  }
);

// Mock function for getAllRepositories
export const getAllRepositories = jest.fn(
  async (
    accessToken?: string,
    installationId?: number,
    organizations?: string[]
  ): Promise<Repository[]> => {
    return [];
  }
);
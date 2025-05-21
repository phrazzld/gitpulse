/**
 * Mock for the GitHub repositories module
 * 
 * This provides mock implementations of GitHub API repository functions
 * to prevent test failures when using Octokit with ESM imports.
 */

import { Repository } from '../types';
import { IOctokitClient } from '../interfaces';

// Mock function for fetchAllRepositoriesOAuth
export const fetchAllRepositoriesOAuth = jest.fn(
  async (client: IOctokitClient): Promise<Repository[]> => {
    return [];
  }
);

// Mock function for fetchAllRepositoriesApp
export const fetchAllRepositoriesApp = jest.fn(
  async (client: IOctokitClient): Promise<Repository[]> => {
    return [];
  }
);

// Mock function for fetchAllRepositories
export const fetchAllRepositories = jest.fn(
  async (
    client: IOctokitClient,
    authMethod: 'oauth' | 'app'
  ): Promise<Repository[]> => {
    return [];
  }
);

// Add aliases for backward compatibility
export const fetchInstallationRepositories = fetchAllRepositoriesApp;
export const fetchOrganizationRepositories = fetchAllRepositoriesOAuth;
export const fetchUserRepositories = fetchAllRepositoriesOAuth;
export const getAllRepositories = fetchAllRepositories;
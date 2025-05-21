/**
 * Test utilities for GitHub modules
 * This file is a helper module, not a test suite
 */

import { IOctokitClient } from '../interfaces';

// Create test globals
declare const jest: any;

/**
 * Creates a mock implementation of IOctokitClient with all required methods
 * @returns A fully mocked IOctokitClient
 */
export function createMockOctokitClient(): IOctokitClient {
  const mockPaginate: any = jest.fn();
  const mockGet: any = jest.fn().mockResolvedValue({
    data: { 
      resources: { 
        core: { 
          limit: 5000, 
          remaining: 4000, 
          reset: Math.floor(Date.now() / 1000) + 3600 
        } 
      } 
    },
    status: 200,
    headers: {}
  });
  
  const mockGetAuthenticated: any = jest.fn().mockResolvedValue({
    data: {
      login: 'testuser',
      id: 123,
      type: 'User'
    },
    status: 200,
    headers: {}
  });
  
  const mockList: any = jest.fn().mockResolvedValue({
    data: [],
    status: 200,
    headers: {}
  });
  
  const mockClient: IOctokitClient = {
    rest: {
      rateLimit: {
        get: mockGet
      },
      users: {
        getAuthenticated: mockGetAuthenticated
      },
      repos: {
        listForAuthenticatedUser: mockList,
        listForOrg: mockList,
        listCommits: mockList
      },
      orgs: {
        listForAuthenticatedUser: mockList
      },
      apps: {
        listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue({
          data: {
            installations: [],
            total_count: 0
          },
          status: 200,
          headers: {}
        }),
        listReposAccessibleToInstallation: jest.fn().mockResolvedValue({
          data: {
            repositories: [],
            total_count: 0
          },
          status: 200,
          headers: {}
        })
      }
    },
    paginate: mockPaginate
  };
  
  return mockClient;
}

/**
 * Type guard to check if an object has the shape of IOctokitClient
 */
export function isOctokitClient(obj: any): obj is IOctokitClient {
  return obj &&
    typeof obj === 'object' &&
    'rest' in obj &&
    'paginate' in obj &&
    typeof obj.rest === 'object' &&
    typeof obj.paginate === 'function';
}
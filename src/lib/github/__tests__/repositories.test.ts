/**
 * Tests for the GitHub repositories module
 */

// Test type declarations
declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect(actual: any): any;
declare namespace jest {
  function resetModules(): void;
  function clearAllMocks(): void;
  function spyOn(object: any, methodName: string): any;
  function fn(implementation?: (...args: any[]) => any): any;
  function mock(moduleName: string, factory?: () => any): void;
}

import { 
  fetchAllRepositoriesOAuth, 
  fetchAllRepositoriesApp, 
  fetchAllRepositories 
} from '../repositories';
import { getInstallationOctokit } from '../auth';
import { logger } from '@/lib/logger';

// Mock the dependencies
jest.mock('../auth', () => ({
  getInstallationOctokit: jest.fn()
}));

// Mock octokit directly
jest.mock('octokit', () => ({
  Octokit: jest.fn(() => ({
    rest: {
      rateLimit: {
        get: jest.fn().mockResolvedValue({
          data: { 
            resources: { 
              core: { 
                limit: 5000, 
                remaining: 4000, 
                reset: Math.floor(Date.now() / 1000) + 3600 
              } 
            } 
          },
          headers: {}
        })
      },
      users: {
        getAuthenticated: jest.fn().mockResolvedValue({
          data: { login: 'testuser', id: 123, type: 'User' },
          headers: { 'x-oauth-scopes': 'repo, read:org' }
        })
      },
      repos: {
        listForAuthenticatedUser: jest.fn()
      },
      orgs: {
        listForAuthenticatedUser: jest.fn()
      },
      apps: {
        listReposAccessibleToInstallation: jest.fn()
      }
    },
    paginate: jest.fn().mockResolvedValue([])
  }))
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('GitHub Repositories Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Function exports', () => {
    it('should export fetchAllRepositoriesOAuth function', () => {
      expect(typeof fetchAllRepositoriesOAuth).toBe('function');
    });
    
    it('should export fetchAllRepositoriesApp function', () => {
      expect(typeof fetchAllRepositoriesApp).toBe('function');
    });
    
    it('should export fetchAllRepositories function', () => {
      expect(typeof fetchAllRepositories).toBe('function');
    });
  });

  describe('fetchAllRepositoriesOAuth', () => {
    it('should call Octokit with correct auth token', async () => {
      const mockOctokit = require('octokit').Octokit();
      // Set up a successful return for paginate
      mockOctokit.paginate.mockResolvedValue([
        { id: 1, name: 'repo1', full_name: 'owner/repo1', private: false }
      ]);
      
      await fetchAllRepositoriesOAuth('test-token');
      
      // Verify Octokit was called with the token
      expect(require('octokit').Octokit).toHaveBeenCalledWith({ 
        auth: 'test-token' 
      });
    });
    
    it('should throw an error when token lacks repo scope', async () => {
      // Get the mock and modify it for this test
      const { Octokit } = require('octokit');
      const mockInstance = new Octokit();
      
      // Override the getAuthenticated method to return a token without 'repo' scope
      mockInstance.rest.users.getAuthenticated.mockResolvedValue({
        data: { login: 'testuser' },
        headers: { 'x-oauth-scopes': 'read:user' }  // Missing 'repo' scope
      });
      
      // Make sure the constructor returns our modified instance
      Octokit.mockReturnValue(mockInstance);
      
      await expect(fetchAllRepositoriesOAuth('token')).rejects.toThrow(
        "GitHub token is missing 'repo' scope. Please re-authenticate with the necessary permissions."
      );
    });
  });

  describe('fetchAllRepositoriesApp', () => {
    it('should call getInstallationOctokit with correct installation ID', async () => {
      // Setup mock for getInstallationOctokit
      const mockOctokit = {
        rest: {
          rateLimit: { 
            get: jest.fn().mockResolvedValue({
              data: { resources: { core: { limit: 5000, remaining: 4000, reset: 123456789 } } },
              headers: {}
            })
          },
          apps: {
            listReposAccessibleToInstallation: jest.fn()
          }
        },
        paginate: jest.fn().mockResolvedValue([])
      };
      
      (getInstallationOctokit as any).mockResolvedValue(mockOctokit);
      
      await fetchAllRepositoriesApp(12345);
      
      // Verify getInstallationOctokit was called with the correct ID
      expect(getInstallationOctokit).toHaveBeenCalledWith(12345);
    });
  });

  describe('fetchAllRepositories', () => {
    it('should call fetchAllRepositoriesApp when installationId is provided', async () => {
      // Since we can't easily spy on imported functions, we'll verify the result
      // by mocking the appropriate dependencies and check the logger calls
      const mockInstallationOctokit = {
        rest: {
          rateLimit: { 
            get: jest.fn().mockResolvedValue({
              data: { resources: { core: { limit: 5000, remaining: 4000, reset: 123456789 } } },
              headers: {}
            })
          },
          apps: {
            listReposAccessibleToInstallation: jest.fn()
          }
        },
        paginate: jest.fn().mockResolvedValue([])
      };
      
      (getInstallationOctokit as any).mockResolvedValue(mockInstallationOctokit);
      
      await fetchAllRepositories('token', 12345);
      
      // Verify getInstallationOctokit was called (indicating fetchAllRepositoriesApp was used)
      expect(getInstallationOctokit).toHaveBeenCalledWith(12345);
      // Verify the logger shows we're using GitHub App installation
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        "Using GitHub App installation for repository access",
        { installationId: 12345 }
      );
    });

    it('should call fetchAllRepositoriesOAuth when only accessToken is provided', async () => {
      // Set up the mock with proper scopes for this test
      const { Octokit } = require('octokit');
      const mockInstance = {
        rest: {
          rateLimit: {
            get: jest.fn().mockResolvedValue({
              data: { 
                resources: { 
                  core: { 
                    limit: 5000, 
                    remaining: 4000, 
                    reset: Math.floor(Date.now() / 1000) + 3600 
                  } 
                } 
              },
              headers: {}
            })
          },
          users: {
            getAuthenticated: jest.fn().mockResolvedValue({
              data: { login: 'testuser', id: 123, type: 'User' },
              headers: { 'x-oauth-scopes': 'repo, read:org' }  // Has proper scopes
            })
          },
          repos: {
            listForAuthenticatedUser: jest.fn()
          },
          orgs: {
            listForAuthenticatedUser: jest.fn()
          },
          apps: {
            listReposAccessibleToInstallation: jest.fn()
          }
        },
        paginate: jest.fn().mockResolvedValue([])
      };
      
      Octokit.mockReturnValue(mockInstance);
      
      await fetchAllRepositories('token');
      
      // Verify Octokit was created with the token (indicating fetchAllRepositoriesOAuth was used)
      expect(Octokit).toHaveBeenCalledWith({ auth: 'token' });
      // Verify the logger shows we're using OAuth
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        "Using OAuth token for repository access"
      );
    });

    it('should throw error when no authentication is provided', async () => {
      await expect(fetchAllRepositories()).rejects.toThrow(
        "No GitHub authentication available"
      );
    });
  });
});
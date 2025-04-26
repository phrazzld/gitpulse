/**
 * Tests for the GitHub repositories module
 *
 * This test suite verifies the GitHub repository fetching functionality
 * of the application, including error handling, authentication methods,
 * and pagination.
 */

// Test type declarations for TypeScript
declare function describe(name: string, fn: () => void): void
declare function beforeEach(fn: () => void): void
declare function afterEach(fn: () => void): void
declare function it(name: string, fn: () => void): void
declare function expect(actual: any): any
declare namespace jest {
  function resetModules(): void
  function clearAllMocks(): void
  function spyOn(object: any, methodName: string): any
  function fn(implementation?: (...args: any[]) => any): any
  function mock(moduleName: string, factory?: () => any): void
  // Mock type
  type MockedFunction<T extends (...args: any[]) => any> = {
    (...args: Parameters<T>): ReturnType<T>
    mockReturnValue: (value: ReturnType<T>) => MockedFunction<T>
    mockResolvedValue: (value: Awaited<ReturnType<T>>) => MockedFunction<T>
    mockRejectedValue: (reason?: any) => MockedFunction<T>
    mockImplementation: (fn: T) => MockedFunction<T>
  }
  
  // Add support for expect.objectContaining and other specialized matchers
  interface Expect {
    objectContaining(obj: object): any;
    any(constructor: any): any;
  }
  // Extend expect for TypeScript
  interface Matchers<R> {
    toHaveBeenCalledWith(...args: any[]): R;
  }
}

import {
  fetchAllRepositoriesOAuth,
  fetchAllRepositoriesApp,
  fetchAllRepositories,
} from '../repositories'
import { getInstallationOctokit } from '../auth'
import { logger } from '@/lib/logger'
import { Octokit } from 'octokit'
import { Repository } from '../types'

// Mock the dependencies
jest.mock('../auth', () => ({
  getInstallationOctokit: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Sample repository data for tests
const sampleRepositories: Partial<Repository>[] = [
  { id: 1, name: 'repo1', full_name: 'owner/repo1', private: false },
  { id: 2, name: 'repo2', full_name: 'owner/repo2', private: true },
  { id: 3, name: 'repo3', full_name: 'another-org/repo3', private: false },
]

// Sample organization data
const sampleOrgs = [
  { login: 'org1', id: 101 },
  { login: 'org2', id: 102 },
]

// Test-specific Octokit mock with configurable behavior
class MockOctokit {
  rest: any;
  paginate: any;
  
  constructor(options: any = {}) {
    // Default success state with required fields
    this.rest = {
      rateLimit: {
        get: jest.fn().mockResolvedValue({
          data: {
            resources: {
              core: {
                limit: 5000,
                remaining: 4000,
                reset: Math.floor(Date.now() / 1000) + 3600,
              },
            },
          },
          headers: {},
        }),
      },
      users: {
        getAuthenticated: jest.fn().mockResolvedValue({
          data: { login: 'testuser', id: 123, type: 'User', two_factor_authentication: true },
          headers: { 'x-oauth-scopes': 'repo, read:org' },
        }),
      },
      repos: {
        listForAuthenticatedUser: jest.fn(),
      },
      orgs: {
        listForAuthenticatedUser: jest.fn().mockResolvedValue([]),
        listForOrg: jest.fn(),
      },
      apps: {
        listReposAccessibleToInstallation: jest.fn(),
      },
    };
    
    this.paginate = jest.fn().mockResolvedValue([...sampleRepositories]);
  }
  
  // Chainable configuration methods for easier test setup
  withLowRateLimit() {
    this.rest.rateLimit.get = jest.fn().mockResolvedValue({
      data: {
        resources: {
          core: {
            limit: 5000,
            remaining: 50, // Low remaining calls
            reset: Math.floor(Date.now() / 1000) + 3600,
          },
        },
      },
      headers: {},
    });
    return this;
  }
  
  withRateLimitError() {
    this.rest.rateLimit.get = jest.fn().mockRejectedValue(
      new Error('Rate limit error')
    );
    return this;
  }
  
  withMissingRepoScope() {
    // Override the paginate method to never be called (as the function should throw earlier)
    this.paginate = jest.fn();
    
    // Must use a function that properly simulates the headers object from the GitHub API
    this.rest.users.getAuthenticated = jest.fn().mockResolvedValue({
      data: { login: 'testuser', id: 123, type: 'User' },
      headers: { 'x-oauth-scopes': 'read:user' }, // Missing repo scope
    });
    return this;
  }
  
  withMissingReadOrgScope() {
    this.rest.users.getAuthenticated = jest.fn().mockResolvedValue({
      data: { login: 'testuser', id: 123, type: 'User' },
      headers: { 'x-oauth-scopes': 'repo' }, // Missing read:org scope
    });
    return this;
  }
  
  withUserInfoError() {
    this.rest.users.getAuthenticated = jest.fn().mockRejectedValue(
      new Error('User info error')
    );
    return this;
  }
  
  withOrganizations(orgs = sampleOrgs) {
    this.rest.orgs.listForAuthenticatedUser = jest.fn();
    this.paginate.mockImplementation((method, options) => {
      if (method === this.rest.orgs.listForAuthenticatedUser) {
        return Promise.resolve(orgs);
      }
      return Promise.resolve([...sampleRepositories]);
    });
    return this;
  }
  
  withOrgReposError(orgName: string) {
    const originalPaginate = this.paginate;
    this.paginate = jest.fn().mockImplementation((method: any, options: any): Promise<any> => {
      if (method === this.rest.repos.listForOrg && options.org === orgName) {
        return Promise.reject(new Error(`Error fetching repos for org: ${orgName}`));
      }
      return originalPaginate(method, options);
    });
    return this;
  }
  
  withOrgListError() {
    this.paginate = jest.fn().mockImplementation((method: any, options: any): Promise<any> => {
      if (method === this.rest.orgs.listForAuthenticatedUser) {
        return Promise.reject(new Error('Error listing organizations'));
      }
      return Promise.resolve([...sampleRepositories]);
    });
    return this;
  }
  
  withApiError() {
    this.paginate = jest.fn().mockRejectedValue(new Error('API error'));
    return this;
  }
  
  withDuplicateRepos() {
    // Create duplicate repos with the same full_name
    const repos = [
      ...sampleRepositories,
      ...sampleRepositories.map(r => ({ ...r })), // Duplicates
    ];
    this.paginate = jest.fn().mockResolvedValue(repos);
    return this;
  }

  // Special case for org repos vs user repos
  withMixedRepos() {
    const originalPaginate = jest.fn();
    
    // Main user repos
    originalPaginate.mockImplementationOnce(() => 
      Promise.resolve([
        { id: 1, name: 'repo1', full_name: 'owner/repo1', private: false },
        { id: 2, name: 'repo2', full_name: 'owner/repo2', private: true },
      ])
    );
    
    // Org list
    originalPaginate.mockImplementationOnce(() => 
      Promise.resolve(sampleOrgs)
    );
    
    // First org repos
    originalPaginate.mockImplementationOnce(() => 
      Promise.resolve([
        { id: 3, name: 'repo3', full_name: 'org1/repo3', private: false },
      ])
    );
    
    // Second org repos
    originalPaginate.mockImplementationOnce(() => 
      Promise.resolve([
        { id: 4, name: 'repo4', full_name: 'org2/repo4', private: true },
        // Add a duplicate from user repos to test deduplication
        { id: 1, name: 'repo1', full_name: 'owner/repo1', private: false }, 
      ])
    );
    
    this.paginate = originalPaginate;
    return this;
  }

  withEmptyResponse() {
    this.paginate = jest.fn().mockResolvedValue([]);
    return this;
  }

  withNonArrayResponse() {
    // Simulate a weird API response that's not an array
    // This tests the type checking code in the repositories.ts module
    const originalPaginate = jest.fn();
    
    // Main repos call returns standard array
    originalPaginate.mockImplementationOnce(() => 
      Promise.resolve([...sampleRepositories])
    );
    
    // Org list returns single org
    originalPaginate.mockImplementationOnce(() => 
      Promise.resolve([{ login: 'org1', id: 101 }])
    );
    
    // First org repos returns non-array object
    originalPaginate.mockImplementationOnce(() => {
      // Return a single object instead of an array
      return Promise.resolve({ id: 999, name: 'single-repo', full_name: 'org1/single-repo' });
    });
    
    this.paginate = originalPaginate;
    return this;
  }
}

// Mock Octokit constructor
jest.mock('octokit', () => {
  return {
    Octokit: jest.fn().mockImplementation((options) => {
      return new MockOctokit(options);
    }),
  };
});

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
      const result = await fetchAllRepositoriesOAuth('test-token');
      
      // Verify Octokit was called with the token
      expect(Octokit).toHaveBeenCalledWith({ auth: 'test-token' });
      
      // Verify it returned repositories
      expect(result).toEqual(sampleRepositories);
      
      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith(
        'github:repositories',
        'fetchAllRepositoriesOAuth called',
        expect.any(Object)
      );
    });

    it('should warn when rate limit is running low', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withLowRateLimit();
      });
      
      await fetchAllRepositoriesOAuth('test-token');
      
      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        'GitHub API rate limit is running low',
        expect.any(Object)
      );
    });

    it('should handle rate limit check errors', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withRateLimitError();
      });
      
      await fetchAllRepositoriesOAuth('test-token');
      
      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        'Failed to check GitHub API rate limits',
        expect.any(Object)
      );
    });

    it('should warn when token lacks repo scope', async () => {
      // Create a custom mock that only overrides the user info but returns valid repos
      const mockOctokit = new MockOctokit();
      
      // Just replace getAuthenticated but keep other functions working
      mockOctokit.rest.users.getAuthenticated = jest.fn().mockResolvedValue({
        data: { login: 'testuser', id: 123, type: 'User' },
        headers: { 'x-oauth-scopes': 'read:user' }, // Missing repo scope
      });
      
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => mockOctokit);
      
      // Verify warning was logged
      let errorThrown = false;
      try {
        await fetchAllRepositoriesOAuth('token');
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).toContain("GitHub token is missing 'repo' scope");
      }
      
      expect(errorThrown).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        "GitHub token is missing 'repo' scope. This will prevent access to private repositories."
      );
    });

    it('should warn but not error when token lacks read:org scope', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withMissingReadOrgScope();
      });
      
      const result = await fetchAllRepositoriesOAuth('token');
      
      // Verify it worked but warned
      expect(result).toEqual(sampleRepositories);
      
      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        "GitHub token is missing 'read:org' scope. This may limit access to organization data."
      );
    });

    it('should handle user info fetch errors', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withUserInfoError();
      });
      
      const result = await fetchAllRepositoriesOAuth('token');
      
      // Should still return repositories despite user info error
      expect(result).toEqual(sampleRepositories);
      
      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        'Could not retrieve authenticated user info',
        expect.any(Object)
      );
    });
    
    it('should handle empty scopes header', async () => {
      // Create a custom mock that returns empty scopes header
      const mockOctokit = new MockOctokit();
      mockOctokit.rest.users.getAuthenticated = jest.fn().mockResolvedValue({
        data: { login: 'testuser', id: 123, type: 'User' },
        headers: { 'x-oauth-scopes': '' }, // Empty scopes
      });
      
      // Reset the mock constructor
      (Octokit as jest.Mock).mockImplementationOnce(() => mockOctokit);
      
      // Verify warning was logged
      let errorThrown = false;
      try {
        await fetchAllRepositoriesOAuth('token');
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).toContain("GitHub token is missing 'repo' scope");
      }
      
      expect(errorThrown).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        "GitHub token is missing 'repo' scope. This will prevent access to private repositories."
      );
    });
    
    it('should handle missing scopes header', async () => {
      // Create a custom mock that returns no scopes header
      const mockOctokit = new MockOctokit();
      mockOctokit.rest.users.getAuthenticated = jest.fn().mockResolvedValue({
        data: { login: 'testuser', id: 123, type: 'User' },
        headers: { } // No x-oauth-scopes header
      });
      
      // Reset the mock constructor
      (Octokit as jest.Mock).mockImplementationOnce(() => mockOctokit);
      
      // Verify warning was logged
      let errorThrown = false;
      try {
        await fetchAllRepositoriesOAuth('token');
      } catch (error: any) {
        errorThrown = true;
        expect(error.message).toContain("GitHub token is missing 'repo' scope");
      }
      
      expect(errorThrown).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        "GitHub token is missing 'repo' scope. This will prevent access to private repositories."
      );
    });

    it('should fetch and include organization repositories', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withMixedRepos();
      });
      
      const result = await fetchAllRepositoriesOAuth('token');
      
      // Should have 4 unique repos (3 original + 1 from orgs, with 1 duplicate removed)
      expect(result.length).toBe(4);
      
      // Verify logging for org repos
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        'Fetched user organizations',
        expect.any(Object)
      );
      
      // Verify deduplication log
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        'Deduplicated repositories',
        expect.any(Object)
      );
    });

    it('should handle errors when fetching org repositories', async () => {
      // Reset the mock constructor to return our configured mock with error for org repos
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        const mock = new MockOctokit().withOrganizations();
        return mock.withOrgReposError('org1');
      });
      
      await fetchAllRepositoriesOAuth('token');
      
      // Verify warning for org repos error
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        'Error fetching repos for org: org1',
        expect.any(Object)
      );
    });

    it('should handle non-array response from organization repo API', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit()
          .withOrganizations([{ login: 'org1', id: 101 }])
          .withNonArrayResponse();
      });
      
      const result = await fetchAllRepositoriesOAuth('token');
      
      // Should include the non-array result converted to array
      const hasOrgRepo = result.some(repo => repo.full_name === 'org1/single-repo');
      expect(hasOrgRepo).toBe(true);
    });

    it('should handle errors when listing organizations', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withOrgListError();
      });
      
      const result = await fetchAllRepositoriesOAuth('token');
      
      // Should still return the main repositories
      expect(result).toEqual(sampleRepositories);
      
      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        'Failed to list user orgs',
        expect.any(Object)
      );
    });

    it('should deduplicate repositories by full_name', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withDuplicateRepos();
      });
      
      const result = await fetchAllRepositoriesOAuth('token');
      
      // Should have deduplicated to original count
      expect(result.length).toBe(sampleRepositories.length);
      
      // Verify deduplication logging
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        'Deduplicated repositories',
        expect.any(Object)
      );
    });

    it('should propagate errors from the main API call', async () => {
      // Reset the mock constructor to return our configured mock
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withApiError();
      });
      
      await expect(fetchAllRepositoriesOAuth('token')).rejects.toThrow('API error');
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'github:repositories',
        'Error fetching repositories',
        expect.any(Object)
      );
    });
  });

  describe('fetchAllRepositoriesApp', () => {
    it('should call getInstallationOctokit with correct installation ID', async () => {
      // Mock the App Octokit response
      const mockAppOctokit = new MockOctokit();
      (getInstallationOctokit as jest.Mock).mockResolvedValue(mockAppOctokit);
      
      const result = await fetchAllRepositoriesApp(12345);
      
      // Verify getInstallationOctokit was called with the correct ID
      expect(getInstallationOctokit).toHaveBeenCalledWith(12345);
      
      // Verify it returned repositories
      expect(result).toEqual(sampleRepositories);
      
      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith(
        'github:repositories',
        'fetchAllRepositoriesApp called',
        { installationId: 12345 }
      );
    });

    it('should check rate limits for app authentication', async () => {
      // Mock a low rate limit App Octokit
      const mockAppOctokit = new MockOctokit().withLowRateLimit();
      (getInstallationOctokit as jest.Mock).mockResolvedValue(mockAppOctokit);
      
      await fetchAllRepositoriesApp(12345);
      
      // Verify rate limit info was logged
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        'GitHub API rate limit status (App auth)',
        expect.any(Object)
      );
    });

    it('should handle rate limit check errors for app authentication', async () => {
      // Mock rate limit error in App Octokit
      const mockAppOctokit = new MockOctokit().withRateLimitError();
      (getInstallationOctokit as jest.Mock).mockResolvedValue(mockAppOctokit);
      
      await fetchAllRepositoriesApp(12345);
      
      // Verify warning was logged
      expect(logger.warn).toHaveBeenCalledWith(
        'github:repositories',
        'Failed to check GitHub API rate limits (App auth)',
        expect.any(Object)
      );
    });

    it('should list all repositories accessible to the installation', async () => {
      // Mock the App Octokit response with custom repositories
      const customRepos = [
        { id: 101, name: 'app-repo1', full_name: 'org/app-repo1', private: true },
        { id: 102, name: 'app-repo2', full_name: 'org/app-repo2', private: false },
      ];
      
      const mockAppOctokit = new MockOctokit();
      mockAppOctokit.paginate = jest.fn().mockResolvedValue(customRepos);
      (getInstallationOctokit as jest.Mock).mockResolvedValue(mockAppOctokit);
      
      const result = await fetchAllRepositoriesApp(12345);
      
      // Verify it returned the correct repositories
      expect(result).toEqual(customRepos);
      
      // Verify paginate was called with the correct method
      expect(mockAppOctokit.paginate).toHaveBeenCalledWith(
        mockAppOctokit.rest.apps.listReposAccessibleToInstallation,
        { per_page: 100 }
      );
      
      // Verify logging includes correct counts
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        'Fetched repositories from GitHub App installation',
        {
          count: 2,
          private: 1,
          public: 1
        }
      );
    });

    it('should handle installation auth errors', async () => {
      // Mock an error when getting the installation Octokit
      (getInstallationOctokit as jest.Mock).mockRejectedValue(
        new Error('Invalid installation')
      );
      
      await expect(fetchAllRepositoriesApp(12345)).rejects.toThrow('Invalid installation');
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'github:repositories',
        'Error fetching repositories via GitHub App',
        expect.any(Object)
      );
    });

    it('should handle API errors after installation auth', async () => {
      // Mock API error in App Octokit
      const mockAppOctokit = new MockOctokit().withApiError();
      (getInstallationOctokit as jest.Mock).mockResolvedValue(mockAppOctokit);
      
      await expect(fetchAllRepositoriesApp(12345)).rejects.toThrow('API error');
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'github:repositories',
        'Error fetching repositories via GitHub App',
        expect.any(Object)
      );
    });

    it('should handle empty repository response', async () => {
      // Mock empty response in App Octokit
      const mockAppOctokit = new MockOctokit().withEmptyResponse();
      (getInstallationOctokit as jest.Mock).mockResolvedValue(mockAppOctokit);
      
      const result = await fetchAllRepositoriesApp(12345);
      
      // Verify it returned empty array
      expect(result).toEqual([]);
      
      // Verify logging includes zero counts
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        'Fetched repositories from GitHub App installation',
        {
          count: 0,
          private: 0,
          public: 0
        }
      );
    });
  });

  describe('fetchAllRepositories', () => {
    it('should call fetchAllRepositoriesApp when installationId is provided', async () => {
      // Mock the App Octokit response
      const mockAppOctokit = new MockOctokit();
      (getInstallationOctokit as jest.Mock).mockResolvedValue(mockAppOctokit);
      
      await fetchAllRepositories('token', 12345);
      
      // Verify getInstallationOctokit was called (indicating fetchAllRepositoriesApp was used)
      expect(getInstallationOctokit).toHaveBeenCalledWith(12345);
      
      // Verify the logger shows we're using GitHub App installation
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        'Using GitHub App installation for repository access',
        { installationId: 12345 }
      );
      
      // Ensure Octokit constructor was not called (which would indicate OAuth was used)
      expect(Octokit).not.toHaveBeenCalled();
    });

    it('should call fetchAllRepositoriesOAuth when only accessToken is provided', async () => {
      await fetchAllRepositories('token');
      
      // Verify Octokit was created with the token (indicating fetchAllRepositoriesOAuth was used)
      expect(Octokit).toHaveBeenCalledWith({ auth: 'token' });
      
      // Verify the logger shows we're using OAuth
      expect(logger.info).toHaveBeenCalledWith(
        'github:repositories',
        'Using OAuth token for repository access'
      );
      
      // Ensure getInstallationOctokit was not called
      expect(getInstallationOctokit).not.toHaveBeenCalled();
    });

    it('should throw error when no authentication is provided', async () => {
      await expect(fetchAllRepositories()).rejects.toThrow('No GitHub authentication available');
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'github:repositories',
        'No authentication method available for repository access'
      );
    });

    it('should propagate errors from fetchAllRepositoriesApp', async () => {
      // Mock an error from getInstallationOctokit
      (getInstallationOctokit as jest.Mock).mockRejectedValue(
        new Error('App installation error')
      );
      
      await expect(fetchAllRepositories(undefined, 12345)).rejects.toThrow('App installation error');
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'github:repositories',
        'Error in unified fetchAllRepositories',
        expect.any(Object)
      );
    });

    it('should propagate errors from fetchAllRepositoriesOAuth', async () => {
      // Reset the mock constructor to return our configured mock with API error
      (Octokit as jest.Mock).mockImplementationOnce(() => {
        return new MockOctokit().withApiError();
      });
      
      await expect(fetchAllRepositories('token')).rejects.toThrow('API error');
      
      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'github:repositories',
        'Error in unified fetchAllRepositories',
        expect.any(Object)
      );
    });

    it('should log debug information when called', async () => {
      await fetchAllRepositories('token');
      
      // Verify debug logging
      expect(logger.debug).toHaveBeenCalledWith(
        'github:repositories',
        'fetchAllRepositories called',
        {
          hasAccessToken: true,
          hasInstallationId: false
        }
      );
    });
  });
});
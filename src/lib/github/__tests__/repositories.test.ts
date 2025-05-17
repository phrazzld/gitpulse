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
import { IOctokitClient } from '../interfaces';
import { logger } from '@/lib/logger';

// Create a mock implementation of IOctokitClient
const createMockOctokitClient = (): jest.Mocked<IOctokitClient> => {
  const mockClient: jest.Mocked<IOctokitClient> = {
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
          data: {
            login: 'testuser',
            id: 123,
            type: 'User'
          },
          status: 200,
          headers: {
            'x-oauth-scopes': 'repo, read:org'
          }
        })
      },
      repos: {
        listForAuthenticatedUser: jest.fn().mockResolvedValue({
          data: [],
          status: 200
        }),
        listForOrg: jest.fn().mockResolvedValue({
          data: [],
          status: 200
        }),
        listCommits: jest.fn()
      },
      orgs: {
        listForAuthenticatedUser: jest.fn().mockResolvedValue({
          data: [],
          status: 200
        })
      },
      apps: {
        listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue({
          data: { installations: [] },
          status: 200
        }),
        listReposAccessibleToInstallation: jest.fn().mockResolvedValue({
          data: [],
          status: 200
        })
      }
    },
    paginate: jest.fn(async (endpoint, params) => {
      // Simulate pagination behavior
      const response = await endpoint(params);
      return response.data;
    })
  };
  
  return mockClient;
};

describe('repositories module', () => {
  let mockClient: jest.Mocked<IOctokitClient>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockOctokitClient();
    loggerSpy = jest.spyOn(logger, 'debug');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllRepositoriesOAuth', () => {
    it('should fetch repositories successfully', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1', full_name: 'user/repo1', private: false },
        { id: 2, name: 'repo2', full_name: 'user/repo2', private: true }
      ];
      
      mockClient.paginate.mockResolvedValue(mockRepos);
      
      const result = await fetchAllRepositoriesOAuth(mockClient);
      
      expect(mockClient.rest.rateLimit.get).toHaveBeenCalled();
      expect(mockClient.rest.users.getAuthenticated).toHaveBeenCalled();
      expect(mockClient.paginate).toHaveBeenCalled();
      expect(result).toEqual(mockRepos);
    });

    it('should throw error if token is missing repo scope', async () => {
      mockClient.rest.users.getAuthenticated.mockResolvedValue({
        data: {
          login: 'testuser',
          id: 123,
          type: 'User'
        },
        status: 200,
        headers: {
          'x-oauth-scopes': 'read:org'
        }
      });

      await expect(fetchAllRepositoriesOAuth(mockClient)).rejects.toThrow(
        'GitHub token is missing \'repo\' scope'
      );
    });
  });

  describe('fetchAllRepositoriesApp', () => {
    it('should fetch repositories via app authentication', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1', full_name: 'org/repo1', private: false }
      ];
      
      mockClient.paginate.mockResolvedValue(mockRepos);
      
      const result = await fetchAllRepositoriesApp(mockClient);
      
      expect(mockClient.rest.rateLimit.get).toHaveBeenCalled();
      expect(mockClient.paginate).toHaveBeenCalled();
      expect(result).toEqual(mockRepos);
    });
  });

  describe('fetchAllRepositories', () => {
    it('should use OAuth when authMethod is oauth', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1', full_name: 'user/repo1', private: false }
      ];
      
      mockClient.paginate.mockResolvedValue(mockRepos);
      
      const result = await fetchAllRepositories(mockClient, 'oauth');
      
      expect(result).toEqual(mockRepos);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.any(String),
        'Using OAuth token for repository access'
      );
    });

    it('should use App when authMethod is app', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1', full_name: 'org/repo1', private: false }
      ];
      
      mockClient.paginate.mockResolvedValue(mockRepos);
      
      const result = await fetchAllRepositories(mockClient, 'app');
      
      expect(result).toEqual(mockRepos);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.any(String),
        'Using GitHub App installation for repository access'
      );
    });
  });
});
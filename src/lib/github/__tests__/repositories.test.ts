/**
 * Tests for the GitHub repositories module
 */

import { 
  fetchAllRepositoriesOAuth, 
  fetchAllRepositoriesApp, 
  fetchAllRepositories 
} from '../repositories';
import { IOctokitClient } from '../interfaces';
import { logger } from '@/lib/logger';
import { createMockOctokitClient } from './testUtils.helper';

// Test globals
declare const describe: any;
declare const it: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const expect: any;
declare const jest: any;

// Custom mock implementation that works with our test setup
const createTestMockOctokitClient = (): IOctokitClient => {
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
    paginate: jest.fn()
  };
  
  return mockClient;
};

describe('repositories module', () => {
  let mockClient: IOctokitClient;
  let loggerSpy: any;
  let infoSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createTestMockOctokitClient();
    loggerSpy = jest.spyOn(logger, 'debug');
    infoSpy = jest.spyOn(logger, 'info');
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
      
      (mockClient.paginate as any).mockResolvedValue(mockRepos);
      
      const result = await fetchAllRepositoriesOAuth(mockClient);
      
      expect((mockClient.rest.rateLimit.get as any)).toHaveBeenCalled();
      expect((mockClient.rest.users.getAuthenticated as any)).toHaveBeenCalled();
      expect((mockClient.paginate as any)).toHaveBeenCalled();
      expect(result).toEqual(mockRepos);
    });

    it('should throw error if token is missing repo scope', async () => {
      (mockClient.rest.users.getAuthenticated as any).mockResolvedValue({
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
      
      (mockClient.paginate as any).mockResolvedValue(mockRepos);
      
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
      
      (mockClient.paginate as any).mockResolvedValue(mockRepos);
      
      const result = await fetchAllRepositories(mockClient, 'oauth');
      
      expect(result).toEqual(mockRepos);
      
      // Check all calls made to logger.info
      const hasCorrectCall = infoSpy.mock.calls.some((call: any[]) => 
        call[0] === 'github:repositories' && 
        call[1] === 'Using OAuth token for repository access'
      );
      expect(hasCorrectCall).toBe(true);
    });

    it('should use App when authMethod is app', async () => {
      const mockRepos = [
        { id: 1, name: 'repo1', full_name: 'org/repo1', private: false }
      ];
      
      (mockClient.paginate as any).mockResolvedValue(mockRepos);
      
      const result = await fetchAllRepositories(mockClient, 'app');
      
      expect(result).toEqual(mockRepos);
      
      // Check all calls made to logger.info
      const hasCorrectCall = infoSpy.mock.calls.some((call: any[]) => 
        call[0] === 'github:repositories' && 
        call[1] === 'Using GitHub App installation for repository access'
      );
      expect(hasCorrectCall).toBe(true);
    });
  });
});
import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import { 
  mockRepositories, 
  mockActivityCommits,
  mockSession,
  mockInstallation
} from './test-utils';
import { Commit, Repository } from '@/lib/githubData';

// Mock Octokit instance for testing
export const mockOctokit = {
  paginate: jest.fn(),
  rest: {
    rateLimit: {
      get: jest.fn().mockResolvedValue({
        data: {
          resources: {
            core: {
              limit: 5000,
              remaining: 4990,
              reset: Math.floor(Date.now() / 1000) + 3600
            }
          }
        }
      })
    },
    users: {
      getAuthenticated: jest.fn().mockResolvedValue({
        data: {
          login: 'testuser',
          id: 12345,
          type: 'User'
        },
        headers: {
          "x-oauth-scopes": "repo, read:org"
        }
      })
    },
    repos: {
      listForAuthenticatedUser: jest.fn(),
      listForOrg: jest.fn(),
      listCommits: jest.fn()
    },
    orgs: {
      listForAuthenticatedUser: jest.fn().mockResolvedValue([
        { login: 'testorg' }
      ])
    },
    apps: {
      listReposAccessibleToInstallation: jest.fn(),
      listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue({
        data: {
          installations: [mockInstallation]
        }
      })
    }
  }
} as unknown as Octokit;

// Mock createAuthenticatedOctokit for testing
export const mockCreateAuthenticatedOctokit = jest.fn().mockResolvedValue(mockOctokit);

// Mock data fetching functions for testing
export const mockFetchRepositories = jest.fn().mockResolvedValue(mockRepositories);
export const mockFetchAppRepositories = jest.fn().mockResolvedValue(mockRepositories);
export const mockFetchAllRepositories = jest.fn().mockResolvedValue(mockRepositories);
export const mockFetchRepositoryCommitsWithOctokit = jest.fn().mockResolvedValue(mockActivityCommits);
export const mockFetchRepositoryCommits = jest.fn().mockResolvedValue(mockActivityCommits);
export const mockFetchCommitsForRepositoriesWithOctokit = jest.fn().mockResolvedValue(mockActivityCommits);
export const mockFetchCommitsForRepositories = jest.fn().mockResolvedValue(mockActivityCommits);

// Helper for creating API route handler tests
export const createApiHandlerTestHelper = (
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  return {
    callHandler: async (
      url: string,
      method: string = 'GET',
      searchParams: Record<string, string> = {},
      body?: any
    ) => {
      // Create URL with search parameters
      const testUrl = new URL(url, 'https://example.com');
      Object.entries(searchParams).forEach(([key, value]) => {
        testUrl.searchParams.append(key, value);
      });
      
      // Create request object
      const req = new NextRequest(testUrl, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Call handler and return response
      const response = await handler(req);
      return {
        status: response.status,
        statusText: response.statusText,
        data: await response.json(),
        headers: Object.fromEntries(response.headers.entries()),
      };
    }
  };
};

// Mock getServerSession for testing API routes
export const mockGetServerSession = jest.fn().mockResolvedValue(mockSession);

// Set up jest mocks for the modules
jest.mock('@/lib/auth/githubAuth', () => ({
  createAuthenticatedOctokit: mockCreateAuthenticatedOctokit,
  getAllAppInstallations: jest.fn().mockResolvedValue([mockInstallation]),
  checkAppInstallation: jest.fn().mockResolvedValue(mockInstallation.id),
  getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/123'),
}));

jest.mock('@/lib/githubData', () => ({
  fetchRepositories: mockFetchRepositories,
  fetchAppRepositories: mockFetchAppRepositories,
  fetchAllRepositories: mockFetchAllRepositories,
  fetchRepositoryCommitsWithOctokit: mockFetchRepositoryCommitsWithOctokit,
  fetchRepositoryCommits: mockFetchRepositoryCommits,
  fetchCommitsForRepositoriesWithOctokit: mockFetchCommitsForRepositoriesWithOctokit,
  fetchCommitsForRepositories: mockFetchCommitsForRepositories,
}));

jest.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSession
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Verify credential handling and client passing
export const verifyCredentialHandling = (
  type: 'oauth' | 'app',
  accessToken?: string,
  installationId?: number
) => {
  // Check that createAuthenticatedOctokit was called with correct credentials
  if (type === 'oauth') {
    expect(mockCreateAuthenticatedOctokit).toHaveBeenCalledWith({
      type: 'oauth',
      token: accessToken
    });
  } else {
    expect(mockCreateAuthenticatedOctokit).toHaveBeenCalledWith({
      type: 'app',
      installationId
    });
  }
};

// Verify that the Octokit instance was passed to data fetching functions
export const verifyOctokitPassing = (
  fetchFunction: jest.Mock,
  ...additionalArgs: any[]
) => {
  expect(fetchFunction).toHaveBeenCalledWith(
    mockOctokit,
    ...additionalArgs
  );
};
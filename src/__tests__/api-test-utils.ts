import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from 'octokit';
import { 
  mockRepositories, 
  mockActivityCommits,
  mockSession,
  mockInstallation
} from './test-utils';
import { Commit, Repository } from '@/lib/githubData';
import { 
  GitHubError,
  GitHubAuthError,
  GitHubConfigError,
  GitHubRateLimitError,
  GitHubNotFoundError,
  GitHubApiError
} from '@/lib/errors';

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
// Direct functions (preferred, use these in new tests)
export const mockFetchRepositories = jest.fn().mockResolvedValue(mockRepositories);
export const mockFetchAppRepositories = jest.fn().mockResolvedValue(mockRepositories);
export const mockFetchRepositoryCommitsWithOctokit = jest.fn().mockResolvedValue(mockActivityCommits);
export const mockFetchCommitsForRepositoriesWithOctokit = jest.fn().mockResolvedValue(mockActivityCommits);

// Deprecated wrapper functions (maintained for backward compatibility with existing tests)
// These should be gradually phased out as tests are updated
export const mockFetchAllRepositories = jest.fn().mockResolvedValue(mockRepositories);
export const mockFetchRepositoryCommits = jest.fn().mockResolvedValue(mockActivityCommits);
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
      body?: Record<string, unknown>
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
  // Direct function implementations (preferred)
  fetchRepositories: mockFetchRepositories,
  fetchAppRepositories: mockFetchAppRepositories,
  fetchRepositoryCommitsWithOctokit: mockFetchRepositoryCommitsWithOctokit,
  fetchCommitsForRepositoriesWithOctokit: mockFetchCommitsForRepositoriesWithOctokit,
  
  // Deprecated wrapper function implementations (maintained for backward compatibility)
  fetchAllRepositories: mockFetchAllRepositories,
  fetchRepositoryCommits: mockFetchRepositoryCommits,
  fetchCommitsForRepositories: mockFetchCommitsForRepositories,
}));

jest.mock('next-auth/next', () => ({
  getServerSession: mockGetServerSession
}));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock GitHub error generators for testing error handling
export const mockErrors = {
  // Config error (status 500)
  createConfigError: () => new GitHubConfigError("GitHub App not properly configured", {
    context: { functionName: "testFunction" }
  }),
  
  // Auth errors (status 403)
  createAuthError: () => new GitHubAuthError("GitHub authentication failed", {
    status: 403,
    context: { functionName: "testFunction" }
  }),
  createTokenError: () => new GitHubAuthError("GitHub token is invalid or expired", {
    status: 403,
    context: { functionName: "testFunction" }
  }),
  createScopeError: () => new GitHubAuthError("GitHub token is missing required scope", {
    status: 403,
    context: { functionName: "testFunction" }
  }),
  
  // Rate limit error (status 429)
  createRateLimitError: () => new GitHubRateLimitError("GitHub API rate limit exceeded", {
    status: 429,
    resetTimestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    context: { functionName: "testFunction" }
  }),
  
  // Not found error (status 404)
  createNotFoundError: () => new GitHubNotFoundError("Repository not found", {
    context: { functionName: "testFunction" }
  }),
  
  // API error (variable status)
  createApiError: (status = 500) => new GitHubApiError("GitHub API operation failed", {
    status,
    context: { functionName: "testFunction" }
  }),
  
  // Generic GitHub error (status 500)
  createGitHubError: () => new GitHubError("Generic GitHub error", {
    context: { functionName: "testFunction" }
  }),
  
  // Regular JS error (status 500)
  createJsError: () => new Error("Standard JavaScript error")
};

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
  ...additionalArgs: unknown[]
) => {
  expect(fetchFunction).toHaveBeenCalledWith(
    mockOctokit,
    ...additionalArgs
  );
};

// Verify the correct repository fetching function was used based on auth type
export const verifyRepositoryFetchingWithOctokit = (
  type: 'oauth' | 'app'
) => {
  if (type === 'oauth') {
    expect(mockFetchRepositories).toHaveBeenCalledWith(mockOctokit);
    expect(mockFetchAppRepositories).not.toHaveBeenCalled();
  } else {
    expect(mockFetchAppRepositories).toHaveBeenCalledWith(mockOctokit);
    expect(mockFetchRepositories).not.toHaveBeenCalled();
  }
  
  // Verify deprecated function wasn't called
  expect(mockFetchAllRepositories).not.toHaveBeenCalled();
};

// Helper to verify that error responses match expected patterns
export const verifyErrorResponse = (
  response: { status: number; data: Record<string, unknown> },
  expectedStatus: number,
  expectedCode: string,
  options?: {
    shouldHaveSignOutRequired?: boolean;
    shouldHaveResetAt?: boolean;
    shouldHaveNeedsInstallation?: boolean;
  }
) => {
  // Verify status code
  expect(response.status).toBe(expectedStatus);
  
  // Verify response contains expected fields
  expect(response.data.error).toBeDefined();
  expect(response.data.code).toBe(expectedCode);
  
  // Verify optional fields
  if (options?.shouldHaveSignOutRequired) {
    expect(response.data.signOutRequired).toBe(true);
  }
  
  if (options?.shouldHaveResetAt) {
    expect(response.data.resetAt).toBeDefined();
  }
  
  if (options?.shouldHaveNeedsInstallation) {
    expect(response.data.needsInstallation).toBe(true);
  }
};
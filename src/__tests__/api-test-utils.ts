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
  paginate: jest.fn().mockImplementation((method) => {
    // When paginating through repositories accessible to an installation
    if (method === mockOctokit.rest.apps.listReposAccessibleToInstallation) {
      return Promise.resolve(mockRepositories);
    }
    
    // When paginating through repos for authenticated user
    if (method === mockOctokit.rest.repos.listForAuthenticatedUser) {
      return Promise.resolve(mockRepositories);
    }
    
    // When paginating through orgs
    if (method === mockOctokit.rest.orgs.listForAuthenticatedUser) {
      return Promise.resolve([{ login: 'testorg' }]);
    }
    
    // When paginating through repos for an org
    if (method === mockOctokit.rest.repos.listForOrg) {
      return Promise.resolve(mockRepositories.filter(r => r.owner.login === 'testorg'));
    }
    
    // When paginating through commits
    if (method === mockOctokit.rest.repos.listCommits) {
      return Promise.resolve(mockActivityCommits);
    }
    
    // Default: return empty array
    return Promise.resolve([]);
  }),
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
export const mockFetchRepositories = jest.fn().mockImplementation((octokit) => {
  if (!octokit) {
    return Promise.reject(new Error("Octokit instance is required"));
  }
  return Promise.resolve(mockRepositories);
});

export const mockFetchAppRepositories = jest.fn().mockImplementation((octokit) => {
  // Validate that an Octokit instance was provided
  if (!octokit) {
    return Promise.reject(new Error("Octokit instance is required"));
  }
  
  // Call the paginate method to simulate the real function behavior
  return octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, {
    per_page: 100
  });
});

export const mockFetchRepositoryCommitsWithOctokit = jest.fn().mockImplementation((octokit, owner, repo, since, until, author) => {
  if (!octokit) {
    return Promise.reject(new Error("Octokit instance is required"));
  }
  
  // Return commits with repository information attached
  return Promise.resolve(mockActivityCommits.map(commit => ({
    ...commit,
    repository: {
      full_name: `${owner}/${repo}`,
      fullName: `${owner}/${repo}`
    }
  })));
});

export const mockFetchCommitsForRepositoriesWithOctokit = jest.fn().mockImplementation((octokit, repositories, since, until, author) => {
  if (!octokit) {
    return Promise.reject(new Error("Octokit instance is required"));
  }
  return Promise.resolve(mockActivityCommits);
});

// Deprecated wrapper functions (maintained for backward compatibility with existing tests)
// These should be gradually phased out as tests are updated
export const mockFetchAllRepositories = jest.fn().mockImplementation((accessToken, installationId) => {
  // Validate at least one authentication method is provided
  if (!accessToken && !installationId) {
    return Promise.reject(new Error("No GitHub authentication available. Please sign in again."));
  }
  
  return Promise.resolve(mockRepositories);
});

export const mockFetchRepositoryCommits = jest.fn().mockImplementation((accessToken, installationId, owner, repo, since, until, author) => {
  // Validate at least one authentication method is provided
  if (!accessToken && !installationId) {
    return Promise.reject(new Error("No GitHub authentication available. Please sign in again."));
  }
  
  return Promise.resolve(mockActivityCommits.map(commit => ({
    ...commit,
    repository: {
      full_name: `${owner}/${repo}`,
      fullName: `${owner}/${repo}`
    }
  })));
});

export const mockFetchCommitsForRepositories = jest.fn().mockImplementation((accessToken, installationId, repositories, since, until, author) => {
  // Validate at least one authentication method is provided
  if (!accessToken && !installationId) {
    return Promise.reject(new Error("No GitHub authentication available. Please sign in again."));
  }
  
  return Promise.resolve(mockActivityCommits);
});

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
      try {
        const response = await handler(req);
        
        return {
          status: response.status,
          statusText: response.statusText,
          data: await response.json(),
          headers: Object.fromEntries(response.headers.entries()),
        };
      } catch (error) {
        console.error("Error calling handler:", error);
        throw error;
      }
    }
  };
};

// Import nextAuth to use its getServerSession mock
import { getServerSession } from "next-auth";
// Export the mocked getServerSession function
// Add TypeScript type assertion to include the mock methods
export const mockGetServerSession = getServerSession as jest.Mock & {
  mockResolvedValue: (value: any) => jest.Mock;
  mockResolvedValueOnce: (value: any) => jest.Mock;
};

// Set up jest mocks for the modules
jest.mock('@/lib/auth/githubAuth', () => ({
  createAuthenticatedOctokit: mockCreateAuthenticatedOctokit,
  getAllAppInstallations: jest.fn().mockResolvedValue([mockInstallation]),
  checkAppInstallation: jest.fn().mockResolvedValue(mockInstallation.id),
  getInstallationManagementUrl: jest.fn().mockReturnValue('https://github.com/settings/installations/123'),
}));

// Mock tokenValidator to prevent fetch errors in tests
jest.mock('@/lib/auth/tokenValidator', () => ({
  isGitHubTokenValid: jest.fn().mockResolvedValue(true),
  validateAuthState: jest.fn().mockResolvedValue(true),
  useAuthValidator: jest.fn().mockReturnValue({ isValidating: false, isValid: true }),
}));

// Create a mock implementation of the apiAuth middleware
jest.mock('@/lib/auth/apiAuth', () => {
  // A helper to create a wrapper that mimics the middleware
  const withAuthValidation = (handler: any) => {
    return async (req: any) => {
      // Pass-through to the original handler with the mock session
      return handler(req, mockSession);
    };
  };
  
  return {
    withAuthValidation,
    ApiRouteHandler: jest.fn(),
  };
});

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
  // Check that createAuthenticatedOctokit was called exactly once
  expect(mockCreateAuthenticatedOctokit).toHaveBeenCalledTimes(1);
  
  // Check that createAuthenticatedOctokit was called with correct credentials
  if (type === 'oauth') {
    expect(mockCreateAuthenticatedOctokit).toHaveBeenCalledWith({
      type: 'oauth',
      token: accessToken
    });
    
    // Ensure we didn't accidentally use both auth methods
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalledWith(
      expect.objectContaining({ 
        type: 'app',
        installationId: expect.any(Number)
      })
    );
  } else {
    expect(mockCreateAuthenticatedOctokit).toHaveBeenCalledWith({
      type: 'app',
      installationId
    });
    
    // Ensure we didn't accidentally use both auth methods
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalledWith(
      expect.objectContaining({ 
        type: 'oauth',
        token: expect.any(String)
      })
    );
  }
};

// Verify that the Octokit instance was passed to data fetching functions
export const verifyOctokitPassing = (
  fetchFunction: jest.Mock,
  ...additionalArgs: unknown[]
) => {
  // Verify the function was called at least once
  expect(fetchFunction).toHaveBeenCalled();
  
  // Verify the function was called with the correct Octokit instance as first argument
  expect(fetchFunction).toHaveBeenCalledWith(
    mockOctokit,
    ...additionalArgs
  );
  
  // Get the actual call arguments for additional checking
  const callArgs = fetchFunction.mock.calls[0];
  
  // Verify that the first argument was exactly the mockOctokit instance
  expect(callArgs[0]).toBe(mockOctokit);
  
  // If additionalArgs were provided, check they match exactly
  if (additionalArgs.length > 0) {
    for (let i = 0; i < additionalArgs.length; i++) {
      if (additionalArgs[i] !== undefined) {
        expect(callArgs[i + 1]).toEqual(additionalArgs[i]);
      }
    }
  }
};

// Verify the correct repository fetching function was used based on auth type
export const verifyRepositoryFetchingWithOctokit = (
  type: 'oauth' | 'app',
  additionalParams?: Record<string, unknown>
) => {
  if (type === 'oauth') {
    // For OAuth, we should call fetchRepositories exactly once
    expect(mockFetchRepositories).toHaveBeenCalledTimes(1);
    
    // With the correct Octokit instance
    expect(mockFetchRepositories).toHaveBeenCalledWith(
      mockOctokit,
      ...(additionalParams ? [additionalParams] : [])
    );
    
    // And should NOT call the App repositories function
    expect(mockFetchAppRepositories).not.toHaveBeenCalled();
  } else {
    // For App auth, we should call fetchAppRepositories exactly once
    expect(mockFetchAppRepositories).toHaveBeenCalledTimes(1);
    
    // With the correct Octokit instance
    expect(mockFetchAppRepositories).toHaveBeenCalledWith(
      mockOctokit,
      ...(additionalParams ? [additionalParams] : [])
    );
    
    // And should NOT call the OAuth repositories function
    expect(mockFetchRepositories).not.toHaveBeenCalled();
  }
  
  // Verify deprecated functions weren't called at all
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
  // Verify status code with exact matching
  expect(response.status).toBe(expectedStatus);
  
  // Verify response contains expected fields with the correct content
  expect(response.data.error).toBeDefined();
  expect(typeof response.data.error).toBe('string');
  expect((response.data.error as string).length).toBeGreaterThan(0);
  
  // Verify error code is exactly as expected
  if (expectedCode) {
    expect(response.data.code).toBe(expectedCode);
  }
  
  // Verify optional fields with precise assertions
  if (options?.shouldHaveSignOutRequired) {
    expect(response.data.signOutRequired).toBe(true);
  } else if (response.data.signOutRequired !== undefined) {
    expect(response.data.signOutRequired).toBe(false);
  }
  
  if (options?.shouldHaveResetAt) {
    expect(response.data.resetAt).toBeDefined();
    expect(typeof response.data.resetAt).toBe('string');
    // Verify resetAt is a valid timestamp string
    expect(Date.parse(response.data.resetAt as string)).not.toBeNaN();
  }
  
  if (options?.shouldHaveNeedsInstallation) {
    expect(response.data.needsInstallation).toBe(true);
  } else if (response.data.needsInstallation !== undefined) {
    expect(response.data.needsInstallation).toBe(false);
  }
  
  // Also check for details field when appropriate (all errors should have details)
  expect(response.data.details).toBeDefined();
  if (response.data.details) {
    expect(typeof response.data.details).toBe('string');
    expect((response.data.details as string).length).toBeGreaterThan(0);
  }
};

// Add tests to ensure Jest recognizes this as a valid test file and verify our utility functions
describe("api-test-utils", () => {
  it("exports utility functions for API testing", () => {
    // Verify some key exports exist
    expect(mockOctokit).toBeDefined();
    expect(createApiHandlerTestHelper).toBeDefined();
    expect(mockCreateAuthenticatedOctokit).toBeDefined();
    expect(mockErrors).toBeDefined();
    expect(verifyCredentialHandling).toBeDefined();
    expect(verifyOctokitPassing).toBeDefined();
    expect(verifyRepositoryFetchingWithOctokit).toBeDefined();
    expect(verifyErrorResponse).toBeDefined();
  });
  
  describe("verifyErrorResponse", () => {
    it("should validate error responses with correct assertions", () => {
      // Create a mock error response to test our verification function
      const mockResponse = {
        status: 404,
        data: {
          error: "Resource not found",
          code: "GITHUB_NOT_FOUND_ERROR",
          details: "The requested repository does not exist"
        }
      };
      
      // This should pass with correct assertions
      expect(() => {
        verifyErrorResponse(mockResponse, 404, "GITHUB_NOT_FOUND_ERROR");
      }).not.toThrow();
      
      // This should fail with incorrect status code
      expect(() => {
        verifyErrorResponse(mockResponse, 403, "GITHUB_NOT_FOUND_ERROR");
      }).toThrow();
      
      // This should fail with incorrect error code
      expect(() => {
        verifyErrorResponse(mockResponse, 404, "GITHUB_AUTH_ERROR");
      }).toThrow();
    });
  });
});
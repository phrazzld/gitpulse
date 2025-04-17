/**
 * Tests for handling specific GitHub error types in API routes
 * This file focuses on testing that:
 * 1. API routes correctly handle the specific GitHub error types when thrown by the data fetching layer
 * 2. The withErrorHandling HOF correctly maps error types to appropriate HTTP status codes
 * 3. The standardized error response format is maintained across all error types
 */
import { NextRequest } from 'next/server';
import { GET as getRepos } from '@/app/api/repos/route';
import { GET as getMyActivity } from '@/app/api/my-activity/route';
import { GET as getSummary } from '@/app/api/summary/route';

import { 
  mockCreateAuthenticatedOctokit,
  mockOctokit,
  mockFetchRepositories,
  mockFetchAppRepositories,
  mockFetchCommitsForRepositoriesWithOctokit,
  createApiHandlerTestHelper,
  mockGetServerSession,
  mockErrors,
  verifyErrorResponse
} from '../api-test-utils';

import { mockInstallation, mockSession } from '../test-utils';

/**
 * Extended verification function for standardized error responses
 * This tests not just the basic error response but also the specific mapping logic
 */
const verifyStandardizedErrorResponse = (
  response: { status: number; data: any },
  expected: {
    statusCode: number,
    errorCode: string,
    errorMessageContains?: string[],
    hasSignOutRequired?: boolean,
    hasResetAt?: boolean,
    hasNeedsInstallation?: boolean,
    hasDetails?: boolean
  }
) => {
  // First run the basic verification
  verifyErrorResponse(response, expected.statusCode, expected.errorCode, {
    shouldHaveSignOutRequired: expected.hasSignOutRequired,
    shouldHaveResetAt: expected.hasResetAt,
    shouldHaveNeedsInstallation: expected.hasNeedsInstallation
  });
  
  // Additional detailed verifications
  
  // Verify response structure conformance to ApiErrorResponse interface
  expect(response.data).toMatchObject({
    error: expect.any(String),
    code: expected.errorCode
  });
  
  // Verify error message content
  if (expected.errorMessageContains) {
    for (const textFragment of expected.errorMessageContains) {
      expect(response.data.error.toLowerCase()).toContain(textFragment.toLowerCase());
    }
  }
  
  // Verify details field (more precise than just checking existence)
  if (expected.hasDetails) {
    expect(response.data.details).toBeDefined();
    expect(typeof response.data.details).toBe('string');
    expect(response.data.details.length).toBeGreaterThan(0);
  }
  
  // Verify resetAt is a valid ISO date string
  if (expected.hasResetAt) {
    expect(response.data.resetAt).toBeDefined();
    expect(() => new Date(response.data.resetAt)).not.toThrow();
    expect(new Date(response.data.resetAt).getTime()).toBeGreaterThan(Date.now());
  }
  
  // Verify optional fields NOT present when they shouldn't be
  if (!expected.hasSignOutRequired) {
    expect(response.data.signOutRequired).toBeUndefined();
  }
  
  if (!expected.hasNeedsInstallation) {
    expect(response.data.needsInstallation).toBeUndefined();
  }
};

// Create test helpers for each API route
const reposTestHelper = createApiHandlerTestHelper(getRepos as (req: NextRequest) => any);
const myActivityTestHelper = createApiHandlerTestHelper(getMyActivity as (req: NextRequest) => any);
const summaryTestHelper = createApiHandlerTestHelper(getSummary as (req: NextRequest) => any);

describe('API Routes: GitHub Error Type Handling', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      installationId: mockInstallation.id
    });
  });

  describe('Rate Limit Errors', () => {
    const rateLimitError = mockErrors.createRateLimitError();

    it('handles rate limit errors in /api/repos', async () => {
      // Mock the fetchAppRepositories function to throw a rate limit error
      mockFetchAppRepositories.mockRejectedValueOnce(rateLimitError);
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify the error response using enhanced verification
      verifyStandardizedErrorResponse(response, {
        statusCode: 429,
        errorCode: 'GITHUB_RATE_LIMIT_ERROR',
        errorMessageContains: ['rate limit', 'exceeded'],
        hasResetAt: true,
        hasDetails: true
      });
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('handles rate limit errors in /api/my-activity', async () => {
      // Mock the fetchAppRepositories function to throw a rate limit error
      mockFetchAppRepositories.mockRejectedValueOnce(rateLimitError);
      
      // Call the handler with required parameters
      const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 429, 'GITHUB_RATE_LIMIT_ERROR', { 
        shouldHaveResetAt: true 
      });
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('handles rate limit errors in /api/summary', async () => {
      // Mock the fetchAppRepositories function to throw a rate limit error
      mockFetchAppRepositories.mockRejectedValueOnce(rateLimitError);
      
      // Call the handler
      const response = await summaryTestHelper.callHandler('/api/summary');
      
      // Verify the error response
      verifyErrorResponse(response, 429, 'GITHUB_RATE_LIMIT_ERROR', { 
        shouldHaveResetAt: true 
      });
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });
  });

  describe('Authentication Errors', () => {
    const authError = mockErrors.createAuthError();

    it('handles authentication errors in /api/repos', async () => {
      // Mock the createAuthenticatedOctokit function to throw an auth error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(authError);
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify the error response - these assertions match apiErrorHandler.ts mapping
      verifyErrorResponse(response, 403, 'GITHUB_AUTH_ERROR', { 
        shouldHaveSignOutRequired: true 
      });
    });

    it('handles authentication errors in /api/my-activity', async () => {
      // Mock the createAuthenticatedOctokit function to throw an auth error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(authError);
      
      // Call the handler with required parameters
      const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 403, 'GITHUB_AUTH_ERROR', { 
        shouldHaveSignOutRequired: true 
      });
    });

    it('handles authentication errors in /api/summary', async () => {
      // Mock the createAuthenticatedOctokit function to throw an auth error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(authError);
      
      // Call the handler
      const response = await summaryTestHelper.callHandler('/api/summary');
      
      // Verify the error response
      verifyErrorResponse(response, 403, 'GITHUB_AUTH_ERROR', { 
        shouldHaveSignOutRequired: true 
      });
    });
  });

  describe('Not Found Errors', () => {
    const notFoundError = mockErrors.createNotFoundError();

    it('handles not found errors in /api/repos', async () => {
      // Mock the fetchAppRepositories function to throw a not found error
      mockFetchAppRepositories.mockRejectedValueOnce(notFoundError);
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify the error response
      verifyErrorResponse(response, 404, 'GITHUB_NOT_FOUND_ERROR');
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('handles not found errors in /api/my-activity', async () => {
      // Mock the fetchAppRepositories function to throw a not found error
      mockFetchAppRepositories.mockRejectedValueOnce(notFoundError);
      
      // Call the handler with required parameters
      const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 404, 'GITHUB_NOT_FOUND_ERROR');
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('handles not found errors in /api/summary', async () => {
      // Mock the fetchAppRepositories function to throw a not found error
      mockFetchAppRepositories.mockRejectedValueOnce(notFoundError);
      
      // Call the handler
      const response = await summaryTestHelper.callHandler('/api/summary');
      
      // Verify the error response
      verifyErrorResponse(response, 404, 'GITHUB_NOT_FOUND_ERROR');
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });
  });

  describe('Token Expiration Errors', () => {
    const tokenError = mockErrors.createTokenError();

    it('handles token errors in /api/repos with signOutRequired flag', async () => {
      // Mock the createAuthenticatedOctokit function to throw a token error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(tokenError);
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify the error response
      verifyErrorResponse(response, 403, 'GITHUB_TOKEN_ERROR', { 
        shouldHaveSignOutRequired: true 
      });
    });

    it('handles token errors in /api/my-activity with signOutRequired flag', async () => {
      // Mock the createAuthenticatedOctokit function to throw a token error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(tokenError);
      
      // Call the handler with required parameters
      const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 403, 'GITHUB_TOKEN_ERROR', { 
        shouldHaveSignOutRequired: true 
      });
    });
  });

  describe('GitHub App Configuration Errors', () => {
    const configError = mockErrors.createConfigError();

    it('handles configuration errors in /api/repos with correct status code and message', async () => {
      // Mock the createAuthenticatedOctokit function to throw a config error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(configError);
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify the error response with enhanced verification
      verifyStandardizedErrorResponse(response, {
        statusCode: 500,
        errorCode: 'GITHUB_APP_CONFIG_ERROR',
        errorMessageContains: ['GitHub App', 'configured'],
        hasDetails: true
      });
    });
  });

  describe('Scope Error Mapping', () => {
    const scopeError = mockErrors.createScopeError();

    it('correctly maps GitHub scope errors to the appropriate error code', async () => {
      // Mock the createAuthenticatedOctokit function to throw a scope error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(scopeError);
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify the error response with enhanced verification
      verifyStandardizedErrorResponse(response, {
        statusCode: 403,
        errorCode: 'GITHUB_SCOPE_ERROR',
        errorMessageContains: ['permission', 'required'],
        hasSignOutRequired: true,
        hasDetails: true
      });
    });
  });

  describe('Generic API Error Mapping', () => {
    const apiError = mockErrors.createApiError(500); // Using 500 since mockErrors.createApiError defaults to 500

    it('correctly maps generic GitHub API errors to appropriate status codes', async () => {
      // Mock the fetchAppRepositories function to throw a generic API error
      mockFetchAppRepositories.mockRejectedValueOnce(apiError);
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify the error response with enhanced verification
      // Note: apiErrorHandler.ts preserves the status code from GitHubApiError instances
      verifyStandardizedErrorResponse(response, {
        statusCode: 500, // Should match the status in mockErrors.createApiError
        errorCode: 'GITHUB_API_ERROR',
        errorMessageContains: ['API', 'error'],
        hasDetails: true
      });
    });
  });

  describe('Unknown Error Types', () => {
    it('handles unknown error objects with a generic API_ERROR code', async () => {
      // Create a non-standard error object
      const unknownError = { 
        message: "Unknown error format", 
        nonStandardField: true 
      };
      
      // Mock the fetchAppRepositories function to throw this non-standard error
      mockFetchAppRepositories.mockRejectedValueOnce(unknownError);
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify error is mapped to a generic API error
      // The implementation in apiErrorHandler.ts maps unknown objects to API_ERROR
      verifyStandardizedErrorResponse(response, {
        statusCode: 500,
        errorCode: 'API_ERROR', // Changed from UNKNOWN_ERROR to match apiErrorHandler.ts
        errorMessageContains: ['error'],
        hasDetails: true
      });
    });
    
    it('maps primitive error values to API_ERROR', async () => {
      // Mock the fetchAppRepositories function to throw a string
      mockFetchAppRepositories.mockRejectedValueOnce("Just a string error");
      
      // Call the handler
      const response = await reposTestHelper.callHandler('/api/repos');
      
      // Verify error is mapped to a generic API error
      verifyStandardizedErrorResponse(response, {
        statusCode: 500,
        errorCode: 'API_ERROR', // Changed from UNKNOWN_ERROR to match apiErrorHandler.ts
        hasDetails: true
      });
    });
  });

  describe('Error Response Structure Uniformity', () => {
    // Tests to ensure all error responses have a consistent structure
    
    it('ensures standardized error responses for each error type', async () => {
      // Testing each error type individually instead of in a loop
      // This makes it clearer which specific error type might be failing
      
      // Test AUTH_ERROR (403)
      jest.clearAllMocks();
      mockGetServerSession.mockResolvedValue({
        ...mockSession,
        installationId: mockInstallation.id
      });
      mockFetchAppRepositories.mockRejectedValueOnce(mockErrors.createAuthError());
      const authResponse = await reposTestHelper.callHandler('/api/repos');
      expect(authResponse.status).toBe(403);
      expect(authResponse.data.code).toBe('GITHUB_AUTH_ERROR');
      expect(authResponse.data.error).toBeDefined();
      expect(authResponse.data.details).toBeDefined();
      expect(authResponse.data.signOutRequired).toBe(true);
      
      // Test TOKEN_ERROR (403)
      jest.clearAllMocks();
      mockGetServerSession.mockResolvedValue({
        ...mockSession, 
        installationId: mockInstallation.id
      });
      mockFetchAppRepositories.mockRejectedValueOnce(mockErrors.createTokenError());
      const tokenResponse = await reposTestHelper.callHandler('/api/repos');
      expect(tokenResponse.status).toBe(403);
      expect(tokenResponse.data.code).toBe('GITHUB_TOKEN_ERROR');
      expect(tokenResponse.data.error).toBeDefined();
      expect(tokenResponse.data.details).toBeDefined();
      expect(tokenResponse.data.signOutRequired).toBe(true);
      
      // Test RATE_LIMIT_ERROR (429)
      jest.clearAllMocks();
      mockGetServerSession.mockResolvedValue({
        ...mockSession,
        installationId: mockInstallation.id
      });
      mockFetchAppRepositories.mockRejectedValueOnce(mockErrors.createRateLimitError());
      const rateResponse = await reposTestHelper.callHandler('/api/repos');
      expect(rateResponse.status).toBe(429);
      expect(rateResponse.data.code).toBe('GITHUB_RATE_LIMIT_ERROR');
      expect(rateResponse.data.error).toBeDefined();
      expect(rateResponse.data.details).toBeDefined();
      expect(rateResponse.data.resetAt).toBeDefined();
      
      // Test NOT_FOUND_ERROR (404)
      jest.clearAllMocks();
      mockGetServerSession.mockResolvedValue({
        ...mockSession,
        installationId: mockInstallation.id
      });
      mockFetchAppRepositories.mockRejectedValueOnce(mockErrors.createNotFoundError());
      const notFoundResponse = await reposTestHelper.callHandler('/api/repos');
      expect(notFoundResponse.status).toBe(404);
      expect(notFoundResponse.data.code).toBe('GITHUB_NOT_FOUND_ERROR');
      expect(notFoundResponse.data.error).toBeDefined();
      expect(notFoundResponse.data.details).toBeDefined();
    });
  });
});
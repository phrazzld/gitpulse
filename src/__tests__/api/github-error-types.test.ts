/**
 * Tests for handling specific GitHub error types in API routes
 * This file focuses on testing that the API routes correctly handle the specific GitHub error types
 * when thrown by the data fetching layer
 */
import { NextRequest } from 'next/server';
import { GET as getRepos } from '@/app/api/repos/route';
import { GET as getMyActivity } from '@/app/api/my-activity/route';
import { GET as getSummary } from '@/app/api/summary/route';
import { GET as getContributors } from '@/app/api/contributors/route';
import { GET as getMyOrgActivity } from '@/app/api/my-org-activity/route';
import { GET as getTeamActivity } from '@/app/api/team-activity/route';

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

// Create test helpers for each API route
const reposTestHelper = createApiHandlerTestHelper(getRepos as (req: NextRequest) => any);
const myActivityTestHelper = createApiHandlerTestHelper(getMyActivity as (req: NextRequest) => any);
const summaryTestHelper = createApiHandlerTestHelper(getSummary as (req: NextRequest) => any);
const contributorsTestHelper = createApiHandlerTestHelper(getContributors as (req: NextRequest) => any);
const myOrgActivityTestHelper = createApiHandlerTestHelper(getMyOrgActivity as (req: NextRequest) => any);
const teamActivityTestHelper = createApiHandlerTestHelper(getTeamActivity as (req: NextRequest) => any);

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
      
      // Verify the error response
      verifyErrorResponse(response, 429, 'GITHUB_RATE_LIMIT_ERROR', { 
        shouldHaveResetAt: true 
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

    it('handles rate limit errors in /api/contributors', async () => {
      // Mock the fetchCommitsForRepositoriesWithOctokit function to throw a rate limit error
      mockFetchCommitsForRepositoriesWithOctokit.mockRejectedValueOnce(rateLimitError);
      
      // Call the handler with required parameters
      const response = await contributorsTestHelper.callHandler('/api/contributors', 'GET', {
        repo: 'test-org/repo-1'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 429, 'GITHUB_RATE_LIMIT_ERROR', { 
        shouldHaveResetAt: true 
      });
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('handles rate limit errors in /api/my-org-activity', async () => {
      // Mock the fetchAppRepositories function to throw a rate limit error
      mockFetchAppRepositories.mockRejectedValueOnce(rateLimitError);
      
      // Call the handler with required parameters
      const response = await myOrgActivityTestHelper.callHandler('/api/my-org-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        organization: 'test-org'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 429, 'GITHUB_RATE_LIMIT_ERROR', { 
        shouldHaveResetAt: true 
      });
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('handles rate limit errors in /api/team-activity', async () => {
      // Mock the fetchAppRepositories function to throw a rate limit error
      mockFetchAppRepositories.mockRejectedValueOnce(rateLimitError);
      
      // Call the handler with required parameters
      const response = await teamActivityTestHelper.callHandler('/api/team-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        repository: 'test-org/repo-1'
      });
      
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
      
      // Verify the error response
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

    it('handles authentication errors in /api/contributors', async () => {
      // Mock the createAuthenticatedOctokit function to throw an auth error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(authError);
      
      // Call the handler with required parameters
      const response = await contributorsTestHelper.callHandler('/api/contributors', 'GET', {
        repo: 'test-org/repo-1'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 403, 'GITHUB_AUTH_ERROR', { 
        shouldHaveSignOutRequired: true 
      });
    });

    it('handles authentication errors in /api/my-org-activity', async () => {
      // Mock the createAuthenticatedOctokit function to throw an auth error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(authError);
      
      // Call the handler with required parameters
      const response = await myOrgActivityTestHelper.callHandler('/api/my-org-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        organization: 'test-org'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 403, 'GITHUB_AUTH_ERROR', { 
        shouldHaveSignOutRequired: true 
      });
    });

    it('handles authentication errors in /api/team-activity', async () => {
      // Mock the createAuthenticatedOctokit function to throw an auth error
      mockCreateAuthenticatedOctokit.mockRejectedValueOnce(authError);
      
      // Call the handler with required parameters
      const response = await teamActivityTestHelper.callHandler('/api/team-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        repository: 'test-org/repo-1'
      });
      
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

    it('handles not found errors in /api/contributors', async () => {
      // Mock the fetchCommitsForRepositoriesWithOctokit function to throw a not found error
      mockFetchCommitsForRepositoriesWithOctokit.mockRejectedValueOnce(notFoundError);
      
      // Call the handler with required parameters
      const response = await contributorsTestHelper.callHandler('/api/contributors', 'GET', {
        repo: 'test-org/repo-1'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 404, 'GITHUB_NOT_FOUND_ERROR');
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('handles not found errors in /api/my-org-activity', async () => {
      // Mock the fetchAppRepositories function to throw a not found error
      mockFetchAppRepositories.mockRejectedValueOnce(notFoundError);
      
      // Call the handler with required parameters
      const response = await myOrgActivityTestHelper.callHandler('/api/my-org-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        organization: 'test-org'
      });
      
      // Verify the error response
      verifyErrorResponse(response, 404, 'GITHUB_NOT_FOUND_ERROR');
      
      // Verify authentication was attempted
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('handles not found errors in /api/team-activity', async () => {
      // Mock the fetchAppRepositories function to throw a not found error
      mockFetchAppRepositories.mockRejectedValueOnce(notFoundError);
      
      // Call the handler with required parameters
      const response = await teamActivityTestHelper.callHandler('/api/team-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        repository: 'test-org/repo-1'
      });
      
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
});
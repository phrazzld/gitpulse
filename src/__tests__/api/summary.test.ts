import { NextRequest } from 'next/server';
import { GET } from '@/app/api/summary/route';
import { 
  mockCreateAuthenticatedOctokit,
  mockOctokit,
  mockFetchRepositories,
  mockFetchAppRepositories,
  mockFetchCommitsForRepositoriesWithOctokit,
  createApiHandlerTestHelper,
  verifyCredentialHandling,
  verifyOctokitPassing,
  mockGetServerSession,
} from '../api-test-utils';
import { mockRepositories, mockActivityCommits, mockInstallation, mockSession, mockSummary } from '../test-utils';

// Mock the Gemini API for generating summaries
jest.mock('@/lib/gemini', () => ({
  generateCommitSummary: jest.fn().mockResolvedValue(mockSummary.aiSummary)
}));

// Set Gemini API key in environment
process.env.GEMINI_API_KEY = 'test-api-key';

// Create test helper for the summary API route
const summaryTestHelper = createApiHandlerTestHelper(GET as (req: NextRequest) => any);

describe('API: /api/summary', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockFetchRepositories.mockResolvedValue(mockRepositories);
    mockFetchAppRepositories.mockResolvedValue(mockRepositories);
    mockFetchCommitsForRepositoriesWithOctokit.mockResolvedValue(mockActivityCommits);
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      installationId: mockInstallation.id
    });
  });

  it('should properly authenticate and fetch summary with GitHub App', async () => {
    // Call the handler with required parameters
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.user).toBe(mockSession.user.name);
    expect(response.data.commits).toEqual(mockActivityCommits);
    expect(response.data.aiSummary).toBeDefined();
    expect(response.data.authMethod).toBe('github_app');
    
    // Verify authentication flow
    verifyCredentialHandling('app', undefined, mockInstallation.id);
    
    // Verify repositories were fetched with the authenticated Octokit instance
    verifyOctokitPassing(mockFetchAppRepositories);
    
    // Verify commits were fetched with the authenticated Octokit instance
    expect(mockFetchCommitsForRepositoriesWithOctokit).toHaveBeenCalledWith(
      mockOctokit,
      expect.any(Array), // Repository names
      '2025-01-01',
      '2025-01-31',
      undefined // No author filter by default
    );
  });

  it('should properly authenticate and fetch summary with OAuth token', async () => {
    // Mock session without installation ID
    mockGetServerSession.mockResolvedValueOnce({
      ...mockSession,
      installationId: undefined
    });
    
    // Call the handler
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.authMethod).toBe('oauth');
    
    // Verify authentication flow
    verifyCredentialHandling('oauth', mockSession.accessToken);
    
    // Verify repositories were fetched with the authenticated Octokit instance
    verifyOctokitPassing(mockFetchRepositories);
  });

  it('should handle filtering by contributors', async () => {
    // Call the handler with contributor filter
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31',
      contributors: 'testuser,anotheruser'
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.filterInfo.contributors).toEqual(['testuser', 'anotheruser']);
    
    // Verify the filter was applied to commits
    expect(response.data.commits.length).toBeGreaterThan(0);
  });

  it('should handle filtering by organizations', async () => {
    // Call the handler with organization filter
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31',
      organizations: 'test-org'
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.filterInfo.organizations).toEqual(['test-org']);
    
    // Verify repositories were filtered
    expect(mockFetchAppRepositories).toHaveBeenCalled();
  });

  it('should handle filtering by repositories', async () => {
    // Call the handler with repository filter
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31',
      repositories: 'test-org/repo-1'
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.filterInfo.repositories).toEqual(['test-org/repo-1']);
  });

  it('should return 401 when no session is available', async () => {
    // Mock no session
    mockGetServerSession.mockResolvedValueOnce(null);
    
    // Call the handler
    const response = await summaryTestHelper.callHandler('/api/summary');
    
    // Verify the error response
    expect(response.status).toBe(401);
    expect(response.data.error).toBe('Unauthorized');
    
    // Verify no authentication or data fetching was attempted
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalled();
  });

  it('should return 403 when no authentication method is available', async () => {
    // Mock session without accessToken or installationId
    mockGetServerSession.mockResolvedValueOnce({
      user: mockSession.user,
      expires: mockSession.expires
    });
    
    // Call the handler
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify the error response
    expect(response.status).toBe(403);
    expect(response.data.error).toBeTruthy();
    expect(response.data.needsInstallation).toBe(true);
    
    // Verify no authentication or data fetching was attempted
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalled();
  });

  it('should return 400 when date parameters are missing', async () => {
    // Call the handler without required date parameters
    const response = await summaryTestHelper.callHandler('/api/summary');
    
    // Verify the error response
    expect(response.status).toBe(400);
    expect(response.data.error).toContain('Missing required parameters');
  });

  it('should return 500 when Gemini API key is missing', async () => {
    // Save original API key and remove it
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    
    // Call the handler
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify the error response
    expect(response.status).toBe(500);
    expect(response.data.error).toContain('Missing Gemini API key');
    
    // Restore API key
    process.env.GEMINI_API_KEY = originalKey;
  });

  it('should handle repositories with no matching filters', async () => {
    // Mock empty repositories after filtering
    mockFetchAppRepositories.mockResolvedValueOnce([]);
    
    // Call the handler with filters that result in no repositories
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31',
      organizations: 'non-existent-org'
    });
    
    // Verify the error response
    expect(response.status).toBe(404);
    expect(response.data.error).toContain('No repositories match');
  });

  it('should handle API errors correctly', async () => {
    // Mock an error during repository fetching
    const apiError = new Error('API Error');
    mockFetchAppRepositories.mockRejectedValueOnce(apiError);
    
    // Call the handler
    const response = await summaryTestHelper.callHandler('/api/summary', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify error response
    expect(response.status).toBe(500);
    expect(response.data.error).toBeTruthy();
    expect(response.data.details).toBeTruthy();
  });
});
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/my-activity/route';
import { 
  mockCreateAuthenticatedOctokit,
  mockOctokit,
  mockFetchRepositories,
  mockFetchAppRepositories,
  mockFetchCommitsForRepositoriesWithOctokit,
  createApiHandlerTestHelper,
  verifyCredentialHandling,
  verifyOctokitPassing,
  verifyRepositoryFetchingWithOctokit,
  mockGetServerSession,
} from '../api-test-utils';
import { mockRepositories, mockActivityCommits, mockInstallation, mockSession } from '../test-utils';

// Create test helper for the my-activity API route
const myActivityTestHelper = createApiHandlerTestHelper(GET as (req: NextRequest) => any);

describe('API: /api/my-activity', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockFetchRepositories.mockResolvedValue(mockRepositories);
    mockFetchAppRepositories.mockResolvedValue(mockRepositories);
    mockFetchCommitsForRepositoriesWithOctokit.mockResolvedValue(mockActivityCommits);
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      profile: {
        login: 'testuser'
      }
    });
  });

  it('should properly authenticate and fetch commits with OAuth', async () => {
    // Call the handler with default setup (has access token)
    const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.commits.length).toBeGreaterThan(0);
    expect(response.data.user).toBe(mockSession.user.name);
    
    // Verify authentication flow
    verifyCredentialHandling('oauth', mockSession.accessToken);
    
    // Verify repositories were fetched using the direct function with octokit
    verifyRepositoryFetchingWithOctokit('oauth');
    
    // Verify commits were fetched with the authenticated Octokit instance
    // using the repo names from the fetched repositories
    const repoNames = mockRepositories.map(repo => repo.full_name);
    expect(mockFetchCommitsForRepositoriesWithOctokit).toHaveBeenCalledWith(
      mockOctokit,
      repoNames,
      expect.any(String),
      expect.any(String),
      'testuser'
    );
  });

  it('should properly authenticate and fetch commits with GitHub App installation', async () => {
    // Mock session with installation ID
    mockGetServerSession.mockResolvedValueOnce({
      ...mockSession,
      profile: {
        login: 'testuser'
      },
      installationId: mockInstallation.id,
      accessToken: undefined
    });
    
    // Call the handler
    const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.commits.length).toBeGreaterThan(0);
    
    // Verify authentication flow
    verifyCredentialHandling('app', undefined, mockInstallation.id);
    
    // Verify repositories were fetched using the App authentication direct function
    verifyRepositoryFetchingWithOctokit('app');
    
    // Verify commits were fetched with the authenticated Octokit instance
    const repoNames = mockRepositories.map(repo => repo.full_name);
    expect(mockFetchCommitsForRepositoriesWithOctokit).toHaveBeenCalledWith(
      mockOctokit,
      repoNames,
      expect.any(String),
      expect.any(String),
      'testuser'
    );
  });

  it('should handle pagination parameters', async () => {
    // Call the handler with pagination parameters
    const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31',
      cursor: 'abc123',
      limit: '10'
    });
    
    // Verify the response includes pagination info
    expect(response.status).toBe(200);
    expect(response.data.pagination).toBeDefined();
  });

  it('should return 401 when no session is available', async () => {
    // Mock no session
    mockGetServerSession.mockResolvedValueOnce(null);
    
    // Call the handler
    const response = await myActivityTestHelper.callHandler('/api/my-activity');
    
    // Verify the error response
    expect(response.status).toBe(401);
    expect(response.data.error).toBe('Unauthorized');
    
    // Verify no authentication or data fetching was attempted
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalled();
    expect(mockFetchAllRepositories).not.toHaveBeenCalled();
    expect(mockFetchCommitsForRepositoriesWithOctokit).not.toHaveBeenCalled();
  });

  it('should return 401 when no authentication method is available', async () => {
    // Mock session without accessToken or installationId
    mockGetServerSession.mockResolvedValueOnce({
      user: mockSession.user,
      expires: mockSession.expires
    });
    
    // Call the handler
    const response = await myActivityTestHelper.callHandler('/api/my-activity');
    
    // Verify the error response
    expect(response.status).toBe(401);
    expect(response.data.error).toBeTruthy();
    expect(response.data.code).toBe('GITHUB_AUTH_ERROR');
    
    // Verify no authentication or data fetching was attempted
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalled();
  });

  it('should handle repository fetch errors correctly', async () => {
    // Mock an error during repository fetching for both OAuth and App methods
    const apiError = new Error('Repository API Error');
    mockFetchRepositories.mockRejectedValueOnce(apiError);
    mockFetchAppRepositories.mockRejectedValueOnce(apiError);
    
    // Call the handler
    const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify error response
    expect(response.status).toBe(500);
    expect(response.data.error).toContain('Error fetching repositories');
    expect(response.data.code).toBe('GITHUB_REPO_ERROR');
    
    // Verify one of the direct functions was called
    expect(mockFetchRepositories).toHaveBeenCalledTimes(1);
  });

  it('should handle commit fetch errors correctly', async () => {
    // Mock an error during commit fetching
    const apiError = new Error('Commit API Error');
    mockFetchCommitsForRepositoriesWithOctokit.mockRejectedValueOnce(apiError);
    
    // Call the handler
    const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify error response
    expect(response.status).toBe(500);
    expect(response.data.error).toContain('Error fetching commits');
    expect(response.data.code).toBe('GITHUB_COMMIT_ERROR');
  });

  it('should include cache headers', async () => {
    // Call the handler
    const response = await myActivityTestHelper.callHandler('/api/my-activity', 'GET', {
      since: '2025-01-01',
      until: '2025-01-31'
    });
    
    // Verify cache headers
    expect(response.headers.etag).toBeTruthy();
    expect(response.headers['cache-control']).toBeTruthy();
  });
});
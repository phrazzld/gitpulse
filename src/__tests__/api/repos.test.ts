import { NextRequest } from 'next/server';
import { GET } from '@/app/api/repos/route';
import { 
  mockCreateAuthenticatedOctokit,
  mockOctokit,
  mockFetchRepositories,
  mockFetchAppRepositories,
  createApiHandlerTestHelper,
  verifyCredentialHandling,
  verifyOctokitPassing,
  mockGetServerSession,
} from '../api-test-utils';
import { mockRepositories, mockInstallation, mockSession } from '../test-utils';

// Create test helper for the repos API route
const reposTestHelper = createApiHandlerTestHelper(GET as (req: NextRequest) => any);

describe('API: /api/repos', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock implementations
    mockFetchRepositories.mockResolvedValue(mockRepositories);
    mockFetchAppRepositories.mockResolvedValue(mockRepositories);
    mockGetServerSession.mockResolvedValue({
      ...mockSession,
      installationId: mockInstallation.id
    });
  });

  it('should properly authenticate with GitHub App and fetch repositories', async () => {
    // Call the handler with default setup (has installation ID)
    const response = await reposTestHelper.callHandler('/api/repos');
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.repositories).toEqual(mockRepositories);
    expect(response.data.authMethod).toBe('github_app');
    expect(response.data.currentInstallation).toBeTruthy();
    
    // Verify authentication flow
    verifyCredentialHandling('app', undefined, mockInstallation.id);
    
    // Verify Octokit instance was passed to the correct data fetching function
    verifyOctokitPassing(mockFetchAppRepositories);
  });

  it('should fall back to OAuth authentication when no installation ID is present', async () => {
    // Mock session without installation ID
    mockGetServerSession.mockResolvedValueOnce({
      ...mockSession,
      installationId: undefined
    });
    
    // Call the handler
    const response = await reposTestHelper.callHandler('/api/repos');
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(response.data.repositories).toEqual(mockRepositories);
    expect(response.data.authMethod).toBe('oauth');
    
    // Verify authentication flow
    verifyCredentialHandling('oauth', mockSession.accessToken);
    
    // Verify Octokit instance was passed to the correct data fetching function
    verifyOctokitPassing(mockFetchRepositories);
  });

  it('should handle requested installation ID from query params', async () => {
    // Call the handler with a specific installation ID
    const requestedInstallationId = 456;
    const response = await reposTestHelper.callHandler('/api/repos', 'GET', {
      installation_id: requestedInstallationId.toString()
    });
    
    // Verify the response
    expect(response.status).toBe(200);
    
    // Verify authentication flow with the requested installation ID
    verifyCredentialHandling('app', undefined, requestedInstallationId);
  });

  it('should return 403 when no authentication method is available', async () => {
    // Mock session without accessToken or installationId
    mockGetServerSession.mockResolvedValueOnce({
      user: mockSession.user,
      expires: mockSession.expires
    });
    
    // Call the handler
    const response = await reposTestHelper.callHandler('/api/repos');
    
    // Verify the error response
    expect(response.status).toBe(403);
    expect(response.data.error).toBeTruthy();
    expect(response.data.needsInstallation).toBe(true);
    
    // Verify no authentication or data fetching was attempted
    expect(mockCreateAuthenticatedOctokit).not.toHaveBeenCalled();
    expect(mockFetchRepositories).not.toHaveBeenCalled();
    expect(mockFetchAppRepositories).not.toHaveBeenCalled();
  });

  it('should handle API errors correctly', async () => {
    // Mock an error during repository fetching
    const apiError = new Error('API Error');
    mockFetchAppRepositories.mockRejectedValueOnce(apiError);
    
    // Call the handler
    const response = await reposTestHelper.callHandler('/api/repos');
    
    // Verify error response
    expect(response.status).toBe(500);
    expect(response.data.error).toBeTruthy();
    
    // Verify authentication was attempted
    expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
  });

  it('should include ETag and cache headers', async () => {
    // Call the handler
    const response = await reposTestHelper.callHandler('/api/repos');
    
    // Verify cache headers
    expect(response.headers.etag).toBeTruthy();
    expect(response.headers['cache-control']).toBeTruthy();
  });
});
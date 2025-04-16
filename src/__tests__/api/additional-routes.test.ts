import { NextRequest } from 'next/server';
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
  verifyCredentialHandling,
  verifyOctokitPassing,
  verifyRepositoryFetchingWithOctokit,
  mockGetServerSession,
} from '../api-test-utils';
import { mockRepositories, mockActivityCommits, mockInstallation, mockSession } from '../test-utils';

// Create test helpers for each API route
const contributorsTestHelper = createApiHandlerTestHelper(getContributors as (req: NextRequest) => any);
const myOrgActivityTestHelper = createApiHandlerTestHelper(getMyOrgActivity as (req: NextRequest) => any);
const teamActivityTestHelper = createApiHandlerTestHelper(getTeamActivity as (req: NextRequest) => any);

describe('Additional API Routes Tests', () => {
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

  describe('API: /api/contributors', () => {
    it('should properly authenticate and fetch contributors', async () => {
      // Call the handler
      const response = await contributorsTestHelper.callHandler('/api/contributors', 'GET', {
        repo: 'test-org/repo-1'
      });
      
      // Verify the response
      expect(response.status).toBe(200);
      
      // Verify authentication flow
      verifyCredentialHandling('app', undefined, mockInstallation.id);
      
      // Verify Octokit instance was passed to data fetching functions
      expect(mockCreateAuthenticatedOctokit).toHaveBeenCalled();
    });

    it('should return 400 when repo parameter is missing', async () => {
      // Call the handler without repo parameter
      const response = await contributorsTestHelper.callHandler('/api/contributors');
      
      // Verify the error response
      expect(response.status).toBe(400);
      expect(response.data.error).toBeTruthy();
    });

    it('should return 401 when no session is available', async () => {
      // Mock no session
      mockGetServerSession.mockResolvedValueOnce(null);
      
      // Call the handler
      const response = await contributorsTestHelper.callHandler('/api/contributors', 'GET', {
        repo: 'test-org/repo-1'
      });
      
      // Verify the error response
      expect(response.status).toBe(401);
      expect(response.data.error).toBe('Unauthorized');
    });
  });

  describe('API: /api/my-org-activity', () => {
    it('should properly authenticate and fetch organization activity', async () => {
      // Call the handler
      const response = await myOrgActivityTestHelper.callHandler('/api/my-org-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        organization: 'test-org'
      });
      
      // Verify the response
      expect(response.status).toBe(200);
      
      // Verify authentication flow
      verifyCredentialHandling('app', undefined, mockInstallation.id);
      
      // Verify the correct repository fetching function was used
      verifyRepositoryFetchingWithOctokit('app');
      
      // Verify commits were fetched with the octokit instance
      verifyOctokitPassing(mockFetchCommitsForRepositoriesWithOctokit, 
        expect.any(Array),
        expect.any(String),
        expect.any(String),
        expect.anything()
      );
    });

    it('should return 400 when required parameters are missing', async () => {
      // Call the handler without required parameters
      const response = await myOrgActivityTestHelper.callHandler('/api/my-org-activity');
      
      // Verify the error response
      expect(response.status).toBe(400);
      expect(response.data.error).toBeTruthy();
    });

    it('should return 401 when no session is available', async () => {
      // Mock no session
      mockGetServerSession.mockResolvedValueOnce(null);
      
      // Call the handler
      const response = await myOrgActivityTestHelper.callHandler('/api/my-org-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        organization: 'test-org'
      });
      
      // Verify the error response
      expect(response.status).toBe(401);
      expect(response.data.error).toBe('Unauthorized');
    });
  });

  describe('API: /api/team-activity', () => {
    it('should properly authenticate and fetch team activity', async () => {
      // Call the handler
      const response = await teamActivityTestHelper.callHandler('/api/team-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        repository: 'test-org/repo-1'
      });
      
      // Verify the response
      expect(response.status).toBe(200);
      
      // Verify authentication flow
      verifyCredentialHandling('app', undefined, mockInstallation.id);
      
      // Verify the correct repository fetching function was used
      verifyRepositoryFetchingWithOctokit('app');
      
      // Verify commits were fetched with the authenticated Octokit instance
      verifyOctokitPassing(mockFetchCommitsForRepositoriesWithOctokit, 
        expect.any(Array),
        expect.any(String),
        expect.any(String)
      );
    });

    it('should return 400 when required parameters are missing', async () => {
      // Call the handler without required parameters
      const response = await teamActivityTestHelper.callHandler('/api/team-activity');
      
      // Verify the error response
      expect(response.status).toBe(400);
      expect(response.data.error).toBeTruthy();
    });

    it('should return 401 when no session is available', async () => {
      // Mock no session
      mockGetServerSession.mockResolvedValueOnce(null);
      
      // Call the handler
      const response = await teamActivityTestHelper.callHandler('/api/team-activity', 'GET', {
        since: '2025-01-01',
        until: '2025-01-31',
        repository: 'test-org/repo-1'
      });
      
      // Verify the error response
      expect(response.status).toBe(401);
      expect(response.data.error).toBe('Unauthorized');
    });
  });
});
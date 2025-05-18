/**
 * Integration tests for the summary API route
 * @jest-environment node
 */

import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { createAuthOptions } from "@/lib/auth/authConfig";
import { createSummaryHandlers } from '../handlers';
import { logger } from '@/lib/logger';
import { getAllAppInstallations, fetchAllRepositories } from '@/lib/github';

// Mock dependencies
jest.mock('@/lib/auth/authConfig', () => ({
  createAuthOptions: jest.fn()
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('@/lib/github', () => ({
  getAllAppInstallations: jest.fn(),
  fetchAllRepositories: jest.fn()
}));

const mockHandlers = {
  filterRepositoriesByOrgAndRepoNames: jest.fn(),
  mapRepositoriesToInstallations: jest.fn(),
  fetchCommitsWithAuthMethod: jest.fn(),
  filterCommitsByContributor: jest.fn(),
  groupCommitsByFilter: jest.fn(),
  generateSummaryData: jest.fn(),
  prepareSummaryResponse: jest.fn()
};

jest.mock('../handlers', () => ({
  createSummaryHandlers: jest.fn(() => mockHandlers)
}));

describe('Summary API Route', () => {
  // Create a helper to mock the NextRequest
  const createMockRequest = (params = {}) => {
    const url = new URL('https://example.com/api/summary');
    
    // Add default parameters
    url.searchParams.set('since', '2023-01-01');
    url.searchParams.set('until', '2023-01-31');
    
    // Add custom parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
    
    // Create headers
    const headers = new Headers();
    
    // Create the mock request
    const request = new NextRequest(url, {
      headers
    });
    
    return request;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for auth config
    (createAuthOptions as jest.Mock).mockReturnValue({
      providers: [],
      session: { strategy: 'jwt' }
    });
    
    // Default mocked session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Test User', email: 'test@example.com' },
      accessToken: 'mock-access-token',
      installationId: 101
    });
    
    // Default mocked installations
    (getAllAppInstallations as jest.Mock).mockResolvedValue([
      { id: 101, account: { login: 'org1' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' }
    ]);
    
    // Default mocked repositories
    (fetchAllRepositories as jest.Mock).mockResolvedValue([
      { id: 1, full_name: 'org1/repo1', name: 'repo1', owner: { login: 'org1' }, private: false, html_url: '', description: null }
    ]);
    
    // Default handler mocks
    mockHandlers.filterRepositoriesByOrgAndRepoNames.mockReturnValue([
      { id: 1, full_name: 'org1/repo1', name: 'repo1', owner: { login: 'org1' }, private: false, html_url: '', description: null }
    ]);
    
    mockHandlers.mapRepositoriesToInstallations.mockReturnValue({
      orgToInstallationMap: new Map([['org1', 101]]),
      reposByInstallation: { '101': ['org1/repo1'] }
    });
    
    mockHandlers.fetchCommitsWithAuthMethod.mockResolvedValue([
      { 
        sha: '1', 
        commit: { 
          author: { name: 'Test User', email: 'test@example.com', date: '2023-01-01T00:00:00Z' },
          message: 'Test commit'
        }, 
        author: { login: 'testuser', avatar_url: '' },
        html_url: 'https://github.com/org1/repo1/commit/1',
        repository: { full_name: 'org1/repo1' }
      }
    ]);
    
    mockHandlers.filterCommitsByContributor.mockImplementation(commits => commits);
    
    mockHandlers.groupCommitsByFilter.mockImplementation(commits => [{
      groupKey: 'all',
      groupName: 'All Commits',
      commitCount: commits.length,
      repositories: ['org1/repo1'],
      dates: ['2023-01-01'],
      commits
    }]);
    
    mockHandlers.generateSummaryData.mockResolvedValue({
      groupedResults: [{
        groupKey: 'all',
        groupName: 'All Commits',
        commitCount: 1,
        repositories: ['org1/repo1'],
        dates: ['2023-01-01'],
        commits: [{
          sha: '1', 
          commit: { 
            author: { name: 'Test User', email: 'test@example.com', date: '2023-01-01T00:00:00Z' },
            message: 'Test commit'
          }, 
          author: { login: 'testuser', avatar_url: '' },
          html_url: 'https://github.com/org1/repo1/commit/1',
          repository: { full_name: 'org1/repo1' }
        }]
      }],
      overallSummary: { keyThemes: ['Testing'], technicalAreas: ['Unit Tests'] }
    });
    
    mockHandlers.prepareSummaryResponse.mockImplementation((groupedResults, overallSummary, filterInfo, userName, authMethod, installationIds) => ({
      user: userName,
      commits: groupedResults[0]?.commits || [],
      stats: { totalCommits: 1, filesChanged: 1, additions: 10, deletions: 5, repositories: ['org1/repo1'], dates: ['2023-01-01'] },
      aiSummary: overallSummary,
      filterInfo,
      groupedResults,
      authMethod,
      installationIds: installationIds.length > 0 ? installationIds : null,
      installations: [],
      currentInstallations: []
    }));
  });
  
  describe('GET /api/summary', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated state
      (getServerSession as jest.Mock).mockResolvedValue(null);
      
      const request = createMockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
    
    it('should return 400 when required parameters are missing', async () => {
      // Create a request without setting the required parameters
      const url = new URL('https://example.com/api/summary');
      const request = new NextRequest(url);
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing required parameters');
    });
    
    it('should handle successful request with GitHub App installation', async () => {
      const request = createMockRequest({ installation_ids: '101' });
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.user).toBe('Test User');
      expect(data.authMethod).toBe('github_app');
      expect(data.installationIds).toEqual([101]);
      expect(data.groupedResults).toHaveLength(1);
      expect(data.aiSummary).toEqual({ keyThemes: ['Testing'], technicalAreas: ['Unit Tests'] });
      
      // Verify handler calls
      expect(mockHandlers.filterRepositoriesByOrgAndRepoNames).toHaveBeenCalled();
      expect(mockHandlers.mapRepositoriesToInstallations).toHaveBeenCalled();
      expect(mockHandlers.fetchCommitsWithAuthMethod).toHaveBeenCalled();
      expect(mockHandlers.filterCommitsByContributor).toHaveBeenCalled();
      expect(mockHandlers.groupCommitsByFilter).toHaveBeenCalled();
      expect(mockHandlers.generateSummaryData).toHaveBeenCalled();
      expect(mockHandlers.prepareSummaryResponse).toHaveBeenCalled();
    });
    
    it('should handle successful request with OAuth only', async () => {
      // Mock session without installation
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'mock-access-token'
        // No installationId
      });
      
      // Mock no installations available
      (getAllAppInstallations as jest.Mock).mockResolvedValue([]);
      
      const request = createMockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.authMethod).toBe('oauth');
      expect(data.installationIds).toBeNull();
    });
    
    it('should filter repositories by organization', async () => {
      const request = createMockRequest({ organizations: 'org1,org2' });
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      // Verify the handler was called with organization filters
      expect(mockHandlers.filterRepositoriesByOrgAndRepoNames).toHaveBeenCalledWith(
        expect.any(Array),
        ['org1', 'org2'],
        []
      );
    });
    
    it('should filter repositories by full name', async () => {
      const request = createMockRequest({ repositories: 'org1/repo1,org2/repo2' });
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      // Verify the handler was called with repository filters
      expect(mockHandlers.filterRepositoriesByOrgAndRepoNames).toHaveBeenCalledWith(
        expect.any(Array),
        [],
        ['org1/repo1', 'org2/repo2']
      );
    });
    
    it('should filter commits by contributor', async () => {
      const request = createMockRequest({ contributors: 'alice,bob' });
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      // Verify the handler was called with contributor filters
      expect(mockHandlers.filterCommitsByContributor).toHaveBeenCalledWith(
        expect.any(Array),
        ['alice', 'bob'],
        'Test User'
      );
    });
    
    it('should handle "me" as a special contributor filter', async () => {
      const request = createMockRequest({ contributors: 'me' });
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      // Verify the author filter was set
      expect(mockHandlers.fetchCommitsWithAuthMethod).toHaveBeenCalledWith(
        expect.any(Object),
        'mock-access-token',
        '2023-01-01',
        '2023-01-31',
        'Test User' // Author filter should be set to current user
      );
    });
    
    it('should return 404 when no repositories match filters', async () => {
      mockHandlers.filterRepositoriesByOrgAndRepoNames.mockReturnValue([]);
      
      const request = createMockRequest({ organizations: 'nonexistent' });
      const response = await GET(request);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('No repositories match');
    });
    
    it('should handle error from GitHub API', async () => {
      (fetchAllRepositories as jest.Mock).mockRejectedValue(new Error('GitHub API error'));
      
      const request = createMockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to generate summary');
    });
    
    it('should use first installation when none specified but available', async () => {
      // Mock session without installation ID but has access token
      (getServerSession as jest.Mock).mockResolvedValue({
        user: { name: 'Test User', email: 'test@example.com' },
        accessToken: 'mock-access-token'
        // No installationId
      });
      
      // Mock multiple installations available
      (getAllAppInstallations as jest.Mock).mockResolvedValue([
        { id: 101, account: { login: 'org1' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' },
        { id: 102, account: { login: 'org2' }, appSlug: 'app', appId: 1, repositorySelection: 'all', targetType: 'Organization' }
      ]);
      
      const request = createMockRequest();
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should use the first installation
      expect(data.installationIds).toEqual([101]);
      expect(fetchAllRepositories).toHaveBeenCalledWith('mock-access-token', 101);
    });
  });
});
/**
 * Integration tests for the summary API route
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from "next-auth";
import * as handlers from '../handlers';
import { logger } from '@/lib/logger';
import { getAllAppInstallations } from '@/lib/github';

// Mock dependencies
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
  getAllAppInstallations: jest.fn()
}));

jest.mock('../handlers', () => ({
  filterRepositoriesByOrgAndRepoNames: jest.fn(),
  mapRepositoriesToInstallations: jest.fn(),
  fetchCommitsWithAuthMethod: jest.fn(),
  filterCommitsByContributor: jest.fn(),
  groupCommitsByFilter: jest.fn(),
  generateSummaryData: jest.fn(),
  prepareSummaryResponse: jest.fn()
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
    
    return {
      url: url.toString(),
      nextUrl: url,
      headers: new Headers(),
    } as unknown as NextRequest;
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
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
    
    // Default handler mocks
    (handlers.filterRepositoriesByOrgAndRepoNames as jest.Mock).mockReturnValue([
      { id: 1, full_name: 'org1/repo1', name: 'repo1', owner: { login: 'org1' }, private: false, html_url: '', description: null }
    ]);
    
    (handlers.mapRepositoriesToInstallations as jest.Mock).mockReturnValue({
      orgToInstallationMap: new Map([['org1', 101]]),
      reposByInstallation: { '101': ['org1/repo1'] }
    });
    
    (handlers.fetchCommitsWithAuthMethod as jest.Mock).mockResolvedValue([
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
    
    (handlers.filterCommitsByContributor as jest.Mock).mockImplementation(commits => commits);
    
    (handlers.groupCommitsByFilter as jest.Mock).mockImplementation(commits => [{
      groupKey: 'all',
      groupName: 'All Commits',
      commitCount: commits.length,
      repositories: ['org1/repo1'],
      dates: ['2023-01-01'],
      commits
    }]);
    
    (handlers.generateSummaryData as jest.Mock).mockResolvedValue({
      groupedResults: [{
        groupKey: 'all',
        groupName: 'All Commits',
        commitCount: 1,
        repositories: ['org1/repo1'],
        dates: ['2023-01-01'],
        commits: [{ sha: '1', /* ... */ }]
      }],
      overallSummary: {
        keyThemes: ['Theme 1'],
        technicalAreas: ['Area 1'],
        summary: 'Test summary'
      }
    });
    
    (handlers.prepareSummaryResponse as jest.Mock).mockImplementation(
      (groupedResults, overallSummary, filterInfo, userName, authMethod, installationIds, installations) => ({
        user: userName,
        commits: groupedResults[0].commits,
        stats: { totalCommits: 1, repositories: ['org1/repo1'], dates: ['2023-01-01'] },
        aiSummary: overallSummary,
        filterInfo,
        groupedResults,
        authMethod,
        installationIds,
        installations,
        currentInstallations: installations
      })
    );
  });
  
  it('should return 401 when no session is available', async () => {
    // Mock no session
    (getServerSession as jest.Mock).mockResolvedValue(null);
    
    const request = createMockRequest();
    const response = await GET(request);
    
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });
  
  it('should return 400 when required date parameters are missing', async () => {
    const request = createMockRequest({ 
      since: null, 
      until: null
    });
    
    const response = await GET(request);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing required parameters');
  });
  
  it('should return 404 when no repositories match the filter criteria', async () => {
    // Mock empty repositories after filtering
    (handlers.filterRepositoriesByOrgAndRepoNames as jest.Mock).mockReturnValue([]);
    
    const request = createMockRequest({ 
      organizations: 'non-existent-org'
    });
    
    const response = await GET(request);
    
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toContain('No repositories match');
  });
  
  it('should return 500 when Gemini API key is missing', async () => {
    // Save original env and remove the key
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    
    const request = createMockRequest();
    const response = await GET(request);
    
    // Restore env
    process.env = originalEnv;
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain('Missing Gemini API key');
  });
  
  it('should return 200 with summary data for valid request', async () => {
    // Mock environment variable
    process.env.GEMINI_API_KEY = 'mock-api-key';
    
    const request = createMockRequest();
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    
    // Verify correct data is returned
    expect(data.user).toBe('Test User');
    expect(data.commits).toHaveLength(1);
    expect(data.aiSummary).toBeDefined();
    expect(data.groupedResults).toHaveLength(1);
    
    // Verify handlers were called with correct parameters
    expect(handlers.filterRepositoriesByOrgAndRepoNames).toHaveBeenCalled();
    expect(handlers.mapRepositoriesToInstallations).toHaveBeenCalled();
    expect(handlers.fetchCommitsWithAuthMethod).toHaveBeenCalled();
    expect(handlers.generateSummaryData).toHaveBeenCalled();
    expect(handlers.prepareSummaryResponse).toHaveBeenCalled();
  });
  
  it('should handle filtering by contributors', async () => {
    const request = createMockRequest({ 
      contributors: 'testuser,another-user'
    });
    
    await GET(request);
    
    // Verify filterCommitsByContributor was called with correct parameters
    expect(handlers.filterCommitsByContributor).toHaveBeenCalled();
    const callArgs = (handlers.filterCommitsByContributor as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toEqual(['testuser', 'another-user']);
  });
  
  it('should handle filtering by organizations', async () => {
    const request = createMockRequest({ 
      organizations: 'org1,org2'
    });
    
    await GET(request);
    
    // Verify filterRepositoriesByOrgAndRepoNames was called with correct parameters
    const callArgs = (handlers.filterRepositoriesByOrgAndRepoNames as jest.Mock).mock.calls[0];
    expect(callArgs[1]).toEqual(['org1', 'org2']);
  });
  
  it('should handle filtering by repositories', async () => {
    const request = createMockRequest({ 
      repositories: 'org1/repo1,org2/repo2'
    });
    
    await GET(request);
    
    // Verify filterRepositoriesByOrgAndRepoNames was called with correct parameters
    const callArgs = (handlers.filterRepositoriesByOrgAndRepoNames as jest.Mock).mock.calls[0];
    expect(callArgs[2]).toEqual(['org1/repo1', 'org2/repo2']);
  });
  
  it('should handle error during processing', async () => {
    // Mock error in handler
    (handlers.fetchCommitsWithAuthMethod as jest.Mock).mockRejectedValue(new Error('Test error'));
    
    const request = createMockRequest();
    const response = await GET(request);
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to generate summary');
    expect(data.details).toBe('Test error');
  });
  
  it('should handle GitHub auth errors', async () => {
    // Mock auth error
    const authError = new Error('Authentication failed');
    (authError as any).name = 'HttpError';
    (authError as any).message = 'Bad credentials';
    (handlers.fetchCommitsWithAuthMethod as jest.Mock).mockRejectedValue(authError);
    
    const request = createMockRequest();
    const response = await GET(request);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('GitHub authentication failed');
    expect(data.code).toBe('GITHUB_AUTH_ERROR');
  });
  
  it('should handle GitHub App config errors', async () => {
    // Mock app config error
    const appError = new Error('GitHub App credentials not configured');
    (handlers.fetchCommitsWithAuthMethod as jest.Mock).mockRejectedValue(appError);
    
    const request = createMockRequest();
    const response = await GET(request);
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('GitHub App not properly configured');
    expect(data.code).toBe('GITHUB_APP_CONFIG_ERROR');
  });
});
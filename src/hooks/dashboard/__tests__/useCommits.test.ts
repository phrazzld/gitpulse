/**
 * @jest-environment jsdom
 */

import { useCommits } from '../useCommits';
import { ActivityMode } from '@/types/dashboard';
import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createActivityFetcher } from '@/lib/activity';
import { logger } from '@/lib/logger';
import { FetchProvider } from '@/contexts/FetchContext';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/lib/activity', () => ({
  createActivityFetcher: jest.fn().mockImplementation(() => jest.fn())
}));
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Create a mock fetch function for testing
const mockFetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      commits: [{ id: 1, sha: 'abc123' }],
      stats: {
        totalCommits: 1,
        repositories: ['repo1'],
        dates: ['2022-01-01']
      }
    })
  })
);

describe('useCommits', () => {
  // Default props for testing
  const defaultProps = {
    dateRange: {
      since: '2022-01-01',
      until: '2022-12-31'
    },
    activityMode: 'my-activity' as ActivityMode,
    organizations: [] as readonly string[],
    repositories: [] as readonly string[],
    contributors: ['me'] as readonly string[],
    installationIds: [] as readonly number[]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    
    // Set up an authenticated session by default
    jest.spyOn(require('next-auth/react'), 'useSession').mockReturnValue({
      data: {
        accessToken: 'fake-token',
        user: { name: 'Test User', email: 'test@example.com' }
      },
      status: 'authenticated',
      update: jest.fn()
    });
  });

  // Helper function to create wrapper with FetchProvider
  const createWrapper = () => {
    const FetchProviderWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(
        FetchProvider,
        { fetchImplementation: mockFetch, children },
        null
      );
    FetchProviderWrapper.displayName = 'FetchProviderWrapper';
    return FetchProviderWrapper;
  };

  it('should fetch commits successfully', async () => {
    // Setup fetch to return successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        commits: [{ id: 1, sha: 'abc123' }],
        stats: {
          totalCommits: 1,
          repositories: ['repo1'],
          dates: ['2022-01-01']
        },
        user: 'testuser'
      })
    });
    
    const { result } = renderHook(() => useCommits(defaultProps), {
      wrapper: createWrapper()
    });
    
    // Initial state should be empty/loading false
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.commits).toEqual([]);
    expect(result.current.summary).toBeNull();
    
    // Call fetchCommits wrapped in act
    await act(async () => {
      await result.current.fetchCommits();
    });
    
    // Verify data was updated
    expect(result.current.error).toBeNull();
    expect(result.current.commits).toEqual([{ id: 1, sha: 'abc123' }]);
    expect(result.current.summary).toEqual({
      commits: [{ id: 1, sha: 'abc123' }],
      stats: {
        totalCommits: 1,
        repositories: ['repo1'],
        dates: ['2022-01-01']
      },
      user: 'testuser'
    });
    
    // Verify fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/summary?since=2022-01-01&until=2022-12-31&contributors=me&groupBy=chronological')
    );
    
    // Verify logger.info was called
    expect(logger.info).toHaveBeenCalledWith(
      'hooks:useCommits',
      'Successfully fetched commits',
      expect.objectContaining({
        count: 1,
        mode: 'my-activity'
      })
    );
  });

  it('should handle API errors correctly', async () => {
    // Mock API error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'API Error',
        code: 'GITHUB_COMMIT_ERROR'
      })
    });
    
    const { result } = renderHook(() => useCommits(defaultProps), {
      wrapper: createWrapper()
    });
    
    // Call fetchCommits
    await act(async () => {
      await result.current.fetchCommits();
    });
    
    // Verify error state
    expect(result.current.error).toBe('API Error');
    expect(result.current.commits).toEqual([]);
    expect(result.current.summary).toBeNull();
    
    // Verify logger.error was called
    expect(logger.error).toHaveBeenCalledWith(
      'hooks:useCommits',
      'Error fetching commits',
      expect.objectContaining({
        error: 'API Error',
        mode: 'my-activity'
      })
    );
  });

  it('should handle authentication errors', async () => {
    // Mock authentication error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({
        error: 'Unauthorized',
        code: 'GITHUB_AUTH_ERROR'
      })
    });
    
    const { result } = renderHook(() => useCommits(defaultProps), {
      wrapper: createWrapper()
    });
    
    // Call fetchCommits
    await act(async () => {
      await result.current.fetchCommits();
    });
    
    // Verify error state includes authentication message
    expect(result.current.error).toContain('GitHub authentication issue detected');
    expect(result.current.commits).toEqual([]);
    
    // Verify logger.error was called
    expect(logger.error).toHaveBeenCalledWith(
      'hooks:useCommits',
      'Error fetching commits',
      expect.objectContaining({
        error: expect.stringContaining('GitHub authentication issue detected')
      })
    );
  });

  it('should handle GitHub App installation errors', async () => {
    // Mock installation error
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        needsInstallation: true
      })
    });
    
    const { result } = renderHook(() => useCommits(defaultProps), {
      wrapper: createWrapper()
    });
    
    // Call fetchCommits
    await act(async () => {
      await result.current.fetchCommits();
    });
    
    // Verify error state includes installation message
    expect(result.current.error).toContain('GitHub App installation required');
  });

  it('should use correct API endpoints for different activity modes', async () => {
    // Test my-work-activity mode
    mockFetch.mockClear();
    (createActivityFetcher as jest.Mock).mockClear();
    
    const workActivityProps = {
      ...defaultProps,
      activityMode: 'my-work-activity' as ActivityMode
    };
    
    const { result: workResult } = renderHook(() => useCommits(workActivityProps), {
      wrapper: createWrapper()
    });
    
    // Call getActivityFetcher indirectly by calling fetchCommits
    await act(async () => {
      await workResult.current.fetchCommits();
    });
    
    // Let's check the API URL used for the fetch instead
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/summary')
    );
    
    // Test team-activity mode
    mockFetch.mockClear();
    
    const teamActivityProps = {
      ...defaultProps,
      activityMode: 'team-activity' as ActivityMode
    };
    
    const { result: teamResult } = renderHook(() => useCommits(teamActivityProps), {
      wrapper: createWrapper()
    });
    
    await act(async () => {
      await teamResult.current.fetchCommits();
    });
    
    // Verify fetch was called with the summary endpoint
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/summary')
    );
  });

  it('should include filter parameters in the request', async () => {
    // Test with all filters specified
    const filteredProps = {
      ...defaultProps,
      organizations: ['org1', 'org2'] as readonly string[],
      repositories: ['repo1', 'repo2'] as readonly string[],
      contributors: ['user1', 'user2'] as readonly string[],
      installationIds: [123, 456] as readonly number[]
    };
    
    const { result } = renderHook(() => useCommits(filteredProps), {
      wrapper: createWrapper()
    });
    
    // Call fetchCommits
    await act(async () => {
      await result.current.fetchCommits();
    });
    
    // Verify fetch was called with all parameters
    const fetchCall = mockFetch.mock.calls[0][0];
    expect(fetchCall).toMatch(/since=2022-01-01/);
    expect(fetchCall).toMatch(/until=2022-12-31/);
    expect(fetchCall).toMatch(/organizations=org1%2Corg2/);
    expect(fetchCall).toMatch(/repositories=repo1%2Crepo2/);
    expect(fetchCall).toMatch(/contributors=user1%2Cuser2/);
    expect(fetchCall).toMatch(/installation_ids=123%2C456/);
  });

  it('should handle missing authentication', async () => {
    // Mock missing authentication
    jest.spyOn(require('next-auth/react'), 'useSession').mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    });
    
    const { result } = renderHook(() => useCommits(defaultProps), {
      wrapper: createWrapper()
    });
    
    // Call fetchCommits
    await act(async () => {
      await result.current.fetchCommits();
    });
    
    // Should set error without calling fetch
    expect(result.current.error).toBe('Authentication required. Please sign in again.');
    expect(logger.warn).toHaveBeenCalledWith(
      'hooks:useCommits',
      'No authentication available for fetching commits'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle installation IDs even without session', async () => {
    // Mock missing session but provide installation IDs
    jest.spyOn(require('next-auth/react'), 'useSession').mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    });
    
    const propsWithInstallationIds = {
      ...defaultProps,
      installationIds: [123, 456] as readonly number[]
    };
    
    const { result } = renderHook(() => useCommits(propsWithInstallationIds), {
      wrapper: createWrapper()
    });
    
    // Call fetchCommits
    await act(async () => {
      await result.current.fetchCommits();
    });
    
    // Should proceed with fetch since installationIds are provided
    expect(mockFetch).toHaveBeenCalled();
    
    // Verify state after fetch completes
    expect(result.current.error).toBeNull();
    expect(result.current.commits).toHaveLength(1);
  });

  it('should handle fetch exception errors', async () => {
    // Mock fetch throwing a network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useCommits(defaultProps), {
      wrapper: createWrapper()
    });
    
    // Call fetchCommits
    await act(async () => {
      await result.current.fetchCommits();
    });
    
    // Verify error state
    expect(result.current.error).toBe('Network error');
    expect(logger.error).toHaveBeenCalledWith(
      'hooks:useCommits',
      'Error fetching commits',
      expect.objectContaining({
        error: 'Network error'
      })
    );
  });
});
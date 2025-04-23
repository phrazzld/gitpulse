/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useCommits } from '../useCommits';
import { useSession } from 'next-auth/react';
import { createActivityFetcher } from '@/lib/activity';

// Add missing waitFor function
const waitFor = async (callback: () => boolean | void, options = { timeout: 1000 }): Promise<void> => {
  const start = Date.now();
  while (Date.now() - start < options.timeout) {
    try {
      const result = callback();
      if (result !== false) {
        return;
      }
    } catch (e) {
      // ignore errors, they mean we need to try again
    }
    await new Promise(r => setTimeout(r, 50));
  }
  throw new Error('Timed out in waitFor');
};

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}));

jest.mock('@/lib/activity', () => ({
  createActivityFetcher: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn() as jest.Mock;

describe('useCommits', () => {
  // Default props for testing
  const defaultProps = {
    dateRange: {
      since: '2022-01-01',
      until: '2022-12-31'
    },
    activityMode: 'my-activity' as const,
    organizations: [] as readonly string[],
    repositories: [] as readonly string[],
    contributors: [] as readonly string[],
    installationIds: [] as readonly number[]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default session mock
    (useSession as jest.Mock).mockReturnValue({
      data: {
        accessToken: 'fake-token',
        user: { name: 'Test User', email: 'test@example.com' }
      },
      status: 'authenticated'
    });

    // Default fetch mock
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        commits: [{ id: 1, sha: 'abc123' }],
        stats: {
          totalCommits: 1,
          repositories: ['repo1'],
          dates: ['2022-01-01']
        }
      })
    });
  });

  it('should fetch commits successfully', async () => {
    const { result } = renderHook(() => useCommits(defaultProps));
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.commits).toEqual([]);
    
    // Call fetchCommits
    result.current.fetchCommits();
    
    // Check loading state
    expect(result.current.loading).toBe(true);
    
    // Wait for fetch to complete
    await waitFor(() => {
      return !result.current.loading;
    });
    
    // Verify data was updated
    expect(result.current.error).toBeNull();
    expect(result.current.commits).toEqual([{ id: 1, sha: 'abc123' }]);
    expect(result.current.summary).not.toBeNull();
    
    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/summary?since=2022-01-01&until=2022-12-31&groupBy=chronological')
    );
  });

  it('should handle API errors correctly', async () => {
    // Mock API error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'API Error',
        code: 'GITHUB_COMMIT_ERROR'
      })
    });
    
    const { result } = renderHook(() => useCommits(defaultProps));
    
    // Call fetchCommits
    result.current.fetchCommits();
    
    // Wait for fetch to complete
    await waitFor(() => {
      return !result.current.loading;
    });
    
    // Verify error state
    expect(result.current.error).toBe('API Error');
    expect(result.current.commits).toEqual([]);
    expect(result.current.summary).toBeNull();
  });

  it('should handle authentication errors', async () => {
    // Mock authentication error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'Unauthorized',
        code: 'GITHUB_AUTH_ERROR'
      })
    });
    
    const { result } = renderHook(() => useCommits(defaultProps));
    
    // Call fetchCommits
    result.current.fetchCommits();
    
    // Wait for fetch to complete
    await waitFor(() => {
      return !result.current.loading;
    });
    
    // Verify error state includes authentication message
    expect(result.current.error).toContain('GitHub authentication issue detected');
  });

  it('should handle GitHub App installation errors', async () => {
    // Mock installation error
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        needsInstallation: true
      })
    });
    
    const { result } = renderHook(() => useCommits(defaultProps));
    
    // Call fetchCommits
    result.current.fetchCommits();
    
    // Wait for fetch to complete
    await waitFor(() => {
      return !result.current.loading;
    });
    
    // Verify error state includes installation message
    expect(result.current.error).toContain('GitHub App installation required');
  });

  it('should use correct API endpoint based on activity mode', async () => {
    // Test with my-work-activity mode
    const workProps = {
      ...defaultProps,
      activityMode: 'my-work-activity' as const
    };
    
    // Create mock for createActivityFetcher
    (createActivityFetcher as jest.Mock).mockReturnValue(() => Promise.resolve({
      data: [],
      nextCursor: null,
      hasMore: false
    }));
    
    const { result } = renderHook((props) => useCommits(props), {
      initialProps: workProps
    });
    
    // Call fetchCommits
    result.current.fetchCommits();
    
    // Verify fetch was called with org activity endpoint
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/summary?')
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
    
    const { result } = renderHook(() => useCommits(filteredProps));
    
    // Call fetchCommits
    result.current.fetchCommits();
    
    // Verify fetch was called with all parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/since=2022-01-01/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/until=2022-12-31/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/organizations=org1%2Corg2/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/repositories=repo1%2Crepo2/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/contributors=user1%2Cuser2/)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/installation_ids=123%2C456/)
    );
  });
});
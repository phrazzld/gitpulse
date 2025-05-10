import { renderHookSafely } from '@/lib/tests/react-test-utils';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useSummary } from '../useSummary';
import { logger } from '@/lib/logger';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

// Mock global fetch
global.fetch = jest.fn();

// Helper to create a mock response
const createMockResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data)
  };
};

describe('useSummary', () => {
  const mockSession = {
    data: {
      user: { name: 'Test User', email: 'test@example.com' },
      accessToken: 'mock-token'
    },
    status: 'authenticated'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue(mockSession);
  });

  const defaultProps = {
    dateRange: { since: '2023-01-01', until: '2023-01-31' },
    activityMode: 'my-activity' as const,
    organizations: [],
    repositories: [],
    contributors: [],
    installationIds: []
  };

  it('should initialize with default values', () => {
    const { result } = renderHookSafely(() => useSummary(defaultProps));
    
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.summary).toBeNull();
    expect(result.current.installations).toEqual([]);
    expect(result.current.currentInstallations).toEqual([]);
    expect(result.current.authMethod).toBeNull();
  });

  it('should generate a summary successfully', async () => {
    const mockSummaryData = {
      user: 'Test User',
      commits: [{ id: 1 }, { id: 2 }],
      stats: {
        totalCommits: 2,
        repositories: ['repo1', 'repo2'],
        dates: ['2023-01-01', '2023-01-02']
      },
      aiSummary: {
        keyThemes: ['Theme 1', 'Theme 2']
      },
      authMethod: 'github_app',
      installations: [{ id: 1, account: { login: 'org1' } }],
      currentInstallations: [{ id: 1, account: { login: 'org1' } }]
    };

    (fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSummaryData));

    const { result } = renderHookSafely(() => useSummary(defaultProps));
    
    await act(async () => {
      await result.current.generateSummary();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.summary).toEqual(mockSummaryData);
    expect(result.current.authMethod).toBe('github_app');
    expect(result.current.installations).toEqual([{ id: 1, account: { login: 'org1' } }]);
    expect(result.current.currentInstallations).toEqual([{ id: 1, account: { login: 'org1' } }]);
    
    // Check if fetch was called with the right arguments
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/summary?since=2023-01-01&until=2023-01-31&groupBy=chronological')
    );
  });

  it('should handle error when no authentication is available', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated'
    });

    const { result } = renderHookSafely(() => useSummary(defaultProps));
    
    await act(async () => {
      await result.current.generateSummary();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Authentication required. Please sign in again.');
    expect(result.current.summary).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      'hooks:useSummary',
      'No authentication available for generating summary'
    );
  });

  it('should include installation IDs in the request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(createMockResponse({}));

    const propsWithInstallations = {
      ...defaultProps,
      installationIds: [123, 456]
    };

    const { result } = renderHookSafely(() => useSummary(propsWithInstallations));
    
    await act(async () => {
      await result.current.generateSummary();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('installation_ids=123%2C456')
    );
  });

  it('should include filter parameters in the request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce(createMockResponse({}));

    const propsWithFilters = {
      ...defaultProps,
      organizations: ['org1', 'org2'],
      repositories: ['repo1'],
      contributors: ['user1']
    };

    const { result } = renderHookSafely(() => useSummary(propsWithFilters));
    
    await act(async () => {
      await result.current.generateSummary();
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/contributors=user1/)
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/organizations=org1%2Corg2/)
    );
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/repositories=repo1/)
    );
  });

  it('should handle API error responses', async () => {
    const errorResponse = {
      error: 'Failed to generate summary',
      code: 'GITHUB_AUTH_ERROR'
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue(errorResponse)
    });

    const { result } = renderHookSafely(() => useSummary(defaultProps));
    
    await act(async () => {
      await result.current.generateSummary();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('GitHub authentication issue detected');
    expect(result.current.summary).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      'hooks:useSummary',
      'Error generating summary',
      expect.objectContaining({
        error: expect.stringContaining('GitHub authentication issue')
      })
    );
  });

  it('should handle installation needed error', async () => {
    const errorResponse = {
      error: 'GitHub App installation required',
      needsInstallation: true
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue(errorResponse)
    });

    const { result } = renderHookSafely(() => useSummary(defaultProps));
    
    await act(async () => {
      await result.current.generateSummary();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toContain('GitHub App installation required');
    expect(result.current.summary).toBeNull();
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHookSafely(() => useSummary(defaultProps));
    
    await act(async () => {
      await result.current.generateSummary();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.summary).toBeNull();
    expect(logger.error).toHaveBeenCalledWith(
      'hooks:useSummary',
      'Error generating summary',
      expect.objectContaining({
        error: 'Network error'
      })
    );
  });
});
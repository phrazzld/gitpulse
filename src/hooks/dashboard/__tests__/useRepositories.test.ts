/**
 * Tests for the useRepositories hook
 */

// Test type declarations
declare function describe(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function expect(actual: any): any;
declare namespace jest {
  function resetModules(): void;
  function clearAllMocks(): void;
  function spyOn(object: any, methodName: string): any;
  function fn(implementation?: (...args: any[]) => any): any;
  function mock(moduleName: string, factory?: () => any): void;
}
type Mock<T> = ReturnType<typeof jest.fn>;

// Import testing library methods
import { renderHookSafely } from '@/lib/tests/react-test-utils';
import { act } from 'react';
import { waitFor } from '@testing-library/react';

// Import hooks and types
import { useRepositories } from '../useRepositories';
import { Repository } from '@/types/dashboard';
import { ClientCacheTTL } from '@/lib/localStorageCache';

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        email: 'test@example.com',
        name: 'Test User'
      }
    },
    status: 'authenticated'
  }))
}));

jest.mock('@/lib/localStorageCache', () => ({
  setCacheItem: jest.fn(),
  getCacheItem: jest.fn(),
  getStaleItem: jest.fn(),
  ClientCacheTTL: {
    LONG: 3600000
  }
}));

// Import mocks after mocking
import { setCacheItem, getStaleItem } from '@/lib/localStorageCache';

// Mock fetch
global.fetch = jest.fn();

describe('useRepositories', () => {
  // Mock repositories for testing
  const mockRepositories: Repository[] = [
    {
      id: 1,
      name: 'repo1',
      full_name: 'org1/repo1',
      owner: { login: 'org1' },
      private: false,
      language: 'TypeScript'
    },
    {
      id: 2,
      name: 'repo2',
      full_name: 'org1/repo2',
      owner: { login: 'org1' },
      private: true,
      language: 'JavaScript'
    }
  ];

  // Mock response for successful fetch
  const mockSuccessResponse = {
    repositories: mockRepositories,
    authMethod: 'github_app',
    installationId: 12345,
    installations: [
      {
        id: 12345,
        account: { login: 'org1', type: 'Organization' },
        appSlug: 'test-app',
        appId: 1,
        repositorySelection: 'all',
        targetType: 'Organization'
      }
    ],
    currentInstallation: {
      id: 12345,
      account: { login: 'org1', type: 'Organization' },
      appSlug: 'test-app',
      appId: 1,
      repositorySelection: 'all',
      targetType: 'Organization'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as any).mockReset();
  });

  it('should return initial state on first render', async () => {
    // Set up mock for stale-while-revalidate cache
    (getStaleItem as any).mockReturnValue({ data: null, isStale: true });
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const { result } = renderHookSafely(() => useRepositories());

    // Initial state
    expect(result.current.repositories).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.needsInstallation).toBe(false);
    expect(typeof result.current.fetchRepositories).toBe('function');
  });

  it('should fetch repositories and update state', async () => {
    // Set up mock for stale-while-revalidate cache
    (getStaleItem as any).mockReturnValue({ data: null, isStale: true });
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const { result } = renderHookSafely(() => useRepositories());

    // Call fetchRepositories
    let fetchPromise;
    await act(async () => {
      fetchPromise = result.current.fetchRepositories();
    });

    // Wait for state updates to complete
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // Verify the promise resolves to true for successful fetch
    const success = await fetchPromise;
    expect(success).toBe(true);
    
    // Verify state updates
    expect(result.current.repositories).toEqual(mockRepositories);
    expect(result.current.error).toBe(null);
    expect(result.current.needsInstallation).toBe(false);
    
    // Verify fetch was called with the correct URL
    expect(fetch).toHaveBeenCalledWith('/api/repos');
    
    // Verify cache was updated
    expect(setCacheItem).toHaveBeenCalledWith(
      'repos:test@example.com',
      mockRepositories,
      ClientCacheTTL.LONG
    );
  });

  it('should use cached repositories if available and not stale', async () => {
    // Set up mock for stale-while-revalidate cache with fresh data
    (getStaleItem as any).mockReturnValue({ 
      data: mockRepositories, 
      isStale: false 
    });

    const { result } = renderHookSafely(() => useRepositories());

    // Call fetchRepositories
    let fetchPromise;
    await act(async () => {
      fetchPromise = result.current.fetchRepositories();
    });

    // Verify the promise resolves to true
    const success = await fetchPromise;
    expect(success).toBe(true);
    
    // Verify repositories were set from cache
    expect(result.current.repositories).toEqual(mockRepositories);
    
    // Verify fetch was NOT called since we had fresh cached data
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should use cached repositories but fetch in background if stale', async () => {
    // Set up mock for stale-while-revalidate cache with stale data
    (getStaleItem as any).mockReturnValue({ 
      data: mockRepositories, 
      isStale: true 
    });
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const { result } = renderHookSafely(() => useRepositories());

    // Call fetchRepositories
    let fetchPromise;
    await act(async () => {
      fetchPromise = result.current.fetchRepositories();
    });

    // Verify the promise resolves to true
    const success = await fetchPromise;
    expect(success).toBe(true);
    
    // Verify repositories were set from cache
    expect(result.current.repositories).toEqual(mockRepositories);
    
    // Verify fetch was called to get fresh data in background
    expect(fetch).toHaveBeenCalledWith('/api/repos');
  });

  it('should handle auth errors correctly', async () => {
    // Set up mock for stale-while-revalidate cache
    (getStaleItem as any).mockReturnValue({ data: null, isStale: true });
    
    // Mock auth error response
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ 
        error: 'Unauthorized - GitHub authentication failed',
        code: 'GITHUB_AUTH_ERROR'
      })
    });

    const { result } = renderHookSafely(() => useRepositories());

    // Call fetchRepositories
    let fetchPromise;
    await act(async () => {
      fetchPromise = result.current.fetchRepositories();
    });

    // Wait for state updates to complete
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // Verify the promise resolves to false for failed fetch
    const success = await fetchPromise;
    expect(success).toBe(false);
    
    // Verify error state
    expect(result.current.error).toContain('GitHub authentication');
    expect(result.current.repositories).toEqual([]);
  });

  it('should handle installation needed errors correctly', async () => {
    // Set up mock for stale-while-revalidate cache
    (getStaleItem as any).mockReturnValue({ data: null, isStale: true });
    
    // Mock installation needed error response
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ 
        error: 'GitHub App installation required',
        needsInstallation: true
      })
    });

    const { result } = renderHookSafely(() => useRepositories());

    // Call fetchRepositories
    let fetchPromise;
    await act(async () => {
      fetchPromise = result.current.fetchRepositories();
    });

    // Wait for state updates to complete
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // Verify the promise resolves to false for failed fetch
    const success = await fetchPromise;
    expect(success).toBe(false);
    
    // Verify needsInstallation state
    expect(result.current.needsInstallation).toBe(true);
    expect(result.current.error).toContain('GitHub App installation required');
    expect(result.current.repositories).toEqual([]);
  });

  it('should handle general errors correctly', async () => {
    // Set up mock for stale-while-revalidate cache
    (getStaleItem as any).mockReturnValue({ data: null, isStale: true });
    
    // Mock generic error
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHookSafely(() => useRepositories());

    // Call fetchRepositories
    let fetchPromise;
    await act(async () => {
      fetchPromise = result.current.fetchRepositories();
    });

    // Wait for state updates to complete
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // Verify the promise resolves to false for failed fetch
    const success = await fetchPromise;
    expect(success).toBe(false);
    
    // Verify error state
    expect(result.current.error).toContain('Failed to fetch repositories');
    expect(result.current.repositories).toEqual([]);
  });

  it('should fetch repositories with specific installation ID', async () => {
    // Set up mock for stale-while-revalidate cache
    (getStaleItem as any).mockReturnValue({ data: null, isStale: true });
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse
    });

    const installationId = 54321;
    const { result } = renderHookSafely(() => useRepositories());

    // Call fetchRepositories with specific installation ID
    let fetchPromise;
    await act(async () => {
      fetchPromise = result.current.fetchRepositories(installationId);
    });

    // Wait for state updates to complete
    await waitFor(() => expect(result.current.loading).toBe(false));
    
    // Verify the promise resolves to true for successful fetch
    const success = await fetchPromise;
    expect(success).toBe(true);
    
    // Verify state updates
    expect(result.current.repositories).toEqual(mockRepositories);
    
    // Verify fetch was called with the correct URL including installation_id
    expect(fetch).toHaveBeenCalledWith(`/api/repos?installation_id=${installationId}`);
  });
});
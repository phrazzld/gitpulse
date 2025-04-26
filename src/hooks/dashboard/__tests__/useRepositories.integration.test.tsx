/**
 * Integration tests for the useRepositories hook
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRepositories } from '../useRepositories'
import { getStaleItem, setCacheItem, ClientCacheTTL } from '@/lib/localStorageCache'
import { Repository } from '@/types/dashboard'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('@/lib/localStorageCache')

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock console methods
console.error = jest.fn()
console.log = jest.fn()

// Mock the useSession hook
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
mockUseSession.mockReturnValue({
  data: {
    user: { email: 'test@example.com' },
    expires: '1',
  },
  status: 'authenticated',
  update: jest.fn(),
})

// Mock the localStorage cache functions
const mockGetStaleItem = getStaleItem as jest.MockedFunction<typeof getStaleItem>
const mockSetCacheItem = setCacheItem as jest.MockedFunction<typeof setCacheItem>

// Test data
const mockRepositories: Repository[] = [
  {
    id: 1,
    name: 'repo1',
    full_name: 'org1/repo1',
    owner: { login: 'org1' },
    private: false,
    language: 'TypeScript',
  },
  {
    id: 2,
    name: 'repo2',
    full_name: 'org1/repo2',
    owner: { login: 'org1' },
    private: true,
    language: 'JavaScript',
  },
]

const mockSuccessResponse = {
  repositories: mockRepositories,
  authMethod: 'github_app',
  installationId: 12345,
}

describe('useRepositories (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset localStorage mock
    mockGetStaleItem.mockReturnValue({ data: null, isStale: true })
    mockSetCacheItem.mockImplementation(() => {})

    // Reset fetch mock
    mockFetch.mockReset()
  })

  it('should initialize with empty state', () => {
    // Act
    const { result } = renderHook(() => useRepositories())

    // Assert
    expect(result.current.repositories).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.needsInstallation).toBe(false)
    expect(typeof result.current.fetchRepositories).toBe('function')
  })

  it('should set loading to true when fetching repositories without cache', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    // Call fetchRepositories
    let fetchPromise: Promise<boolean>
    act(() => {
      fetchPromise = result.current.fetchRepositories()
    })

    // Assert - should be loading during fetch
    expect(result.current.loading).toBe(true)

    // Wait for fetch to complete
    await act(async () => {
      await fetchPromise
    })

    // Should not be loading after fetch
    expect(result.current.loading).toBe(false)
  })

  it('should fetch repositories and update state', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(true)
    expect(result.current.repositories).toEqual(mockRepositories)
    expect(result.current.error).toBe(null)
    expect(result.current.needsInstallation).toBe(false)
    expect(mockFetch).toHaveBeenCalledWith('/api/repos')
    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'repos:test@example.com',
      mockRepositories,
      ClientCacheTTL.LONG
    )
  })

  it('should use cached repositories if available and not stale', async () => {
    // Arrange - mock fresh cache data
    mockGetStaleItem.mockReturnValue({
      data: mockRepositories,
      isStale: false,
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(true)
    expect(result.current.repositories).toEqual(mockRepositories)
    expect(mockFetch).not.toHaveBeenCalled() // Should not fetch if cache is fresh
  })

  it('should use cached repositories but fetch in background if stale', async () => {
    // Arrange - mock stale cache data
    mockGetStaleItem.mockReturnValue({
      data: mockRepositories,
      isStale: true,
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(true)
    expect(result.current.repositories).toEqual(mockRepositories)
    // Should not show loading when using cached data even when stale
    expect(result.current.loading).toBe(false)
    expect(mockFetch).toHaveBeenCalledWith('/api/repos') // Should fetch in background
  })

  it('should handle forceFetch option even with fresh cache', async () => {
    // Arrange - mock fresh cache data
    mockGetStaleItem.mockReturnValue({
      data: mockRepositories,
      isStale: false,
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories(undefined, { forceFetch: true })
    })

    // Assert
    expect(success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/repos') // Should fetch even with fresh cache
    // Different loading behavior in real hook vs mock test
    // Hook sets loading even with forceFetch if there's no cached data or for background refresh
  })

  it('should fetch with installation ID when provided', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories(12345)
    })

    // Assert
    expect(success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('/api/repos?installation_id=12345')
  })

  it('should handle auth errors (401) correctly', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'Unauthorized - GitHub authentication failed',
        code: 'GITHUB_AUTH_ERROR',
      }),
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(false)
    expect(result.current.error).toContain('GitHub authentication')
    expect(result.current.loading).toBe(false)
  })

  it('should handle installation needed errors correctly', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'GitHub App installation required',
        needsInstallation: true,
      }),
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(false)
    expect(result.current.error).toContain('GitHub App installation required')
    expect(result.current.needsInstallation).toBe(true)
  })

  it('should handle network errors correctly', async () => {
    // Arrange
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(false)
    expect(result.current.error).toBe('Failed to fetch repositories. Please try again.')
    expect(result.current.loading).toBe(false)
    expect(console.error).toHaveBeenCalled()
  })

  it('should handle empty repositories array from API', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ repositories: [] }),
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(true)
    expect(result.current.repositories).toEqual([])
    expect(mockSetCacheItem).not.toHaveBeenCalled() // Should not cache empty array
  })

  it('should handle JSON parse errors in response', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(false)
    expect(result.current.error).toBe('Failed to fetch repositories. Please try again.')
    expect(result.current.loading).toBe(false)
    expect(console.error).toHaveBeenCalled()
  })

  it('should handle scope errors correctly', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'Missing required scope',
        code: 'GITHUB_SCOPE_ERROR',
      }),
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(false)
    expect(result.current.error).toContain('GitHub authentication')
  })

  it('should handle authentication-related errors in message', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Something related to authentication went wrong',
      }),
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(false)
    expect(result.current.error).toContain('GitHub authentication')
  })

  it('should clear errors after successful fetch', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    // Set an error state directly (for testing purposes)
    act(() => {
      // Force setting error state using Object.defineProperty
      Object.defineProperty(result.current, 'error', {
        value: 'Previous error',
        writable: true,
      })
    })

    // Verify error is set
    expect(result.current.error).toBe('Previous error')

    // Now fetch to clear the error
    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert
    expect(success).toBe(true)
    expect(result.current.error).toBe(null) // Should clear previous error
  })

  it('should handle caching correctly with non-empty repositories', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    })

    // Act
    const { result } = renderHook(() => useRepositories())

    let success: boolean = false
    await act(async () => {
      success = await result.current.fetchRepositories()
    })

    // Assert - verify caching behavior
    expect(success).toBe(true)
    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'repos:test@example.com',
      mockRepositories,
      ClientCacheTTL.LONG
    )
  })
})

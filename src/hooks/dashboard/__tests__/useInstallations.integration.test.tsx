/**
 * Integration tests for the useInstallations hook
 */

import { renderHook, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useInstallations } from '../useInstallations'
import { getStaleItem, setCacheItem, ClientCacheTTL } from '@/lib/localStorageCache'
import { Installation } from '@/types/dashboard'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('@/lib/localStorageCache')

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

// Mock fetch repositories function
const mockFetchRepositories = jest.fn().mockResolvedValue(true)

// Test data
const mockInstallations: Installation[] = [
  {
    id: 1,
    account: {
      login: 'org1',
      type: 'Organization',
      avatarUrl: 'https://example.com/avatar1.png',
    },
    appSlug: 'github-app',
    appId: 1234,
    repositorySelection: 'all',
    targetType: 'Organization',
  },
  {
    id: 2,
    account: {
      login: 'org2',
      type: 'Organization',
      avatarUrl: 'https://example.com/avatar2.png',
    },
    appSlug: 'github-app',
    appId: 1234,
    repositorySelection: 'all',
    targetType: 'Organization',
  },
]

describe('useInstallations (Integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset localStorage mock
    mockGetStaleItem.mockReturnValue({ data: null, isStale: true })
    mockSetCacheItem.mockImplementation(() => {})

    // Reset fetch mock
    mockFetchRepositories.mockClear()
  })

  it('should initialize with empty state when no cache exists', () => {
    // Arrange
    mockGetStaleItem.mockReturnValue({ data: null, isStale: true })

    // Act
    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Assert
    expect(result.current.installations).toEqual([])
    expect(result.current.currentInstallations).toEqual([])
    expect(result.current.installationIds).toEqual([])
    expect(result.current.needsInstallation).toBe(false)
  })

  it('should set installations when setInstallations is called', () => {
    // Arrange
    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Act
    act(() => {
      result.current.setInstallations(mockInstallations)
    })

    // Assert
    expect(result.current.installations).toEqual(mockInstallations)
    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'installations',
      mockInstallations,
      ClientCacheTTL.LONG
    )
  })

  it('should add current installation when addCurrentInstallation is called', () => {
    // Arrange
    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Act - add first installation
    act(() => {
      result.current.addCurrentInstallation(mockInstallations[0])
    })

    // Assert - should add to current installations and installationIds
    expect(result.current.currentInstallations).toEqual([mockInstallations[0]])
    expect(result.current.installationIds).toEqual([1])

    // Act - add second installation
    act(() => {
      result.current.addCurrentInstallation(mockInstallations[1])
    })

    // Assert - should add to existing arrays
    expect(result.current.currentInstallations).toEqual(mockInstallations)
    expect(result.current.installationIds).toEqual([1, 2])
  })

  it('should not add duplicate current installations', () => {
    // Arrange
    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Act - add installation twice
    act(() => {
      result.current.addCurrentInstallation(mockInstallations[0])
      result.current.addCurrentInstallation(mockInstallations[0]) // Duplicate
    })

    // Assert - should only add once
    expect(result.current.currentInstallations).toEqual([mockInstallations[0]])
    expect(result.current.installationIds).toEqual([1])
  })

  it('should switch installations successfully', async () => {
    // Arrange
    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Add installations first
    act(() => {
      result.current.setInstallations(mockInstallations)
      result.current.addCurrentInstallation(mockInstallations[0])
    })

    // Act - switch to second installation
    await act(async () => {
      await result.current.switchInstallations([2]) // Switch to second installation
    })

    // Assert
    expect(result.current.installationIds).toEqual([2])
    expect(result.current.currentInstallations).toEqual([mockInstallations[1]])
    expect(mockFetchRepositories).toHaveBeenCalledWith(2)
  })

  it('should not call fetchRepositories if installIds is empty', async () => {
    // Arrange
    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Act - switch with empty array
    await act(async () => {
      await result.current.switchInstallations([])
    })

    // Assert
    expect(mockFetchRepositories).not.toHaveBeenCalled()
  })

  it('should not update state if fetch fails during switchInstallations', async () => {
    // Arrange
    mockFetchRepositories.mockResolvedValueOnce(false) // Fetch fails

    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Set initial state
    act(() => {
      result.current.setInstallations(mockInstallations)
      result.current.addCurrentInstallation(mockInstallations[0])
    })

    const initialIds = [...result.current.installationIds]
    const initialCurrentInstalls = [...(result.current.currentInstallations as Installation[])]

    // Act - try to switch installations
    await act(async () => {
      await result.current.switchInstallations([2])
    })

    // Assert - state should not change
    expect(result.current.installationIds).toEqual(initialIds)
    expect(result.current.currentInstallations).toEqual(initialCurrentInstalls)
  })

  it('should load installations from cache when available', () => {
    // Arrange
    mockGetStaleItem.mockReturnValue({
      data: mockInstallations,
      isStale: false,
    })

    // Act
    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Assert
    expect(result.current.installations).toEqual(mockInstallations)
    expect(mockGetStaleItem).toHaveBeenCalledWith('installations')
  })

  it('should handle localStorage errors gracefully', () => {
    // First mock the implementation as normal for initialization
    mockGetStaleItem.mockReturnValue({ data: null, isStale: true })

    // Act - render hook first
    const { result } = renderHook(() =>
      useInstallations({
        fetchRepositories: mockFetchRepositories,
      })
    )

    // Then update the mock to throw on subsequent calls
    mockGetStaleItem.mockImplementation(() => {
      throw new Error('Storage error')
    })

    // Act - trigger a call that would use localStorage
    act(() => {
      // This should not throw even though localStorage has an error
      result.current.setInstallations(mockInstallations)
    })

    // Assert - should have updated state despite localStorage error
    expect(result.current.installations).toEqual(mockInstallations)
  })
})

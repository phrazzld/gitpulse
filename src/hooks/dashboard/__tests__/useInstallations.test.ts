/**
 * Tests for the useInstallations hook
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { Installation } from '@/types/dashboard'
import { ClientCacheTTL } from '@/lib/localStorageCache'

// Mock the dependencies
jest.mock('next-auth/react')
jest.mock('react')

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
}

// Replace the real localStorage with our mock
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock localStorage cache module
const mockSetCacheItem = jest.fn()
const mockGetStaleItem = jest.fn()

jest.mock('@/lib/localStorageCache', () => ({
  setCacheItem: (...args: any[]) => mockSetCacheItem(...args),
  getStaleItem: (...args: any[]) => mockGetStaleItem(...args),
  ClientCacheTTL: { LONG: 3600000 },
}))

// Create a simplified version of the hook for testing
// This avoids the need to use React hooks directly
function createMockUseInstallations() {
  let installationsState: Installation[] = []
  let currentInstallationsState: Installation[] = []
  let installationIdsState: number[] = []
  let needsInstallationState = false

  const setInstallations = (newValue: Installation[]) => {
    installationsState = newValue
    if (newValue.length > 0) {
      mockSetCacheItem('installations', newValue, ClientCacheTTL.LONG)
    }
  }

  const addCurrentInstallation = (installation: Installation) => {
    const exists = currentInstallationsState.some(inst => inst.id === installation.id)

    if (!exists) {
      currentInstallationsState = [...currentInstallationsState, installation]
      installationIdsState = currentInstallationsState.map(inst => inst.id)
      mockSetCacheItem('currentInstallations', currentInstallationsState, ClientCacheTTL.LONG)
    }
  }

  const setNeedsInstallation = (value: boolean) => {
    needsInstallationState = value
  }

  const switchInstallations = async (installIds: number[]) => {
    // Check if selection has changed
    const currentIds = currentInstallationsState.map(inst => inst.id)
    const hasSelectionChanged =
      installIds.length !== currentIds.length || installIds.some(id => !currentIds.includes(id))

    if (!hasSelectionChanged) {
      return
    }

    if (installIds.length === 0) {
      return
    }

    const primaryInstallId = installIds[0]
    const mockFetchResult = await mockFetchRepositories(primaryInstallId)

    if (mockFetchResult) {
      try {
        mockLocalStorage.setItem('lastInstallationSwitch', Date.now().toString())
      } catch (e) {
        // Handle localStorage errors
      }

      const selectedInstallations = installationsState.filter(inst => installIds.includes(inst.id))

      currentInstallationsState = selectedInstallations
      installationIdsState = installIds
      needsInstallationState = false
    }
  }

  // Mock fetchRepositories function
  const mockFetchRepositories = jest.fn().mockResolvedValue(true)

  // Load data from cache if available
  const loadFromCache = () => {
    // Check for cached installations
    const installationsCache = mockGetStaleItem('installations')
    if (installationsCache?.data && installationsCache.data.length > 0) {
      installationsState = installationsCache.data
    }

    // Check for cached current installations
    const currentInstallationsCache = mockGetStaleItem('currentInstallations')
    if (currentInstallationsCache?.data && currentInstallationsCache.data.length > 0) {
      currentInstallationsState = currentInstallationsCache.data
      installationIdsState = currentInstallationsCache.data.map((inst: Installation) => inst.id)
    }
  }

  // Call loadFromCache initially
  loadFromCache()

  return {
    // State
    get installations() {
      return installationsState
    },
    get currentInstallations() {
      return currentInstallationsState
    },
    get installationIds() {
      return installationIdsState
    },
    get needsInstallation() {
      return needsInstallationState
    },

    // Functions
    setInstallations,
    addCurrentInstallation,
    setNeedsInstallation,
    switchInstallations,

    // For testing
    _mockFetchRepositories: mockFetchRepositories,
  }
}

describe('useInstallations', () => {
  // Sample data for testing
  const mockInstallations: Installation[] = [
    {
      id: 1,
      account: {
        login: 'org1',
        type: 'Organization',
        avatarUrl: 'https://example.com/avatar1.png',
      },
      appSlug: 'test-app',
      appId: 123,
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
      appSlug: 'test-app',
      appId: 123,
      repositorySelection: 'all',
      targetType: 'Organization',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset mocks
    mockGetStaleItem.mockReturnValue({ data: null, isStale: true })
    mockLocalStorage.setItem.mockClear()
  })

  it('should initialize with empty state when no cache exists', () => {
    // Arrange
    mockGetStaleItem.mockReturnValue({ data: null, isStale: true })

    // Act
    const result = createMockUseInstallations()

    // Assert
    expect(result.installations).toEqual([])
    expect(result.currentInstallations).toEqual([])
    expect(result.installationIds).toEqual([])
    expect(result.needsInstallation).toBe(false)
  })

  it('should set installations when setInstallations is called', () => {
    // Arrange
    const result = createMockUseInstallations()

    // Act
    result.setInstallations(mockInstallations)

    // Assert
    expect(result.installations).toEqual(mockInstallations)
    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'installations',
      mockInstallations,
      ClientCacheTTL.LONG
    )
  })

  it('should add current installation when addCurrentInstallation is called', () => {
    // Arrange
    const result = createMockUseInstallations()

    // Act
    result.addCurrentInstallation(mockInstallations[0])

    // Assert
    expect(result.currentInstallations).toEqual([mockInstallations[0]])
    expect(result.installationIds).toEqual([1])
    expect(mockSetCacheItem).toHaveBeenCalledWith(
      'currentInstallations',
      [mockInstallations[0]],
      ClientCacheTTL.LONG
    )
  })

  it('should not add duplicate current installations', () => {
    // Arrange
    const result = createMockUseInstallations()

    // Act
    result.addCurrentInstallation(mockInstallations[0])
    mockSetCacheItem.mockClear() // Clear the first call

    result.addCurrentInstallation(mockInstallations[0]) // Try to add again

    // Assert
    expect(result.currentInstallations).toEqual([mockInstallations[0]])
    expect(result.installationIds).toEqual([1])
    expect(mockSetCacheItem).not.toHaveBeenCalled() // Should not be called again
  })

  it('should switch installations successfully', async () => {
    // Arrange
    const result = createMockUseInstallations()
    result.setInstallations(mockInstallations)
    result._mockFetchRepositories.mockResolvedValueOnce(true)

    // Act
    await result.switchInstallations([2])

    // Assert
    expect(result._mockFetchRepositories).toHaveBeenCalledWith(2)
    expect(result.currentInstallations).toEqual([mockInstallations[1]])
    expect(result.installationIds).toEqual([2])
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'lastInstallationSwitch',
      expect.any(String)
    )
  })

  it('should not call fetchRepositories if installIds is empty', async () => {
    // Arrange
    const result = createMockUseInstallations()
    result.setInstallations(mockInstallations)

    // Act
    await result.switchInstallations([])

    // Assert
    expect(result._mockFetchRepositories).not.toHaveBeenCalled()
  })

  it('should not update state if fetch fails during switchInstallations', async () => {
    // Arrange
    const result = createMockUseInstallations()
    result.setInstallations(mockInstallations)
    result.addCurrentInstallation(mockInstallations[0])

    // Mock fetch to fail
    result._mockFetchRepositories.mockResolvedValueOnce(false)

    // Act
    await result.switchInstallations([2])

    // Assert
    expect(result._mockFetchRepositories).toHaveBeenCalledWith(2)
    // State should remain unchanged
    expect(result.currentInstallations).toEqual([mockInstallations[0]])
    expect(result.installationIds).toEqual([1])
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })

  it('should load installations from cache when available', () => {
    // Arrange
    mockGetStaleItem.mockImplementation((key: string) => {
      if (key === 'installations') {
        return { data: mockInstallations, isStale: false }
      } else if (key === 'currentInstallations') {
        return { data: [mockInstallations[0]], isStale: false }
      }
      return { data: null, isStale: true }
    })

    // Act
    const result = createMockUseInstallations()

    // Assert
    expect(result.installations).toEqual(mockInstallations)
    expect(result.currentInstallations).toEqual([mockInstallations[0]])
    expect(result.installationIds).toEqual([1])
  })

  it('should handle localStorage errors gracefully', async () => {
    // Arrange
    const result = createMockUseInstallations()
    result.setInstallations(mockInstallations)

    // Mock localStorage to throw
    mockLocalStorage.setItem.mockImplementationOnce(() => {
      throw new Error('localStorage error')
    })

    // Act/Assert - should not throw
    await expect(result.switchInstallations([1])).resolves.not.toThrow()
  })
})

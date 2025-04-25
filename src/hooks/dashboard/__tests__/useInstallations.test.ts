/**
 * Tests for the useInstallations hook
 */

// Test type declarations
declare function describe(name: string, fn: () => void): void
declare function beforeEach(fn: () => void): void
declare function afterEach(fn: () => void): void
declare function it(name: string, fn: () => void): void
declare function expect(actual: any): any
declare namespace jest {
  function resetModules(): void
  function clearAllMocks(): void
  function spyOn(object: any, methodName: string): any
  function fn(implementation?: (...args: any[]) => any): any
  function mock(moduleName: string, factory?: () => any): void
}

// Mocking renderHook and act functions since we can't import @testing-library/react
const renderHook = (callback: Function) => {
  const result = { current: callback() }
  return { result }
}

const act = async (callback: Function) => {
  await callback()
}

const waitFor = async (callback: Function) => {
  await new Promise(resolve => setTimeout(resolve, 0))
  callback()
}

// Import hooks and types
import { useInstallations } from '../useInstallations'
import { Installation } from '@/types/dashboard'
import { ClientCacheTTL } from '@/lib/localStorageCache'

// Mock dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        email: 'test@example.com',
        name: 'Test User',
      },
    },
    status: 'authenticated',
  })),
}))

jest.mock('@/lib/localStorageCache', () => ({
  setCacheItem: jest.fn(),
  getCacheItem: jest.fn(),
  getStaleItem: jest.fn(),
  ClientCacheTTL: {
    LONG: 3600000,
  },
}))

// Import mocks after mocking
import { setCacheItem, getStaleItem } from '@/lib/localStorageCache'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useInstallations', () => {
  // Mock installations for testing
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

  // Mock fetchRepositories function
  const mockFetchRepositories = jest.fn(() => Promise.resolve(true))

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    ;(getStaleItem as any).mockReturnValue({ data: null, isStale: true })
  })

  it('should return initial state on first render', () => {
    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: mockFetchRepositories })
    )

    // Initial state
    expect(result.current.installations).toEqual([])
    expect(result.current.currentInstallations).toEqual([])
    expect(result.current.installationIds).toEqual([])
    expect(result.current.needsInstallation).toBe(false)
    expect(typeof result.current.switchInstallations).toBe('function')
    expect(typeof result.current.setInstallations).toBe('function')
    expect(typeof result.current.addCurrentInstallation).toBe('function')
  })

  it('should set installations when setInstallations is called', async () => {
    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: mockFetchRepositories })
    )

    await act(async () => {
      result.current.setInstallations(mockInstallations)
    })

    expect(result.current.installations).toEqual(mockInstallations)

    // Verify cache was updated
    expect(setCacheItem).toHaveBeenCalledWith(
      'installations',
      mockInstallations,
      ClientCacheTTL.LONG
    )
  })

  it('should add a current installation when addCurrentInstallation is called', async () => {
    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: mockFetchRepositories })
    )

    // First set all available installations
    await act(async () => {
      result.current.setInstallations(mockInstallations)
    })

    // Then add one as current
    await act(async () => {
      result.current.addCurrentInstallation(mockInstallations[0])
    })

    expect(result.current.currentInstallations).toEqual([mockInstallations[0]])
    expect(result.current.installationIds).toEqual([1])
  })

  it('should not add duplicate current installations', async () => {
    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: mockFetchRepositories })
    )

    // Add the same installation twice
    await act(async () => {
      result.current.addCurrentInstallation(mockInstallations[0])
      result.current.addCurrentInstallation(mockInstallations[0])
    })

    expect(result.current.currentInstallations).toEqual([mockInstallations[0]])
    expect(result.current.installationIds).toEqual([1])
  })

  it('should switch installations and fetch repositories', async () => {
    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: mockFetchRepositories })
    )

    // First set all available installations
    await act(async () => {
      result.current.setInstallations(mockInstallations)
    })

    // Then switch to one installation
    await act(async () => {
      result.current.switchInstallations([2])
    })

    expect(mockFetchRepositories).toHaveBeenCalledWith(2)

    // Wait for the promise to resolve
    await waitFor(() => {
      expect(result.current.installationIds).toEqual([2])
      expect(result.current.currentInstallations).toEqual([mockInstallations[1]])
    })
  })

  it('should not call fetchRepositories if installation selection has not changed', async () => {
    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: mockFetchRepositories })
    )

    // First set installations and switch to one
    await act(async () => {
      result.current.setInstallations(mockInstallations)
      result.current.switchInstallations([1])
    })

    mockFetchRepositories.mockClear()

    // Call switchInstallations with the same ID
    await act(async () => {
      result.current.switchInstallations([1])
    })

    expect(mockFetchRepositories).not.toHaveBeenCalled()
  })

  it('should not call fetchRepositories if installIds is empty', async () => {
    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: mockFetchRepositories })
    )

    // First set all available installations
    await act(async () => {
      result.current.setInstallations(mockInstallations)
    })

    mockFetchRepositories.mockClear()

    // Then switch to empty array
    await act(async () => {
      result.current.switchInstallations([])
    })

    expect(mockFetchRepositories).not.toHaveBeenCalled()
  })

  it('should load installations from cache if available', async () => {
    // Set up mock for stale-while-revalidate cache with fresh data
    ;(getStaleItem as any).mockReturnValue({
      data: mockInstallations,
      isStale: false,
    })

    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: mockFetchRepositories })
    )

    // Hook should initialize with cached data
    expect(result.current.installations).toEqual(mockInstallations)
  })

  it('should update currentInstallations when switching installations succeeds', async () => {
    // Setup fetchRepositories to return success
    const successFetchRepositories = jest.fn(() => Promise.resolve(true))

    const { result } = renderHook(() =>
      useInstallations({ fetchRepositories: successFetchRepositories })
    )

    // First set all available installations
    await act(async () => {
      result.current.setInstallations(mockInstallations)
    })

    // Then switch to one installation
    await act(async () => {
      result.current.switchInstallations([1])
    })

    // Wait for the promise to resolve
    await waitFor(() => {
      expect(result.current.currentInstallations).toEqual([mockInstallations[0]])
      expect(result.current.installationIds).toEqual([1])
      // Verify localStorage was updated
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })
})

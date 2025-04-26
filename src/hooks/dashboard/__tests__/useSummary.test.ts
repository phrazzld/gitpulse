import { renderHook, act } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useSummary } from '../useSummary'
import { logger } from '@/lib/logger'
import { ActivityMode, CommitSummary, DateRange, Installation } from '@/types/dashboard'

// Mock dependencies
jest.mock('next-auth/react')
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock global fetch
global.fetch = jest.fn()

// Helper to create a mock response
const createMockResponse = (data: any, status = 200): Partial<Response> => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  }
}

describe('useSummary', (): void => {
  const mockSession = {
    data: {
      user: { name: 'Test User', email: 'test@example.com' },
      accessToken: 'mock-token',
    },
    status: 'authenticated',
  }

  beforeEach((): void => {
    jest.clearAllMocks()
    ;(useSession as jest.Mock).mockReturnValue(mockSession)
  })

  const defaultProps = {
    dateRange: { since: '2023-01-01', until: '2023-01-31' } as DateRange,
    activityMode: 'my-activity' as ActivityMode,
    organizations: [] as readonly string[],
    repositories: [] as readonly string[],
    contributors: [] as readonly string[],
    installationIds: [] as readonly number[],
  }

  it('should initialize with default values', (): void => {
    const { result } = renderHook(() => useSummary(defaultProps))

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.summary).toBeNull()
    expect(result.current.installations).toEqual([])
    expect(result.current.currentInstallations).toEqual([])
    expect(result.current.authMethod).toBeNull()
  })

  it('should generate a summary successfully', async (): Promise<void> => {
    const mockSummaryData = {
      user: 'Test User',
      commits: [{ id: 1 }, { id: 2 }],
      stats: {
        totalCommits: 2,
        repositories: ['repo1', 'repo2'],
        dates: ['2023-01-01', '2023-01-02'],
      },
      aiSummary: {
        keyThemes: ['Theme 1', 'Theme 2'],
      },
      authMethod: 'github_app',
      installations: [{ id: 1, account: { login: 'org1' } }],
      currentInstallations: [{ id: 1, account: { login: 'org1' } }],
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSummaryData))

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.summary).toEqual(mockSummaryData)
    expect(result.current.authMethod).toBe('github_app')
    expect(result.current.installations).toEqual([{ id: 1, account: { login: 'org1' } }])
    expect(result.current.currentInstallations).toEqual([{ id: 1, account: { login: 'org1' } }])

    // Check if fetch was called with the right arguments
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        '/api/summary?since=2023-01-01&until=2023-01-31&groupBy=chronological'
      )
    )
  })

  it('should handle error when no authentication is available', async (): Promise<void> => {
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Authentication required. Please sign in again.')
    expect(result.current.summary).toBeNull()
    expect(logger.warn).toHaveBeenCalledWith(
      'hooks:useSummary',
      'No authentication available for generating summary'
    )
  })

  it('should include installation IDs in the request', async (): Promise<void> => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse({}))

    const propsWithInstallations = {
      ...defaultProps,
      installationIds: [123, 456],
    }

    const { result } = renderHook(() => useSummary(propsWithInstallations))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('installation_ids=123%2C456'))
  })

  it('should include filter parameters in the request', async (): Promise<void> => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse({}))

    const propsWithFilters = {
      ...defaultProps,
      organizations: ['org1', 'org2'],
      repositories: ['repo1'],
      contributors: ['user1'],
    }

    const { result } = renderHook(() => useSummary(propsWithFilters))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/contributors=user1/))
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/organizations=org1%2Corg2/))
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/repositories=repo1/))
  })

  it('should handle API error responses', async (): Promise<void> => {
    const errorResponse = {
      error: 'Failed to generate summary',
      code: 'GITHUB_AUTH_ERROR',
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue(errorResponse),
    })

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toContain('GitHub authentication issue detected')
    expect(result.current.summary).toBeNull()
    expect(logger.error).toHaveBeenCalledWith(
      'hooks:useSummary',
      'Error generating summary',
      expect.objectContaining({
        error: expect.stringContaining('GitHub authentication issue'),
      })
    )
  })

  it('should handle installation needed error', async (): Promise<void> => {
    const errorResponse = {
      error: 'GitHub App installation required',
      needsInstallation: true,
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: jest.fn().mockResolvedValue(errorResponse),
    })

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toContain('GitHub App installation required')
    expect(result.current.summary).toBeNull()
  })

  it('should handle network errors', async (): Promise<void> => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Network error')
    expect(result.current.summary).toBeNull()
    expect(logger.error).toHaveBeenCalledWith(
      'hooks:useSummary',
      'Error generating summary',
      expect.objectContaining({
        error: 'Network error',
      })
    )
  })

  // New test to cover the fallback error message (Line 72: errorData.error || 'Failed to generate summary')
  it('should use fallback error message when API returns error without message', async (): Promise<void> => {
    const errorResponse = {
      // No error property provided, so fallback message should be used
      code: 'GENERIC_ERROR',
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue(errorResponse),
    })

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe('Failed to generate summary')
    expect(result.current.summary).toBeNull()
    expect(logger.error).toHaveBeenCalledWith(
      'hooks:useSummary',
      'Error generating summary',
      expect.objectContaining({
        error: 'Failed to generate summary',
      })
    )
  })

  // New test to cover the empty installationIds array (Line 143: data.installationIds && data.installationIds.length > 0)
  it('should handle response with empty installationIds array', async (): Promise<void> => {
    const mockSummaryData = {
      user: 'Test User',
      commits: [{ id: 1 }],
      stats: { totalCommits: 1 },
      authMethod: 'oauth',
      // Empty array provided to test branch coverage
      installationIds: [],
      installations: [{ id: 1, account: { login: 'org1' } }],
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSummaryData))

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.summary).toEqual(mockSummaryData)
    expect(result.current.authMethod).toBe('oauth')

    // Verify that debug for installationIds was not called since the array was empty
    expect(logger.debug).not.toHaveBeenCalledWith(
      'hooks:useSummary',
      'Using GitHub App installation IDs',
      expect.anything()
    )
  })

  // This test handles the scenario when data.installationIds is undefined (testing both branches of line 143)
  it('should handle response with undefined installationIds', async (): Promise<void> => {
    const mockSummaryData = {
      user: 'Test User',
      commits: [{ id: 1 }],
      stats: { totalCommits: 1 },
      authMethod: 'oauth',
      // installationIds is completely omitted here
      installations: [{ id: 1, account: { login: 'org1' } }],
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSummaryData))

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.summary).toEqual(mockSummaryData)
    expect(result.current.authMethod).toBe('oauth')

    // Verify that debug for installationIds was not called since it was undefined
    expect(logger.debug).not.toHaveBeenCalledWith(
      'hooks:useSummary',
      'Using GitHub App installation IDs',
      expect.anything()
    )
  })

  // Test to cover the non-empty installationIds array to reach 100% branch coverage
  it('should handle response with non-empty installationIds array', async (): Promise<void> => {
    const mockSummaryData = {
      user: 'Test User',
      commits: [{ id: 1 }],
      stats: { totalCommits: 1 },
      authMethod: 'github_app',
      // Non-empty array to test branch coverage
      installationIds: [123, 456],
      installations: [{ id: 123, account: { login: 'org1' } }],
      currentInstallations: [{ id: 123, account: { login: 'org1' } }],
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce(createMockResponse(mockSummaryData))

    const { result } = renderHook(() => useSummary(defaultProps))

    await act(async () => {
      await result.current.generateSummary()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.summary).toEqual(mockSummaryData)
    expect(result.current.authMethod).toBe('github_app')

    // Verify that debug for installationIds WAS called since it has values
    expect(logger.debug).toHaveBeenCalledWith(
      'hooks:useSummary',
      'Using GitHub App installation IDs',
      expect.objectContaining({ ids: [123, 456] })
    )
  })
})

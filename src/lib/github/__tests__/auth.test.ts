// @ts-nocheck - Disable TypeScript checking temporarily - see task T043
/**
 * Tests for the GitHub authentication module
 *
 * This test suite verifies the GitHub authentication functionality
 * of the application, including OAuth flows, App installations,
 * and token validation.
 */

// Test type declarations for TypeScript
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
  type MockedFunction<T extends (...args: any[]) => any> = {
    (...args: Parameters<T>): ReturnType<T>
    mockReturnValue: (value: ReturnType<T>) => MockedFunction<T>
    mockResolvedValue: (value: Awaited<ReturnType<T>>) => MockedFunction<T>
    mockRejectedValue: (reason?: any) => MockedFunction<T>
    mockImplementation: (fn: T) => MockedFunction<T>
    mockResolvedValueOnce: (value: Awaited<ReturnType<T>>) => MockedFunction<T>
  }
}

// Add support for expect.objectContaining
declare namespace jest {
  interface Expect {
    objectContaining(obj: object): any
  }
}

// Extend expect for TypeScript
declare namespace jest {
  interface Matchers<R> {
    toHaveBeenCalledWith(...args: any[]): R
  }
}

import {
  getInstallationManagementUrl,
  createOAuthOctokit,
  getInstallationOctokit,
  getAllAppInstallations,
  checkAppInstallation,
  validateOAuthToken,
} from '../auth'
import { logger } from '@/lib/logger'
import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'
import { AppInstallation } from '../types'

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('octokit', () => ({
  Octokit: jest.fn(),
}))

jest.mock('@octokit/auth-app', () => ({
  createAppAuth: jest.fn(),
}))

describe('GitHub Auth Module', () => {
  // Save original env and reset mocks before each test
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_GITHUB_APP_NAME: 'test-app',
      GITHUB_APP_ID: '12345',
      GITHUB_APP_PRIVATE_KEY_PKCS8: 'test-private-key\\nwith-newline',
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getInstallationManagementUrl', () => {
    it('returns organization URL for organization accounts', () => {
      const url = getInstallationManagementUrl(123, 'test-org', 'Organization')
      expect(url).toBe('https://github.com/organizations/test-org/settings/installations/123')
    })

    it('returns user URL when account type is not Organization', () => {
      const url = getInstallationManagementUrl(123, 'test-user', 'User')
      expect(url).toBe('https://github.com/settings/installations/123')
    })

    it('returns user URL when account login is null', () => {
      const url = getInstallationManagementUrl(123, null, 'Organization')
      expect(url).toBe('https://github.com/settings/installations/123')
    })

    it('returns user URL when account type is null', () => {
      const url = getInstallationManagementUrl(123, 'test-org', null)
      expect(url).toBe('https://github.com/settings/installations/123')
    })

    it('returns user URL when both account login and type are undefined', () => {
      const url = getInstallationManagementUrl(123, undefined, undefined)
      expect(url).toBe('https://github.com/settings/installations/123')
    })
  })

  describe('createOAuthOctokit', () => {
    it('creates an Octokit instance with OAuth token', () => {
      ;(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(() => ({}) as any)

      createOAuthOctokit('test-token')

      expect(Octokit).toHaveBeenCalledWith({ auth: 'test-token' })

      expect(logger.debug).toHaveBeenCalledWith('github:auth', 'createOAuthOctokit called', {
        accessTokenLength: 10,
      })
    })
  })

  describe('getInstallationOctokit', () => {
    beforeEach(() => {
      // Reset mock implementation to default for each test
      ;(createAppAuth as jest.MockedFunction<typeof createAppAuth>).mockImplementation(() => {
        return jest.fn().mockResolvedValue({
          type: 'installation',
          token: 'test-installation-token',
          expiresAt: '2023-01-01T00:00:00Z',
        })
      })
    })

    it('creates an Octokit instance with App authentication', async () => {
      // Mock createAppAuth to return a token
      const mockAuthFunction = jest
        .fn()
        .mockResolvedValue({
          type: 'installation',
          token: 'test-installation-token',
          expiresAt: '2023-01-01T00:00:00Z',
        })(createAppAuth as jest.MockedFunction<typeof createAppAuth>)
        .mockReturnValue(mockAuthFunction)

      // Mock Octokit
      const mockOctokit = {}
      ;(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(() => mockOctokit as any)

      // Call the function
      const result = await getInstallationOctokit(12345)

      // Verify correct auth parameters
      expect(createAppAuth).toHaveBeenCalledWith({
        appId: '12345',
        privateKey: 'test-private-key\nwith-newline',
        installationId: 12345,
      })

      // Verify auth function was called with correct type
      expect(mockAuthFunction).toHaveBeenCalledWith({ type: 'installation' })

      // Verify Octokit was created with token
      expect(Octokit).toHaveBeenCalledWith({ auth: 'test-installation-token' })

      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith('github:auth', 'getInstallationOctokit called', {
        installationId: 12345,
      })

      expect(logger.debug).toHaveBeenCalledWith(
        'github:auth',
        'Generated installation access token',
        {
          tokenType: 'installation',
          expiresAt: '2023-01-01T00:00:00Z',
        }
      )

      // Verify return value
      expect(result).toBe(mockOctokit)
    })

    it('throws an error when app credentials are missing', async () => {
      delete process.env.GITHUB_APP_ID
      delete process.env.GITHUB_APP_PRIVATE_KEY_PKCS8

      await expect(getInstallationOctokit(12345)).rejects.toThrow(
        'GitHub App credentials not configured'
      )

      expect(logger.error).toHaveBeenCalledWith('github:auth', 'Missing GitHub App credentials', {
        hasAppId: false,
        hasPrivateKey: false,
      })
    })

    it('throws an error when appId is missing', async () => {
      delete process.env.GITHUB_APP_ID

      await expect(getInstallationOctokit(12345)).rejects.toThrow(
        'GitHub App credentials not configured'
      )

      expect(logger.error).toHaveBeenCalledWith('github:auth', 'Missing GitHub App credentials', {
        hasAppId: false,
        hasPrivateKey: true,
      })
    })

    it('throws an error when privateKey is missing', async () => {
      delete process.env.GITHUB_APP_PRIVATE_KEY_PKCS8

      await expect(getInstallationOctokit(12345)).rejects.toThrow(
        'GitHub App credentials not configured'
      )

      expect(logger.error).toHaveBeenCalledWith('github:auth', 'Missing GitHub App credentials', {
        hasAppId: true,
        hasPrivateKey: false,
      })
    })

    it('propagates authentication errors', async () => {
      // Mock auth error
      const mockError = new Error('Authentication failed')
      const mockAuthFunction = jest
        .fn()
        .mockRejectedValue(mockError)(createAppAuth as jest.MockedFunction<typeof createAppAuth>)
        .mockReturnValue(mockAuthFunction)

      await expect(getInstallationOctokit(12345)).rejects.toThrow('Authentication failed')

      expect(logger.error).toHaveBeenCalledWith(
        'github:auth',
        'Error creating installation Octokit',
        { error: mockError }
      )
    })
  })

  describe('getAllAppInstallations', () => {
    it('retrieves and filters installations by app name', async () => {
      // Mock successful response with installations
      const mockResponse = {
        data: {
          installations: [
            {
              id: 1,
              app_slug: 'test-app',
              app_id: 12345,
              repository_selection: 'all',
              target_type: 'User',
              account: {
                login: 'test-user',
                type: 'User',
                avatar_url: 'https://github.com/avatar.png',
              },
            },
            {
              id: 2,
              app_slug: 'other-app',
              app_id: 67890,
              repository_selection: 'selected',
              target_type: 'Organization',
              account: {
                login: 'test-org',
                type: 'Organization',
                avatar_url: 'https://github.com/avatar2.png',
              },
            },
          ],
        },
      }

      // Mock Octokit
      const mockOctokitInstance = {
        rest: {
          apps: {
            listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await getAllAppInstallations('test-token')

      // Verify Octokit creation
      expect(Octokit).toHaveBeenCalledWith({ auth: 'test-token' })

      // Verify API call
      expect(mockOctokitInstance.rest.apps.listInstallationsForAuthenticatedUser).toHaveBeenCalled()

      // Verify correct filtering - should only return the installation for 'test-app'
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].appSlug).toBe('test-app')

      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith('github:auth', 'getAllAppInstallations called', {
        accessTokenLength: 10,
      })

      expect(logger.debug).toHaveBeenCalledWith('github:auth', 'Retrieved user installations', {
        installationsCount: 2,
        appName: 'test-app',
        appId: '12345',
      })

      expect(logger.info).toHaveBeenCalledWith(
        'github:auth',
        'Found GitHub App installations',
        expect.objectContaining({
          count: 1,
          accounts: 'test-user',
        })
      )
    })

    it("filters installations by app ID when name doesn't match", async () => {
      // Change app name in env
      process.env.NEXT_PUBLIC_GITHUB_APP_NAME = 'different-app-name'

      // Mock successful response with installations
      const mockResponse = {
        data: {
          installations: [
            {
              id: 1,
              app_slug: 'not-matching',
              app_id: 12345, // Matches app ID
              repository_selection: 'all',
              target_type: 'User',
              account: {
                login: 'test-user',
                type: 'User',
                avatar_url: 'https://github.com/avatar.png',
              },
            },
          ],
        },
      }

      // Mock Octokit
      const mockOctokitInstance = {
        rest: {
          apps: {
            listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await getAllAppInstallations('test-token')

      // Verify correct filtering by app ID
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].appId).toBe(12345)
    })

    it('handles installations with missing account information', async () => {
      // Mock response with null account
      const mockResponse = {
        data: {
          installations: [
            {
              id: 1,
              app_slug: 'test-app',
              app_id: 12345,
              repository_selection: 'all',
              target_type: 'User',
              account: null,
            },
          ],
        },
      }

      // Mock Octokit
      const mockOctokitInstance = {
        rest: {
          apps: {
            listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await getAllAppInstallations('test-token')

      // Verify correct handling of null account
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].account).toBeNull()
    })

    it('includes all installations when no app name or ID is provided', async () => {
      // Clear app name and ID
      delete process.env.NEXT_PUBLIC_GITHUB_APP_NAME
      delete process.env.GITHUB_APP_ID

      // Mock successful response with installations
      const mockResponse = {
        data: {
          installations: [
            {
              id: 1,
              app_slug: 'app-1',
              app_id: 12345,
              repository_selection: 'all',
              target_type: 'User',
              account: {
                login: 'user-1',
                type: 'User',
                avatar_url: 'https://github.com/avatar1.png',
              },
            },
            {
              id: 2,
              app_slug: 'app-2',
              app_id: 67890,
              repository_selection: 'selected',
              target_type: 'Organization',
              account: {
                login: 'org-1',
                type: 'Organization',
                avatar_url: 'https://github.com/avatar2.png',
              },
            },
          ],
        },
      }

      // Mock Octokit
      const mockOctokitInstance = {
        rest: {
          apps: {
            listInstallationsForAuthenticatedUser: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await getAllAppInstallations('test-token')

      // Should include all installations without filtering
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(2)
    })

    it('handles API errors gracefully', async () => {
      // Mock API error
      const mockError = new Error('API error')
      const mockOctokitInstance = {
        rest: {
          apps: {
            listInstallationsForAuthenticatedUser: jest.fn().mockRejectedValue(mockError),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await getAllAppInstallations('test-token')

      // Should return empty array on error
      expect(result).toEqual([])

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        'github:auth',
        'Error getting GitHub App installations',
        { error: mockError }
      )
    })
  })

  describe('checkAppInstallation', () => {
    // Tests for getAllAppInstallations
    let originalGetAllAppInstallations: typeof getAllAppInstallations

    beforeEach(() => {
      // Store the original implementation
      originalGetAllAppInstallations = getAllAppInstallations
      // Create a spy on getAllAppInstallations directly in the import
      jest.spyOn(require('../auth'), 'getAllAppInstallations')
    })

    afterEach(() => {
      // Restore the original implementation
      if (originalGetAllAppInstallations) {
        ;(getAllAppInstallations as any) = originalGetAllAppInstallations
      }
    })

    it('returns the first installation ID when installations exist', async () => {
      // Mock the getAllAppInstallations function
      ;(
        getAllAppInstallations as jest.MockedFunction<typeof getAllAppInstallations>
      ).mockResolvedValue([
        {
          id: 12345,
          account: {
            login: 'test-user',
            type: 'User',
            avatarUrl: 'https://github.com/avatar.png',
          },
          appSlug: 'test-app',
          appId: 67890,
          repositorySelection: 'all',
          targetType: 'User',
        },
        {
          id: 67890,
          account: {
            login: 'test-org',
            type: 'Organization',
            avatarUrl: 'https://github.com/org-avatar.png',
          },
          appSlug: 'test-app',
          appId: 67890,
          repositorySelection: 'selected',
          targetType: 'Organization',
        },
      ])

      // Call the function
      const result = await checkAppInstallation('test-token')

      // Should return first installation ID
      expect(result).toBe(12345)

      // Verify getAllAppInstallations was called
      expect(getAllAppInstallations).toHaveBeenCalledWith('test-token')

      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith('github:auth', 'checkAppInstallation called', {
        accessTokenLength: 10,
      })

      expect(logger.info).toHaveBeenCalledWith(
        'github:auth',
        'Using first GitHub App installation',
        {
          installationId: 12345,
          account: 'test-user',
        }
      )
    })

    it('returns null when no installations exist', async () => {
      // Mock getAllAppInstallations to return empty array
      ;(
        getAllAppInstallations as jest.MockedFunction<typeof getAllAppInstallations>
      ).mockResolvedValue([])

      // Call the function
      const result = await checkAppInstallation('test-token')

      // Should return null when no installations
      expect(result).toBeNull()

      // Verify logging
      expect(logger.info).toHaveBeenCalledWith(
        'github:auth',
        'No GitHub App installation found for this user'
      )
    })

    it('returns null on error', async () => {
      // Mock getAllAppInstallations to throw an error
      const mockError = new Error('Test error')(
        getAllAppInstallations as jest.MockedFunction<typeof getAllAppInstallations>
      ).mockRejectedValue(mockError)

      // Call the function
      const result = await checkAppInstallation('test-token')

      // Should return null on error
      expect(result).toBeNull()

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        'github:auth',
        'Error checking for GitHub App installation',
        { error: mockError }
      )
    })
  })

  describe('validateOAuthToken', () => {
    it('validates a token with required scopes', async () => {
      // Mock successful authentication response
      const mockResponse = {
        data: {
          login: 'test-user',
          id: 12345,
        },
        headers: {
          'x-oauth-scopes': 'repo, read:org, user:email',
        },
      }

      // Mock Octokit instance with getAuthenticated
      const mockOctokitInstance = {
        rest: {
          users: {
            getAuthenticated: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      }(
        // Mock Octokit constructor
        Octokit as jest.MockedFunction<typeof Octokit>
      ).mockImplementation(() => mockOctokitInstance as any)

      // Call the function
      const result = await validateOAuthToken('test-token')

      // Verify correct validation result
      expect(result.isValid).toBe(true)
      expect(result.login).toBe('test-user')
      expect(result.scopes).toEqual(['repo', 'read:org', 'user:email'])
      expect(result.hasRepoScope).toBe(true)
      expect(result.hasReadOrgScope).toBe(true)

      // Verify Octokit creation
      expect(Octokit).toHaveBeenCalledWith({ auth: 'test-token' })

      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith('github:auth', 'validateOAuthToken called', {
        accessTokenLength: 10,
      })

      expect(logger.info).toHaveBeenCalledWith('github:auth', 'Validated OAuth token', {
        login: 'test-user',
        tokenScopes: ['repo', 'read:org', 'user:email'],
        hasRepoScope: true,
        hasReadOrgScope: true,
      })
    })

    it('validates a token missing required scopes', async () => {
      // Mock authentication response with limited scopes
      const mockResponse = {
        data: {
          login: 'test-user',
          id: 12345,
        },
        headers: {
          'x-oauth-scopes': 'user:email',
        },
      }

      // Mock Octokit
      const mockOctokitInstance = {
        rest: {
          users: {
            getAuthenticated: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await validateOAuthToken('test-token')

      // Token is valid but missing required scopes
      expect(result.isValid).toBe(true)
      expect(result.login).toBe('test-user')
      expect(result.scopes).toEqual(['user:email'])
      expect(result.hasRepoScope).toBe(false)
      expect(result.hasReadOrgScope).toBe(false)
    })

    it('handles invalid tokens', async () => {
      // Mock authentication error
      const mockError = new Error('Bad credentials')
      const mockOctokitInstance = {
        rest: {
          users: {
            getAuthenticated: jest.fn().mockRejectedValue(mockError),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await validateOAuthToken('invalid-token')

      // Should indicate invalid token
      expect(result.isValid).toBe(false)
      expect(result.scopes).toEqual([])
      expect(result.hasRepoScope).toBe(false)
      expect(result.hasReadOrgScope).toBe(false)
      expect(result.error).toBe('Bad credentials')

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith('github:auth', 'Error validating OAuth token', {
        error: mockError,
      })
    })

    it('handles missing scopes header', async () => {
      // Mock authentication response with no scopes header
      const mockResponse = {
        data: {
          login: 'test-user',
          id: 12345,
        },
        headers: {}, // No x-oauth-scopes header
      }

      // Mock Octokit
      const mockOctokitInstance = {
        rest: {
          users: {
            getAuthenticated: jest.fn().mockResolvedValue(mockResponse),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await validateOAuthToken('test-token')

      // Token is valid but has no scopes
      expect(result.isValid).toBe(true)
      expect(result.login).toBe('test-user')
      expect(result.scopes).toEqual([])
      expect(result.hasRepoScope).toBe(false)
      expect(result.hasReadOrgScope).toBe(false)
    })

    it('handles non-Error objects in catch block', async () => {
      // Mock a non-Error rejection
      const mockNonError = 'String error message'
      const mockOctokitInstance = {
        rest: {
          users: {
            getAuthenticated: jest.fn().mockRejectedValue(mockNonError),
          },
        },
      }(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
        () => mockOctokitInstance as any
      )

      // Call the function
      const result = await validateOAuthToken('test-token')

      // Should handle non-Error properly
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('Unknown error')

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith('github:auth', 'Error validating OAuth token', {
        error: mockNonError,
      })
    })
  })
})

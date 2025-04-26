// @ts-nocheck - Disable TypeScript checking temporarily - see task T043
/**
 * Simplified tests for the GitHub authentication module
 * Focus on functions that can be tested without complex mocking
 */

import { getInstallationManagementUrl, createOAuthOctokit, getInstallationOctokit } from '../auth'
import { logger } from '@/lib/logger'
import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'

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

describe('GitHub Auth Module - Simple Tests', () => {
  // Save original env
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup test environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_GITHUB_APP_NAME: 'test-app',
      GITHUB_APP_ID: '12345',
      GITHUB_APP_PRIVATE_KEY_PKCS8: 'test-private-key\\nwith-newline',
    }
  })

  afterEach(() => {
    // Restore original env
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
    it('throws error when app credentials are missing', async () => {
      // Clear environment variables
      delete process.env.GITHUB_APP_ID
      delete process.env.GITHUB_APP_PRIVATE_KEY_PKCS8

      // Should throw error
      await expect(getInstallationOctokit(12345)).rejects.toThrow(
        'GitHub App credentials not configured'
      )

      expect(logger.error).toHaveBeenCalledWith('github:auth', 'Missing GitHub App credentials', {
        hasAppId: false,
        hasPrivateKey: false,
      })
    })

    it('throws error when appId is missing', async () => {
      // Clear just the app ID
      delete process.env.GITHUB_APP_ID

      await expect(getInstallationOctokit(12345)).rejects.toThrow(
        'GitHub App credentials not configured'
      )

      expect(logger.error).toHaveBeenCalledWith('github:auth', 'Missing GitHub App credentials', {
        hasAppId: false,
        hasPrivateKey: true,
      })
    })

    it('throws error when privateKey is missing', async () => {
      // Clear just the private key
      delete process.env.GITHUB_APP_PRIVATE_KEY_PKCS8

      await expect(getInstallationOctokit(12345)).rejects.toThrow(
        'GitHub App credentials not configured'
      )

      expect(logger.error).toHaveBeenCalledWith('github:auth', 'Missing GitHub App credentials', {
        hasAppId: true,
        hasPrivateKey: false,
      })
    })

    it('creates an Octokit instance with App authentication', async () => {
      // Mock auth function that returns a token
      const mockAuthFunction = jest
        .fn()
        .mockResolvedValue({
          type: 'installation',
          token: 'test-token',
          expiresAt: '2023-01-01T00:00:00Z',
        })(
          // Mock createAppAuth to return our mock auth function
          createAppAuth as jest.MockedFunction<typeof createAppAuth>
        )
        .mockReturnValue(mockAuthFunction)

      // Mock Octokit constructor
      const mockOctokit = {}
      ;(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(() => mockOctokit as any)

      // Call the function
      const result = await getInstallationOctokit(12345)

      // Verify createAppAuth was called correctly
      expect(createAppAuth).toHaveBeenCalledWith({
        appId: '12345',
        privateKey: 'test-private-key\nwith-newline',
        installationId: 12345,
      })

      // Verify auth function was called with correct type
      expect(mockAuthFunction).toHaveBeenCalledWith({ type: 'installation' })

      // Verify Octokit was created with the token
      expect(Octokit).toHaveBeenCalledWith({ auth: 'test-token' })

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

      // Verify the function returns the Octokit instance
      expect(result).toBe(mockOctokit)
    })

    it('propagates authentication errors', async () => {
      // Mock auth error
      const mockError = new Error('Authentication failed')
      const mockAuthFunction = jest
        .fn()
        .mockRejectedValue(mockError)(
          // Mock createAppAuth to return our failing mock auth function
          createAppAuth as jest.MockedFunction<typeof createAppAuth>
        )
        .mockReturnValue(mockAuthFunction)

      // Should throw the error
      await expect(getInstallationOctokit(12345)).rejects.toThrow('Authentication failed')

      // Verify error logging
      expect(logger.error).toHaveBeenCalledWith(
        'github:auth',
        'Error creating installation Octokit',
        { error: mockError }
      )
    })
  })
})

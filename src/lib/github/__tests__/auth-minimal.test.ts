// @ts-nocheck - Disable TypeScript checking temporarily - see task T043
/**
 * Minimal tests for the GitHub authentication module
 * Focus only on functions that can be easily tested
 */

import { getInstallationManagementUrl, createOAuthOctokit } from '../auth'
import { logger } from '../../logger'
import { Octokit } from 'octokit'
import { describe, beforeEach, it, expect, jest } from '@jest/globals'

// Mock dependencies
jest.mock('../../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Create MockOctokit class for consistent typing
class MockOctokit {
  rest: any
  request: any

  constructor(options: Record<string, unknown> = {}) {
    this.rest = {}
    this.request = jest.fn()
  }
}

// Mock Octokit constructor
jest.mock('octokit', () => {
  const mockOctokitConstructor = jest
    .fn()
    .mockImplementation((options: Record<string, unknown>) => {
      return new MockOctokit(options) as unknown as Octokit
    })

  return {
    Octokit: mockOctokitConstructor,
  }
})

describe('GitHub Auth Module - Minimal Tests', () => {
  beforeEach((): void => {
    jest.clearAllMocks()
  })

  describe('getInstallationManagementUrl', () => {
    it('returns organization URL for organization accounts', (): void => {
      const url: string = getInstallationManagementUrl(123, 'test-org', 'Organization')
      expect(url).toBe('https://github.com/organizations/test-org/settings/installations/123')
    })

    it('returns user URL when account type is not Organization', (): void => {
      const url: string = getInstallationManagementUrl(123, 'test-user', 'User')
      expect(url).toBe('https://github.com/settings/installations/123')
    })

    it('returns user URL when account login is null', (): void => {
      const url: string = getInstallationManagementUrl(123, null, 'Organization')
      expect(url).toBe('https://github.com/settings/installations/123')
    })

    it('returns user URL when account type is null', (): void => {
      const url: string = getInstallationManagementUrl(123, 'test-org', null)
      expect(url).toBe('https://github.com/settings/installations/123')
    })

    it('returns user URL when both account login and type are undefined', (): void => {
      const url: string = getInstallationManagementUrl(123, undefined, undefined)
      expect(url).toBe('https://github.com/settings/installations/123')
    })
  })

  describe('createOAuthOctokit', () => {
    it('creates an Octokit instance with OAuth token', (): void => {
      // Our mock is already set up by the jest.mock above
      createOAuthOctokit('test-token')

      // Verify Octokit constructor was called with correct options
      expect(Octokit).toHaveBeenCalledWith({ auth: 'test-token' })

      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith('github:auth', 'createOAuthOctokit called', {
        accessTokenLength: 10,
      })
    })
  })
})

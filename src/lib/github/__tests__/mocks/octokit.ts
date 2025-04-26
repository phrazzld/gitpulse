/**
 * Shared mocks for Octokit
 * This file provides consistent mocking patterns for Octokit across test files
 */

import { jest } from '@jest/globals'
import { Octokit } from 'octokit'

/**
 * Base MockOctokit class that can be extended or used directly in tests
 */
export class MockOctokit {
  rest: any
  request: any
  paginate: any

  constructor(options: Record<string, unknown> = {}) {
    this.rest = {
      rateLimit: {
        get: jest.fn().mockResolvedValue({
          data: {
            resources: {
              core: {
                limit: 5000,
                remaining: 4000,
                reset: Math.floor(Date.now() / 1000) + 3600,
              },
            },
          },
          headers: {},
        }),
      },
      users: {
        getAuthenticated: jest.fn().mockResolvedValue({
          data: { login: 'testuser', id: 123, type: 'User', two_factor_authentication: true },
          headers: { 'x-oauth-scopes': 'repo, read:org' },
        }),
      },
      // Add other common REST API endpoints as needed
    }

    this.request = jest.fn()
    this.paginate = jest.fn()
  }
}

/**
 * Setup the Octokit mock consistently across test files
 */
export function setupOctokitMock(): void {
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
}

/**
 * Helper to get properly typed mocked Octokit
 */
export function getMockedOctokit(): jest.MockedFunction<typeof Octokit> {
  // This cast is necessary because TypeScript doesn't know that
  // Octokit has been mocked by jest.mock
  return jest.mocked(Octokit)
}

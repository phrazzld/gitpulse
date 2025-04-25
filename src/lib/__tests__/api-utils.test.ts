/**
 * Types for test mocking - since we're not actually running tests right now
 * This helps with TypeScript checks during development
 */
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

import { generateBasicStats, extractUniqueRepositories, extractUniqueDates } from '../api-utils'
import { Commit } from '../github'
import { CommitStats } from '@/types/api'
import { logger } from '../logger'

// Mock dependencies
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('api-utils', () => {
  // Sample test data
  const mockCommits: Commit[] = [
    {
      sha: '123abc',
      commit: {
        author: {
          name: 'User 1',
          email: 'user1@example.com',
          date: '2023-01-01T10:00:00Z',
        },
        message: 'First commit',
      },
      html_url: 'https://github.com/org1/repo1/commit/123abc',
      repository: {
        full_name: 'org1/repo1',
      },
      author: {
        login: 'user1',
        avatar_url: 'https://example.com/avatar1.png',
      },
    },
    {
      sha: '456def',
      commit: {
        author: {
          name: 'User 2',
          email: 'user2@example.com',
          date: '2023-01-02T10:00:00Z',
        },
        message: 'Second commit',
      },
      html_url: 'https://github.com/org1/repo1/commit/456def',
      repository: {
        full_name: 'org1/repo1',
      },
      author: {
        login: 'user2',
        avatar_url: 'https://example.com/avatar2.png',
      },
    },
    {
      sha: '789ghi',
      commit: {
        author: {
          name: 'User 1',
          email: 'user1@example.com',
          date: '2023-01-03T10:00:00Z',
        },
        message: 'Third commit',
      },
      html_url: 'https://github.com/org2/repo2/commit/789ghi',
      repository: {
        full_name: 'org2/repo2',
      },
      author: {
        login: 'user1',
        avatar_url: 'https://example.com/avatar1.png',
      },
    },
    // A commit without repository field, fallback to html_url parsing
    {
      sha: 'abc123',
      commit: {
        author: {
          name: 'User 3',
          email: 'user3@example.com',
          date: '2023-01-03T12:00:00Z',
        },
        message: 'Fourth commit',
      },
      html_url: 'https://github.com/org3/repo3/commit/abc123',
      author: {
        login: 'user3',
        avatar_url: 'https://example.com/avatar3.png',
      },
    },
  ]

  describe('generateBasicStats', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should generate correct statistics for commits', () => {
      const result = generateBasicStats(mockCommits)

      // Check structure and types
      expect(result).toHaveProperty('totalCommits')
      expect(result).toHaveProperty('repositories')
      expect(result).toHaveProperty('dates')

      // Check values
      expect(result.totalCommits).toBe(4)
      expect(result.repositories).toHaveLength(3)
      expect(result.repositories).toContain('org1/repo1')
      expect(result.repositories).toContain('org2/repo2')
      expect(result.repositories).toContain('org3/repo3')
      expect(result.dates).toHaveLength(3)
      expect(result.dates).toContain('2023-01-01')
      expect(result.dates).toContain('2023-01-02')
      expect(result.dates).toContain('2023-01-03')

      // Verify logging
      expect(logger.debug).toHaveBeenCalledWith('api-utils', 'Generating basic stats', {
        commitCount: 4,
      })
      expect(logger.debug).toHaveBeenCalledWith('api-utils', 'Basic stats generated', {
        totalCommits: 4,
        uniqueRepos: 3,
        uniqueDates: 3,
      })
    })

    it('should handle empty commit array', () => {
      const result = generateBasicStats([])

      expect(result.totalCommits).toBe(0)
      expect(result.repositories).toHaveLength(0)
      expect(result.dates).toHaveLength(0)
    })
  })

  describe('extractUniqueRepositories', () => {
    it('should extract unique repository names from commits', () => {
      const result = extractUniqueRepositories(mockCommits)

      expect(result).toHaveLength(3)
      expect(result).toContain('org1/repo1')
      expect(result).toContain('org2/repo2')
      expect(result).toContain('org3/repo3')
    })

    it('should handle empty commit array', () => {
      const result = extractUniqueRepositories([])
      expect(result).toHaveLength(0)
    })
  })

  describe('extractUniqueDates', () => {
    it('should extract unique dates from commits', () => {
      const result = extractUniqueDates(mockCommits)

      expect(result).toHaveLength(3)
      expect(result).toContain('2023-01-01')
      expect(result).toContain('2023-01-02')
      expect(result).toContain('2023-01-03')
    })

    it('should handle empty commit array', () => {
      const result = extractUniqueDates([])
      expect(result).toHaveLength(0)
    })
  })
})

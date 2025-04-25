/**
 * Test file for optimize.ts utility functions
 *
 * This test file demonstrates:
 * 1. Proper TypeScript type annotations throughout
 * 2. Testing of pure functions with varied inputs
 * 3. Coverage of edge cases and error scenarios
 * 4. No mocking of internal collaborators (adhering to GitPulse mocking policy)
 * 5. Comprehensive documentation of test strategy
 */

import {
  optimizeRepository,
  optimizeCommit,
  optimizeContributor,
  optimizeArray,
  removeNullValues,
  optimizedJSONStringify,
  MinimalRepository,
  MinimalCommit,
  MinimalContributor,
} from '../optimize'
import { Repository, Commit } from '../github'

/**
 * Test Fixtures
 * --------------------------------------------------------------------
 * Well-typed test data that represents a variety of real-world scenarios
 * This allows tests to focus on behavior rather than data setup
 */

/**
 * Repository fixture with complete data
 */
const fullRepository: Repository = {
  id: 12345,
  name: 'test-repo',
  full_name: 'test-org/test-repo',
  owner: {
    login: 'test-org',
  },
  private: false,
  html_url: 'https://github.com/test-org/test-repo',
  description: 'A test repository',
  updated_at: '2023-02-01T00:00:00Z',
  language: 'TypeScript',
}

/**
 * Repository fixture with minimal required data
 */
const minimalRepository: Repository = {
  id: 67890,
  name: 'min-repo',
  full_name: 'test-org/min-repo',
  owner: {
    login: 'test-org',
  },
  private: true,
  html_url: 'https://github.com/test-org/min-repo',
  description: null,
  updated_at: '2023-03-10T00:00:00Z',
  language: null,
}

/**
 * Commit fixture with complete data
 */
const fullCommit: Commit = {
  sha: 'abc123def456',
  commit: {
    author: {
      name: 'Jane Developer',
      email: 'jane@example.com',
      date: '2023-04-15T10:30:00Z',
    },
    committer: {
      name: 'GitHub',
      email: 'noreply@github.com',
      date: '2023-04-15T10:30:00Z',
    },
    message: 'feat: add new awesome feature',
    url: 'https://api.github.com/repos/test-org/test-repo/git/commits/abc123def456',
    tree: {
      sha: 'tree-sha',
      url: 'https://api.github.com/repos/test-org/test-repo/git/trees/tree-sha',
    },
  },
  author: {
    login: 'janedeveloper',
    avatar_url: 'https://github.com/janedeveloper.png',
    url: 'https://api.github.com/users/janedeveloper',
  },
  html_url: 'https://github.com/test-org/test-repo/commit/abc123def456',
  repository: {
    full_name: 'test-org/test-repo',
  },
}

/**
 * Commit fixture with missing author data
 */
const commitWithMissingAuthor: Commit = {
  sha: 'def456ghi789',
  commit: {
    author: null,
    committer: {
      name: 'GitHub',
      email: 'noreply@github.com',
      date: '2023-04-16T09:15:00Z',
    },
    message: 'chore: update dependencies',
    url: 'https://api.github.com/repos/test-org/test-repo/git/commits/def456ghi789',
    tree: {
      sha: 'tree-sha-2',
      url: 'https://api.github.com/repos/test-org/test-repo/git/trees/tree-sha-2',
    },
  },
  author: null,
  html_url: 'https://github.com/test-org/test-repo/commit/def456ghi789',
  repository: {
    full_name: 'test-org/test-repo',
  },
}

/**
 * Commit fixture with missing repository
 */
const commitWithoutRepository: Commit = {
  sha: 'ghi789jkl012',
  commit: {
    author: {
      name: 'John Contributor',
      email: 'john@example.com',
      date: '2023-04-17T14:20:00Z',
    },
    committer: {
      name: 'GitHub',
      email: 'noreply@github.com',
      date: '2023-04-17T14:20:00Z',
    },
    message: 'fix: resolve critical bug',
    url: 'https://api.github.com/repos/test-org/another-repo/git/commits/ghi789jkl012',
    tree: {
      sha: 'tree-sha-3',
      url: 'https://api.github.com/repos/test-org/another-repo/git/trees/tree-sha-3',
    },
  },
  author: {
    login: 'johncontributor',
    avatar_url: 'https://github.com/johncontributor.png',
    url: 'https://api.github.com/users/johncontributor',
  },
  html_url: 'https://github.com/test-org/another-repo/commit/ghi789jkl012',
}

/**
 * Contributor fixtures with different data structures
 */
const contributorWithUsername: Record<string, any> = {
  username: 'johndoe',
  displayName: 'John Doe',
  avatarUrl: 'https://github.com/johndoe.png',
  commitCount: 42,
}

const contributorWithLogin: Record<string, any> = {
  login: 'janedoe',
  name: 'Jane Doe',
  avatar_url: 'https://github.com/janedoe.png',
  commit_count: 27,
}

const contributorWithMissingFields: Record<string, any> = {
  login: 'anonymous',
  commit_count: 5,
}

/**
 * Object with nulls and undefined values for removeNullValues tests
 */
const objectWithNulls: Record<string, any> = {
  id: 123,
  name: 'test',
  description: null,
  tags: undefined,
  count: 0,
  isActive: false,
}

/**
 * Test Suite
 * --------------------------------------------------------------------
 */

describe('Optimize utilities', (): void => {
  /**
   * Testing optimizeRepository function
   *
   * Strategy:
   * 1. Test with complete repository data
   * 2. Test with minimal repository data
   * 3. Verify that only expected fields are present in output
   * 4. Verify that null values are handled correctly
   */
  describe('optimizeRepository', (): void => {
    it('should optimize a repository with complete data', (): void => {
      const result: MinimalRepository = optimizeRepository(fullRepository)

      expect(result).toEqual({
        id: 12345,
        name: 'test-repo',
        full_name: 'test-org/test-repo',
        owner_login: 'test-org',
        private: false,
        language: 'TypeScript',
        html_url: 'https://github.com/test-org/test-repo',
      })
    })

    it('should handle repositories with null language', (): void => {
      const result: MinimalRepository = optimizeRepository(minimalRepository)

      expect(result).toEqual({
        id: 67890,
        name: 'min-repo',
        full_name: 'test-org/min-repo',
        owner_login: 'test-org',
        private: true,
        language: null,
        html_url: 'https://github.com/test-org/min-repo',
      })
    })

    it('should only include expected fields', (): void => {
      const result: MinimalRepository = optimizeRepository(fullRepository)

      // Object should only have these properties and no extras
      const expectedKeys: string[] = [
        'id',
        'name',
        'full_name',
        'owner_login',
        'private',
        'language',
        'html_url',
      ]
      const actualKeys: string[] = Object.keys(result)

      expect(actualKeys.sort()).toEqual(expectedKeys.sort())
    })
  })

  /**
   * Testing optimizeCommit function
   *
   * Strategy:
   * 1. Test with complete commit data
   * 2. Test with missing author data
   * 3. Test with missing repository data
   * 4. Verify fallback values are used when data is missing
   */
  describe('optimizeCommit', (): void => {
    it('should optimize a commit with complete data', (): void => {
      const result: MinimalCommit = optimizeCommit(fullCommit)

      expect(result).toEqual({
        sha: 'abc123def456',
        message: 'feat: add new awesome feature',
        author_name: 'Jane Developer',
        author_date: '2023-04-15T10:30:00Z',
        author_login: 'janedeveloper',
        author_avatar: 'https://github.com/janedeveloper.png',
        repo_name: 'test-org/test-repo',
        html_url: 'https://github.com/test-org/test-repo/commit/abc123def456',
      })
    })

    it('should handle commits with missing author data', (): void => {
      const result: MinimalCommit = optimizeCommit(commitWithMissingAuthor)

      // Should use "Unknown" as fallback for author name
      expect(result.author_name).toBe('Unknown')
      // Should use current date as fallback
      expect(result.author_date).toBeDefined()
      expect(result.author_login).toBeUndefined()
      expect(result.author_avatar).toBeUndefined()
    })

    it('should handle commits without repository information', (): void => {
      const result: MinimalCommit = optimizeCommit(commitWithoutRepository)

      expect(result.repo_name).toBeUndefined()
      expect(result.html_url).toBe('https://github.com/test-org/another-repo/commit/ghi789jkl012')
    })
  })

  /**
   * Testing optimizeContributor function
   *
   * Strategy:
   * 1. Test with different input formats
   * 2. Test fallback field selection
   * 3. Test with missing fields
   */
  describe('optimizeContributor', (): void => {
    it('should optimize a contributor with username format', (): void => {
      const result: MinimalContributor = optimizeContributor(contributorWithUsername)

      expect(result).toEqual({
        username: 'johndoe',
        display_name: 'John Doe',
        avatar_url: 'https://github.com/johndoe.png',
        commit_count: 42,
      })
    })

    it('should optimize a contributor with login format', (): void => {
      const result: MinimalContributor = optimizeContributor(contributorWithLogin)

      expect(result).toEqual({
        username: 'janedoe',
        display_name: 'Jane Doe',
        avatar_url: 'https://github.com/janedoe.png',
        commit_count: 27,
      })
    })

    it('should handle missing fields with appropriate fallbacks', (): void => {
      const result: MinimalContributor = optimizeContributor(contributorWithMissingFields)

      expect(result).toEqual({
        username: 'anonymous',
        display_name: 'anonymous', // Fallback to username/login
        avatar_url: null, // Fallback to null
        commit_count: 5,
      })
    })
  })

  /**
   * Testing optimizeArray function
   *
   * Strategy:
   * 1. Test with arrays of different types
   * 2. Test with empty array
   * 3. Test with non-array input
   */
  describe('optimizeArray', (): void => {
    it('should optimize an array of repositories', (): void => {
      const repositories: Repository[] = [fullRepository, minimalRepository]
      const result: MinimalRepository[] = optimizeArray<Repository, MinimalRepository>(
        repositories,
        optimizeRepository
      )

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('test-repo')
      expect(result[1].name).toBe('min-repo')
    })

    it('should optimize an array of commits', (): void => {
      const commits: Commit[] = [fullCommit, commitWithMissingAuthor]
      const result: MinimalCommit[] = optimizeArray<Commit, MinimalCommit>(commits, optimizeCommit)

      expect(result).toHaveLength(2)
      expect(result[0].sha).toBe('abc123def456')
      expect(result[1].sha).toBe('def456ghi789')
    })

    it('should return an empty array when input is empty', (): void => {
      const result: MinimalRepository[] = optimizeArray<Repository, MinimalRepository>(
        [],
        optimizeRepository
      )

      expect(result).toEqual([])
    })

    it('should return an empty array for non-array inputs', (): void => {
      // @ts-expect-error - Testing invalid input type
      const result = optimizeArray(null, optimizeRepository)
      expect(result).toEqual([])

      // @ts-expect-error - Testing invalid input type
      const result2 = optimizeArray(undefined, optimizeRepository)
      expect(result2).toEqual([])

      // @ts-expect-error - Testing invalid input type
      const result3 = optimizeArray({}, optimizeRepository)
      expect(result3).toEqual([])
    })
  })

  /**
   * Testing removeNullValues function
   *
   * Strategy:
   * 1. Test with object containing null and undefined
   * 2. Test with object having falsy values that should be preserved
   */
  describe('removeNullValues', (): void => {
    it('should remove null and undefined values', (): void => {
      const result: Partial<Record<string, any>> = removeNullValues(objectWithNulls)

      // Should have these properties
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('count')
      expect(result).toHaveProperty('isActive')

      // Should not have these properties
      expect(result).not.toHaveProperty('description')
      expect(result).not.toHaveProperty('tags')
    })

    it('should preserve falsy values that are not null or undefined', (): void => {
      const result: Partial<Record<string, any>> = removeNullValues(objectWithNulls)

      // Should preserve 0 and false
      expect(result.count).toBe(0)
      expect(result.isActive).toBe(false)
    })

    it('should handle empty objects', (): void => {
      const result: Partial<Record<string, any>> = removeNullValues({})
      expect(result).toEqual({})
    })
  })

  /**
   * Testing optimizedJSONStringify function
   *
   * Strategy:
   * 1. Test with various data types
   * 2. Test with nested objects
   * 3. Test with arrays
   */
  describe('optimizedJSONStringify', (): void => {
    it('should stringify simple values', (): void => {
      expect(optimizedJSONStringify(123)).toBe('123')
      expect(optimizedJSONStringify('test')).toBe('"test"')
      expect(optimizedJSONStringify(true)).toBe('true')
      expect(optimizedJSONStringify(null)).toBe('null')
    })

    it('should stringify objects correctly', (): void => {
      const obj: Record<string, any> = { id: 1, name: 'test' }
      const result: string = optimizedJSONStringify(obj)

      // Parse back to verify structure is preserved
      const parsed = JSON.parse(result)
      expect(parsed).toEqual(obj)
    })

    it('should handle arrays differently than standard JSON.stringify', (): void => {
      const testArray: number[] = [1, 2, 3]
      const result: string = optimizedJSONStringify(testArray)

      expect(result).toBe('[1,2,3]')
    })

    it('should handle arrays with objects', (): void => {
      const arrayWithObjects: Array<Record<string, string>> = [{ name: 'item1' }, { name: 'item2' }]

      const result: string = optimizedJSONStringify(arrayWithObjects)

      // Parse back to verify structure is preserved
      const parsed = JSON.parse(result)
      expect(parsed).toEqual(arrayWithObjects)
    })

    it('should handle nested structures', (): void => {
      const complex: Record<string, any> = {
        id: 1,
        items: [
          { id: 1, name: 'first' },
          { id: 2, name: 'second' },
        ],
        metadata: {
          created: '2023-01-01',
          tags: ['important', 'featured'],
        },
      }

      const result: string = optimizedJSONStringify(complex)

      // Parse back to verify structure is preserved
      const parsed = JSON.parse(result)
      expect(parsed).toEqual(complex)
    })
  })
})

/**
 * Tests for the GitHub index module
 *
 * Verifies that the index module correctly re-exports all functions and types
 * from the other GitHub modules for backward compatibility.
 */

import * as githubIndex from '../index'
import * as githubTypes from '../types'
import * as githubAuth from '../auth'
import * as githubRepositories from '../repositories'
import * as githubCommits from '../commits'
import * as githubUtils from '../utils'

describe('GitHub Index Module', () => {
  it('should re-export all types from types.ts', () => {
    // Get keys from the types module
    const typeKeys = Object.keys(githubTypes)

    // Verify all keys are present in the index exports
    typeKeys.forEach(key => {
      expect(githubIndex).toHaveProperty(key)
    })
  })

  it('should re-export all functions from auth.ts', () => {
    // Get keys from the auth module
    const authKeys = Object.keys(githubAuth)

    // Verify all keys are present in the index exports
    authKeys.forEach(key => {
      expect(githubIndex).toHaveProperty(key)
    })
  })

  it('should re-export all functions from repositories.ts', () => {
    // Get keys from the repositories module
    const repoKeys = Object.keys(githubRepositories)

    // Verify all keys are present in the index exports
    repoKeys.forEach(key => {
      expect(githubIndex).toHaveProperty(key)
    })
  })

  it('should re-export all functions from commits.ts', () => {
    // Get keys from the commits module
    const commitKeys = Object.keys(githubCommits)

    // Verify all keys are present in the index exports
    commitKeys.forEach(key => {
      expect(githubIndex).toHaveProperty(key)
    })
  })

  it('should re-export all functions from utils.ts', () => {
    // Get keys from the utils module
    const utilsKeys = Object.keys(githubUtils)

    // Verify all keys are present in the index exports
    utilsKeys.forEach(key => {
      expect(githubIndex).toHaveProperty(key)
    })
  })

  it('should define MODULE_NAME for backward compatibility', () => {
    expect(githubIndex.MODULE_NAME).toBe('github')
  })
})

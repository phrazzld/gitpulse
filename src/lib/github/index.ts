/**
 * GitHub module index
 *
 * This module re-exports all functions and types from the GitHub modules
 * to maintain backward compatibility with code that imports from the
 * original monolithic github.ts file.
 */

// Re-export all types
export * from './types'

// Re-export all authentication-related functions
export * from './auth'

// Re-export all repository-related functions
export * from './repositories'

// Re-export all commit-related functions
export * from './commits'

// Re-export all utility functions
export * from './utils'

// Set the module name for logging
export const MODULE_NAME = 'github'

/**
 * Global type definitions for testing
 * This file consolidates type declarations used in tests
 */

import { Octokit } from 'octokit'

/**
 * Declare module augmentations for third-party libraries
 */
declare global {
  namespace jest {
    // Add specialized type for mocking Octokit
    interface MockedOctokit extends Octokit {
      // Add any custom properties that might be needed in tests
      rest: jest.Mocked<Octokit['rest']>
      request: jest.MockedFunction<Octokit['request']>
    }
  }
}

/**
 * Export types that might be useful in multiple test files
 */
export {}

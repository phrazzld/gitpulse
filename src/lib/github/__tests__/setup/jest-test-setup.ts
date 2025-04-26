/**
 * Jest setup utilities for GitHub tests
 * Import this in test files to get consistent mocking and type definitions
 */

import { jest } from '@jest/globals'

/**
 * Mock the logger consistently across test files
 */
export function setupLoggerMock(): void {
  jest.mock('@/lib/logger', () => ({
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
  }))
}

/**
 * Reset all mocks before each test
 */
export function resetAllMocks(): void {
  beforeEach(() => {
    jest.clearAllMocks()
  })
}

/**
 * Test Utilities Index
 * 
 * This file exports all test utility functions from the various utility files.
 * Import from this file instead of individual utility files for better organization.
 */

export * from './github-test-utils';
export * from './react-test-utils';
export * from './network-test-utils';
export * from './dateMock';
export * from './localStorageMock';
export * from './mockRenderer';

/**
 * Common test utilities that don't belong in a specific category
 */

/**
 * Helper to create a delay in tests
 * @param ms - Number of milliseconds to wait
 * @returns Promise that resolves after specified time
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a mock date for testing date-dependent functions
 * @param dateString - ISO date string to use for the mock date
 * @returns Object with mock and restore functions
 * @deprecated Use createMockDate from dateMock.ts instead
 */
export const mockDate = (dateString: string) => {
  // Import the createMockDate function from the dateMock module
  const { createMockDate } = require('./dateMock');
  return createMockDate(dateString);
};

/**
 * Create a spy on console methods to prevent test output pollution
 * @param methods - Console methods to spy on
 * @returns Function to restore original console methods
 */
export const mockConsole = (methods: Array<'log' | 'error' | 'warn' | 'info' | 'debug'> = ['error']) => {
  const originalMethods: Record<string, any> = {};
  
  methods.forEach(method => {
    originalMethods[method] = console[method];
    console[method] = jest.fn();
  });
  
  return () => {
    methods.forEach(method => {
      console[method] = originalMethods[method];
    });
  };
};

/**
 * Helper to test localStorage in environments where it might not be available
 * @returns Mock localStorage implementation and utility functions
 * @deprecated Use createMockLocalStorage from localStorageMock.ts instead
 */
export const mockLocalStorage = () => {
  // Import the createMockLocalStorage function from the localStorageMock module
  const { createMockLocalStorage } = require('./localStorageMock');
  return createMockLocalStorage();
};
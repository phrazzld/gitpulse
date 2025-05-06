/**
 * Test Utilities Index
 * 
 * This file exports all test utility functions from the various utility files.
 * Import from this file instead of individual utility files for better organization.
 */

export * from './github-test-utils';
export * from './react-test-utils';
export * from './network-test-utils';

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
 */
export const mockDate = (dateString: string) => {
  const originalDate = global.Date;
  const mockDateObj = new Date(dateString);
  
  // @ts-ignore
  global.Date = class extends Date {
    constructor() {
      super();
      return mockDateObj;
    }
    
    static now() {
      return mockDateObj.getTime();
    }
  };
  
  return {
    date: mockDateObj,
    restore: () => {
      global.Date = originalDate;
    }
  };
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
 */
export const mockLocalStorage = () => {
  const originalLocalStorage = global.localStorage;
  const store: Record<string, string> = {};
  
  const mockStorage = {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => {
        delete store[key];
      });
    }),
    key: jest.fn((index: number) => {
      return Object.keys(store)[index] || null;
    }),
    length: 0
  };
  
  Object.defineProperty(mockStorage, 'length', {
    get: () => Object.keys(store).length
  });
  
  // @ts-ignore
  global.localStorage = mockStorage;
  
  return {
    store,
    localStorage: mockStorage,
    restore: () => {
      global.localStorage = originalLocalStorage;
    }
  };
};
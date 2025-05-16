/**
 * LocalStorage Mock Utility
 * 
 * This module provides a strongly-typed mock for the browser's localStorage object
 * to use in tests for localStorage-dependent functionality.
 */

/**
 * Type definition for the localStorage interface we need to mock
 */
interface Storage {
  readonly length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

/**
 * Creates a mock localStorage implementation for testing with proper TypeScript typing
 * 
 * @returns Object with the mock store, localStorage implementation, and restore function
 */
export function createMockLocalStorage() {
  const originalLocalStorage = global.localStorage;
  const store: Record<string, string> = {};
  
  // Create a properly typed mock localStorage implementation
  const mockStorage: Storage = {
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
    get length() {
      return Object.keys(store).length;
    }
  };
  
  // Replace the global localStorage with our mock
  global.localStorage = mockStorage as Storage;
  
  return {
    store,
    localStorage: mockStorage,
    restore: () => {
      global.localStorage = originalLocalStorage;
    }
  };
}
/**
 * Typed Mock Utilities
 *
 * This module provides type-safe utilities for creating Jest mocks
 * with proper TypeScript typing.
 */

import { jest } from '@jest/globals';

/**
 * Creates a typed mock function that returns a resolved promise with the provided value
 * 
 * @param value Value to be resolved by the mock function
 * @returns Properly typed Jest mock function
 */
export function mockResolvedValue<T>(value: T): jest.Mock {
  return jest.fn(() => Promise.resolve(value));
}

/**
 * Creates a typed mock function that returns a rejected promise with the provided error
 * 
 * @param error Error to be rejected by the mock function
 * @returns Properly typed Jest mock function
 */
export function mockRejectedValue<E = Error>(error: E): jest.Mock {
  return jest.fn(() => Promise.reject(error));
}

/**
 * Creates a typed mock function that returns the provided value
 * 
 * @param value Value to be returned by the mock function
 * @returns Properly typed Jest mock function
 */
export function mockReturnValue<T>(value: T): jest.Mock {
  return jest.fn(() => value);
}

/**
 * Creates a typed mock implementation
 * 
 * @param implementation Function implementation for the mock
 * @returns Properly typed Jest mock function
 */
export function mockImplementation<T extends (...args: any[]) => any>(
  implementation: T
): jest.Mock {
  return jest.fn(implementation);
}

/**
 * Type helper for creating typed mock objects
 * 
 * This type helps create properly typed mock objects where each property
 * is a Jest mock function with the correct return type based on the original interface
 */
export type TypedMock<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? jest.Mock
    : T[K] extends object
      ? TypedMock<T[K]>
      : T[K];
};

/**
 * Creates a typed mock object based on the provided interface
 * with default mock implementations for each method
 * 
 * @param mockImplementations Default implementations for mock methods
 * @returns Typed mock object
 */
export function createTypedMock<T extends Record<string, any>>(
  mockImplementations: Partial<{
    [K in keyof T]: T[K] extends (...args: any[]) => any
      ? ReturnType<T[K]> | Error
      : never;
  }>
): TypedMock<T> {
  const mockObject = {} as TypedMock<T>;
  
  // Create mock functions for each property in the implementation
  for (const key in mockImplementations) {
    const value = mockImplementations[key];
    
    // Create the appropriate mock based on the value
    if (value instanceof Error) {
      mockObject[key] = mockRejectedValue(value) as any;
    } else if (value instanceof Promise) {
      mockObject[key] = mockResolvedValue(value) as any;
    } else {
      mockObject[key] = mockReturnValue(value) as any;
    }
  }
  
  return mockObject;
}
/**
 * Date Mock Utility
 * 
 * This module provides a strongly-typed mock for JavaScript's Date object
 * to use in tests for date-dependent functionality.
 */

/**
 * Type describing the properties of the Date constructor that we need to mock
 */
type DateConstructor = typeof Date;

/**
 * Interface for the mock Date class to ensure we're implementing all required methods
 */
interface MockDateClass extends DateConstructor {
  new(): Date;
  now(): number;
}

/**
 * Creates a mock date for testing date-dependent functions with proper TypeScript typing
 * 
 * @param dateString - ISO date string to use for the mock date
 * @returns Object with mock date, mock class, and restore function
 */
export function createMockDate(dateString: string) {
  const originalDate = global.Date;
  const mockDateObj = new Date(dateString);
  
  // Create a properly typed mock Date class
  const MockDate = class MockDate extends Date {
    constructor() {
      super();
      return mockDateObj;
    }
    
    static now() {
      return mockDateObj.getTime();
    }
  } as unknown as MockDateClass;
  
  // Replace the global Date class with our mock
  global.Date = MockDate;
  
  return {
    date: mockDateObj,
    MockDate,
    restore: () => {
      global.Date = originalDate;
    }
  };
}
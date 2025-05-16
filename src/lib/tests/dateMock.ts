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
  const mockTime = new Date(dateString).getTime();
  
  // Create a properly typed mock Date class
  const MockDate = class MockDate extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        // When called with no args, return a fresh copy of the mock date
        super(mockTime);
      } else {
        // Otherwise call the original constructor with explicit args
        if (args.length === 1) {
          super(args[0]);
        } else if (args.length === 2) {
          super(args[0], args[1]);
        } else if (args.length === 3) {
          super(args[0], args[1], args[2]);
        } else if (args.length === 4) {
          super(args[0], args[1], args[2], args[3]);
        } else if (args.length === 5) {
          super(args[0], args[1], args[2], args[3], args[4]);
        } else if (args.length === 6) {
          super(args[0], args[1], args[2], args[3], args[4], args[5]);
        } else if (args.length === 7) {
          super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        } else {
          super(args[0]);
        }
      }
    }
    
    static now() {
      return mockTime;
    }
  } as unknown as MockDateClass;
  
  // Replace the global Date class with our mock
  global.Date = MockDate;
  
  return {
    date: new MockDate(),
    MockDate,
    restore: () => {
      global.Date = originalDate;
    }
  };
}
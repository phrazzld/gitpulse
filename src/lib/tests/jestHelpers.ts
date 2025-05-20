/**
 * Jest Helpers for Enhanced Error Output
 * 
 * This module provides utilities to improve Jest error reporting
 * by enhancing object comparison output and providing custom matchers
 * for more descriptive error messages.
 */

/**
 * Creates a formatted string representation of an object
 * suitable for error messages with clean indentation.
 * 
 * @param obj The object to format
 * @param indent Current indentation level (used for recursion)
 * @returns A formatted string representation
 */
export function formatObject(obj: unknown, indent = 2): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  
  if (typeof obj === 'object') {
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      
      const items = obj.map(item => ' '.repeat(indent + 2) + formatObject(item, indent + 2));
      return `[\n${items.join(',\n')}\n${' '.repeat(indent)}]`;
    }
    
    if (Object.keys(obj).length === 0) return '{}';
    
    const entries = Object.entries(obj).map(([key, value]) => {
      return `${' '.repeat(indent + 2)}"${key}": ${formatObject(value, indent + 2)}`;
    });
    
    return `{\n${entries.join(',\n')}\n${' '.repeat(indent)}}`;
  }
  
  if (typeof obj === 'string') return `"${obj}"`;
  
  return String(obj);
}

/**
 * Enhances the error message for object comparison failures
 * by showing a more detailed diff between expected and actual values.
 * 
 * @param actual The actual value received
 * @param expected The expected value
 * @param message Optional custom message prefix
 * @returns A detailed error message
 */
export function formatDiff(actual: unknown, expected: unknown, message?: string): string {
  const prefix = message ? `${message}\n\n` : '';
  
  const formattedActual = formatObject(actual);
  const formattedExpected = formatObject(expected);
  
  return `${prefix}Expected: ${formattedExpected}\n\nReceived: ${formattedActual}`;
}

/**
 * Highlights the first difference between two objects
 * to make it easier to identify where they diverge.
 * 
 * @param actual The actual value
 * @param expected The expected value 
 * @returns A message pointing out the first difference
 */
export function findFirstDifference(actual: unknown, expected: unknown): string {
  if (typeof actual !== typeof expected) {
    return `Type mismatch: expected ${typeof expected}, received ${typeof actual}`;
  }
  
  if (typeof actual !== 'object' || actual === null || expected === null) {
    return `Value mismatch: expected ${String(expected)}, received ${String(actual)}`;
  }
  
  // Handle arrays
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      return `Array length mismatch: expected ${expected.length}, received ${actual.length}`;
    }
    
    for (let i = 0; i < actual.length; i++) {
      if (JSON.stringify(actual[i]) !== JSON.stringify(expected[i])) {
        return `Array difference at index ${i}:\n${findFirstDifference(actual[i], expected[i])}`;
      }
    }
  }
  
  // For type safety, ensure we're working with non-null objects
  const actualObj = actual as Record<string, unknown>;
  const expectedObj = expected as Record<string, unknown>;
  
  // Handle objects
  const actualKeys = Object.keys(actualObj);
  const expectedKeys = Object.keys(expectedObj);
  
  // Check for missing/extra keys
  const missingKeys = expectedKeys.filter(key => !actualKeys.includes(key));
  if (missingKeys.length > 0) {
    return `Missing keys in actual object: ${missingKeys.join(', ')}`;
  }
  
  const extraKeys = actualKeys.filter(key => !expectedKeys.includes(key));
  if (extraKeys.length > 0) {
    return `Extra keys in actual object: ${extraKeys.join(', ')}`;
  }
  
  // Check for value differences
  for (const key of expectedKeys) {
    if (JSON.stringify(actualObj[key]) !== JSON.stringify(expectedObj[key])) {
      return `Object difference at key "${key}":\n${findFirstDifference(
        actualObj[key], 
        expectedObj[key]
      )}`;
    }
  }
  
  return 'No differences found';
}

/**
 * Extends Jest's expect with custom matchers
 * to provide more detailed error messages.
 */
export function setupJestMatchers(): void {
  // Only run this in a Jest environment
  if (typeof expect !== 'undefined' && typeof expect.extend === 'function') {
    expect.extend({
      /**
       * Custom matcher that provides detailed output for deep equality checks.
       */
      toEqualWithDetail(actual: unknown, expected: unknown) {
        const pass = this.equals(actual, expected);
        
        if (pass) {
          return {
            pass: true,
            message: () => `Expected objects not to be deeply equal, but they were.`,
          };
        }
        
        const diff = findFirstDifference(actual, expected);
        const detailedMessage = formatDiff(actual, expected, diff);
        
        return {
          pass: false,
          message: () => detailedMessage,
        };
      },
      
      /**
       * Custom matcher for partial object matching with detailed feedback.
       */
      toMatchObjectWithDetail(actual: Record<string, unknown>, expected: Record<string, unknown>) {
        const objEntries = Object.entries(expected);
        
        // Check each property in expected
        for (const [key, value] of objEntries) {
          // If property doesn't exist or doesn't match
          if (!actual.hasOwnProperty(key) || !this.equals(actual[key], value)) {
            return {
              pass: false,
              message: () => 
                `Expected object to contain property "${key}" with value ${formatObject(value)}\n` +
                `Actual value for "${key}": ${formatObject(actual[key])}`,
            };
          }
        }
        
        return {
          pass: true,
          message: () => `Expected object not to match the specified properties, but it did.`,
        };
      },
    });
  }
}

// TypeScript type augmentation for the custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Custom matcher that provides detailed output for deep equality checks.
       * @param expected The expected value
       */
      toEqualWithDetail(expected: unknown): R;
      
      /**
       * Custom matcher for partial object matching with detailed feedback.
       * @param expected The expected object properties
       */
      toMatchObjectWithDetail(expected: Record<string, unknown>): R;
    }
  }
}
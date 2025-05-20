// Optional: configure or set up a testing framework before each test
// This is needed for testing-library
import '@testing-library/jest-dom';
import { setupJestMatchers } from './src/lib/tests/jestHelpers';

// Initialize custom Jest matchers for enhanced error output
setupJestMatchers();

// Configure Jest for better error messages
expect.hasAssertions.suppressError = false;

// Improve the output of array and object diffs
// This makes it easier to spot differences in complex objects
const originalConsoleError = console.error;
console.error = (...args) => {
  // Enhance error output for objects and arrays by adding more context
  const enhancedArgs = args.map(arg => {
    if (typeof arg === 'string' && arg.includes('Difference')) {
      return arg.replace(/Received:/g, '\nReceived:')
               .replace(/Expected:/g, '\nExpected:')
               .replace(/\[\s+/g, '[\n  ')
               .replace(/\{\s+/g, '{\n  ')
               .replace(/,\s+/g, ',\n  ');
    }
    return arg;
  });
  originalConsoleError(...enhancedArgs);
};

// Mock CSS variables for tests, but only if window is defined (browser environment)
// This helps with assertions on styles that use CSS variables
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: (prop) => {
        if (prop === '--dark-slate') return '#1b2b34';
        if (prop === '--electric-blue') return '#3b8eea';
        if (prop === '--light-gray') return '#f5f5f5';
        if (prop === '--disabled-gray') return '#e0e0e0';
        if (prop === '--text-light') return '#ffffff';
        if (prop === '--text-dark') return '#333333';
        return '';
      },
    }),
  });
}
// Optional: configure or set up a testing framework before each test
// This is needed for testing-library
import '@testing-library/jest-dom';

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
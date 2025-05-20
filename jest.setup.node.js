// Jest setup for Node.js environment (API routes)

// Import the custom Jest helpers
const { setupJestMatchers } = require('./src/lib/tests/jestHelpers');

// Initialize custom Jest matchers for enhanced error output
setupJestMatchers();

// Configure Jest for better error messages
if (expect.hasAssertions) {
  expect.hasAssertions.suppressError = false;
}

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

// Mock global fetch
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers()
  })
);

// Mock GitHub library to avoid ESM issues
jest.mock('@/lib/github', () => ({
  fetchCommitsForRepositories: jest.fn().mockResolvedValue([]),
  fetchAllRepositories: jest.fn().mockResolvedValue([]),
  getAllAppInstallations: jest.fn().mockResolvedValue([]),
}));

// Provide required global objects that might be missing in Node environment
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock crypto if needed
if (!global.crypto) {
  global.crypto = {
    getRandomValues: arr => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
    subtle: {}
  };
}

// Add structuredClone if not available
if (!global.structuredClone) {
  global.structuredClone = obj => JSON.parse(JSON.stringify(obj));
}
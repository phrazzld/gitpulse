// Jest setup for Node.js environment (API routes)

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
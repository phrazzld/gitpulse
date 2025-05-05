/**
 * This file is used to set up Jest to handle ESM modules correctly.
 * It runs before tests to ensure all module imports are handled properly.
 */

// For Node 18+, this allows require() to import ESM modules
// by providing essential interoperability between CommonJS and ES modules.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Mock fetch API for tests
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  })
);

// Setup environment variables needed for tests
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://test-api.example.com';
process.env.NEXT_PUBLIC_GITHUB_APP_NAME = 'test-app';
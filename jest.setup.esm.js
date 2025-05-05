/**
 * This file is used to set up Jest to handle ESM modules correctly.
 * It runs before tests to ensure all module imports are handled properly.
 */

// For Node 18+, this allows require() to import ESM modules
// by providing essential interoperability between CommonJS and ES modules.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Ensure TextEncoder/TextDecoder are available (required by some ESM modules)
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

// Mock fetch API for tests
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Map(),
    status: 200,
    statusText: 'OK'
  })
);

// Define Headers if not available (used by Octokit)
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers extends Map {
    append(key, value) {
      this.set(key, value);
    }
    delete(key) {
      super.delete(key);
    }
    get(key) {
      return super.get(key);
    }
    has(key) {
      return super.has(key);
    }
    set(key, value) {
      super.set(key, value);
      return this;
    }
  };
}

// Ensure ReadableStream is available (used by fetch-related modules)
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = class ReadableStream {
    constructor() {}
    getReader() {
      return {
        read: () => Promise.resolve({ done: true, value: undefined }),
        releaseLock: () => {}
      };
    }
  };
}

// Setup environment variables needed for tests
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://test-api.example.com';
process.env.NEXT_PUBLIC_GITHUB_APP_NAME = 'test-app';
process.env.NODE_ENV = 'test';
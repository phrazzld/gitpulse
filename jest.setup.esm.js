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

// Mock fetch API for tests with more comprehensive behavior
global.fetch = jest.fn().mockImplementation((url, options = {}) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Map(),
    status: 200,
    statusText: 'OK',
    url: typeof url === 'string' ? url : url?.toString?.() || '',
    clone: function() { return this; },
    redirected: false,
    type: 'basic',
    body: null,
  });
});

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
    entries() {
      return super.entries();
    }
    keys() {
      return super.keys();
    }
    values() {
      return super.values();
    }
    forEach(callback, thisArg) {
      return super.forEach(callback, thisArg);
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
        releaseLock: () => {},
        closed: Promise.resolve()
      };
    }
    pipeThrough() { return this; }
    pipeTo() { return Promise.resolve(); }
    tee() { return [this, this]; }
    cancel() { return Promise.resolve(); }
  };
}

// Add Response and Request classes if they don't exist
if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;
      this.type = 'basic';
      this.url = '';
      this.redirected = false;
    }
    
    clone() { return this; }
    json() { return Promise.resolve({}); }
    text() { return Promise.resolve(''); }
    blob() { return Promise.resolve(new Blob()); }
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
    formData() { return Promise.resolve({}); }
  };
}

if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input?.url || '';
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body || null;
      this.mode = init.mode || 'cors';
      this.credentials = init.credentials || 'same-origin';
      this.cache = init.cache || 'default';
      this.redirect = init.redirect || 'follow';
      this.referrer = init.referrer || 'about:client';
      this.integrity = init.integrity || '';
    }
    
    clone() { return this; }
    arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
    blob() { return Promise.resolve(new Blob()); }
    formData() { return Promise.resolve({}); }
    json() { return Promise.resolve({}); }
    text() { return Promise.resolve(''); }
  };
}

// Implement a minimal FormData (used by Octokit)
if (typeof globalThis.FormData === 'undefined') {
  globalThis.FormData = class FormData {
    constructor() {
      this._data = new Map();
    }
    
    append(key, value, filename) {
      this._data.set(key, { value, filename });
    }
    
    delete(key) {
      this._data.delete(key);
    }
    
    get(key) {
      return this._data.get(key)?.value;
    }
    
    getAll(key) {
      return this._data.has(key) ? [this._data.get(key).value] : [];
    }
    
    has(key) {
      return this._data.has(key);
    }
    
    set(key, value, filename) {
      this._data.set(key, { value, filename });
    }
    
    entries() {
      return this._data.entries();
    }
    
    keys() {
      return this._data.keys();
    }
    
    values() {
      const values = [];
      for (const [_, entry] of this._data.entries()) {
        values.push(entry.value);
      }
      return values[Symbol.iterator]();
    }
  };
}

// Implement URL and URLSearchParams if needed
if (typeof globalThis.URL === 'undefined') {
  globalThis.URL = class URL {
    constructor(url, base) {
      this.href = url;
      this.origin = '';
      this.protocol = 'https:';
      this.username = '';
      this.password = '';
      this.host = '';
      this.hostname = '';
      this.port = '';
      this.pathname = '';
      this.search = '';
      this.searchParams = new URLSearchParams();
      this.hash = '';
    }
    
    toString() {
      return this.href;
    }
    
    toJSON() {
      return this.href;
    }
  };
}

if (typeof globalThis.URLSearchParams === 'undefined') {
  globalThis.URLSearchParams = class URLSearchParams {
    constructor(init) {
      this._params = new Map();
      
      if (typeof init === 'string') {
        // Parse string
        const params = init.replace(/^\?/, '').split('&');
        for (const param of params) {
          if (!param) continue;
          const [key, value = ''] = param.split('=');
          this.append(decodeURIComponent(key), decodeURIComponent(value));
        }
      } else if (init instanceof URLSearchParams) {
        // Copy from another URLSearchParams
        for (const [key, value] of init.entries()) {
          this.append(key, value);
        }
      } else if (init && typeof init === 'object') {
        // From object
        for (const key of Object.keys(init)) {
          this.append(key, init[key]);
        }
      }
    }
    
    append(key, value) {
      const values = this._params.get(key) || [];
      values.push(String(value));
      this._params.set(key, values);
    }
    
    delete(key) {
      this._params.delete(key);
    }
    
    get(key) {
      const values = this._params.get(key);
      return values && values.length > 0 ? values[0] : null;
    }
    
    getAll(key) {
      return this._params.get(key) || [];
    }
    
    has(key) {
      return this._params.has(key);
    }
    
    set(key, value) {
      this._params.set(key, [String(value)]);
    }
    
    sort() {
      const entries = Array.from(this._params.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      this._params.clear();
      for (const [key, values] of entries) {
        this._params.set(key, values);
      }
    }
    
    toString() {
      let result = '';
      for (const [key, values] of this._params.entries()) {
        for (const value of values) {
          if (result) result += '&';
          result += `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
      }
      return result;
    }
    
    *entries() {
      for (const [key, values] of this._params.entries()) {
        for (const value of values) {
          yield [key, value];
        }
      }
    }
    
    *keys() {
      for (const key of this._params.keys()) {
        yield key;
      }
    }
    
    *values() {
      for (const [, values] of this._params.entries()) {
        for (const value of values) {
          yield value;
        }
      }
    }
    
    [Symbol.iterator]() {
      return this.entries();
    }
  };
}

// Setup Web Crypto API for Octokit (needed for some authentication methods)
if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.subtle) {
  const webcrypto = require('crypto').webcrypto;
  globalThis.crypto = webcrypto;
}

// Setup environment variables needed for tests
process.env.NEXT_PUBLIC_API_BASE_URL = 'http://test-api.example.com';
process.env.NEXT_PUBLIC_GITHUB_APP_NAME = 'test-app';
process.env.NODE_ENV = 'test';

// Export helper functions to facilitate test setup
module.exports = {
  resetFetchMocks() {
    global.fetch.mockClear();
  },
  
  mockFetchSuccess(data) {
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        headers: new Map(),
        statusText: 'OK'
      })
    );
  },
  
  mockFetchError(status = 500, message = 'Internal Server Error') {
    global.fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        status,
        statusText: message,
        json: () => Promise.reject(new Error(message)),
        text: () => Promise.resolve(message),
        headers: new Map()
      })
    );
  }
};
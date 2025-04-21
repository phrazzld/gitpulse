// Import jest-dom additions
import "@testing-library/jest-dom";

// Suppress JSX transform warnings in tests
// This is a workaround for the conflict between Next.js's requirement for "jsx":"preserve"
// and the test environment's need for a different JSX transform
const originalWarn = console.warn;
console.warn = (...args) => {
  // Filter out the JSX transform warning
  if (args[0]?.includes && args[0].includes("outdated JSX transform")) {
    return;
  }
  originalWarn(...args);
};

// Mock the global fetch function for tests
// This prevents "fetch is not defined" errors in the tokenValidator
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    headers: new Map([
      ["x-ratelimit-limit", "5000"],
      ["x-ratelimit-remaining", "4999"],
      ["x-ratelimit-reset", String(Math.floor(Date.now() / 1000) + 3600)],
      ["x-oauth-scopes", "repo, read:org, user:email"],
    ]),
  }),
);

// Mock Request and NextRequest for Next.js API tests
global.Request = class Request {};
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || "";
    this.headers = new Map(Object.entries(init.headers || {}));
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
};

// Mock next/server imports
jest.mock("next/server", () => {
  const responseHeaders = new Map();

  class MockHeaders {
    constructor(init) {
      this.headers = new Map();

      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }

    get(name) {
      return this.headers.get(name.toLowerCase());
    }

    set(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }

    append(name, value) {
      this.headers.set(name.toLowerCase(), value);
    }

    delete(name) {
      this.headers.delete(name.toLowerCase());
    }

    has(name) {
      return this.headers.has(name.toLowerCase());
    }

    entries() {
      return this.headers.entries();
    }

    [Symbol.iterator]() {
      return this.entries();
    }
  }

  class MockCookies {
    constructor() {
      this.cookies = new Map();
    }

    get(name) {
      return { name, value: this.cookies.get(name) };
    }

    getAll() {
      return Array.from(this.cookies.entries()).map(([name, value]) => ({
        name,
        value,
      }));
    }

    set(name, value) {
      this.cookies.set(name, value);
    }

    delete(name) {
      this.cookies.delete(name);
    }

    has(name) {
      return this.cookies.has(name);
    }
  }

  // Class to properly implement the NextURL object
  class MockNextURL {
    constructor(url = "https://example.com") {
      // Handle if input is null or undefined by defaulting to example.com
      const safeUrl = url || "https://example.com";
      // Parse the URL
      try {
        const parsedUrl = new URL(safeUrl);
        this.href = parsedUrl.href;
        this.origin = parsedUrl.origin;
        this.protocol = parsedUrl.protocol;
        this.host = parsedUrl.host;
        this.hostname = parsedUrl.hostname;
        this.port = parsedUrl.port;
        this.pathname = parsedUrl.pathname;
        this.search = parsedUrl.search;
        this.searchParams = parsedUrl.searchParams;
        this.hash = parsedUrl.hash;
        this.basePath = "";
      } catch (e) {
        // Handle invalid URLs gracefully
        const fallbackUrl = new URL("https://example.com");
        this.href = fallbackUrl.href;
        this.origin = fallbackUrl.origin;
        this.protocol = fallbackUrl.protocol;
        this.host = fallbackUrl.host;
        this.hostname = fallbackUrl.hostname;
        this.port = fallbackUrl.port;
        this.pathname = fallbackUrl.pathname;
        this.search = fallbackUrl.search;
        this.searchParams = new URLSearchParams();
        this.hash = fallbackUrl.hash;
        this.basePath = "";
      }
    }
  }

  class MockNextRequest {
    constructor(input, init = {}) {
      // Handle the URL appropriately
      if (typeof input === "string") {
        this.url = input;
      } else if (input && input.url) {
        this.url = input.url;
      } else {
        this.url = "https://example.com";
      }

      this.method = init.method || "GET";
      this.headers = new MockHeaders(init.headers || {});
      this.cookies = new MockCookies();
      this.bodyUsed = false;
      this._body = init.body;

      // Create nextUrl instance early to avoid issues
      this._nextUrl = new MockNextURL(this.url);
    }

    json() {
      this.bodyUsed = true;
      return Promise.resolve(
        typeof this._body === "string" ? JSON.parse(this._body) : this._body,
      );
    }

    text() {
      this.bodyUsed = true;
      return Promise.resolve(this._body);
    }

    get nextUrl() {
      return this._nextUrl;
    }
  }

  class MockNextResponse {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.statusText = options.statusText || "";
      this.headers = new MockHeaders(options.headers || {});
      this.cookies = new MockCookies();
    }

    static json(body, init = {}) {
      const jsonBody = JSON.stringify(body);
      const response = new MockNextResponse(jsonBody, init);
      response.headers.set("content-type", "application/json");
      return response;
    }

    json() {
      try {
        return Promise.resolve(JSON.parse(this.body));
      } catch (e) {
        return Promise.resolve({});
      }
    }

    static redirect(url, init = {}) {
      const response = new MockNextResponse("", { status: 307, ...init });
      response.headers.set("location", url);
      return response;
    }

    static next(options = {}) {
      const response = new MockNextResponse("", { status: 200 });
      return response;
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: MockNextResponse,
  };
});

// Mock Octokit to avoid ESM import issues in tests
jest.mock("octokit", () => {
  // Create the default mock implementation
  const defaultMockImplementation = () => ({
    request: jest.fn(),
    paginate: jest.fn(),
    rest: {
      users: {
        getAuthenticated: jest.fn().mockResolvedValue({
          headers: { "x-oauth-scopes": "repo, read:org, user:email" },
          data: {
            login: "test-user",
            id: 12345,
            type: "User",
            two_factor_authentication: true,
          },
        }),
      },
      rateLimit: {
        get: jest.fn().mockResolvedValue({
          data: {
            resources: {
              core: {
                limit: 5000,
                remaining: 4990,
                reset: Math.floor(Date.now() / 1000) + 3600,
              },
            },
          },
        }),
      },
      apps: {
        listInstallations: jest.fn(),
        listReposAccessibleToInstallation: jest.fn(),
      },
      repos: {
        listForAuthenticatedUser: jest.fn(),
        listForOrg: jest.fn(),
        listCommits: jest.fn(),
      },
      orgs: {
        listForAuthenticatedUser: jest.fn(),
      },
    },
  });

  const MockOctokit = jest.fn().mockImplementation(defaultMockImplementation);

  // Make sure the mock constructor supports mockImplementation
  MockOctokit.mockImplementation = jest
    .fn()
    .mockImplementation((implementation) => {
      // We'll still allow tests to override the implementation
      // but ensure the default headers are always present if not specified
      MockOctokit.mockImplementationOnce(implementation);
      return MockOctokit;
    });

  // Set a default response for getAuthenticated on all mock instances
  const originalMockImplementation = MockOctokit.mockImplementation;
  MockOctokit.mockImplementation = (...args) => {
    // Get the original mock implementation result
    const instance = originalMockImplementation(...args);

    // Ensure there's a users.getAuthenticated method that returns the right headers
    if (instance && instance.rest && instance.rest.users) {
      const getAuthenticated = instance.rest.users.getAuthenticated;
      if (getAuthenticated && typeof getAuthenticated === "function") {
        // Save original implementation
        const originalGetAuthenticated = getAuthenticated;

        // Override with version that always includes headers
        instance.rest.users.getAuthenticated = jest
          .fn()
          .mockImplementation(async (...args) => {
            try {
              const result = await originalGetAuthenticated(...args);

              // Add headers if missing
              if (!result.headers) {
                result.headers = {
                  "x-oauth-scopes": "repo, read:org, user:email",
                };
              } else if (!result.headers["x-oauth-scopes"]) {
                result.headers["x-oauth-scopes"] = "repo, read:org, user:email";
              }

              return result;
            } catch (error) {
              // Default response if original fails
              return {
                headers: { "x-oauth-scopes": "repo, read:org, user:email" },
                data: {
                  login: "test-user",
                  id: 12345,
                  type: "User",
                  two_factor_authentication: true,
                },
              };
            }
          });
      }
    }

    return instance;
  };

  return { Octokit: MockOctokit };
});

// Mock @octokit/auth-app
jest.mock("@octokit/auth-app", () => ({
  createAppAuth: jest.fn(),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    refresh: jest.fn(),
    pathname: "/",
  }),
}));

// Mock next/image - using a factory that doesn't access out-of-scope variables
jest.mock("next/image", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((props) => {
    // Return a React element-like structure without touching document
    return {
      type: "img",
      props,
      $$typeof: Symbol.for("react.element"),
    };
  }),
}));

// Mock CSS Variables for styling with var(--variable)
// Use jest.fn() instead of accessing window directly to avoid issues in CI
const mockGetComputedStyle = jest.fn().mockImplementation(() => ({
  getPropertyValue: jest.fn().mockImplementation((prop) => {
    // Add any CSS variables used in components here
    if (prop === "--neon-green") return "#00FF87";
    if (prop === "--electric-blue") return "#3B8EEA";
    if (prop === "--dark-slate") return "#1B2B34";
    if (prop === "--crimson-red") return "#FF3B30";
    if (prop === "--foreground") return "#FFFFFF";
    if (prop === "--luminous-yellow") return "#FFC857";
    if (prop === "--gradient-bg")
      return "linear-gradient(135deg, #1B2B34 0%, #2D3B44 100%)";
    return "";
  }),
}));

// Assign the mock after definition to avoid the module factory restriction
global.getComputedStyle = mockGetComputedStyle;

// Import the mock session from test-utils to ensure consistency
const { mockSession } = require("./src/__tests__/test-utils");

// Create complete mock auth options for next-auth
const mockAuthOptions = {
  providers: [
    {
      id: "github",
      name: "GitHub",
      type: "oauth",
      clientId: "mock-client-id",
      clientSecret: "mock-client-secret",
    },
  ],
  callbacks: {
    jwt: jest.fn().mockResolvedValue({}),
    session: jest.fn().mockResolvedValue(mockSession),
  },
  secret: "mock-secret",
};

// Create a mock callback function that returns the mockSession
const mockGetServerSession = jest.fn().mockImplementation(() => {
  return Promise.resolve(mockSession);
});

// Add Jest mock methods to the function to make TypeScript happy
mockGetServerSession.mockResolvedValue = jest
  .fn()
  .mockImplementation((value) => {
    return mockGetServerSession.mockImplementation(() =>
      Promise.resolve(value),
    );
  });

mockGetServerSession.mockResolvedValueOnce = jest
  .fn()
  .mockImplementation((value) => {
    return mockGetServerSession.mockImplementationOnce(() =>
      Promise.resolve(value),
    );
  });

// Mock next-auth to avoid ESM module issues
jest.mock("next-auth", () => {
  return {
    __esModule: true,
    default: jest.fn(),
    getServerSession: mockGetServerSession,
  };
});

// Mock next-auth/next
jest.mock("next-auth/next", () => {
  return {
    __esModule: true,
    getServerSession: mockGetServerSession,
  };
});

// Set up proper mock implementation for auth options
jest.mock("@/app/api/auth/[...nextauth]/route", () => {
  return {
    __esModule: true,
    authOptions: mockAuthOptions,
    GET: jest.fn(),
    POST: jest.fn(),
    handler: jest.fn(),
  };
});

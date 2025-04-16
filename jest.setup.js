// Import jest-dom additions
import "@testing-library/jest-dom";

// Mock Request and NextRequest for Next.js API tests
global.Request = class Request {};
global.Response = class Response {};

// Mock Octokit to avoid ESM import issues in tests
jest.mock("octokit", () => {
  const MockOctokit = jest.fn().mockImplementation(() => ({
    request: jest.fn(),
    rest: {
      users: { getAuthenticated: jest.fn() },
      apps: { listInstallations: jest.fn() },
      repos: {
        listForAuthenticatedUser: jest.fn(),
        listForOrg: jest.fn(),
        listCommits: jest.fn(),
      },
    },
  }));

  // Make sure the mock constructor supports mockImplementation
  MockOctokit.mockImplementation = jest
    .fn()
    .mockImplementation((implementation) => {
      MockOctokit.mockImplementationOnce(implementation);
      return MockOctokit;
    });

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

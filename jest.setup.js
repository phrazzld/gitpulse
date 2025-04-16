// Import jest-dom additions
import "@testing-library/jest-dom";

// Mock Request and NextRequest for Next.js API tests
global.Request = class Request {};
global.Response = class Response {};

// Mock Octokit to avoid ESM import issues in tests
jest.mock("octokit", () => ({
  Octokit: class MockOctokit {
    constructor() {
      this.request = jest.fn();
      this.rest = {
        users: { getAuthenticated: jest.fn() },
        apps: { listInstallations: jest.fn() },
        repos: {
          listForAuthenticatedUser: jest.fn(),
          listForOrg: jest.fn(),
          listCommits: jest.fn(),
        },
      };
    }
  },
}));

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

// Mock next/image - using a proper function mock that doesn't rely on JSX
jest.mock("next/image", () => ({
  __esModule: true,
  default: function Image(props) {
    // Create an actual img element
    const img = document.createElement("img");
    Object.assign(img, props);
    return img;
  },
}));

// Mock CSS Variables for styling with var(--variable)
Object.defineProperty(window, "getComputedStyle", {
  value: () => ({
    getPropertyValue: (prop) => {
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
    },
  }),
});

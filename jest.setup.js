// Import jest-dom additions
import "@testing-library/jest-dom";

// Mock Request and NextRequest for Next.js API tests
global.Request = class Request {};
global.Response = class Response {};

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

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  // Use a string representation to avoid JSX parsing in ESLint
  default: '(props) => { return createElement("img", props); }',
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

/**
 * Jest configuration for GitPulse
 *
 * This configuration is designed to properly handle React 19 and Next.js 15.2+ components
 * in tests, resolving JSX transform compatibility issues.
 */
const nextJest = require("next/jest");

// Providing the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: "./",
});

// Any custom config you want to pass to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",

  // Module name mapping for import aliases
  moduleNameMapper: {
    // Handle module aliases defined in tsconfig.json
    "^@/(.*)$": "<rootDir>/src/$1",
    "@components/(.*)$": "<rootDir>/src/components/library/$1",
  },

  // Files to exclude from testing
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/.next/",
    // Only exclude utility files, not test files that were previously skipped due to JSX issues
    "<rootDir>/src/__tests__/test-utils.tsx",
    "<rootDir>/src/__tests__/integration/DashboardTestWrapper.tsx",
    "<rootDir>/src/__tests__/integration/ImprovedDashboardTestWrapper.tsx",
  ],

  // Transform ignore patterns for node_modules
  transformIgnorePatterns: [
    // Transform ESM modules and React packages from node_modules for testing
    // This configuration is critical for React 19 compatibility
    "/node_modules/(?!(octokit|@octokit|jose|next-auth|openid-client|react|react-dom|@testing-library)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ],

  // Transform settings for JS/TS/JSX/TSX files
  transform: {
    // Use the updated babel.config.jest.js for proper JSX transformation
    "^.+\\.(js|jsx|ts|tsx|mjs)$": [
      "babel-jest",
      { configFile: "./babel.config.jest.js" },
    ],
  },

  // Cache settings - disable to ensure fresh transformations when config changes
  cache: false,

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    "src/components/dashboard/**/*.{js,jsx,ts,tsx}",
    "src/components/library/**/*.{js,jsx,ts,tsx}",
    "src/state/slices/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/test-utils.tsx",
  ],

  // Coverage thresholds - adjusted to match current progress
  // These thresholds should be increased in future test tickets
  coverageThreshold:
    process.env.CI === "true"
      ? undefined
      : {
          // Global thresholds for local development
          global: {
            branches: 15,
            functions: 15,
            lines: 20,
            statements: 19,
          },
          // Specific directory thresholds based on current coverage
          "src/components/dashboard/layout/": {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95,
          },
          "src/components/library/utils/": {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
          },
        },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig);

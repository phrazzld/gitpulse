const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app
  dir: './',
})

// Add custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Test paths to include
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**',
    '!**/node_modules/**',
    '!<rootDir>/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Core API logic - critical business logic
    "src/app/api/summary/handlers.ts": {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    },
    // Utility functions that are central to the application
    "src/lib/api-utils.ts": {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    },
    "src/lib/dashboard-utils.ts": {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    },
    "src/lib/github/utils.ts": {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    },
    // GitHub API interaction modules - core functionality
    "src/lib/github/commits.ts": {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    },
    "src/lib/github/repositories.ts": {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    },
    // Critical hooks for dashboard functionality
    "src/hooks/dashboard/useSummary.ts": {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    }
  },
  coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig)
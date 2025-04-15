const nextJest = require('next/jest');

// Providing the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
});

// Any custom config you want to pass to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (if you configured them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/src/__tests__/test-utils.tsx',
  ],
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/components/dashboard/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/test-utils.tsx',
  ],
  // Coverage thresholds - fail the test command if these are not met
  coverageThreshold: {
    // Global thresholds for all files - good targets to maintain
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    // Per-directory thresholds - these are set based on current coverage
    // and should be increased over time as more tests are added
    'src/components/dashboard/': {
      branches: 80,  // Already at 85.36%
      functions: 70, // Currently at 72.5%
      lines: 70,     // Currently at 71.11%
      statements: 70,// Currently at 71.73%
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config
module.exports = createJestConfig(customJestConfig);
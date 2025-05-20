const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.setup.esm.js'],
  moduleNameMapper: {
    // Handle module aliases
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/src/.*/__tests__/glance.md',
    '<rootDir>/e2e/', // Exclude Playwright E2E test files
    '.*\\.helper\\.ts$', // Exclude helper files
  ],
  // Enhanced error message configuration
  verbose: true,
  // Improved diff visualization
  prettierPath: null, // Use Jest's built-in prettier for consistent diffs
  injectGlobals: true,
  // Error formatting options
  errorOnDeprecated: true,
  // Configure diff output to be more readable
  // Improved diff output configuration
  verbose: true,
  // Larger context for better understanding test failures
  bail: false,
  // Make snapshot failures more readable
  snapshotFormat: {
    printBasicPrototype: false,
    escapeString: true,
  },
  // Expanding the list of ESM modules to process with Jest transformer
  transformIgnorePatterns: [
    '/node_modules/(?!(' + [
      // Octokit packages
      'octokit',
      '@octokit',
      
      // Dependencies of Octokit that might use ESM
      'node-fetch',
      'fetch-blob', 
      'formdata-polyfill',
      'data-uri-to-buffer',
      'web-streams-polyfill',
      
      // Additional ESM packages
      'is-plain-object',
      'universal-user-agent',
      'once',
      'wrappy',
      'tr46',
      'whatwg-url',
      'punycode',
      'webidl-conversions',
      
      // Additional dependencies that might be using ESM
      'before-after-hook',
      'deprecation',
      'stream-buffers',
      'undici',
      'hpagent',
      'hpagent',
      '@sindresorhus/is',
      'form-data-encoder',
      'ms',
      'querystringify',
      'requires-port',
      'url-parse'
    ].join('|') + ')/)' 
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/glance.md',
    '!**/node_modules/**',
  ],
  // Coverage thresholds configuration - CI will fail if these thresholds are not met
  // These thresholds are aligned with the requirements in DEVELOPMENT_PHILOSOPHY_APPENDIX_TESTING.md
  // When running with --coverage flag, Jest will enforce these thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/components/atoms/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/components/molecules/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/components/organisms/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['lcov', 'text', 'json-summary'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
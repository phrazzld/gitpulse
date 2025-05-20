// Special Jest configuration for API tests
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.node.js', '<rootDir>/jest.setup.api.js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Enhanced error message configuration for API tests
  verbose: true,
  // Improved diff visualization
  prettierPath: null,
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
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  testMatch: [
    '<rootDir>/src/app/api/**/__tests__/*.test.ts'
  ],
};
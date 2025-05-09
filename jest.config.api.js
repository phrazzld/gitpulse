// Special Jest configuration for API tests
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.node.js', '<rootDir>/jest.setup.api.js'],
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
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
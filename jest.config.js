module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^octokit$': '<rootDir>/src/lib/github/__mocks__/octokit.ts',
    '^@octokit/(.*)$': '<rootDir>/src/lib/github/__mocks__/@octokit/$1.ts'
  }
};
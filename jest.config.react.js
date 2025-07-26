module.exports = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  testMatch: [
    '**/__tests__/**/*.{ts,tsx}',
    '**/?(*.)+(spec|test).{ts,tsx}'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^octokit$': '<rootDir>/src/lib/github/__mocks__/octokit.ts',
    '^@octokit/(.*)$': '<rootDir>/src/lib/github/__mocks__/@octokit/$1.ts',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react'
      }
    }]
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react)/)'
  ]
};
#!/usr/bin/env node

/**
 * Custom script to run API tests in a Node environment
 * This is needed because our main Jest config uses jsdom environment,
 * but API route tests need to run in Node
 */

const { spawn } = require('child_process');
const path = require('path');

// Get the path to the API test files
const apiTestFiles = [
  'src/app/api/summary/__tests__/handlers.test.ts',
  'src/app/api/summary/__tests__/route.test.ts'
];

// Run Jest with specific environment settings
const jestProcess = spawn('npx', [
  'jest',
  '--testEnvironment=node',
  '--no-cache',
  '--setupFilesAfterEnv=./jest.setup.node.js',
  ...apiTestFiles
], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    // Set any environment variables needed for API tests
    GEMINI_API_KEY: 'test-api-key',
    NEXT_PUBLIC_VERCEL_URL: 'test.example.com'
  }
});

jestProcess.on('exit', (code) => {
  process.exit(code);
});
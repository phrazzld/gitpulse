#!/usr/bin/env node

// This script runs TypeScript type checking without specific files
// to ensure the tsconfig.json exclusions are respected
// Use with: node scripts/typecheck.js

const { execSync } = require('child_process');

try {
  // Run TypeScript compiler without passing specific files
  // This ensures it uses tsconfig.json properly
  console.log('Running TypeScript type check...');
  execSync('tsc --noEmit --project tsconfig.json', { stdio: 'inherit' });
  console.log('TypeScript check passed!');
  process.exit(0);
} catch (error) {
  console.error('TypeScript check failed!');
  process.exit(1);
}
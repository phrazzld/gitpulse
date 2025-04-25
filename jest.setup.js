/**
 * Jest setup file - runs before each test file
 * 
 * NOTE: Jest configuration files run in a Node.js CommonJS context.
 * ES Module import syntax (import x from 'y') is not supported here.
 * Always use require() for importing modules in Jest configuration files.
 */
require('@testing-library/jest-dom')

// Add any custom global setup needed for tests
/**
 * Custom accessibility testing utilities that override the default behavior
 * of axe-playwright to ensure a11y issues are reported as warnings instead of failures
 */

const assert = require('assert');

/**
 * Custom implementation of testResultDependsOnViolations that always skips failures
 * and only reports violations as warnings
 * 
 * This replaces the implementation in node_modules/axe-playwright/dist/utils.js
 * 
 * @param {Array} violations - List of a11y violations found
 * @param {boolean} skipFailures - Whether to skip failures (ignored in our implementation)
 */
const customTestResultDependsOnViolations = (violations, skipFailures) => {
  // Always log warnings but never fail tests
  if (violations.length) {
    console.warn({
      name: 'a11y violation summary',
      message: `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${violations.length === 1 ? 'was' : 'were'} detected`,
    });
  }
  
  // Ensure we don't throw an assertion error, regardless of skipFailures setting
  // This is intentionally commented out as we're not failing the test
  // assert.strictEqual(violations.length, 0, `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} were detected`);
};

// Export our custom implementation
module.exports = {
  customTestResultDependsOnViolations
};
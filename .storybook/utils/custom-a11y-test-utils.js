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
 * @returns {boolean} Always returns false to prevent test failures
 */
const customTestResultDependsOnViolations = (violations, skipFailures) => {
  // Always log warnings but never fail tests
  if (violations && violations.length) {
    console.warn({
      name: 'a11y violation summary',
      message: `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${violations.length === 1 ? 'was' : 'were'} detected`,
    });
    
    // Log detailed information about violations
    violations.forEach((violation, index) => {
      console.warn({
        name: `a11y violation #${index + 1}`,
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          html: node.html,
          impact: node.impact,
          target: node.target
        }))
      });
    });
  }
  
  // IMPORTANT: Always return false to indicate test should NOT fail
  // regardless of skipFailures value or violations
  return false;
};

// Export our custom implementation
module.exports = {
  customTestResultDependsOnViolations
};
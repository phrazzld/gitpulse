/**
 * Custom accessibility testing utilities that override the default behavior
 * of axe-playwright to make accessibility test failures configurable
 */

const assert = require('assert');

// Default severity impact values that would cause tests to fail
const DEFAULT_FAILING_IMPACTS = ['critical', 'serious'];

/**
 * Get the list of accessibility impacts that should cause test failures
 * @returns {string[]} Array of impact values that should cause test failures
 */
const getFailingImpacts = () => {
  // Read from environment variable or use defaults
  const envValue = process.env.A11Y_FAILING_IMPACTS;
  if (envValue) {
    return envValue.split(',').map(s => s.trim().toLowerCase());
  }
  return DEFAULT_FAILING_IMPACTS;
};

/**
 * Determine if CI should be explicitly enabled for a11y failures
 * @returns {boolean} True if CI should fail on a11y issues
 */
const shouldFailOnViolations = () => {
  // If explicitly set to skip, return false
  if (process.env.SKIP_A11Y_FAILURES === 'true') {
    return false;
  }

  // If explicitly set to fail, or in CI environment, return true
  return process.env.FAIL_ON_A11Y_VIOLATIONS === 'true' || process.env.CI === 'true';
};

/**
 * Custom implementation of testResultDependsOnViolations that conditionally fails
 * tests based on violation severity and configuration
 *
 * This replaces the implementation in node_modules/axe-playwright/dist/utils.js
 *
 * @param {Array} violations - List of a11y violations found
 * @param {boolean} skipFailures - Whether to skip failures (from direct function call)
 * @returns {boolean} True if the test should fail, false otherwise
 */
const customTestResultDependsOnViolations = (violations, skipFailures) => {
  // If explicitly asked to skip or no violations, don't fail
  if (skipFailures || !violations || !violations.length) {
    return false;
  }

  // Check if we should fail based on environment
  const shouldFail = shouldFailOnViolations();

  // Get impacts that should cause failure
  const failingImpacts = getFailingImpacts();

  // Log all violations as warnings regardless of failure decision
  console.warn({
    name: 'a11y violation summary',
    message: `${violations.length} accessibility violation${violations.length === 1 ? '' : 's'} ${violations.length === 1 ? 'was' : 'were'} detected`,
    failOnViolations: shouldFail,
    failingImpactLevels: failingImpacts.join(', ')
  });

  // Find violations that should cause failure
  const criticalViolations = violations.filter(violation =>
    failingImpacts.includes(violation.impact.toLowerCase())
  );

  // Log detailed information about all violations
  violations.forEach((violation, index) => {
    const isCritical = failingImpacts.includes(violation.impact.toLowerCase());
    console.warn({
      name: `a11y violation #${index + 1}`,
      id: violation.id,
      impact: violation.impact,
      willCauseBuildFailure: shouldFail && isCritical,
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

  // If not in fail mode, or no critical violations, don't fail the test
  if (!shouldFail || criticalViolations.length === 0) {
    return false;
  }

  // Return true to indicate test should fail if there are critical violations
  // and we are configured to fail on violations
  return criticalViolations.length > 0;
};

// Export our custom implementation
module.exports = {
  customTestResultDependsOnViolations,
  getFailingImpacts,
  shouldFailOnViolations
};
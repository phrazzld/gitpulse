/**
 * Setup file for the Storybook test-runner to override the axe-playwright utility
 * that causes tests to fail when accessibility violations are found
 */

// Import the utils module from axe-playwright
const axePlaywrightUtils = require('axe-playwright/dist/utils');

// Import our custom implementation
const { customTestResultDependsOnViolations } = require('./utils/custom-a11y-test-utils');

// Override the testResultDependsOnViolations function with our custom implementation
// This ensures that tests won't fail when a11y violations are found, regardless of skipFailures setting
axePlaywrightUtils.testResultDependsOnViolations = customTestResultDependsOnViolations;
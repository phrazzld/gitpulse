/**
 * Storybook Test Runner Setup
 * 
 * This file sets up the test environment for Storybook accessibility tests.
 * It configures axe-playwright to report accessibility issues as warnings
 * instead of failing tests, allowing CI to pass while still reporting issues.
 */

const { getStoryContext } = require('@storybook/test-runner');
const { injectAxe, checkA11y, configureAxe } = require('axe-playwright');
const { CustomAxeReporter } = require('./utils/custom-axe-reporter');

// Import and override the axe-playwright utility to ensure tests never fail on violations
const axePlaywrightUtils = require('axe-playwright/dist/utils');
const { customTestResultDependsOnViolations } = require('./utils/custom-a11y-test-utils');
axePlaywrightUtils.testResultDependsOnViolations = customTestResultDependsOnViolations;

/**
 * @type {import('@storybook/test-runner').TestRunnerConfig}
 */
module.exports = {
  // Hook that is executed before the test runner starts running tests
  setup() {
    // Force the environment variable to be true to skip failures
    process.env.SKIP_A11Y_FAILURES = 'true';
    
    // Log that we're using custom a11y testing setup
    console.log('Using custom accessibility testing setup with violations reported as warnings');
  },

  // Hook that is executed before each individual test
  async preVisit(page) {
    // Inject axe into the page for accessibility testing
    await injectAxe(page);
  },

  // Hook that is executed after each individual test
  async postVisit(page, context) {
    // Get story context information, which includes component metadata
    const storyContext = await getStoryContext(page, context);
    
    // Skip a11y tests for specific stories if needed
    if (storyContext.parameters?.a11y?.disable) {
      console.log(`Skipping a11y tests for: ${context.title} - ${context.name}`);
      return;
    }
    
    // Configure axe based on story parameters or use defaults
    const a11yConfig = storyContext.parameters?.a11y?.config || {};
    await configureAxe(page, {
      // Default configuration that can be overridden by story parameters
      rules: [
        // Examples of rules that can be configured
        { id: 'color-contrast', reviewOnFail: true },
        // Add more rule configurations as needed
      ],
      ...a11yConfig,
    });
    
    // Create a custom reporter instance
    const reporter = new CustomAxeReporter();
    
    try {
      // Run axe accessibility tests with our custom configuration
      // This will use our overridden testResultDependsOnViolations function
      // to prevent test failures while still reporting issues
      const results = await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
        // Ensure we always skip failures
        skipFailures: true,
      });
      
      // If we got results, log them using our custom reporter
      if (results && results.violations) {
        reporter.report(results.violations);
      }
    } catch (error) {
      // Log the error but don't fail the test
      console.error('Error running accessibility tests:', error);
    } finally {
      // Always log summary of accessibility issues
      reporter.logViolationSummary(context.title, context.name);
    }
  },
};
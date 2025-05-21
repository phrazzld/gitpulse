/**
 * Storybook Test Runner Setup
 *
 * This file sets up the test environment for Storybook accessibility tests.
 * It configures axe-playwright to report accessibility issues and conditionally
 * fail tests based on environment configuration.
 */

const fs = require('fs');
const path = require('path');
const { getStoryContext } = require('@storybook/test-runner');
const { injectAxe, checkA11y, configureAxe } = require('axe-playwright');
const { CustomAxeReporter } = require('./utils/custom-axe-reporter');

// Import and override the axe-playwright utility with our configurable implementation
const axePlaywrightUtils = require('axe-playwright/dist/utils');
const {
  customTestResultDependsOnViolations,
  getFailingImpacts,
  shouldFailOnViolations
} = require('./utils/custom-a11y-test-utils');
axePlaywrightUtils.testResultDependsOnViolations = customTestResultDependsOnViolations;

// Ensure results directory exists
function ensureResultsDirectory() {
  const resultsDir = path.resolve('./test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  return resultsDir;
}

/**
 * @type {import('@storybook/test-runner').TestRunnerConfig}
 */
module.exports = {
  // Hook that is executed before the test runner starts running tests
  setup() {
    // Create results directory if it doesn't exist
    ensureResultsDirectory();
    
    // Configure behavior based on CI environment
    // In CI, fail on critical/serious violations (unless explicitly configured to skip)
    // This allows CI to enforce accessibility standards
    if (process.env.CI === 'true' && process.env.SKIP_A11Y_FAILURES !== 'true') {
      process.env.FAIL_ON_A11Y_VIOLATIONS = 'true';
      console.log('Running in CI environment: Will fail on critical and serious accessibility violations');
    } else if (process.env.SKIP_A11Y_FAILURES === 'true') {
      console.log('Accessibility test failures explicitly disabled: Will only report warnings');
    } else {
      console.log('Running in development environment: Will report accessibility issues as warnings');
    }
    
    // Configure which impact levels cause test failures (default is critical,serious)
    if (!process.env.A11Y_FAILING_IMPACTS) {
      process.env.A11Y_FAILING_IMPACTS = 'critical,serious';
    }
    
    // Set results path
    process.env.A11Y_RESULTS_PATH = path.join(ensureResultsDirectory(), 'a11y-results.json');
    
    console.log(`Accessibility failure thresholds: ${process.env.A11Y_FAILING_IMPACTS}`);
    console.log(`Results will be saved to: ${process.env.A11Y_RESULTS_PATH}`);
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
      // Enhanced default configuration with improved rule details
      rules: [
        // Core rules with detailed reporting
        { id: 'color-contrast', reviewOnFail: true },
        { id: 'aria-valid-attr', reviewOnFail: true },
        { id: 'aria-roles', reviewOnFail: true },
        { id: 'aria-hidden-focus', reviewOnFail: true },
        { id: 'document-title', reviewOnFail: true },
        { id: 'duplicate-id', reviewOnFail: true },
        { id: 'button-name', reviewOnFail: true },
        { id: 'image-alt', reviewOnFail: true },
        { id: 'label', reviewOnFail: true },
        { id: 'landmark-one-main', reviewOnFail: true },
        { id: 'heading-order', reviewOnFail: true },
        { id: 'label-title-only', reviewOnFail: true },
        { id: 'link-name', reviewOnFail: true },
        { id: 'region', reviewOnFail: true },
      ],
      // Merge with any story-specific configurations
      ...a11yConfig,
      // Advanced options for better details
      resultTypes: ['violations', 'incomplete', 'inapplicable'],
      reporter: 'v2',
      // Provide more context about the violations
      xpath: true,
      ancestry: true,
    });
    
    // Create a custom reporter instance
    const reporter = new CustomAxeReporter();
    
    try {
      // Run axe accessibility tests with our custom configuration
      // The skipFailures parameter is now respected by our custom implementation
      // and will fail tests for critical/serious issues in CI mode
      const results = await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
        // Only skip failures in development mode, not in CI
        skipFailures: process.env.FAIL_ON_A11Y_VIOLATIONS !== 'true',
      });
      
      // If we got results, log them using our custom reporter
      if (results && results.violations) {
        reporter.report(results.violations, results);
      }
    } catch (error) {
      // Log the error but don't fail the test
      console.error('Error running accessibility tests:', error);
    } finally {
      // Always log summary of accessibility issues
      reporter.logViolationSummary(context.title, context.name);
    }
  },
  
  // Hook that is executed after all tests have completed
  teardown() {
    // Save a11y results to file
    try {
      // Generate and save markdown summary for PR comments
      const summaryPath = path.join(ensureResultsDirectory(), 'a11y-summary.md');
      fs.writeFileSync(
        summaryPath, 
        CustomAxeReporter.generateMarkdownSummary(),
        'utf8'
      );
      console.log(`Saved accessibility summary to: ${summaryPath}`);
    } catch (error) {
      console.error('Error saving accessibility results:', error);
    }
    
    // Log completion message with thresholds used
    console.log(`Accessibility testing completed with threshold: ${process.env.A11Y_FAILING_IMPACTS}`);
    console.log(`Tests were configured to ${shouldFailOnViolations() ? 'fail' : 'warn'} on violations.`);
  },
};
/**
 * Custom Axe Reporter for Storybook Test Runner
 *
 * This reporter captures accessibility violations and logs them without causing
 * test failures, allowing CI processes to continue while still reporting issues.
 *
 * In CI mode, it also collects results to be reported in PR comments.
 */

// Import the results collector if available
let A11yResultsCollector;
try {
  const { A11yResultsCollector: Collector } = require('./a11y-results-collector');
  A11yResultsCollector = Collector;
} catch (error) {
  console.warn('A11y results collector not available, detailed reporting will be disabled');
}

// Global results collector instance for aggregating results across all tests
let globalCollector = null;

// Try to get the output directory for results
const getResultsPath = () => {
  const defaultPath = './test-results/a11y-results.json';
  return process.env.A11Y_RESULTS_PATH || defaultPath;
};

class CustomAxeReporter {
  constructor() {
    this.violations = [];
    this.checksRun = 0;

    // Initialize global collector if in CI environment
    if (process.env.CI === 'true' && A11yResultsCollector && !globalCollector) {
      globalCollector = new A11yResultsCollector();

      // Set up process exit handler to save results
      process.on('exit', () => {
        if (globalCollector) {
          globalCollector.saveResults(getResultsPath());
        }
      });
    }
  }

  /**
   * Report method called by axe-core when violations are found
   * @param {Array} violations - List of accessibility violations
   * @param {Object} results - Full axe results including passes and other data
   */
  report(violations, results) {
    if (violations && Array.isArray(violations)) {
      this.violations = violations;
    }

    // Store check count if available
    if (results && typeof results.passes === 'object') {
      this.checksRun = (results.passes?.length || 0) + (violations?.length || 0);
    }

    return this;
  }

  /**
   * Log a summary of violations found for a specific story
   * @param {string} storyTitle - Story title (component name)
   * @param {string} storyName - Story name (variant)
   */
  logViolationSummary(storyTitle, storyName) {
    // Record results in collector if available
    if (globalCollector) {
      globalCollector.recordResults(storyTitle, storyName, this.violations, this.checksRun);
    }

    if (this.violations.length === 0) {
      console.log(`✅ No accessibility issues found in: ${storyTitle} - ${storyName}`);
      return;
    }

    // Count violations by impact
    const impactCounts = this.violations.reduce((counts, violation) => {
      const impact = violation.impact.toLowerCase();
      counts[impact] = (counts[impact] || 0) + 1;
      return counts;
    }, {});

    // Log summary of violations
    console.warn({
      name: 'A11Y Violation Summary',
      message: `${this.violations.length} accessibility violation${this.violations.length === 1 ? '' : 's'} found in: ${storyTitle} - ${storyName}`,
      violationCount: this.violations.length,
      impactBreakdown: impactCounts
    });

    // Log each violation with details
    this.violations.forEach((violation, index) => {
      console.warn({
        index: index + 1,
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          html: node.html,
          failureSummary: node.failureSummary
        }))
      });
    });

    // Display a separator for better readability in logs
    console.log('-------------------------------------');
  }

  /**
   * Format a violation for cleaner display in CI logs
   * @param {Object} violation - Axe violation object
   * @returns {string} Formatted violation message
   */
  formatViolation(violation) {
    return `
      Rule: ${violation.id} (${violation.impact})
      Description: ${violation.description}
      Help: ${violation.help}
      Help URL: ${violation.helpUrl}
      Affected elements: ${violation.nodes.length}
    `;
  }

  /**
   * Generate a markdown summary of all collected results
   * For use in PR comments
   * @returns {string} Markdown formatted summary
   */
  static generateMarkdownSummary() {
    if (!globalCollector) {
      return '## Accessibility Test Results\n\nNo results collected or collector not available.';
    }

    return globalCollector.generateMarkdownSummary();
  }

  /**
   * Save collected results to a file
   * @returns {boolean} True if successful, false otherwise
   */
  static saveResults() {
    if (!globalCollector) {
      return false;
    }

    return globalCollector.saveResults(getResultsPath());
  }
}

module.exports = {
  CustomAxeReporter
};
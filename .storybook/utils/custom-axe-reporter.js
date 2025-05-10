/**
 * Custom Axe Reporter for Storybook Test Runner
 * 
 * This reporter captures accessibility violations and logs them without causing
 * test failures, allowing CI processes to continue while still reporting issues.
 */

class CustomAxeReporter {
  constructor() {
    this.violations = [];
  }

  /**
   * Report method called by axe-core when violations are found
   * @param {Array} violations - List of accessibility violations
   */
  report(violations) {
    if (violations && Array.isArray(violations)) {
      this.violations = violations;
    }
    return this;
  }

  /**
   * Log a summary of violations found for a specific story
   * @param {string} storyTitle - Story title (component name)
   * @param {string} storyName - Story name (variant)
   */
  logViolationSummary(storyTitle, storyName) {
    if (this.violations.length === 0) {
      console.log(`✅ No accessibility issues found in: ${storyTitle} - ${storyName}`);
      return;
    }

    // Log summary of violations
    console.warn({
      name: 'A11Y Violation Summary',
      message: `${this.violations.length} accessibility violation${this.violations.length === 1 ? '' : 's'} found in: ${storyTitle} - ${storyName}`,
      violationCount: this.violations.length
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
}

module.exports = {
  CustomAxeReporter
};
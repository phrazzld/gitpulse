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

    // Count violations by impact and type
    const impactCounts = this.violations.reduce((counts, violation) => {
      const impact = violation.impact.toLowerCase();
      counts[impact] = (counts[impact] || 0) + 1;
      return counts;
    }, {});

    // Group violations by rule for better analysis
    const violationsByRule = this.violations.reduce((byRule, violation) => {
      if (!byRule[violation.id]) {
        byRule[violation.id] = {
          count: 0,
          impact: violation.impact,
          description: violation.description,
          helpUrl: violation.helpUrl,
          elementsAffected: 0
        };
      }
      byRule[violation.id].count++;
      byRule[violation.id].elementsAffected += violation.nodes.length;
      return byRule;
    }, {});

    // Create a more detailed summary box
    console.warn(`
========== ACCESSIBILITY VIOLATIONS SUMMARY ==========
Component: ${storyTitle} - ${storyName}
Total Violations: ${this.violations.length}
Violation Impacts: ${Object.entries(impactCounts)
      .map(([impact, count]) => `${impact}: ${count}`)
      .join(', ')}
Failing WCAG Criteria: ${Array.from(new Set(this.violations.flatMap(v => 
        v.tags.filter(tag => tag.startsWith('wcag') || tag.match(/^[1-4]\.[1-4]\.[1-5]$/))
      ))).join(', ')}
=======================================================
    `);

    // Log rule summary (grouped by rule for better organization)
    console.warn('Rule-based Violation Summary:');
    Object.entries(violationsByRule).forEach(([ruleId, data], index) => {
      console.warn(`
      ${index + 1}. Rule: ${ruleId} (${data.impact})
         Description: ${data.description}
         Occurrences: ${data.count} (affecting ${data.elementsAffected} elements)
         Help URL: ${data.helpUrl}
      `);
    });

    // Log detailed violations with component attribution
    console.warn('\nDetailed Violations:');
    this.violations.forEach((violation, index) => {
      const formattedViolation = this.formatViolation(violation);
      console.warn(`
----- Violation #${index + 1} -----
Component: ${storyTitle} - ${storyName}
${formattedViolation}
`);
    });

    // Add recommendation section when available
    const hasRecommendations = this.violations.some(v => v.help);
    if (hasRecommendations) {
      console.warn('\nRecommended Fixes:');
      this.violations.forEach((violation, index) => {
        console.warn(`
${index + 1}. For '${violation.id}' (${violation.impact}):
   ${violation.help}
   Learn more: ${violation.helpUrl}
        `);
      });
    }

    // Display a separator for better readability in logs
    console.log('=======================================================');
  }

  /**
   * Format a violation for cleaner display in CI logs
   * @param {Object} violation - Axe violation object
   * @returns {string} Formatted violation message
   */
  formatViolation(violation) {
    // Format each node for better readability
    const nodeDetails = violation.nodes.map((node, idx) => {
      const selector = node.target ? 
        (Array.isArray(node.target) ? node.target.join(' ') : node.target) : 
        'Unknown selector';
        
      return `
      Element ${idx + 1}: ${selector}
      HTML: ${node.html.trim()}
      Issue: ${node.failureSummary?.replace(/\n/g, '\n        ') || 'Not specified'}
      ${node.ancestry ? `DOM path: ${node.ancestry}` : ''}
      ${node.xpath ? `XPath: ${node.xpath}` : ''}
      `;
    }).join('\n');

    // Include WCAG success criteria for better context
    let wcagCriteria = '';
    if (violation.tags) {
      const wcagTags = violation.tags.filter(tag => tag.startsWith('wcag') || tag.match(/^[1-4]\.[1-4]\.[1-5]$/));
      if (wcagTags.length > 0) {
        wcagCriteria = `WCAG Criteria: ${wcagTags.join(', ')}`;
      }
    }

    return `
      Rule: ${violation.id} (${violation.impact})
      Description: ${violation.description}
      Help: ${violation.help}
      Help URL: ${violation.helpUrl}
      ${wcagCriteria}
      Affected elements: ${violation.nodes.length}
      
      Element Details:
      ${nodeDetails}
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
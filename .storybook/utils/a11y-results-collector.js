/**
 * Accessibility Results Collector
 * 
 * This utility collects and summarizes accessibility test results for reporting
 * in CI environments and PR comments.
 */

const fs = require('fs');
const path = require('path');

class A11yResultsCollector {
  constructor() {
    this.results = {
      totalViolations: 0,
      totalChecks: 0,
      violationsByImpact: {
        critical: 0,
        serious: 0, 
        moderate: 0,
        minor: 0
      },
      violationsByComponent: {},
      componentResults: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Record accessibility results for a specific component
   * @param {string} componentName - Component name/title
   * @param {string} storyName - Story/variant name
   * @param {Array} violations - Accessibility violations found
   * @param {number} checkCount - Total checks performed
   */
  recordResults(componentName, storyName, violations, checkCount) {
    // Increment totals
    this.results.totalChecks += checkCount || 0;
    this.results.totalViolations += violations.length;

    // Categorize by impact
    violations.forEach(violation => {
      const impact = violation.impact.toLowerCase();
      if (this.results.violationsByImpact[impact] !== undefined) {
        this.results.violationsByImpact[impact]++;
      } else {
        this.results.violationsByImpact[impact] = 1;
      }
    });

    // Categorize by component
    if (!this.results.violationsByComponent[componentName]) {
      this.results.violationsByComponent[componentName] = 0;
    }
    this.results.violationsByComponent[componentName] += violations.length;

    // Record detailed component result
    this.results.componentResults.push({
      componentName,
      storyName,
      violations: violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help
      })),
      passCount: checkCount - violations.length
    });
  }

  /**
   * Save the collected results to a JSON file
   * @param {string} outputPath - Path to save results
   */
  saveResults(outputPath) {
    try {
      const dirPath = path.dirname(outputPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Add summary stats before saving
      this.results.summary = {
        passRate: this.results.totalChecks ? 
          ((this.results.totalChecks - this.results.totalViolations) / this.results.totalChecks * 100).toFixed(2) + '%' : 
          'N/A',
        critical: this.results.violationsByImpact.critical,
        serious: this.results.violationsByImpact.serious,
        moderate: this.results.violationsByImpact.moderate,
        minor: this.results.violationsByImpact.minor,
        componentsTested: this.results.componentResults.length,
        componentsWithIssues: Object.keys(this.results.violationsByComponent).length
      };
      
      fs.writeFileSync(
        outputPath, 
        JSON.stringify(this.results, null, 2),
        'utf8'
      );
      
      console.log(`Accessibility results saved to ${outputPath}`);
      return true;
    } catch (error) {
      console.error('Error saving accessibility results:', error);
      return false;
    }
  }

  /**
   * Generate a markdown summary from the results
   * @returns {string} Markdown formatted summary
   */
  generateMarkdownSummary() {
    const { summary, violationsByImpact, componentResults } = this.results;
    
    if (!summary) {
      return '## Accessibility Test Results\n\nNo results collected.';
    }
    
    // Check for critical/serious failures that would break the build
    const hasCriticalIssues = violationsByImpact.critical > 0 || violationsByImpact.serious > 0;
    
    let markdown = `## Accessibility Test Results\n\n`;
    
    // Add summary badge
    if (hasCriticalIssues) {
      markdown += `❌ **Failed**: Found critical/serious accessibility issues that would break the build\n\n`;
    } else if (this.results.totalViolations > 0) {
      markdown += `⚠️ **Warning**: Found non-critical accessibility issues\n\n`;
    } else {
      markdown += `✅ **Passed**: No accessibility issues found\n\n`;
    }
    
    // Add summary table
    markdown += `### Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `| ------ | ----- |\n`;
    markdown += `| Pass Rate | ${summary.passRate} |\n`;
    markdown += `| Components Tested | ${summary.componentsTested} |\n`;
    markdown += `| Components with Issues | ${summary.componentsWithIssues} |\n`;
    
    // Add violations by impact
    markdown += `\n### Violations by Impact Level\n\n`;
    markdown += `| Impact | Count | Build Fails? |\n`;
    markdown += `| ------ | ----- | ------------ |\n`;
    markdown += `| Critical | ${violationsByImpact.critical} | Yes |\n`;
    markdown += `| Serious | ${violationsByImpact.serious} | Yes |\n`;
    markdown += `| Moderate | ${violationsByImpact.moderate} | No |\n`;
    markdown += `| Minor | ${violationsByImpact.minor} | No |\n`;
    
    // Add component-specific information for those with issues
    if (this.results.totalViolations > 0) {
      markdown += `\n### Components with Issues\n\n`;
      
      // Get components with violations, sorted by violation count (descending)
      const componentsWithIssues = componentResults
        .filter(result => result.violations.length > 0)
        .sort((a, b) => {
          // First sort by critical violations
          const aCritical = a.violations.filter(v => v.impact.toLowerCase() === 'critical').length;
          const bCritical = b.violations.filter(v => v.impact.toLowerCase() === 'critical').length;
          
          if (aCritical !== bCritical) return bCritical - aCritical;
          
          // Then by total violations
          return b.violations.length - a.violations.length;
        });
      
      if (componentsWithIssues.length === 0) {
        markdown += `No components with accessibility issues.\n`;
      } else {
        // List top 5 components with issues
        const topIssues = componentsWithIssues.slice(0, 5);
        
        markdown += `| Component | Story | Issues | Highest Impact |\n`;
        markdown += `| --------- | ----- | ------ | -------------- |\n`;
        
        topIssues.forEach(result => {
          const highestImpact = result.violations.length > 0 ? 
            result.violations.reduce((max, v) => {
              const impactOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
              const currentImpact = impactOrder[v.impact.toLowerCase()] || 0;
              const maxImpact = impactOrder[max.toLowerCase()] || 0;
              return currentImpact > maxImpact ? v.impact : max;
            }, 'minor') : 
            'none';
          
          markdown += `| ${result.componentName} | ${result.storyName} | ${result.violations.length} | ${highestImpact} |\n`;
        });
        
        if (componentsWithIssues.length > 5) {
          markdown += `\n*...and ${componentsWithIssues.length - 5} more components with issues.*\n`;
        }
      }
    }
    
    return markdown;
  }
}

module.exports = { A11yResultsCollector };
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

    // Enhanced violation data for better reporting
    const enhancedViolations = violations.map(v => {
      // Extract WCAG criteria from tags
      const wcagCriteria = v.tags ? 
        v.tags.filter(tag => tag.startsWith('wcag') || tag.match(/^[1-4]\.[1-4]\.[1-5]$/)) : 
        [];
      
      // Process node information for better element identification
      const nodeInfo = v.nodes.map(node => {
        // Extract selector information (simplified)
        const selector = node.target ? 
          (Array.isArray(node.target) ? node.target.join(' ') : node.target) : 
          'Unknown selector';
          
        // Extract HTML snippet (truncated)
        const html = node.html && node.html.length > 100 ? 
          `${node.html.substring(0, 100)}...` : 
          (node.html || 'No HTML available');
          
        return {
          selector,
          html,
          failureSummary: node.failureSummary
        };
      });
      
      // Return enhanced violation with more detailed information
      return {
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl || `https://dequeuniversity.com/rules/axe/${v.id}`,
        wcagCriteria,
        nodeCount: v.nodes.length,
        // Store a sample of nodes (first 3 max)
        nodeSamples: nodeInfo.slice(0, 3),
        componentName, // Associate component info with violation
        storyName
      };
    });

    // Record detailed component result with enhanced violation data
    this.results.componentResults.push({
      componentName,
      storyName,
      violations: enhancedViolations,
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
    
    // Add summary badge with emoji for better visibility
    if (hasCriticalIssues) {
      markdown += `❌ **Failed**: Found critical/serious accessibility issues that would break the build\n\n`;
    } else if (this.results.totalViolations > 0) {
      markdown += `⚠️ **Warning**: Found non-critical accessibility issues\n\n`;
    } else {
      markdown += `✅ **Passed**: No accessibility issues found\n\n`;
    }
    
    // Add summary table with improved formatting
    markdown += `### Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `| ------ | ----- |\n`;
    markdown += `| Pass Rate | ${summary.passRate} |\n`;
    markdown += `| Components Tested | ${summary.componentsTested} |\n`;
    markdown += `| Components with Issues | ${summary.componentsWithIssues} |\n`;
    markdown += `| Total Violations | ${this.results.totalViolations} |\n`;
    
    // Add violations by impact with clearer status indicators
    markdown += `\n### Violations by Impact Level\n\n`;
    markdown += `| Impact | Count | Status | Build Fails? |\n`;
    markdown += `| ------ | ----- | ------ | ------------ |\n`;
    markdown += `| Critical | ${violationsByImpact.critical} | ${violationsByImpact.critical > 0 ? '❌' : '✅'} | Yes |\n`;
    markdown += `| Serious | ${violationsByImpact.serious} | ${violationsByImpact.serious > 0 ? '❌' : '✅'} | Yes |\n`;
    markdown += `| Moderate | ${violationsByImpact.moderate} | ${violationsByImpact.moderate > 0 ? '⚠️' : '✅'} | No |\n`;
    markdown += `| Minor | ${violationsByImpact.minor} | ${violationsByImpact.minor > 0 ? 'ℹ️' : '✅'} | No |\n`;
    
    // Collect all violations across components for rule-based reporting
    const allViolations = componentResults.flatMap(result => result.violations);
    
    // Group violations by rule for better analysis
    const violationsByRule = allViolations.reduce((byRule, violation) => {
      const ruleId = violation.id;
      if (!byRule[ruleId]) {
        byRule[ruleId] = {
          id: ruleId,
          description: violation.description,
          help: violation.help,
          impact: violation.impact,
          count: 0,
          components: new Set()
        };
      }
      
      byRule[ruleId].count++;
      byRule[ruleId].components.add(violation.componentName || '(unknown)');
      
      // Keep track of highest impact
      const impactOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
      if (impactOrder[violation.impact.toLowerCase()] > impactOrder[byRule[ruleId].impact.toLowerCase()]) {
        byRule[ruleId].impact = violation.impact;
      }
      
      return byRule;
    }, {});
    
    // Show violations by rule if there are any issues
    if (Object.keys(violationsByRule).length > 0) {
      markdown += `\n### Issues by Rule\n\n`;
      markdown += `| Rule | Impact | Count | Description |\n`;
      markdown += `| ---- | ------ | ----- | ----------- |\n`;
      
      // Sort by impact (critical first) then by count
      const sortedRules = Object.values(violationsByRule).sort((a, b) => {
        const impactOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
        const aImpact = impactOrder[a.impact.toLowerCase()] || 0;
        const bImpact = impactOrder[b.impact.toLowerCase()] || 0;
        
        if (aImpact !== bImpact) return bImpact - aImpact;
        return b.count - a.count;
      });
      
      sortedRules.forEach(rule => {
        let impactEmoji = '✅';
        if (rule.impact.toLowerCase() === 'critical') impactEmoji = '❌';
        else if (rule.impact.toLowerCase() === 'serious') impactEmoji = '❌';
        else if (rule.impact.toLowerCase() === 'moderate') impactEmoji = '⚠️';
        else if (rule.impact.toLowerCase() === 'minor') impactEmoji = 'ℹ️';
        
        markdown += `| ${rule.id} | ${impactEmoji} ${rule.impact} | ${rule.count} | ${rule.description} |\n`;
      });
    }
    
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
        // List components with issues
        markdown += `| Component | Story | Issues | Highest Impact | Top Rules |\n`;
        markdown += `| --------- | ----- | ------ | -------------- | --------- |\n`;
        
        componentsWithIssues.forEach(result => {
          const highestImpact = result.violations.length > 0 ? 
            result.violations.reduce((max, v) => {
              const impactOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
              const currentImpact = impactOrder[v.impact.toLowerCase()] || 0;
              const maxImpact = impactOrder[max.toLowerCase()] || 0;
              return currentImpact > maxImpact ? v.impact : max;
            }, 'minor') : 
            'none';
          
          // Get top rules for this component
          const ruleFrequency = result.violations.reduce((freq, v) => {
            freq[v.id] = (freq[v.id] || 0) + 1;
            return freq;
          }, {});
          
          const topRules = Object.entries(ruleFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([id, count]) => `${id} (${count})`)
            .join(', ');
          
          // Add impact emoji
          let impactEmoji = '✅';
          if (highestImpact.toLowerCase() === 'critical') impactEmoji = '❌';
          else if (highestImpact.toLowerCase() === 'serious') impactEmoji = '❌';
          else if (highestImpact.toLowerCase() === 'moderate') impactEmoji = '⚠️';
          else if (highestImpact.toLowerCase() === 'minor') impactEmoji = 'ℹ️';
          
          markdown += `| ${result.componentName} | ${result.storyName} | ${result.violations.length} | ${impactEmoji} ${highestImpact} | ${topRules} |\n`;
        });
      }
    }
    
    // Add developer guidance section
    markdown += `\n### 🔍 How to Fix Accessibility Issues\n\n`;
    
    if (this.results.totalViolations === 0) {
      markdown += `Congratulations! No accessibility issues found.\n`;
    } else {
      markdown += `To fix accessibility issues:\n\n`;
      markdown += `1. Run \`npm run check:a11y:all\` locally to generate detailed reports\n`;
      markdown += `2. Use the rule IDs above to locate specific violations in components\n`;
      markdown += `3. Check the Storybook Accessibility tab to identify and fix issues\n`;
      markdown += `4. Reference the axe-core rule documentation for detailed guidance\n\n`;
      
      // Add common fixes for frequent violations
      if (Object.keys(violationsByRule).length > 0) {
        markdown += `#### Common Fixes for Top Issues\n\n`;
        
        const topRules = Object.values(violationsByRule)
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        
        topRules.forEach(rule => {
          markdown += `**${rule.id}** (${rule.impact}):\n`;
          markdown += `- ${rule.help}\n`;
          markdown += `- Affects ${rule.count} instances across ${rule.components.size} components\n\n`;
        });
      }
    }
    
    return markdown;
  }
}

module.exports = { A11yResultsCollector };
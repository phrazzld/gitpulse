import chalk from 'chalk';
import { ProcessedVulnerability, SeverityLevel, FilterResult } from './types';

/**
 * Generate and print a formatted report of vulnerabilities
 * @param filterResult Filter result containing vulnerabilities to report
 */
export function generateReport(filterResult: FilterResult): void {
  const { toReport, prodFailures, devFailures } = filterResult;
  
  if (toReport.length === 0) {
    console.log(chalk.green('\n✓ No vulnerabilities found within the configured thresholds\n'));
    return;
  }

  console.log(chalk.bold('\n=== Security Audit Report ===\n'));

  // Group vulnerabilities by production status and severity
  const productionVulnerabilities = toReport.filter(v => v.isProduction);
  const developmentVulnerabilities = toReport.filter(v => !v.isProduction);

  // Print production vulnerabilities
  if (productionVulnerabilities.length > 0) {
    console.log(chalk.bold.red('\n⚠️  Production Vulnerabilities ⚠️\n'));
    printVulnerabilityGroup(productionVulnerabilities);
  }

  // Print development vulnerabilities
  if (developmentVulnerabilities.length > 0) {
    console.log(chalk.bold.yellow('\n⚠️  Development Vulnerabilities ⚠️\n'));
    printVulnerabilityGroup(developmentVulnerabilities);
  }

  // Print summary
  printSummary(toReport, prodFailures, devFailures);
}

/**
 * Print a group of vulnerabilities, sorted by severity
 * @param vulnerabilities List of vulnerabilities to print
 */
function printVulnerabilityGroup(vulnerabilities: ProcessedVulnerability[]): void {
  // Group by severity
  const severityLevels: SeverityLevel[] = ['critical', 'high', 'moderate', 'low', 'info'];
  
  for (const severity of severityLevels) {
    const vulnsOfSeverity = vulnerabilities.filter(v => v.severity === severity);
    
    if (vulnsOfSeverity.length === 0) {
      continue;
    }
    
    console.log(getSeverityHeader(severity));
    
    for (const vuln of vulnsOfSeverity) {
      printVulnerability(vuln);
    }
  }
}

/**
 * Print a single vulnerability
 * @param vuln Vulnerability to print
 */
function printVulnerability(vuln: ProcessedVulnerability): void {
  const severityColor = getSeverityColor(vuln.severity);
  
  console.log(severityColor(`\n${chalk.bold(vuln.name)}`));
  console.log(`  ${chalk.bold('Title:')} ${vuln.title}`);
  console.log(`  ${chalk.bold('Severity:')} ${severityColor(vuln.severity)}`);
  console.log(`  ${chalk.bold('Affected Versions:')} ${vuln.vulnerableVersions}`);
  if (vuln.currentVersion) {
    console.log(`  ${chalk.bold('Current Version:')} ${vuln.currentVersion}`);
  }
  console.log(`  ${chalk.bold('Direct Dependency:')} ${vuln.isDirect ? 'Yes' : 'No'}`);
  
  // Show only the first 3 paths to avoid excessive output
  const maxPaths = 3;
  const displayPaths = vuln.paths.slice(0, maxPaths);
  const remainingPaths = vuln.paths.length - maxPaths;
  
  console.log(`  ${chalk.bold('Dependency Path' + (displayPaths.length > 1 ? 's' : ''))}:`);
  for (const path of displayPaths) {
    console.log(`    - ${path}`);
  }
  if (remainingPaths > 0) {
    console.log(`    ... and ${remainingPaths} more path${remainingPaths > 1 ? 's' : ''}`);
  }
  
  console.log(`  ${chalk.bold('Advisory:')} ${vuln.url}`);
  
  if (vuln.fix) {
    console.log(`  ${chalk.bold('Recommendation:')} ${chalk.green(vuln.fix)}`);
  }
}

/**
 * Print a summary of the audit results
 * @param all All vulnerabilities to report
 * @param prodFailures Production vulnerabilities that meet failure criteria
 * @param devFailures Development vulnerabilities that meet failure criteria
 */
function printSummary(
  all: ProcessedVulnerability[],
  prodFailures: ProcessedVulnerability[],
  devFailures: ProcessedVulnerability[]
): void {
  console.log(chalk.bold('\n=== Summary ===\n'));
  
  // Count vulnerabilities by severity and environment
  const prodCount = all.filter(v => v.isProduction).length;
  const devCount = all.filter(v => !v.isProduction).length;
  
  const severityCounts = all.reduce((counts, vuln) => {
    counts[vuln.severity] = (counts[vuln.severity] || 0) + 1;
    return counts;
  }, {} as Record<SeverityLevel, number>);
  
  console.log(`Total vulnerabilities: ${chalk.bold(all.length)}`);
  console.log(`Production vulnerabilities: ${chalk.bold(prodCount)}`);
  console.log(`Development vulnerabilities: ${chalk.bold(devCount)}`);
  
  const severityLevels: SeverityLevel[] = ['critical', 'high', 'moderate', 'low', 'info'];
  for (const severity of severityLevels) {
    if (severityCounts[severity]) {
      const color = getSeverityColor(severity);
      console.log(`${severity} severity: ${color(severityCounts[severity])}`);
    }
  }
  
  console.log(`\nVulnerabilities that will cause build failure: ${chalk.bold(prodFailures.length + devFailures.length)}`);
  if (prodFailures.length > 0) {
    console.log(`  Production vulnerabilities: ${chalk.bold.red(prodFailures.length)}`);
  }
  if (devFailures.length > 0) {
    console.log(`  Development vulnerabilities: ${chalk.bold.yellow(devFailures.length)}`);
  }
  
  console.log('\n');
}

/**
 * Get a color function for a severity level
 * @param severity Severity level
 * @returns Chalk color function
 */
function getSeverityColor(severity: SeverityLevel): chalk.ChalkFunction {
  switch (severity) {
    case 'critical':
      return chalk.red.bold;
    case 'high':
      return chalk.magenta;
    case 'moderate':
      return chalk.yellow;
    case 'low':
      return chalk.blue;
    case 'info':
      return chalk.gray;
    default:
      return chalk.white;
  }
}

/**
 * Get a formatted header for a severity level
 * @param severity Severity level
 * @returns Formatted header string
 */
function getSeverityHeader(severity: SeverityLevel): string {
  const color = getSeverityColor(severity);
  const symbols = {
    critical: '🚨',
    high: '⛔',
    moderate: '⚠️',
    low: 'ℹ️',
    info: '📝'
  };
  
  return color(`\n${symbols[severity]} ${severity.toUpperCase()} Severity Vulnerabilities ${symbols[severity]}\n`);
}
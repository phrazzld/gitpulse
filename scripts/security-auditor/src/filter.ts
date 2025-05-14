import { AuditConfig, ProcessedVulnerability, FilterResult, SeverityLevel } from './types';
import { meetsOrExceedsSeverity } from './config';

/**
 * Filter vulnerabilities based on configuration
 * @param vulnerabilities Processed vulnerabilities from parser
 * @param config Audit configuration
 * @returns FilterResult containing vulnerabilities for reporting and failure determination
 */
export function filterVulnerabilities(
  vulnerabilities: ProcessedVulnerability[],
  config: AuditConfig
): FilterResult {
  // Filter vulnerabilities for reporting
  const toReport = vulnerabilities.filter(vuln => {
    // Skip if below minimum severity for reporting
    if (!meetsOrExceedsSeverity(vuln.severity, config.reportMinSeverity)) {
      return false;
    }

    // Skip if this is a development dependency and we're excluding dev dependencies
    if (!vuln.isProduction && !config.includeDev) {
      return false;
    }

    // Skip if the advisory ID is in the allowlist
    if (config.allowlistAdvisories.includes(vuln.advisoryId)) {
      return false;
    }

    // Skip if the package matches any pattern in the allowlist
    if (isPackageAllowlisted(vuln.name, config.allowlistPackages)) {
      return false;
    }

    return true;
  });

  // Filter production vulnerabilities that meet failure criteria
  const prodFailures = toReport.filter(vuln => 
    vuln.isProduction && 
    meetsOrExceedsSeverity(vuln.severity, config.failOnSeverity)
  );

  // Filter development vulnerabilities that meet failure criteria
  const devFailures = toReport.filter(vuln => 
    !vuln.isProduction && 
    meetsOrExceedsSeverity(vuln.severity, config.failOnSeverity)
  );

  return {
    toReport,
    prodFailures,
    devFailures
  };
}

/**
 * Check if a package name matches any pattern in the allowlist
 * @param packageName Package name to check
 * @param allowlistPatterns Patterns to check against
 * @returns True if the package matches any pattern
 */
function isPackageAllowlisted(packageName: string, allowlistPatterns: string[]): boolean {
  for (const pattern of allowlistPatterns) {
    // Handle exact package name matches
    if (pattern === packageName) {
      return true;
    }
    
    // Handle version-specific patterns (e.g., lodash@<4.17.21)
    if (pattern.startsWith(packageName + '@')) {
      return true;
    }
    
    // Handle wildcard patterns (e.g., eslint-*)
    if (pattern.endsWith('*') && packageName.startsWith(pattern.slice(0, -1))) {
      return true;
    }
  }
  
  return false;
}
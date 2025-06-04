import { 
  AuditReport, 
  Vulnerability, 
  Advisory, 
  ProcessedVulnerability 
} from './types';

/**
 * Parse npm audit JSON output and classify vulnerabilities
 * @param jsonString JSON string from npm audit
 * @returns Array of processed vulnerabilities
 */
export function parseAuditOutput(jsonString: string): ProcessedVulnerability[] {
  let auditReport: AuditReport;
  
  try {
    auditReport = JSON.parse(jsonString) as AuditReport;
  } catch (error) {
    throw new Error(`Failed to parse npm audit JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!auditReport.vulnerabilities) {
    return [];
  }

  const processedVulnerabilities: ProcessedVulnerability[] = [];

  // Process each vulnerability
  for (const [packageName, vulnerability] of Object.entries(auditReport.vulnerabilities)) {
    // Skip if the vulnerability structure is unexpected
    if (!vulnerability.via || !Array.isArray(vulnerability.via)) {
      continue;
    }

    // Extract advisory information
    const advisories = vulnerability.via.filter(item => typeof item !== 'string') as Advisory[];
    
    // If there are no proper advisories, skip
    if (advisories.length === 0) {
      continue;
    }

    // Use the first advisory for basic information
    const primaryAdvisory = advisories[0];
    
    // Determine if this is a production issue by checking if ANY path is through a production dependency
    // In npm audit, if a vulnerability is in a production dependency, it's considered a production issue
    // even if it's also found in development dependencies
    const isProduction = !vulnerability.nodes.every(nodePath => isDevelopmentPath(nodePath));

    const processedVulnerability: ProcessedVulnerability = {
      name: packageName,
      severity: vulnerability.severity,
      title: primaryAdvisory.title,
      isDirect: vulnerability.isDirect,
      isProduction,
      url: primaryAdvisory.url,
      vulnerableVersions: primaryAdvisory.vulnerableVersions,
      currentVersion: extractCurrentVersion(vulnerability.nodes[0], packageName),
      paths: vulnerability.nodes,
      advisoryId: extractAdvisoryId(primaryAdvisory.url),
    };

    // Add fix information if available
    if (vulnerability.fixAvailable && typeof vulnerability.fixAvailable !== 'boolean') {
      processedVulnerability.fix = `Update to ${vulnerability.fixAvailable.name}@${vulnerability.fixAvailable.version}`;
    }

    processedVulnerabilities.push(processedVulnerability);
  }

  return processedVulnerabilities;
}

/**
 * Extract advisory ID (GHSA ID) from advisory URL
 * @param url Advisory URL from npm audit
 * @returns Advisory ID (e.g., GHSA-8cj5-5rvv-wf4v) or fallback string
 */
function extractAdvisoryId(url: string): string {
  try {
    // Extract GHSA ID from GitHub advisory URL
    const match = url.match(/\/advisories\/(GHSA-[a-z0-9-]+)/i);
    if (match && match[1]) {
      return match[1];
    }
    
    // If not a GitHub advisory, use the URL as ID
    return url;
  } catch (error) {
    return url;
  }
}

/**
 * Determines if a dependency path is development-only
 * This is a heuristic based on npm's node path format
 * @param nodePath The node path from npm audit
 * @returns True if this path is through development dependencies only
 */
function isDevelopmentPath(nodePath: string): boolean {
  // Paths containing node_modules/.bin are typically dev dependencies
  if (nodePath.includes('node_modules/.bin')) {
    return true;
  }

  // The most reliable way would be to parse the package.json
  // and check each dependency in the path, but as a heuristic:
  // If the path contains dev tokens like 'devDependencies' or specific
  // known development packages, consider it a dev path
  const devTokens = [
    '/dev/', 
    'devDependencies',
    // Common dev tools (extend as needed)
    'eslint',
    'jest',
    'mocha',
    'chai',
    'typescript',
    'webpack',
    'babel',
    'prettier',
    'husky',
    'storybook'
  ];

  return devTokens.some(token => nodePath.includes(token));
}

/**
 * Extract the current version of a package from a node path
 * @param nodePath Node path from npm audit
 * @param packageName Package name
 * @returns The current version or undefined if not found
 */
function extractCurrentVersion(nodePath: string, packageName: string): string | undefined {
  const versionMatch = nodePath.match(new RegExp(`${packageName}@([^/]+)`));
  return versionMatch ? versionMatch[1] : undefined;
}
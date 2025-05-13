import { Command } from 'commander';
import { AuditConfig, SeverityLevel, EnvironmentScope } from './types';

/**
 * Parses CLI arguments and returns a configuration object
 */
export function parseConfig(): AuditConfig {
  const program = new Command();

  program
    .name('security-auditor')
    .description('Enhanced npm audit with differentiation between production and development vulnerabilities')
    .version('1.0.0');

  program
    .option(
      '--fail-on-severity <level>', 
      'Minimum severity to cause a non-zero exit code', 
      'high'
    )
    .option(
      '--fail-on-env <scope>', 
      'Environment scope for failure (prod, any)', 
      'prod'
    )
    .option(
      '--report-min-severity <level>', 
      'Minimum severity to include in the report', 
      'low'
    )
    .option(
      '--include-dev', 
      'Include development dependencies in reporting and failure consideration', 
      false
    )
    .option(
      '--exclude-dev', 
      'Exclude development dependencies from reporting', 
      false
    )
    .option(
      '--allowlist-advisories <ids>', 
      'Comma-separated list of advisory IDs to ignore', 
      ''
    )
    .option(
      '--allowlist-packages <patterns>', 
      'Comma-separated list of package name patterns to ignore', 
      ''
    );

  program.parse(process.argv);
  const options = program.opts();

  // Validate severity level
  const validSeverities: SeverityLevel[] = ['critical', 'high', 'moderate', 'low', 'info'];
  if (!validSeverities.includes(options.failOnSeverity as SeverityLevel)) {
    console.error(`Invalid severity level: ${options.failOnSeverity}`);
    process.exit(2);
  }

  // Validate environment scope
  const validScopes: EnvironmentScope[] = ['prod', 'any'];
  if (!validScopes.includes(options.failOnEnv as EnvironmentScope)) {
    console.error(`Invalid environment scope: ${options.failOnEnv}`);
    process.exit(2);
  }

  // Handle the case where both include-dev and exclude-dev are specified
  if (options.includeDev && options.excludeDev) {
    console.warn('Both --include-dev and --exclude-dev specified. Using --include-dev.');
    options.excludeDev = false;
  }

  // Parse allowlist options from comma-separated strings to arrays
  const allowlistAdvisories = options.allowlistAdvisories
    ? options.allowlistAdvisories.split(',').map((id: string) => id.trim())
    : [];

  const allowlistPackages = options.allowlistPackages
    ? options.allowlistPackages.split(',').map((pattern: string) => pattern.trim())
    : [];

  return {
    failOnSeverity: options.failOnSeverity as SeverityLevel,
    failOnEnv: options.failOnEnv as EnvironmentScope,
    reportMinSeverity: options.reportMinSeverity as SeverityLevel,
    includeDev: options.includeDev || options.failOnEnv === 'any',
    allowlistAdvisories,
    allowlistPackages,
  };
}

/**
 * Get severity level ranking for comparison
 */
export function getSeverityRank(severity: SeverityLevel): number {
  const ranks: Record<SeverityLevel, number> = {
    critical: 4,
    high: 3,
    moderate: 2,
    low: 1,
    info: 0
  };
  return ranks[severity] || 0;
}

/**
 * Check if a severity level meets or exceeds a threshold
 */
export function meetsOrExceedsSeverity(severity: SeverityLevel, threshold: SeverityLevel): boolean {
  return getSeverityRank(severity) >= getSeverityRank(threshold);
}
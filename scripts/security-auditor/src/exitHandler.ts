import { AuditConfig, FilterResult, AuditResult } from './types';

/**
 * Exit codes:
 * 0 - No vulnerabilities found that meet failure criteria
 * 1 - Vulnerabilities found that meet failure criteria
 * 2 - Script execution error
 */

/**
 * Determine the appropriate exit code based on filter results and configuration
 * @param filterResult Filter result containing vulnerabilities meeting failure criteria
 * @param config Audit configuration
 * @returns AuditResult with exit code and execution status
 */
export function determineExitCode(
  filterResult: FilterResult,
  config: AuditConfig
): AuditResult {
  const { prodFailures, devFailures } = filterResult;
  
  // Always fail on production vulnerabilities that meet the severity threshold
  if (prodFailures.length > 0) {
    const severityDescription = config.failOnSeverity === 'critical' 
      ? 'critical'
      : `${config.failOnSeverity} or higher`;
      
    return {
      exitCode: 1,
      executionError: false,
      errorMessage: `Found ${prodFailures.length} production vulnerabilities with ${severityDescription} severity`
    };
  }
  
  // Fail on development vulnerabilities only if configured to do so
  if (config.failOnEnv === 'any' && devFailures.length > 0) {
    const severityDescription = config.failOnSeverity === 'critical' 
      ? 'critical'
      : `${config.failOnSeverity} or higher`;
      
    return {
      exitCode: 1,
      executionError: false,
      errorMessage: `Found ${devFailures.length} development vulnerabilities with ${severityDescription} severity`
    };
  }
  
  // No vulnerabilities meet failure criteria
  return {
    exitCode: 0,
    executionError: false
  };
}

/**
 * Create an execution error result
 * @param message Error message
 * @returns AuditResult indicating an execution error
 */
export function createExecutionError(message: string): AuditResult {
  return {
    exitCode: 2,
    executionError: true,
    errorMessage: message
  };
}
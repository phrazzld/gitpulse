#!/usr/bin/env node

import { parseConfig } from './config';
import { executeNpmAudit } from './executor';
import { parseAuditOutput } from './parser';
import { filterVulnerabilities } from './filter';
import { generateReport } from './reporter';
import { determineExitCode, createExecutionError } from './exitHandler';
import chalk from 'chalk';

/**
 * Main function that orchestrates the security audit workflow
 */
async function main() {
  console.log(chalk.bold('🔒 Enhanced Security Audit'));
  console.log('Analyzing dependencies for security vulnerabilities...\n');

  try {
    // Parse configuration from CLI arguments
    const config = parseConfig();
    
    // Execute npm audit and get JSON output
    const auditOutput = await executeNpmAudit();
    
    // Parse and classify vulnerabilities
    const vulnerabilities = parseAuditOutput(auditOutput);
    
    // Filter vulnerabilities based on configuration
    const filterResult = filterVulnerabilities(vulnerabilities, config);
    
    // Generate and print report
    generateReport(filterResult);
    
    // Determine exit code
    const auditResult = determineExitCode(filterResult, config);
    
    if (auditResult.exitCode !== 0 && auditResult.errorMessage) {
      console.error(chalk.red(`\n❌ ${auditResult.errorMessage}`));
    }
    
    // Set process exit code
    process.exitCode = auditResult.exitCode;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(`\n❌ Error: ${errorMessage}`));
    
    const auditResult = createExecutionError(errorMessage);
    process.exitCode = auditResult.exitCode;
  }
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`\n❌ Unhandled error: ${error instanceof Error ? error.message : String(error)}`));
  process.exitCode = 2;
});
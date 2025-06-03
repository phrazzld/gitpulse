#!/usr/bin/env node

/**
 * Diagnose Storybook CI Failures
 * 
 * This script analyzes CI logs and artifacts to identify common failure patterns
 * and suggest fixes.
 */

const fs = require('fs');
const path = require('path');

// Common error patterns and their solutions
const ERROR_PATTERNS = [
  {
    pattern: /EADDRINUSE.*:(\d+)/,
    description: 'Port already in use',
    getSolution: (match) => `Port ${match[1]} is already in use. Solutions:
    - Kill the process using the port
    - Use a different port with --port flag
    - Add port conflict resolution in CI`
  },
  {
    pattern: /Cannot find module.*@storybook/,
    description: 'Missing Storybook dependency',
    getSolution: () => `Storybook dependency not found. Solutions:
    - Run: npm ci
    - Check package-lock.json is committed
    - Verify npm install completed successfully in CI`
  },
  {
    pattern: /storybook-static.*not found/,
    description: 'Storybook build missing',
    getSolution: () => `Storybook build artifacts missing. Solutions:
    - Ensure 'npm run build-storybook' runs before tests
    - Check build step completed successfully
    - Verify working directory is correct`
  },
  {
    pattern: /stories\.json.*not found/,
    description: 'Stories JSON missing',
    getSolution: () => `Stories JSON file missing. Solutions:
    - Check Storybook build configuration
    - Ensure stories.json generation is enabled
    - Verify build completed without errors`
  },
  {
    pattern: /timeout.*exceeded/i,
    description: 'Operation timeout',
    getSolution: () => `Operation timed out. Solutions:
    - Increase timeout values in CI configuration
    - Check for server startup delays
    - Optimize build and test performance`
  },
  {
    pattern: /ECONNREFUSED.*127\.0\.0\.1:(\d+)/,
    description: 'Connection refused',
    getSolution: (match) => `Cannot connect to localhost:${match[1]}. Solutions:
    - Ensure server started successfully
    - Check server logs for startup errors
    - Verify localhost is accessible in CI environment`
  },
  {
    pattern: /heap out of memory/i,
    description: 'Memory exhaustion',
    getSolution: () => `JavaScript heap out of memory. Solutions:
    - Increase Node.js memory limit: NODE_OPTIONS="--max-old-space-size=4096"
    - Optimize memory usage in tests
    - Use larger CI runners if available`
  },
  {
    pattern: /Process exit.*code 1/,
    description: 'Generic process failure',
    getSolution: () => `Process exited with code 1. This is generic - check:
    - Previous error messages in the log
    - Server startup logs
    - Test execution output
    - Environment variable configuration`
  }
];

/**
 * Analyze log content for errors
 */
function analyzeLog(content, filename) {
  const findings = [];
  const lines = content.split('\n');
  
  // Check each error pattern
  ERROR_PATTERNS.forEach(({ pattern, description, getSolution }) => {
    lines.forEach((line, index) => {
      const match = line.match(pattern);
      if (match) {
        findings.push({
          file: filename,
          line: index + 1,
          description,
          solution: getSolution(match),
          context: lines.slice(Math.max(0, index - 2), index + 3).join('\n')
        });
      }
    });
  });
  
  // Look for specific CI indicators
  if (content.includes('::error::')) {
    const errorLines = lines.filter(line => line.includes('::error::'));
    errorLines.forEach(line => {
      findings.push({
        file: filename,
        description: 'GitHub Actions error annotation',
        solution: 'This is a CI-specific error marker. Check the surrounding context.',
        context: line
      });
    });
  }
  
  return findings;
}

/**
 * Analyze JSON reports
 */
function analyzeJsonReport(content, filename) {
  const findings = [];
  
  try {
    const data = JSON.parse(content);
    
    // Check test results
    if (data.tests && data.tests.exitCode !== 0) {
      findings.push({
        file: filename,
        description: 'Tests failed with non-zero exit code',
        solution: `Exit code: ${data.tests.exitCode}. Check test output for specific failures.`,
        context: JSON.stringify(data.tests, null, 2)
      });
    }
    
    // Check server info
    if (data.server && data.server.startupTime > 30000) {
      findings.push({
        file: filename,
        description: 'Slow server startup',
        solution: `Server took ${data.server.startupTime / 1000}s to start. Consider:
        - Increasing startup timeout
        - Optimizing build size
        - Using production builds`,
        context: JSON.stringify(data.server, null, 2)
      });
    }
    
    // Check for violations
    if (data.violations && data.violations.length > 0) {
      findings.push({
        file: filename,
        description: 'Accessibility violations found',
        solution: 'Fix accessibility issues in components. Run tests locally to debug.',
        context: `${data.violations.length} violations found`
      });
    }
    
  } catch (error) {
    findings.push({
      file: filename,
      description: 'Invalid JSON',
      solution: 'JSON parsing failed. Check file format.',
      context: error.message
    });
  }
  
  return findings;
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations(findings) {
  const recommendations = new Set();
  
  findings.forEach(finding => {
    // Port conflicts
    if (finding.description.includes('Port')) {
      recommendations.add('Add dynamic port allocation to CI scripts');
    }
    
    // Build issues
    if (finding.description.includes('build') || finding.description.includes('missing')) {
      recommendations.add('Add build verification step before running tests');
      recommendations.add('Upload build artifacts for debugging');
    }
    
    // Timeout issues
    if (finding.description.includes('timeout') || finding.description.includes('Slow')) {
      recommendations.add('Increase CI timeout limits');
      recommendations.add('Add progress logging to identify slow operations');
    }
    
    // Memory issues
    if (finding.description.includes('memory')) {
      recommendations.add('Use larger CI runners or optimize memory usage');
      recommendations.add('Add NODE_OPTIONS="--max-old-space-size=4096" to CI');
    }
  });
  
  return Array.from(recommendations);
}

/**
 * Main diagnostic function
 */
async function diagnose(logsPath) {
  console.log('🔍 Storybook CI Failure Diagnostics');
  console.log('===================================\n');
  
  const findings = [];
  
  // Check if path exists
  if (!fs.existsSync(logsPath)) {
    console.error(`❌ Path not found: ${logsPath}`);
    console.log('\nUsage: node diagnose-failure.js <path-to-logs>');
    console.log('Example: node diagnose-failure.js ./test-logs');
    process.exit(1);
  }
  
  // Process all files in the directory
  const files = fs.readdirSync(logsPath);
  
  for (const file of files) {
    const filePath = path.join(logsPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      console.log(`📄 Analyzing: ${file}`);
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (file.endsWith('.json')) {
        findings.push(...analyzeJsonReport(content, file));
      } else if (file.endsWith('.log') || file.endsWith('.txt')) {
        findings.push(...analyzeLog(content, file));
      }
    }
  }
  
  // Display findings
  if (findings.length === 0) {
    console.log('\n✅ No obvious errors found in the logs.');
    console.log('Consider checking:');
    console.log('- Full CI workflow output');
    console.log('- Environment variable configuration');
    console.log('- Network connectivity in CI');
  } else {
    console.log(`\n❌ Found ${findings.length} potential issue(s):\n`);
    
    findings.forEach((finding, index) => {
      console.log(`${index + 1}. ${finding.description}`);
      console.log(`   File: ${finding.file}${finding.line ? ` (line ${finding.line})` : ''}`);
      console.log(`   Solution: ${finding.solution}`);
      if (finding.context) {
        console.log(`   Context:\n${finding.context.split('\n').map(l => '   > ' + l).join('\n')}`);
      }
      console.log();
    });
    
    // Generate recommendations
    const recommendations = generateRecommendations(findings);
    if (recommendations.length > 0) {
      console.log('📋 Recommendations:');
      recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
  }
  
  // Generate summary report
  const report = {
    timestamp: new Date().toISOString(),
    logsPath,
    findingsCount: findings.length,
    findings: findings.map(f => ({
      description: f.description,
      file: f.file,
      solution: f.solution
    })),
    recommendations: generateRecommendations(findings)
  };
  
  const reportPath = path.join(logsPath, 'diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📊 Diagnostic report saved to: ${reportPath}`);
}

// Run if called directly
if (require.main === module) {
  const logsPath = process.argv[2] || './test-logs';
  diagnose(logsPath).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { analyzeLog, analyzeJsonReport, ERROR_PATTERNS };
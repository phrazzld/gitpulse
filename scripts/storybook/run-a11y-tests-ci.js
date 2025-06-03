#!/usr/bin/env node

/**
 * Run A11y Tests in CI
 * 
 * This script orchestrates the complete accessibility testing workflow for CI:
 * 1. Starts Storybook server with health checks
 * 2. Waits for server readiness
 * 3. Executes accessibility tests
 * 4. Handles cleanup and error reporting
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const StorybookServer = require('./start-server-with-retry');

// Configuration with CI-aware defaults
const isCI = process.env.CI === 'true';
const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const TEST_TIMEOUT = isCI ? 600000 : 300000; // 10 minutes in CI, 5 minutes locally
const LOG_DIR = 'test-logs';
const RESULTS_DIR = 'test-results';

// CI-specific configuration
const CI_CONFIG = {
  maxRetries: isCI ? 2 : 3,
  retryDelay: isCI ? 3000 : 2000,
  healthCheckTimeout: isCI ? 45000 : 30000,
  serverStartupTimeout: isCI ? 120000 : 60000
};

// Ensure directories exist
[LOG_DIR, RESULTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Run test-storybook with proper error handling
 */
async function runTests(serverUrl) {
  return new Promise((resolve, reject) => {
    console.log('\n🧪 Running accessibility tests...');
    console.log(`📍 Server URL: ${serverUrl}`);
    
    const testLogFile = path.join(LOG_DIR, 'a11y-test-output.log');
    const testLogStream = fs.createWriteStream(testLogFile);
    
    // Configure test runner arguments
    const args = [
      'test-storybook',
      '--url', serverUrl,
      '--ci',
      '--junit',
      '--maxWorkers=2'
    ];
    
    // Add stories.json if using static build
    const storiesJsonPath = path.join('storybook-static', 'stories.json');
    if (fs.existsSync(storiesJsonPath)) {
      args.push('--stories-json', storiesJsonPath);
    }
    
    console.log('📝 Test command:', `npx ${args.join(' ')}`);
    
    const testProcess = spawn('npx', args, {
      env: {
        ...process.env,
        CI: 'true',
        A11Y_FAILING_IMPACTS: process.env.A11Y_FAILING_IMPACTS || 'critical,serious',
        SKIP_A11Y_FAILURES: 'false',
        DEBUG: 'true',
        A11Y_ENHANCED_REPORTING: 'true',
        TEST_REPORT_PATH: path.join(RESULTS_DIR, 'storybook-a11y.xml'),
        NODE_PATH: './node_modules',
        FORCE_COLOR: '0'
      },
      shell: true
    });
    
    let testOutput = '';
    let errorOutput = '';
    let violationsSummary = null;
    
    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      testOutput += output;
      testLogStream.write(`[STDOUT] ${output}`);
      
      // Display test progress
      if (output.includes('PASS') || output.includes('FAIL')) {
        process.stdout.write(output);
      }
      
      // Capture violations summary
      if (output.includes('ACCESSIBILITY VIOLATIONS SUMMARY')) {
        violationsSummary = output;
      }
    });
    
    testProcess.stderr.on('data', (data) => {
      const output = data.toString();
      errorOutput += output;
      testLogStream.write(`[STDERR] ${output}`);
      
      // Display errors immediately
      if (output.trim() && !output.includes('DeprecationWarning')) {
        process.stderr.write(output);
      }
    });
    
    testProcess.on('error', (error) => {
      testLogStream.write(`[ERROR] ${error.message}\n`);
      reject(new Error(`Failed to start test process: ${error.message}`));
    });
    
    testProcess.on('exit', (code, signal) => {
      testLogStream.write(`[EXIT] Code: ${code}, Signal: ${signal}\n`);
      testLogStream.end();
      
      // Save full output for debugging
      fs.writeFileSync(path.join(LOG_DIR, 'a11y-full-output.txt'), testOutput);
      
      // Process results
      const result = {
        exitCode: code,
        signal: signal,
        hasViolations: code !== 0,
        violationsSummary: violationsSummary,
        logFile: testLogFile
      };
      
      if (code === 0) {
        console.log('\n✅ All accessibility tests passed!');
        resolve(result);
      } else {
        console.log(`\n⚠️  Tests completed with exit code ${code}`);
        
        // Extract and display violation details
        if (violationsSummary) {
          console.log('\n📊 Accessibility Violations Summary:');
          console.log(violationsSummary);
        }
        
        // Still resolve (not reject) but with failure info
        resolve(result);
      }
    });
    
    // Setup timeout
    const timeoutId = setTimeout(() => {
      console.error('\n❌ Test execution timed out!');
      testProcess.kill('SIGTERM');
      reject(new Error('Test execution timed out'));
    }, TEST_TIMEOUT);
    
    // Clear timeout on completion
    testProcess.on('exit', () => clearTimeout(timeoutId));
  });
}

/**
 * Generate summary report
 */
function generateSummaryReport(testResult, serverInfo) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    server: {
      port: serverInfo.port,
      url: serverInfo.url,
      startupTime: serverInfo.startupTime
    },
    tests: {
      exitCode: testResult.exitCode,
      hasViolations: testResult.hasViolations,
      summary: testResult.violationsSummary
    },
    environment: {
      node: process.version,
      ci: process.env.CI === 'true',
      failingImpacts: process.env.A11Y_FAILING_IMPACTS || 'critical,serious'
    }
  };
  
  // Save JSON report
  const reportPath = path.join(RESULTS_DIR, 'a11y-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Test report saved to: ${reportPath}`);
  
  return report;
}

/**
 * Pre-flight checks to identify issues before starting
 */
async function preFlightChecks() {
  console.log('🔍 Running pre-flight checks...\n');
  
  const checks = [];
  
  // Node.js version check
  checks.push({
    name: 'Node.js version',
    check: () => {
      const version = process.version;
      const major = parseInt(version.split('.')[0].substring(1));
      return { value: version, passed: major >= 18 };
    }
  });
  
  // Storybook build check
  checks.push({
    name: 'Storybook build exists',
    check: () => {
      const exists = fs.existsSync('storybook-static/index.html');
      return { value: exists ? 'Found' : 'Missing', passed: exists };
    }
  });
  
  // Stories JSON check (Storybook 8 generates index.json instead of stories.json)
  checks.push({
    name: 'Stories JSON exists',
    check: () => {
      const exists = fs.existsSync('storybook-static/index.json');
      return { value: exists ? 'Found' : 'Missing', passed: exists };
    }
  });
  
  // Environment variables check
  checks.push({
    name: 'CI environment',
    check: () => {
      const isCI = process.env.CI === 'true';
      return { value: isCI ? 'CI mode' : 'Local mode', passed: true };
    }
  });
  
  // Critical dependencies check
  checks.push({
    name: 'Test runner installed',
    check: () => {
      const exists = fs.existsSync('node_modules/@storybook/test-runner');
      return { value: exists ? 'Installed' : 'Missing', passed: exists };
    }
  });
  
  // Run all checks
  const results = [];
  for (const check of checks) {
    try {
      const result = await check.check();
      results.push({
        name: check.name,
        ...result,
        status: result.passed ? '✅' : '❌'
      });
    } catch (error) {
      results.push({
        name: check.name,
        value: `Error: ${error.message}`,
        passed: false,
        status: '❌'
      });
    }
  }
  
  // Display results in table format
  console.log('Pre-flight Check Results:');
  console.log('------------------------');
  results.forEach(result => {
    console.log(`${result.status} ${result.name}: ${result.value}`);
  });
  console.log('------------------------\n');
  
  // Check if any critical checks failed
  const criticalFailures = results.filter(r => !r.passed && r.name !== 'CI environment');
  if (criticalFailures.length > 0) {
    throw new Error(`Pre-flight checks failed: ${criticalFailures.map(r => r.name).join(', ')}`);
  }
  
  // Log additional diagnostic info if debug mode
  if (process.env.DEBUG === 'true' || process.env.DEBUG_CI === 'true') {
    console.log('📊 Additional Diagnostics:');
    console.log(`- Current directory: ${process.cwd()}`);
    console.log(`- Process ID: ${process.pid}`);
    console.log(`- Platform: ${process.platform}`);
    console.log(`- Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log();
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Storybook A11y Tests - CI Runner');
  console.log('===================================\n');
  
  const startTime = Date.now();
  let server = null;
  let exitCode = 0;
  
  try {
    // Run pre-flight checks
    await preFlightChecks();
    
    // Check prerequisites
    if (!fs.existsSync('storybook-static')) {
      throw new Error('storybook-static directory not found. Please build Storybook first.');
    }
    
    // Start server with retry logic
    console.log('📦 Starting Storybook server...');
    if (isCI) {
      console.log('🤖 Running in CI environment with enhanced timeouts');
    }
    
    server = new StorybookServer({
      port: 6006,
      directory: 'storybook-static',
      maxRetries: CI_CONFIG.maxRetries,
      retryDelay: CI_CONFIG.retryDelay,
      healthTimeout: CI_CONFIG.healthCheckTimeout
    });
    
    // Set global server reference for signal handling
    globalServer = server;
    
    const serverInfo = await server.start();
    serverInfo.startupTime = Date.now() - startTime;
    
    console.log(`\n✅ Server ready in ${serverInfo.startupTime / 1000}s`);
    
    // Run accessibility tests
    const testResult = await runTests(serverInfo.url);
    
    // Generate summary report
    const report = generateSummaryReport(testResult, serverInfo);
    
    // Set exit code based on test results
    exitCode = testResult.exitCode || 0;
    
    // Display final summary
    console.log('\n📊 Test Execution Summary:');
    console.log(`- Server startup time: ${serverInfo.startupTime / 1000}s`);
    console.log(`- Test exit code: ${exitCode}`);
    console.log(`- Violations found: ${testResult.hasViolations ? 'Yes' : 'No'}`);
    
    if (exitCode !== 0) {
      console.log('\n⚠️  Accessibility violations were found!');
      console.log('See the artifacts for detailed reports.');
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack trace:', error.stack);
    exitCode = 1;
    
    // Save error details
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      },
      logs: {
        server: path.join(LOG_DIR, 'storybook-server-*.log'),
        tests: path.join(LOG_DIR, 'a11y-test-output.log')
      }
    };
    
    fs.writeFileSync(
      path.join(RESULTS_DIR, 'a11y-error-report.json'),
      JSON.stringify(errorReport, null, 2)
    );
  } finally {
    // Always stop the server with enhanced cleanup
    if (server) {
      console.log('\n🛑 Stopping server...');
      try {
        await server.stop();
        
        // CI-specific cleanup
        if (isCI) {
          console.log('🧹 Performing CI cleanup...');
          
          // Give processes time to clean up
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check for lingering processes (in CI environments)
          if (isGitHubActions) {
            console.log('🔍 Checking for lingering processes...');
            // Additional GitHub Actions specific cleanup if needed
          }
        }
      } catch (cleanupError) {
        console.warn('⚠️ Warning: Server cleanup encountered an issue:', cleanupError.message);
        // Don't fail the build due to cleanup issues
      }
    }
    
    // CI-specific final reporting
    if (isCI) {
      console.log('\n📊 CI Final Summary:');
      console.log(`- Environment: ${isGitHubActions ? 'GitHub Actions' : 'Generic CI'}`);
      console.log(`- Exit Code: ${exitCode}`);
      console.log(`- Test Timeout: ${TEST_TIMEOUT / 1000}s`);
      console.log(`- Max Retries: ${CI_CONFIG.maxRetries}`);
    }
    
    // Exit with appropriate code
    process.exit(exitCode);
  }
}

// Enhanced signal handling for graceful shutdowns
let globalServer = null;

function gracefulShutdown(signal) {
  console.log(`\n⚠️ Received ${signal}, performing graceful shutdown...`);
  
  if (globalServer) {
    console.log('🛑 Stopping server...');
    globalServer.stop().then(() => {
      console.log('✅ Server stopped gracefully');
      process.exit(0);
    }).catch((error) => {
      console.error('❌ Error stopping server:', error.message);
      process.exit(1);
    });
  } else {
    console.log('✅ No server to stop, exiting...');
    process.exit(0);
  }
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors with CI-aware logging
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  
  if (isCI) {
    console.error('🤖 CI Environment - Additional debug info:');
    console.error('- Node version:', process.version);
    console.error('- Platform:', process.platform);
    console.error('- Memory usage:', process.memoryUsage());
    console.error('- Environment variables:');
    Object.keys(process.env)
      .filter(key => key.startsWith('CI') || key.startsWith('GITHUB') || key.startsWith('NODE'))
      .forEach(key => console.error(`  ${key}=${process.env[key]}`));
  }
  
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runTests, generateSummaryReport };
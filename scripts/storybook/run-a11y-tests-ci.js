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

// Configuration
const TEST_TIMEOUT = 300000; // 5 minutes
const LOG_DIR = 'test-logs';
const RESULTS_DIR = 'test-results';

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
 * Main execution
 */
async function main() {
  console.log('🚀 Storybook A11y Tests - CI Runner');
  console.log('===================================\n');
  
  const startTime = Date.now();
  let server = null;
  let exitCode = 0;
  
  try {
    // Check prerequisites
    if (!fs.existsSync('storybook-static')) {
      throw new Error('storybook-static directory not found. Please build Storybook first.');
    }
    
    // Start server with retry logic
    console.log('📦 Starting Storybook server...');
    server = new StorybookServer({
      port: 6006,
      directory: 'storybook-static',
      maxRetries: 3,
      healthTimeout: 45000 // 45 seconds
    });
    
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
    // Always stop the server
    if (server) {
      console.log('\n🛑 Stopping server...');
      await server.stop();
    }
    
    // Exit with appropriate code
    process.exit(exitCode);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runTests, generateSummaryReport };
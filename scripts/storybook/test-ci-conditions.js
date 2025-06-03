#!/usr/bin/env node

/**
 * Test CI-like conditions locally
 * 
 * This script helps identify potential CI issues before pushing code.
 * It simulates various CI environment conditions and checks for common problems.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const { execSync } = require('child_process');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results collector
const results = [];

/**
 * Add a test result
 */
function addResult(category, test, passed, details = '') {
  results.push({
    category,
    test,
    passed,
    status: passed ? '✅ PASS' : '❌ FAIL',
    details
  });
}

/**
 * Check Node.js version
 */
function checkNodeVersion() {
  console.log(`\n${colors.cyan}🔍 Checking Node.js version...${colors.reset}`);
  
  try {
    const currentVersion = process.version;
    let expectedVersion = 'v22';
    
    if (fs.existsSync('.nvmrc')) {
      expectedVersion = fs.readFileSync('.nvmrc', 'utf8').trim();
    }
    
    const matches = currentVersion.startsWith(expectedVersion.split('.')[0]);
    
    addResult(
      'Environment',
      'Node.js version',
      matches,
      `Current: ${currentVersion}, Expected: ${expectedVersion}`
    );
    
    return matches;
  } catch (error) {
    addResult('Environment', 'Node.js version', false, error.message);
    return false;
  }
}

/**
 * Check if Storybook build exists
 */
function checkStorybookBuild() {
  console.log(`\n${colors.cyan}🔍 Checking Storybook build...${colors.reset}`);
  
  const requiredFiles = [
    'storybook-static/index.html',
    'storybook-static/index.json', // In Storybook 8, stories.json is now index.json
    'storybook-static/iframe.html'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  });
  
  const passed = missingFiles.length === 0;
  
  addResult(
    'Build Artifacts',
    'Storybook build files',
    passed,
    passed ? 'All required files present' : `Missing: ${missingFiles.join(', ')}`
  );
  
  // Check build directory size
  if (fs.existsSync('storybook-static')) {
    try {
      const size = execSync('du -sh storybook-static').toString().trim().split('\t')[0];
      console.log(`  Build size: ${size}`);
    } catch (error) {
      console.log(`  Could not determine build size`);
    }
  }
  
  return passed;
}

/**
 * Check port availability
 */
async function checkPortAvailability(port = 6006) {
  console.log(`\n${colors.cyan}🔍 Checking port ${port} availability...${colors.reset}`);
  
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        addResult(
          'Network',
          `Port ${port} availability`,
          false,
          'Port is already in use'
        );
        resolve(false);
      } else {
        addResult(
          'Network',
          `Port ${port} availability`,
          false,
          err.message
        );
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      addResult(
        'Network',
        `Port ${port} availability`,
        true,
        'Port is available'
      );
      resolve(true);
    });
    
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Check localhost connectivity
 */
async function checkLocalhostConnectivity() {
  console.log(`\n${colors.cyan}🔍 Checking localhost connectivity...${colors.reset}`);
  
  const addresses = ['127.0.0.1', 'localhost', '::1'];
  let allPassed = true;
  
  for (const address of addresses) {
    try {
      // Try to create a server on each address
      await new Promise((resolve, reject) => {
        const server = net.createServer();
        const port = 0; // Random port
        
        server.once('error', reject);
        server.once('listening', () => {
          const actualPort = server.address().port;
          server.close(() => resolve(actualPort));
        });
        
        server.listen(port, address);
      });
      
      console.log(`  ✅ ${address} - OK`);
    } catch (error) {
      console.log(`  ❌ ${address} - Failed: ${error.message}`);
      allPassed = false;
    }
  }
  
  addResult(
    'Network',
    'Localhost connectivity',
    allPassed,
    allPassed ? 'All addresses accessible' : 'Some addresses failed'
  );
  
  return allPassed;
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  console.log(`\n${colors.cyan}🔍 Checking environment variables...${colors.reset}`);
  
  const ciVariables = {
    'CI': process.env.CI,
    'NODE_ENV': process.env.NODE_ENV,
    'GITHUB_ACTIONS': process.env.GITHUB_ACTIONS,
    'RUNNER_OS': process.env.RUNNER_OS
  };
  
  console.log('  Current environment:');
  Object.entries(ciVariables).forEach(([key, value]) => {
    console.log(`    ${key}: ${value || '(not set)'}`);
  });
  
  // In CI, these should be set
  const isCI = process.env.CI === 'true';
  const hasRequiredVars = !isCI || (
    process.env.CI === 'true' &&
    process.env.GITHUB_ACTIONS === 'true'
  );
  
  addResult(
    'Environment',
    'CI environment variables',
    true, // Always pass, just informational
    isCI ? 'Running in CI' : 'Running locally'
  );
  
  return true;
}

/**
 * Check system resources
 */
function checkSystemResources() {
  console.log(`\n${colors.cyan}🔍 Checking system resources...${colors.reset}`);
  
  try {
    const cpuCount = require('os').cpus().length;
    const totalMem = require('os').totalmem() / (1024 * 1024 * 1024); // GB
    const freeMem = require('os').freemem() / (1024 * 1024 * 1024); // GB
    
    console.log(`  CPUs: ${cpuCount}`);
    console.log(`  Total Memory: ${totalMem.toFixed(2)} GB`);
    console.log(`  Free Memory: ${freeMem.toFixed(2)} GB`);
    
    const hasEnoughResources = cpuCount >= 2 && freeMem >= 1;
    
    addResult(
      'Resources',
      'System resources',
      hasEnoughResources,
      `${cpuCount} CPUs, ${freeMem.toFixed(2)} GB free memory`
    );
    
    return hasEnoughResources;
  } catch (error) {
    addResult('Resources', 'System resources', false, error.message);
    return false;
  }
}

/**
 * Check npm dependencies
 */
function checkDependencies() {
  console.log(`\n${colors.cyan}🔍 Checking npm dependencies...${colors.reset}`);
  
  try {
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      addResult(
        'Dependencies',
        'node_modules directory',
        false,
        'node_modules not found - run npm install'
      );
      return false;
    }
    
    // Check for specific critical dependencies
    const criticalDeps = [
      '@storybook/react',
      '@storybook/test-runner',
      'axe-playwright'
    ];
    
    const missingDeps = criticalDeps.filter(dep => 
      !fs.existsSync(path.join('node_modules', dep))
    );
    
    const passed = missingDeps.length === 0;
    
    addResult(
      'Dependencies',
      'Critical Storybook dependencies',
      passed,
      passed ? 'All present' : `Missing: ${missingDeps.join(', ')}`
    );
    
    return passed;
  } catch (error) {
    addResult('Dependencies', 'npm dependencies', false, error.message);
    return false;
  }
}

/**
 * Check file permissions
 */
function checkFilePermissions() {
  console.log(`\n${colors.cyan}🔍 Checking file permissions...${colors.reset}`);
  
  const criticalFiles = [
    'scripts/storybook/run-a11y-tests-ci.js',
    'scripts/storybook/start-server-with-retry.js',
    'scripts/storybook/debug-ci-server.js'
  ];
  
  let allExecutable = true;
  
  criticalFiles.forEach(file => {
    try {
      fs.accessSync(file, fs.constants.X_OK);
      console.log(`  ✅ ${file} - executable`);
    } catch (error) {
      console.log(`  ❌ ${file} - not executable`);
      allExecutable = false;
    }
  });
  
  addResult(
    'File System',
    'Script permissions',
    allExecutable,
    allExecutable ? 'All scripts executable' : 'Some scripts not executable'
  );
  
  return allExecutable;
}

/**
 * Display results summary
 */
function displaySummary() {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}📊 CI Conditions Test Summary${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  
  // Group results by category
  const categories = {};
  results.forEach(result => {
    if (!categories[result.category]) {
      categories[result.category] = [];
    }
    categories[result.category].push(result);
  });
  
  // Display by category
  Object.entries(categories).forEach(([category, categoryResults]) => {
    console.log(`${colors.yellow}${category}:${colors.reset}`);
    categoryResults.forEach(result => {
      const color = result.passed ? colors.green : colors.red;
      console.log(`  ${color}${result.status}${colors.reset} ${result.test}`);
      if (result.details) {
        console.log(`       ${result.details}`);
      }
    });
    console.log();
  });
  
  // Overall summary
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`Total: ${totalTests} | ${colors.green}Passed: ${passedTests}${colors.reset} | ${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
  
  // Recommendations
  if (failedTests > 0) {
    console.log(`${colors.yellow}⚠️  Recommendations:${colors.reset}`);
    
    results.filter(r => !r.passed).forEach(result => {
      if (result.test.includes('Node.js')) {
        console.log('  - Update Node.js to match .nvmrc version');
      } else if (result.test.includes('Storybook build')) {
        console.log('  - Run: npm run build-storybook');
      } else if (result.test.includes('Port')) {
        console.log('  - Kill process using port 6006 or use a different port');
      } else if (result.test.includes('dependencies')) {
        console.log('  - Run: npm ci');
      } else if (result.test.includes('permissions')) {
        console.log('  - Run: chmod +x scripts/storybook/*.js');
      }
    });
    
    console.log();
  }
  
  return failedTests === 0;
}

/**
 * Main execution
 */
async function main() {
  console.log(`${colors.blue}🚀 Testing CI-like conditions locally${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  
  // Run all checks
  checkNodeVersion();
  checkStorybookBuild();
  await checkPortAvailability(6006);
  await checkPortAvailability(6007); // Alternative port
  await checkLocalhostConnectivity();
  checkEnvironmentVariables();
  checkSystemResources();
  checkDependencies();
  checkFilePermissions();
  
  // Display summary
  const allPassed = displaySummary();
  
  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = {
  checkNodeVersion,
  checkStorybookBuild,
  checkPortAvailability,
  checkEnvironmentVariables
};
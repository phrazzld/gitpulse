#!/usr/bin/env node

/**
 * Debug CI Server Startup
 * 
 * This script provides detailed diagnostics for Storybook server startup in CI environments.
 * It checks port availability, monitors server startup, and provides detailed error reporting.
 */

const net = require('net');
const { spawn } = require('child_process');
// Use native fetch (Node.js 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || (() => {
  try {
    return require('node-fetch');
  } catch (e) {
    console.error('Warning: node-fetch not found, using basic http module');
    return null;
  }
})();
const path = require('path');
const fs = require('fs');

// Configuration
const DEFAULT_PORT = 6006;
const STARTUP_TIMEOUT = 60000; // 60 seconds
const CHECK_INTERVAL = 1000; // 1 second
const LOG_DIR = 'test-logs';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Check if a port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`❌ Port ${port} is already in use`);
        resolve(false);
      } else {
        console.log(`❌ Error checking port ${port}:`, err.message);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      console.log(`✅ Port ${port} is available`);
      resolve(true);
    });
    
    server.listen(port);
  });
}

/**
 * Find an available port starting from the preferred port
 */
async function findAvailablePort(preferredPort = DEFAULT_PORT, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found starting from ${preferredPort}`);
}

/**
 * Check if server is ready by testing various endpoints
 */
async function checkServerHealth(baseUrl) {
  const endpoints = [
    { url: '/', name: 'Root' },
    { url: '/index.json', name: 'Index JSON' },
    { url: '/stories.json', name: 'Stories JSON' },
    { url: '/iframe.html', name: 'IFrame HTML' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      if (!fetch) {
        // Fallback to basic http request if fetch not available
        const http = require('http');
        const url = new URL(`${baseUrl}${endpoint.url}`);
        const response = await new Promise((resolve, reject) => {
          const req = http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
              status: res.statusCode,
              ok: res.statusCode >= 200 && res.statusCode < 300,
              headers: { entries: () => Object.entries(res.headers) },
              text: async () => data
            }));
          });
          req.on('error', reject);
          req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });
        });
        return response;
      }
      
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        timeout: 5000
      });
      
      results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (endpoint.url === '/stories.json' && response.ok) {
        const text = await response.text();
        const storiesCount = (text.match(/"kind":/g) || []).length;
        results[results.length - 1].storiesCount = storiesCount;
      }
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Start Storybook server with detailed logging
 */
async function startStorybookServer(port) {
  console.log(`\n🚀 Starting Storybook server on port ${port}...`);
  
  const logFile = path.join(LOG_DIR, 'storybook-server.log');
  const logStream = fs.createWriteStream(logFile);
  
  const serverProcess = spawn('npx', ['http-server', 'storybook-static', '--port', port.toString()], {
    env: { ...process.env, FORCE_COLOR: '0' },
    shell: true
  });
  
  // Log output
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    logStream.write(`[STDOUT] ${output}`);
    console.log(`📝 Server: ${output.trim()}`);
  });
  
  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    logStream.write(`[STDERR] ${output}`);
    console.error(`⚠️  Server Error: ${output.trim()}`);
  });
  
  serverProcess.on('error', (error) => {
    console.error('❌ Failed to start server process:', error);
    logStream.write(`[ERROR] ${error.message}\n`);
  });
  
  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
    logStream.write(`[EXIT] Code: ${code}, Signal: ${signal}\n`);
    logStream.end();
  });
  
  return { process: serverProcess, logFile };
}

/**
 * Wait for server to be ready with detailed progress reporting
 */
async function waitForServerReady(baseUrl, timeout = STARTUP_TIMEOUT) {
  const startTime = Date.now();
  let lastHealthCheck = null;
  
  while (Date.now() - startTime < timeout) {
    console.log(`\n⏳ Checking server health (${Math.round((Date.now() - startTime) / 1000)}s elapsed)...`);
    
    const healthResults = await checkServerHealth(baseUrl);
    lastHealthCheck = healthResults;
    
    // Log health check results
    console.log('📊 Health check results:');
    healthResults.forEach(result => {
      if (result.error) {
        console.log(`  ❌ ${result.endpoint}: ${result.error}`);
      } else {
        const statusIcon = result.ok ? '✅' : '⚠️';
        console.log(`  ${statusIcon} ${result.endpoint}: Status ${result.status}`);
        if (result.storiesCount !== undefined) {
          console.log(`     📚 Found ${result.storiesCount} stories`);
        }
      }
    });
    
    // Check if critical endpoints are ready
    const storiesEndpoint = healthResults.find(r => r.url === '/stories.json');
    const iframeEndpoint = healthResults.find(r => r.url === '/iframe.html');
    
    if (storiesEndpoint?.ok && iframeEndpoint?.ok) {
      console.log('\n✅ Server is ready!');
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
  }
  
  // Timeout reached
  console.error('\n❌ Server failed to become ready within timeout');
  console.error('Last health check results:', JSON.stringify(lastHealthCheck, null, 2));
  
  // Save detailed diagnostics
  const diagnosticsFile = path.join(LOG_DIR, 'server-diagnostics.json');
  fs.writeFileSync(diagnosticsFile, JSON.stringify({
    timeout: timeout,
    elapsed: Date.now() - startTime,
    lastHealthCheck: lastHealthCheck,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  return false;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Storybook CI Server Debugger');
  console.log('================================\n');
  
  try {
    // Check if storybook-static exists
    if (!fs.existsSync('storybook-static')) {
      throw new Error('storybook-static directory not found. Please build Storybook first.');
    }
    
    // Find available port
    const port = await findAvailablePort(DEFAULT_PORT);
    console.log(`\n🎯 Using port: ${port}`);
    
    // Start server
    const { process: serverProcess, logFile } = await startStorybookServer(port);
    console.log(`📄 Server logs: ${logFile}`);
    
    // Wait for server to be ready
    const baseUrl = `http://localhost:${port}`;
    const isReady = await waitForServerReady(baseUrl);
    
    if (isReady) {
      console.log('\n🎉 Server started successfully!');
      console.log(`🌐 Server URL: ${baseUrl}`);
      
      // Export port for use by test runner
      console.log(`\n::set-output name=port::${port}`);
      console.log(`::set-output name=url::${baseUrl}`);
      
      // Keep server running if needed
      if (process.argv.includes('--keep-alive')) {
        console.log('\n⏸️  Keeping server alive (press Ctrl+C to stop)...');
      } else {
        serverProcess.kill();
      }
    } else {
      console.error('\n❌ Server startup failed!');
      serverProcess.kill();
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { isPortAvailable, findAvailablePort, checkServerHealth, waitForServerReady };
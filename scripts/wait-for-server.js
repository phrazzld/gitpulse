/**
 * Simple utility script to wait for the server to be ready before starting tests.
 * 
 * Usage: node scripts/wait-for-server.js [url] [timeout] [interval]
 * 
 * - url: URL to check (default: http://localhost:3000)
 * - timeout: Maximum time to wait in milliseconds (default: 60000)
 * - interval: Check interval in milliseconds (default: 1000)
 */

const http = require('http');
const https = require('https');

// Parse command line arguments
const url = process.argv[2] || 'http://localhost:3000';
const timeout = parseInt(process.argv[3], 10) || 60000;
const interval = parseInt(process.argv[4], 10) || 1000;

console.log(`Waiting for server at ${url} (timeout: ${timeout}ms, interval: ${interval}ms)...`);

const startTime = Date.now();
let isReady = false;

// Track consecutive successes for more reliable server readiness detection
let consecutiveSuccesses = 0;
const requiredSuccesses = process.env.CI ? 3 : 1; // More strict in CI

function checkServer() {
  const timeElapsed = Date.now() - startTime;
  
  if (timeElapsed > timeout) {
    console.error(`Timeout waiting for server at ${url} after ${timeout}ms`);
    process.exit(1);
  }
  
  const client = url.startsWith('https') ? https : http;
  
  const req = client.get(url, (res) => {
    const statusCode = res.statusCode;
    if (statusCode >= 200 && statusCode < 400) {
      consecutiveSuccesses++;
      console.log(`Server at ${url} responded successfully (Status: ${statusCode}) - Success ${consecutiveSuccesses}/${requiredSuccesses}`);
      
      if (consecutiveSuccesses >= requiredSuccesses) {
        console.log(`Server at ${url} is ready! Had ${requiredSuccesses} consecutive successful responses.`);
        process.exit(0);
      } else {
        // Wait a bit longer between success checks to ensure stability
        setTimeout(checkServer, interval * 2);
      }
    } else {
      // Reset consecutive successes counter on any failure
      consecutiveSuccesses = 0;
      console.log(`Server not ready yet. Status code: ${statusCode}. Retrying in ${interval}ms...`);
      setTimeout(checkServer, interval);
    }
  });
  
  req.on('error', (err) => {
    // Reset consecutive successes counter on any error
    consecutiveSuccesses = 0;
    console.log(`Server not ready yet. Error: ${err.message}. Retrying in ${interval}ms...`);
    setTimeout(checkServer, interval);
  });
  
  // Set a timeout for the request itself
  req.setTimeout(5000, () => {
    req.destroy();
    console.log(`Request timed out. Retrying in ${interval}ms...`);
    setTimeout(checkServer, interval);
  });
  
  req.end();
}

// Start checking
checkServer();
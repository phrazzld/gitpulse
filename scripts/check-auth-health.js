/**
 * Authentication Health Check Script
 * 
 * Verifies that NextAuth API endpoints are available and responding correctly
 * before E2E tests begin. This prevents test failures due to authentication
 * endpoints not being ready.
 * 
 * Usage: node scripts/check-auth-health.js [baseUrl] [timeout] [interval]
 * 
 * - baseUrl: Base URL to check (default: http://localhost:3000)
 * - timeout: Maximum time to wait in milliseconds (default: 30000)
 * - interval: Check interval in milliseconds (default: 1000)
 */

const http = require('http');
const https = require('https');

// Parse command line arguments
const baseUrl = process.argv[2] || 'http://localhost:3000';
const timeout = parseInt(process.argv[3], 10) || 30000;
const interval = parseInt(process.argv[4], 10) || 1000;

console.log(`Checking authentication endpoints at ${baseUrl} (timeout: ${timeout}ms, interval: ${interval}ms)...`);

const startTime = Date.now();

// Define critical authentication endpoints to check
const endpoints = [
  {
    path: '/api/auth/session',
    name: 'Session API',
    expectedStatus: [200], // Should return 200 even for unauthenticated requests
    critical: true
  },
  {
    path: '/api/auth/providers',
    name: 'Providers API',
    expectedStatus: [200],
    critical: true
  },
  {
    path: '/api/auth/csrf',
    name: 'CSRF Token API',
    expectedStatus: [200],
    critical: true
  },
  {
    path: '/',
    name: 'Root Page',
    expectedStatus: [200],
    critical: false // Not critical for auth, but good to check
  }
];

// Track endpoint status
const endpointStatus = new Map();
endpoints.forEach(endpoint => {
  endpointStatus.set(endpoint.path, {
    ...endpoint,
    isReady: false,
    lastError: null,
    consecutiveSuccesses: 0
  });
});

function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const fullUrl = `${baseUrl}${endpoint.path}`;
    const client = fullUrl.startsWith('https') ? https : http;
    
    const req = client.get(fullUrl, (res) => {
      const statusCode = res.statusCode;
      const isExpected = endpoint.expectedStatus.includes(statusCode);
      
      resolve({
        success: isExpected,
        statusCode,
        error: null
      });
    });
    
    req.on('error', (err) => {
      resolve({
        success: false,
        statusCode: null,
        error: err.message
      });
    });
    
    // Set a timeout for the request
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({
        success: false,
        statusCode: null,
        error: 'Request timeout'
      });
    });
    
    req.end();
  });
}

async function checkAllEndpoints() {
  const timeElapsed = Date.now() - startTime;
  
  if (timeElapsed > timeout) {
    console.error(`\\nTimeout waiting for authentication endpoints after ${timeout}ms`);
    console.error('Failed endpoints:');
    
    for (const [path, status] of endpointStatus) {
      if (!status.isReady && status.critical) {
        console.error(`  - ${status.name} (${path}): ${status.lastError || 'Not ready'}`);
      }
    }
    
    process.exit(1);
  }
  
  console.log(`\\n=== Authentication Health Check (${Math.round(timeElapsed / 1000)}s elapsed) ===`);
  
  // Check all endpoints
  const results = await Promise.all(
    endpoints.map(async (endpoint) => {
      const result = await makeRequest(endpoint);
      const status = endpointStatus.get(endpoint.path);
      
      if (result.success) {
        status.consecutiveSuccesses++;
        status.lastError = null;
        
        // Require 2 consecutive successes for stability
        if (status.consecutiveSuccesses >= 2) {
          status.isReady = true;
        }
        
        console.log(`✅ ${status.name}: OK (${result.statusCode}) - ${status.consecutiveSuccesses}/2 successes`);
      } else {
        status.consecutiveSuccesses = 0;
        status.isReady = false;
        status.lastError = result.error || `HTTP ${result.statusCode}`;
        
        console.log(`❌ ${status.name}: FAIL (${result.statusCode || 'ERROR'}) - ${status.lastError}`);
      }
      
      return { endpoint, status, result };
    })
  );
  
  // Check if all critical endpoints are ready
  const criticalEndpoints = endpoints.filter(e => e.critical);
  const readyCriticalEndpoints = criticalEndpoints.filter(e => 
    endpointStatus.get(e.path).isReady
  );
  
  console.log(`\\nCritical endpoints ready: ${readyCriticalEndpoints.length}/${criticalEndpoints.length}`);
  
  if (readyCriticalEndpoints.length === criticalEndpoints.length) {
    console.log('\\n🎉 All authentication endpoints are ready!');
    
    // Show final status summary
    console.log('\\n=== Final Status Summary ===');
    for (const endpoint of endpoints) {
      const status = endpointStatus.get(endpoint.path);
      const statusIcon = status.isReady ? '✅' : '❌';
      const criticalLabel = endpoint.critical ? ' (critical)' : '';
      console.log(`${statusIcon} ${status.name}${criticalLabel}: ${status.isReady ? 'Ready' : 'Not ready'}`);
    }
    
    process.exit(0);
  }
  
  // Continue checking
  setTimeout(checkAllEndpoints, interval);
}

// Start checking
console.log('Starting authentication endpoint health checks...');
checkAllEndpoints();
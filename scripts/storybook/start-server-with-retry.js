#!/usr/bin/env node

/**
 * Start Storybook Server with Retry Logic
 * 
 * This script provides a robust way to start the Storybook server with:
 * - Automatic retry on failure
 * - Port conflict resolution
 * - Proper cleanup on exit
 * - Health endpoint verification
 */

const { spawn } = require('child_process');
// Use native fetch (Node.js 18+) or require node-fetch for older versions
const fetch = globalThis.fetch || (() => {
  try {
    return require('node-fetch');
  } catch (e) {
    // Fetch functionality is handled by debug-ci-server module
    return null;
  }
})();
const path = require('path');
const fs = require('fs');
const { isPortAvailable, findAvailablePort, checkServerHealth } = require('./debug-ci-server');

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds
const HEALTH_CHECK_INTERVAL = 1000; // 1 second

class StorybookServer {
  constructor(options = {}) {
    this.port = options.port || 6006;
    this.directory = options.directory || 'storybook-static';
    this.logDir = options.logDir || 'test-logs';
    this.maxRetries = options.maxRetries || MAX_RETRIES;
    this.retryDelay = options.retryDelay || RETRY_DELAY;
    this.healthTimeout = options.healthTimeout || HEALTH_CHECK_TIMEOUT;
    this.serverProcess = null;
    this.isShuttingDown = false;
    
    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Setup cleanup handlers
    this.setupCleanupHandlers();
  }
  
  /**
   * Setup process cleanup handlers
   */
  setupCleanupHandlers() {
    const cleanup = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      
      console.log(`\n🛑 Received ${signal}, shutting down server...`);
      await this.stop();
      process.exit(0);
    };
    
    process.on('SIGINT', () => cleanup('SIGINT'));
    process.on('SIGTERM', () => cleanup('SIGTERM'));
    process.on('exit', () => {
      if (this.serverProcess && !this.serverProcess.killed) {
        this.serverProcess.kill();
      }
    });
  }
  
  /**
   * Start the server with retry logic
   */
  async start() {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      console.log(`\n🚀 Starting Storybook server (attempt ${attempt}/${this.maxRetries})...`);
      
      try {
        // Find available port
        this.port = await findAvailablePort(this.port);
        
        // Start server
        await this.startServer();
        
        // Wait for server to be healthy
        const isHealthy = await this.waitForHealth();
        
        if (isHealthy) {
          console.log(`\n✅ Server started successfully on port ${this.port}`);
          return {
            success: true,
            port: this.port,
            url: `http://localhost:${this.port}`,
            process: this.serverProcess
          };
        } else {
          throw new Error('Server health check failed');
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        // Stop the server if it's running
        await this.stop();
        
        if (attempt < this.maxRetries) {
          console.log(`⏳ Retrying in ${this.retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          
          // Try next port on retry
          this.port++;
        } else {
          throw new Error(`Failed to start server after ${this.maxRetries} attempts`);
        }
      }
    }
  }
  
  /**
   * Start the server process
   */
  async startServer() {
    return new Promise((resolve, reject) => {
      const logFile = path.join(this.logDir, `storybook-server-${Date.now()}.log`);
      const logStream = fs.createWriteStream(logFile);
      
      console.log(`📄 Server log: ${logFile}`);
      
      // Use npx http-server for serving static files
      const args = [
        'http-server',
        this.directory,
        '--port', this.port.toString(),
        '--cors',
        '--silent'
      ];
      
      this.serverProcess = spawn('npx', args, {
        env: { ...process.env, FORCE_COLOR: '0' },
        shell: true
      });
      
      let startupError = null;
      
      this.serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        logStream.write(`[STDOUT] ${output}`);
        
        // Check for successful startup messages
        if (output.includes('Starting up') || output.includes('Available on')) {
          resolve();
        }
      });
      
      this.serverProcess.stderr.on('data', (data) => {
        const output = data.toString();
        logStream.write(`[STDERR] ${output}`);
        
        // Collect startup errors
        if (!startupError && output.trim()) {
          startupError = output.trim();
        }
      });
      
      this.serverProcess.on('error', (error) => {
        logStream.write(`[ERROR] ${error.message}\n`);
        reject(new Error(`Failed to start server process: ${error.message}`));
      });
      
      this.serverProcess.on('exit', (code, signal) => {
        logStream.write(`[EXIT] Code: ${code}, Signal: ${signal}\n`);
        logStream.end();
        
        if (code !== 0 && code !== null && !this.isShuttingDown) {
          const errorMsg = startupError || `Server process exited with code ${code}`;
          reject(new Error(errorMsg));
        }
      });
      
      // Give the server a moment to start or fail
      setTimeout(() => {
        if (!this.serverProcess.killed) {
          resolve();
        }
      }, 2000);
    });
  }
  
  /**
   * Wait for server to become healthy
   */
  async waitForHealth() {
    const startTime = Date.now();
    const baseUrl = `http://localhost:${this.port}`;
    
    console.log(`🏥 Checking server health at ${baseUrl}...`);
    
    while (Date.now() - startTime < this.healthTimeout) {
      try {
        // Check critical endpoints
        const healthResults = await checkServerHealth(baseUrl);
        
        const storiesEndpoint = healthResults.find(r => r.url === '/stories.json');
        const iframeEndpoint = healthResults.find(r => r.url === '/iframe.html');
        
        if (storiesEndpoint?.ok && iframeEndpoint?.ok) {
          console.log('✅ Server health check passed');
          
          // Additional verification for stories.json
          if (storiesEndpoint.storiesCount > 0) {
            console.log(`📚 Found ${storiesEndpoint.storiesCount} stories`);
            return true;
          } else {
            console.warn('⚠️  No stories found in stories.json');
          }
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, HEALTH_CHECK_INTERVAL));
    }
    
    return false;
  }
  
  /**
   * Stop the server
   */
  async stop() {
    if (this.serverProcess && !this.serverProcess.killed) {
      console.log('🛑 Stopping server...');
      
      return new Promise((resolve) => {
        this.serverProcess.once('exit', () => {
          this.serverProcess = null;
          resolve();
        });
        
        this.serverProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill('SIGKILL');
          }
        }, 5000);
      });
    }
  }
}

/**
 * Main execution when run directly
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    port: parseInt(args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '6006'),
    directory: args.find(arg => arg.startsWith('--dir='))?.split('=')[1] || 'storybook-static',
    maxRetries: parseInt(args.find(arg => arg.startsWith('--retries='))?.split('=')[1] || '3'),
    healthTimeout: parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || '30000')
  };
  
  console.log('🚀 Storybook Server Starter with Retry');
  console.log('=====================================\n');
  console.log('Options:', options);
  
  const server = new StorybookServer(options);
  
  try {
    const result = await server.start();
    
    console.log('\n✅ Server started successfully!');
    console.log(`🌐 URL: ${result.url}`);
    console.log(`🔌 Port: ${result.port}`);
    
    // Export for CI
    if (process.env.CI) {
      console.log(`\n::set-output name=port::${result.port}`);
      console.log(`::set-output name=url::${result.url}`);
    }
    
    // Keep server running if requested
    if (args.includes('--keep-alive')) {
      console.log('\n⏸️  Server is running (press Ctrl+C to stop)...');
      // Keep process alive
      await new Promise(() => {});
    }
  } catch (error) {
    console.error('\n❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = StorybookServer;
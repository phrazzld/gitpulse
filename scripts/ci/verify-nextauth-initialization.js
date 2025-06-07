#!/usr/bin/env node

/**
 * NextAuth Initialization Verification Script for CI
 * 
 * This script ensures NextAuth is fully initialized and ready for E2E testing
 * by performing comprehensive verification beyond basic endpoint availability.
 * It addresses timing issues where NextAuth endpoints respond but aren't fully configured.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT = parseInt(process.argv[3]) || 45000;
const RETRY_INTERVAL = parseInt(process.argv[4]) || 2000;
const CI_ENVIRONMENT = process.env.CI === 'true';

class NextAuthInitializationVerifier {
  constructor(baseUrl, timeout, retryInterval) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retryInterval = retryInterval;
    this.startTime = Date.now();
    this.verificationResults = {
      timestamp: new Date().toISOString(),
      baseUrl,
      ciEnvironment: CI_ENVIRONMENT,
      verifications: [],
      timing: {
        startTime: this.startTime,
        totalDuration: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const elapsed = Date.now() - this.startTime;
    const prefix = `[NEXTAUTH-INIT ${timestamp}] [+${elapsed}ms]`;
    
    switch (type) {
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
      case 'success':
        console.log(`${prefix} ✅ ${message}`);
        break;
      case 'warning':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      case 'progress':
        console.log(`${prefix} 🔄 ${message}`);
        break;
      default:
        console.log(`${prefix} ℹ️ ${message}`);
    }
  }

  async waitForCondition(conditionFn, description, maxWaitTime = this.timeout) {
    const startTime = Date.now();
    let lastError = null;

    this.log(`Waiting for condition: ${description} (max ${maxWaitTime}ms)`, 'progress');

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const result = await conditionFn();
        if (result) {
          const elapsed = Date.now() - startTime;
          this.log(`Condition met: ${description} (took ${elapsed}ms)`, 'success');
          return result;
        }
      } catch (error) {
        lastError = error;
        // Continue retrying
      }

      await new Promise(resolve => setTimeout(resolve, this.retryInterval));
    }

    const elapsed = Date.now() - startTime;
    const errorMsg = `Timeout waiting for: ${description} after ${elapsed}ms`;
    if (lastError) {
      throw new Error(`${errorMsg} - Last error: ${lastError.message}`);
    } else {
      throw new Error(errorMsg);
    }
  }

  async verifyBasicEndpointAvailability() {
    const verification = {
      name: 'Basic Endpoint Availability',
      startTime: Date.now(),
      status: 'pending',
      details: {}
    };

    try {
      this.log('Verifying basic NextAuth endpoint availability');

      await this.waitForCondition(async () => {
        try {
          const response = execSync(
            `curl -s -w "HTTP_STATUS:%{http_code}" -m 5 "${this.baseUrl}/api/auth/session"`,
            { encoding: 'utf8', timeout: 5000 }
          );
          
          const statusMatch = response.match(/HTTP_STATUS:(\d+)$/);
          const httpStatus = statusMatch ? parseInt(statusMatch[1]) : 0;
          
          return httpStatus === 200;
        } catch (error) {
          return false;
        }
      }, 'NextAuth session endpoint responds with HTTP 200');

      verification.status = 'passed';
      verification.details = { endpointResponsive: true };
      this.log('Basic endpoint availability verified', 'success');

    } catch (error) {
      verification.status = 'failed';
      verification.error = error.message;
      this.log(`Basic endpoint availability failed: ${error.message}`, 'error');
      throw error;

    } finally {
      verification.endTime = Date.now();
      verification.duration = verification.endTime - verification.startTime;
      this.verificationResults.verifications.push(verification);
    }
  }

  async verifyNextAuthConfiguration() {
    const verification = {
      name: 'NextAuth Configuration Verification',
      startTime: Date.now(),
      status: 'pending',
      details: {}
    };

    try {
      this.log('Verifying NextAuth configuration is properly loaded');

      await this.waitForCondition(async () => {
        try {
          // Test the providers endpoint to ensure NextAuth config is loaded
          const response = execSync(
            `curl -s -w "HTTP_STATUS:%{http_code}" -m 5 "${this.baseUrl}/api/auth/providers"`,
            { encoding: 'utf8', timeout: 5000 }
          );
          
          const statusMatch = response.match(/HTTP_STATUS:(\d+)$/);
          const httpStatus = statusMatch ? parseInt(statusMatch[1]) : 0;
          const body = response.replace(/HTTP_STATUS:\d+$/, '');

          if (httpStatus === 200) {
            try {
              const providers = JSON.parse(body);
              // Check if GitHub provider is configured
              const hasGitHubProvider = providers.github || 
                Object.values(providers).some(p => p && p.type === 'oauth' && p.name && p.name.toLowerCase().includes('github'));
              
              verification.details.providers = Object.keys(providers);
              verification.details.hasGitHubProvider = hasGitHubProvider;
              
              return hasGitHubProvider;
            } catch (parseError) {
              this.log(`Providers endpoint returned invalid JSON: ${parseError.message}`, 'warning');
              return false;
            }
          }
          
          return false;
        } catch (error) {
          return false;
        }
      }, 'NextAuth providers endpoint returns valid GitHub configuration');

      verification.status = 'passed';
      this.log('NextAuth configuration properly loaded', 'success');

    } catch (error) {
      verification.status = 'failed';
      verification.error = error.message;
      this.log(`NextAuth configuration verification failed: ${error.message}`, 'error');
      throw error;

    } finally {
      verification.endTime = Date.now();
      verification.duration = verification.endTime - verification.startTime;
      this.verificationResults.verifications.push(verification);
    }
  }

  async verifyJWTSecretConfiguration() {
    const verification = {
      name: 'JWT Secret Configuration Verification',
      startTime: Date.now(),
      status: 'pending',
      details: {}
    };

    try {
      this.log('Verifying JWT secret is properly configured');

      // Check environment variable
      const nextAuthSecret = process.env.NEXTAUTH_SECRET;
      if (!nextAuthSecret) {
        throw new Error('NEXTAUTH_SECRET environment variable is not set');
      }

      verification.details.secretLength = nextAuthSecret.length;
      verification.details.secretPresent = true;

      // Test CSRF endpoint which relies on secret for token generation
      await this.waitForCondition(async () => {
        try {
          const response = execSync(
            `curl -s -w "HTTP_STATUS:%{http_code}" -m 5 "${this.baseUrl}/api/auth/csrf"`,
            { encoding: 'utf8', timeout: 5000 }
          );
          
          const statusMatch = response.match(/HTTP_STATUS:(\d+)$/);
          const httpStatus = statusMatch ? parseInt(statusMatch[1]) : 0;
          const body = response.replace(/HTTP_STATUS:\d+$/, '');

          if (httpStatus === 200) {
            try {
              const csrfData = JSON.parse(body);
              const hasCSRFToken = csrfData.csrfToken && csrfData.csrfToken.length > 0;
              
              verification.details.csrfTokenGenerated = hasCSRFToken;
              verification.details.csrfTokenLength = csrfData.csrfToken ? csrfData.csrfToken.length : 0;
              
              return hasCSRFToken;
            } catch (parseError) {
              this.log(`CSRF endpoint returned invalid JSON: ${parseError.message}`, 'warning');
              return false;
            }
          }
          
          return false;
        } catch (error) {
          return false;
        }
      }, 'CSRF endpoint generates valid tokens using JWT secret');

      verification.status = 'passed';
      this.log('JWT secret properly configured and functional', 'success');

    } catch (error) {
      verification.status = 'failed';
      verification.error = error.message;
      this.log(`JWT secret verification failed: ${error.message}`, 'error');
      throw error;

    } finally {
      verification.endTime = Date.now();
      verification.duration = verification.endTime - verification.startTime;
      this.verificationResults.verifications.push(verification);
    }
  }

  async verifySessionHandling() {
    const verification = {
      name: 'Session Handling Verification',
      startTime: Date.now(),
      status: 'pending',
      details: {}
    };

    try {
      this.log('Verifying NextAuth session handling is ready');

      // If storage state exists from global setup, test session validation
      const storageStatePath = 'e2e/storageState.json';
      if (fs.existsSync(storageStatePath)) {
        this.log('Testing session validation with existing storage state');
        
        await this.waitForCondition(async () => {
          try {
            const storageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'));
            const sessionCookie = storageState.cookies.find(
              cookie => cookie.name === 'next-auth.session-token'
            );

            if (!sessionCookie) {
              this.log('No session token found in storage state', 'warning');
              return false;
            }

            // Test session API with the cookie
            const cookieHeader = `${sessionCookie.name}=${sessionCookie.value}`;
            const response = execSync(
              `curl -s -w "HTTP_STATUS:%{http_code}" -m 5 -H "Cookie: ${cookieHeader}" "${this.baseUrl}/api/auth/session"`,
              { encoding: 'utf8', timeout: 5000 }
            );
            
            const statusMatch = response.match(/HTTP_STATUS:(\d+)$/);
            const httpStatus = statusMatch ? parseInt(statusMatch[1]) : 0;
            const body = response.replace(/HTTP_STATUS:\d+$/, '');

            if (httpStatus === 200) {
              try {
                const sessionData = JSON.parse(body);
                const hasValidSession = sessionData && Object.keys(sessionData).length > 0 && sessionData.user;
                
                verification.details.sessionResponseType = hasValidSession ? 'valid_user_session' : 'empty_object';
                verification.details.sessionHasUser = !!sessionData.user;
                verification.details.sessionKeys = Object.keys(sessionData);
                
                if (!hasValidSession) {
                  this.log('Session API returned empty object - NextAuth may not be properly initialized', 'warning');
                  return false;
                }
                
                return true;
              } catch (parseError) {
                this.log(`Session API returned invalid JSON: ${parseError.message}`, 'warning');
                return false;
              }
            }
            
            return false;
          } catch (error) {
            this.log(`Session handling test error: ${error.message}`, 'warning');
            return false;
          }
        }, 'Session API properly validates and returns user data');

        verification.details.storageStatePresent = true;
      } else {
        this.log('No storage state available for session testing - will verify readiness only', 'info');
        verification.details.storageStatePresent = false;
        
        // Just verify session endpoint responds consistently
        await this.waitForCondition(async () => {
          try {
            const response = execSync(
              `curl -s -w "HTTP_STATUS:%{http_code}" -m 5 "${this.baseUrl}/api/auth/session"`,
              { encoding: 'utf8', timeout: 5000 }
            );
            
            const statusMatch = response.match(/HTTP_STATUS:(\d+)$/);
            const httpStatus = statusMatch ? parseInt(statusMatch[1]) : 0;
            
            return httpStatus === 200;
          } catch (error) {
            return false;
          }
        }, 'Session endpoint consistently responds');
      }

      verification.status = 'passed';
      this.log('Session handling verification completed', 'success');

    } catch (error) {
      verification.status = 'failed';
      verification.error = error.message;
      this.log(`Session handling verification failed: ${error.message}`, 'error');
      throw error;

    } finally {
      verification.endTime = Date.now();
      verification.duration = verification.endTime - verification.startTime;
      this.verificationResults.verifications.push(verification);
    }
  }

  async addInitializationDelay() {
    const verification = {
      name: 'Initialization Delay for CI Stability',
      startTime: Date.now(),
      status: 'pending',
      details: {}
    };

    try {
      // Add strategic delay in CI environment to allow NextAuth to fully stabilize
      const delayMs = CI_ENVIRONMENT ? 3000 : 1000;
      
      this.log(`Adding ${delayMs}ms initialization delay for stability`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      verification.details.delayAdded = delayMs;
      verification.details.ciEnvironment = CI_ENVIRONMENT;
      verification.status = 'passed';
      
      this.log(`Initialization delay completed (${delayMs}ms)`, 'success');

    } catch (error) {
      verification.status = 'failed';
      verification.error = error.message;

    } finally {
      verification.endTime = Date.now();
      verification.duration = verification.endTime - verification.startTime;
      this.verificationResults.verifications.push(verification);
    }
  }

  async runAllVerifications() {
    this.log('Starting comprehensive NextAuth initialization verification', 'info');
    this.log(`Base URL: ${this.baseUrl}`, 'info');
    this.log(`Timeout: ${this.timeout}ms`, 'info');
    this.log(`CI Environment: ${CI_ENVIRONMENT}`, 'info');

    const verifications = [
      () => this.verifyBasicEndpointAvailability(),
      () => this.verifyNextAuthConfiguration(),
      () => this.verifyJWTSecretConfiguration(),
      () => this.verifySessionHandling(),
      () => this.addInitializationDelay()
    ];

    let allPassed = true;

    for (const verification of verifications) {
      try {
        await verification();
      } catch (error) {
        allPassed = false;
        this.log(`Verification failed, but continuing with remaining checks: ${error.message}`, 'error');
      }
    }

    // Generate final results
    this.verificationResults.timing.endTime = Date.now();
    this.verificationResults.timing.totalDuration = this.verificationResults.timing.endTime - this.verificationResults.timing.startTime;

    const passedCount = this.verificationResults.verifications.filter(v => v.status === 'passed').length;
    const failedCount = this.verificationResults.verifications.filter(v => v.status === 'failed').length;

    this.log('=== NEXTAUTH INITIALIZATION VERIFICATION SUMMARY ===', 'info');
    this.log(`Total Verifications: ${this.verificationResults.verifications.length}`, 'info');
    this.log(`Passed: ${passedCount}`, 'success');
    this.log(`Failed: ${failedCount}`, failedCount > 0 ? 'error' : 'info');
    this.log(`Total Duration: ${this.verificationResults.timing.totalDuration}ms`, 'info');

    // Save detailed results
    const resultsPath = 'ci-metrics/nextauth-initialization.json';
    const resultsDir = path.dirname(resultsPath);
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(this.verificationResults, null, 2));
    this.log(`Detailed results saved to ${resultsPath}`, 'info');

    if (!allPassed) {
      this.log('NextAuth initialization verification FAILED - some checks did not pass', 'error');
      this.log('E2E tests may experience authentication issues', 'warning');
      // Don't exit with error - let the E2E tests run and fail with better debugging
      process.exit(0);
    } else {
      this.log('NextAuth initialization verification PASSED - ready for E2E tests', 'success');
      process.exit(0);
    }
  }
}

// Main execution
async function main() {
  const verifier = new NextAuthInitializationVerifier(BASE_URL, TIMEOUT, RETRY_INTERVAL);
  await verifier.runAllVerifications();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`[NEXTAUTH-INIT] Uncaught exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[NEXTAUTH-INIT] Unhandled rejection at:`, promise, 'reason:', reason);
  process.exit(1);
});

// Run the verification
if (require.main === module) {
  main().catch(error => {
    console.error(`[NEXTAUTH-INIT] Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { NextAuthInitializationVerifier };
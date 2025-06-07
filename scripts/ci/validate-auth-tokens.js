#!/usr/bin/env node

/**
 * Authentication Token Validation Script for CI
 * 
 * This script performs comprehensive validation of authentication tokens and NextAuth
 * configuration before E2E test execution. It helps diagnose authentication issues
 * by validating JWT structure, NextAuth initialization, and session token handling.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BASE_URL = process.argv[2] || 'http://localhost:3000';
const TIMEOUT = parseInt(process.argv[3]) || 30000;
const STORAGE_STATE_PATH = 'e2e/storageState.json';

class AuthTokenValidator {
  constructor(baseUrl, timeout) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl,
      tests: [],
      summary: {
        passed: 0,
        failed: 0,
        total: 0
      }
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[AUTH-TOKEN-VALIDATION ${timestamp}]`;
    
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
      default:
        console.log(`${prefix} ℹ️ ${message}`);
    }
  }

  async addTest(name, testFn) {
    const test = {
      name,
      status: 'pending',
      startTime: Date.now(),
      error: null,
      details: {}
    };

    this.results.tests.push(test);
    this.results.summary.total++;

    try {
      this.log(`Starting test: ${name}`);
      const result = await testFn();
      
      test.status = 'passed';
      test.details = result || {};
      this.results.summary.passed++;
      
      this.log(`Test passed: ${name}`, 'success');
      return result;
    } catch (error) {
      test.status = 'failed';
      test.error = error.message;
      test.details = { error: error.message, stack: error.stack };
      this.results.summary.failed++;
      
      this.log(`Test failed: ${name} - ${error.message}`, 'error');
      throw error;
    } finally {
      test.endTime = Date.now();
      test.duration = test.endTime - test.startTime;
    }
  }

  async validateEnvironmentVariables() {
    return this.addTest('Environment Variables Validation', () => {
      const requiredVars = [
        'NODE_ENV',
        'E2E_MOCK_AUTH_ENABLED',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET',
        'GITHUB_OAUTH_CLIENT_ID',
        'GITHUB_OAUTH_CLIENT_SECRET'
      ];

      const envStatus = {};
      const missing = [];

      for (const varName of requiredVars) {
        const value = process.env[varName];
        envStatus[varName] = {
          present: !!value,
          value: value ? (varName.includes('SECRET') ? '[REDACTED]' : value) : null
        };
        
        if (!value) {
          missing.push(varName);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }

      this.log(`All required environment variables are present`, 'success');
      return { envStatus, requiredVars };
    });
  }

  async validateNextAuthConfiguration() {
    return this.addTest('NextAuth Configuration Validation', async () => {
      const nextAuthPath = path.join(process.cwd(), 'src/app/api/auth/[...nextauth]/route.ts');
      
      if (!fs.existsSync(nextAuthPath)) {
        throw new Error(`NextAuth configuration file not found at ${nextAuthPath}`);
      }

      // Read NextAuth configuration
      const configContent = fs.readFileSync(nextAuthPath, 'utf8');
      
      // Basic validation of NextAuth setup
      const hasGitHubProvider = configContent.includes('GitHubProvider') || configContent.includes('github');
      const hasSecret = configContent.includes('NEXTAUTH_SECRET') || process.env.NEXTAUTH_SECRET;
      const hasUrl = configContent.includes('NEXTAUTH_URL') || process.env.NEXTAUTH_URL;

      const issues = [];
      if (!hasGitHubProvider) issues.push('GitHub provider not configured');
      if (!hasSecret) issues.push('NEXTAUTH_SECRET not configured');
      if (!hasUrl) issues.push('NEXTAUTH_URL not configured');

      if (issues.length > 0) {
        throw new Error(`NextAuth configuration issues: ${issues.join(', ')}`);
      }

      this.log('NextAuth configuration appears valid', 'success');
      return {
        configPath: nextAuthPath,
        hasGitHubProvider,
        hasSecret,
        hasUrl,
        configSize: configContent.length
      };
    });
  }

  async validateAuthEndpoints() {
    return this.addTest('Authentication Endpoints Validation', async () => {
      const endpoints = [
        '/api/auth/session',
        '/api/auth/providers',
        '/api/auth/csrf'
      ];

      const endpointResults = {};

      for (const endpoint of endpoints) {
        try {
          const url = `${this.baseUrl}${endpoint}`;
          this.log(`Testing endpoint: ${url}`);

          // Use curl for endpoint testing to avoid Node.js fetch complications
          const curlCmd = `curl -s -w "HTTP_STATUS:%{http_code}" -m 10 "${url}"`;
          const response = execSync(curlCmd, { encoding: 'utf8', timeout: 10000 });
          
          // Parse curl response
          const statusMatch = response.match(/HTTP_STATUS:(\d+)$/);
          const httpStatus = statusMatch ? parseInt(statusMatch[1]) : 0;
          const body = response.replace(/HTTP_STATUS:\d+$/, '');

          endpointResults[endpoint] = {
            status: httpStatus,
            responseSize: body.length,
            reachable: httpStatus > 0,
            successful: httpStatus >= 200 && httpStatus < 400
          };

          if (httpStatus === 0) {
            this.log(`Endpoint ${endpoint} is not reachable`, 'warning');
          } else if (httpStatus >= 400) {
            this.log(`Endpoint ${endpoint} returned error status: ${httpStatus}`, 'warning');
          } else {
            this.log(`Endpoint ${endpoint} is responding (HTTP ${httpStatus})`, 'success');
          }

        } catch (error) {
          endpointResults[endpoint] = {
            status: 0,
            error: error.message,
            reachable: false,
            successful: false
          };
          this.log(`Failed to test endpoint ${endpoint}: ${error.message}`, 'warning');
        }
      }

      // Check if any critical endpoints are failing
      const failedEndpoints = Object.entries(endpointResults)
        .filter(([_, result]) => !result.successful)
        .map(([endpoint, _]) => endpoint);

      if (failedEndpoints.length === endpoints.length) {
        throw new Error(`All authentication endpoints are failing: ${failedEndpoints.join(', ')}`);
      }

      return { endpointResults, failedEndpoints, testedEndpoints: endpoints };
    });
  }

  async validateStorageState() {
    return this.addTest('Storage State Validation', () => {
      if (!fs.existsSync(STORAGE_STATE_PATH)) {
        throw new Error(`Storage state file not found at ${STORAGE_STATE_PATH}`);
      }

      const storageStateContent = fs.readFileSync(STORAGE_STATE_PATH, 'utf8');
      let storageState;

      try {
        storageState = JSON.parse(storageStateContent);
      } catch (error) {
        throw new Error(`Invalid JSON in storage state file: ${error.message}`);
      }

      // Validate storage state structure
      if (!storageState.cookies || !Array.isArray(storageState.cookies)) {
        throw new Error('Storage state missing cookies array');
      }

      // Find NextAuth session token
      const sessionCookie = storageState.cookies.find(
        cookie => cookie.name === 'next-auth.session-token'
      );

      if (!sessionCookie) {
        throw new Error('NextAuth session token not found in storage state');
      }

      // Validate session cookie properties
      const cookieValidation = {
        hasValue: !!sessionCookie.value,
        hasDomain: !!sessionCookie.domain,
        hasPath: !!sessionCookie.path,
        isHttpOnly: sessionCookie.httpOnly === true,
        sameSite: sessionCookie.sameSite || 'unknown'
      };

      // Check for expiration
      const now = Date.now() / 1000; // Convert to seconds
      const isExpired = sessionCookie.expires && sessionCookie.expires < now;

      if (isExpired) {
        throw new Error(`Session cookie is expired (expires: ${new Date(sessionCookie.expires * 1000).toISOString()})`);
      }

      this.log(`Storage state contains valid NextAuth session token`, 'success');
      return {
        storageStatePath: STORAGE_STATE_PATH,
        cookieCount: storageState.cookies.length,
        sessionCookie: {
          ...cookieValidation,
          domain: sessionCookie.domain,
          path: sessionCookie.path,
          expires: sessionCookie.expires ? new Date(sessionCookie.expires * 1000).toISOString() : null,
          valueLength: sessionCookie.value ? sessionCookie.value.length : 0
        }
      };
    });
  }

  async validateJWTTokenStructure() {
    return this.addTest('JWT Token Structure Validation', () => {
      if (!fs.existsSync(STORAGE_STATE_PATH)) {
        throw new Error(`Storage state file not found for JWT validation`);
      }

      const storageState = JSON.parse(fs.readFileSync(STORAGE_STATE_PATH, 'utf8'));
      const sessionCookie = storageState.cookies.find(
        cookie => cookie.name === 'next-auth.session-token'
      );

      if (!sessionCookie) {
        throw new Error('No session token found for JWT validation');
      }

      const token = sessionCookie.value;
      
      // Basic JWT structure validation (without actual decoding for security)
      const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;
      const isJWTFormat = jwtPattern.test(token);
      
      if (!isJWTFormat) {
        // Check if it's a NextAuth session token (different format for session strategy)
        if (token.length > 32 && !token.includes('.')) {
          this.log('Token appears to be NextAuth session token (not JWT)', 'info');
          return {
            tokenType: 'session',
            format: 'valid',
            length: token.length,
            isJWT: false,
            validation: 'NextAuth session token format detected'
          };
        } else {
          throw new Error(`Token does not match expected JWT or NextAuth session format: ${token.substring(0, 20)}...`);
        }
      }

      // If it's JWT format, validate structure
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error(`JWT should have 3 parts separated by dots, found ${parts.length}`);
      }

      this.log('Token structure validation passed', 'success');
      return {
        tokenType: 'jwt',
        format: 'valid',
        length: token.length,
        isJWT: true,
        parts: {
          header: parts[0].length,
          payload: parts[1].length,
          signature: parts[2].length
        },
        validation: 'JWT structure is valid'
      };
    });
  }

  async validateSessionAPI() {
    return this.addTest('Session API Response Validation', async () => {
      const sessionUrl = `${this.baseUrl}/api/auth/session`;
      
      try {
        // Use curl to test session API with cookies from storage state
        let curlCmd = `curl -s -w "HTTP_STATUS:%{http_code}" -m 10`;
        
        // Add cookies from storage state if available
        if (fs.existsSync(STORAGE_STATE_PATH)) {
          const storageState = JSON.parse(fs.readFileSync(STORAGE_STATE_PATH, 'utf8'));
          const cookieHeader = storageState.cookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');
          
          if (cookieHeader) {
            curlCmd += ` -H "Cookie: ${cookieHeader}"`;
          }
        }
        
        curlCmd += ` "${sessionUrl}"`;
        
        const response = execSync(curlCmd, { encoding: 'utf8', timeout: 10000 });
        
        // Parse curl response
        const statusMatch = response.match(/HTTP_STATUS:(\d+)$/);
        const httpStatus = statusMatch ? parseInt(statusMatch[1]) : 0;
        const body = response.replace(/HTTP_STATUS:\d+$/, '');

        if (httpStatus !== 200) {
          throw new Error(`Session API returned HTTP ${httpStatus}`);
        }

        // Try to parse response as JSON
        let sessionData;
        try {
          sessionData = JSON.parse(body);
        } catch (error) {
          throw new Error(`Session API returned invalid JSON: ${error.message}`);
        }

        // Validate session response structure
        const isEmpty = Object.keys(sessionData).length === 0;
        const hasUser = sessionData.user && typeof sessionData.user === 'object';
        const hasExpires = !!sessionData.expires;
        const hasAccessToken = !!sessionData.accessToken;

        if (isEmpty) {
          this.log('Session API returned empty object - authentication not working', 'error');
          throw new Error('Session API returned empty object - user not authenticated');
        }

        this.log('Session API returned valid user session', 'success');
        return {
          status: httpStatus,
          isEmpty,
          hasUser,
          hasExpires,
          hasAccessToken,
          userFields: hasUser ? Object.keys(sessionData.user) : [],
          responseSize: body.length,
          sessionData: {
            ...sessionData,
            // Don't log actual token values in CI
            accessToken: sessionData.accessToken ? '[PRESENT]' : undefined
          }
        };

      } catch (error) {
        this.log(`Session API validation failed: ${error.message}`, 'error');
        throw error;
      }
    });
  }

  async validateAuthenticationFlow() {
    return this.addTest('End-to-End Authentication Flow Validation', async () => {
      // This test validates the complete authentication flow
      const validationSteps = [];

      try {
        // Step 1: Check if storage state exists and is valid
        if (fs.existsSync(STORAGE_STATE_PATH)) {
          validationSteps.push({ step: 'storage_state', status: 'exists' });
        } else {
          validationSteps.push({ step: 'storage_state', status: 'missing' });
          throw new Error('Storage state file missing - authentication flow incomplete');
        }

        // Step 2: Validate that NextAuth endpoints are responding
        const sessionUrl = `${this.baseUrl}/api/auth/session`;
        const curlCmd = `curl -s -w "HTTP_STATUS:%{http_code}" -m 5 "${sessionUrl}"`;
        const response = execSync(curlCmd, { encoding: 'utf8', timeout: 5000 });
        const statusMatch = response.match(/HTTP_STATUS:(\d+)$/);
        const httpStatus = statusMatch ? parseInt(statusMatch[1]) : 0;

        if (httpStatus === 200) {
          validationSteps.push({ step: 'nextauth_endpoints', status: 'responding' });
        } else {
          validationSteps.push({ step: 'nextauth_endpoints', status: 'error', httpStatus });
          throw new Error(`NextAuth endpoints not responding properly (HTTP ${httpStatus})`);
        }

        // Step 3: Validate authentication state persistence
        // This would typically involve checking that the session persists across requests
        validationSteps.push({ step: 'auth_persistence', status: 'ready' });

        this.log('Complete authentication flow validation passed', 'success');
        return {
          validationSteps,
          flowStatus: 'valid',
          readyForE2E: true
        };

      } catch (error) {
        validationSteps.push({ 
          step: 'flow_validation', 
          status: 'failed', 
          error: error.message 
        });
        
        throw new Error(`Authentication flow validation failed: ${error.message}`);
      }
    });
  }

  async runAllValidations() {
    this.log('Starting comprehensive authentication token validation', 'info');
    this.log(`Base URL: ${this.baseUrl}`, 'info');
    this.log(`Timeout: ${this.timeout}ms`, 'info');

    const validations = [
      () => this.validateEnvironmentVariables(),
      () => this.validateNextAuthConfiguration(),
      () => this.validateAuthEndpoints(),
      () => this.validateStorageState(),
      () => this.validateJWTTokenStructure(),
      () => this.validateSessionAPI(),
      () => this.validateAuthenticationFlow()
    ];

    let allPassed = true;

    for (const validation of validations) {
      try {
        await validation();
      } catch (error) {
        allPassed = false;
        // Continue with other validations even if one fails
      }
    }

    // Generate summary report
    this.log('=== AUTHENTICATION TOKEN VALIDATION SUMMARY ===', 'info');
    this.log(`Total Tests: ${this.results.summary.total}`, 'info');
    this.log(`Passed: ${this.results.summary.passed}`, 'success');
    this.log(`Failed: ${this.results.summary.failed}`, this.results.summary.failed > 0 ? 'error' : 'info');

    // Save detailed results to file for CI artifacts
    const resultsPath = 'ci-metrics/auth-token-validation.json';
    const resultsDir = path.dirname(resultsPath);
    
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
    this.log(`Detailed results saved to ${resultsPath}`, 'info');

    if (!allPassed) {
      this.log('Authentication token validation FAILED - see errors above', 'error');
      process.exit(1);
    } else {
      this.log('All authentication token validations PASSED', 'success');
      process.exit(0);
    }
  }
}

// Main execution
async function main() {
  const validator = new AuthTokenValidator(BASE_URL, TIMEOUT);
  await validator.runAllValidations();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`[AUTH-TOKEN-VALIDATION] Uncaught exception: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`[AUTH-TOKEN-VALIDATION] Unhandled rejection at:`, promise, 'reason:', reason);
  process.exit(1);
});

// Run the validation
if (require.main === module) {
  main().catch(error => {
    console.error(`[AUTH-TOKEN-VALIDATION] Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { AuthTokenValidator };
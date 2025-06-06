# Authentication Troubleshooting Guide

This guide provides comprehensive troubleshooting procedures for authentication issues in GitPulse E2E tests, particularly in CI environments. It covers the enhanced verification system, debugging procedures, and common failure patterns.

## Overview

GitPulse uses a sophisticated authentication system for E2E testing that includes:
- Mock authentication via cookies (see `E2E_MOCK_AUTH_STRATEGY.md`)
- Multi-method verification system with confidence scoring
- Adaptive timing for CI environments
- Advanced debugging and error reporting

This guide focuses on **troubleshooting authentication failures** after the system is set up.

## Quick Reference

### Common Commands
```bash
# Run authentication tests locally
NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true npm run test:e2e -- e2e/auth.spec.ts

# Run with debugging
DEBUG=pw:api,pw:browser* npm run test:e2e -- e2e/auth.spec.ts

# Check storage state
cat e2e/storageState.json | jq '.cookies[] | select(.name=="next-auth.session-token")'

# Validate authentication endpoint health
node scripts/check-auth-health.js
```

### Environment Variables Checklist
- ✅ `NODE_ENV=test`
- ✅ `E2E_MOCK_AUTH_ENABLED=true`
- ✅ `NEXTAUTH_SECRET` (set to any value for tests)
- ✅ `NEXTAUTH_URL=http://localhost:3000` (or appropriate URL)
- ✅ `CI=true` (in CI environments)

## Authentication Verification System

### Verification Methods

Our authentication system uses four verification methods with confidence scoring:

1. **API Verification** (95% confidence)
   - Calls `/api/auth/session` endpoint
   - Retry logic with exponential backoff
   - High confidence for successful responses

2. **Cookie Verification** (80% confidence)
   - Checks `next-auth.session-token` cookie presence and validity
   - Analyzes expiry, security attributes, and content length
   - Confidence adjusts based on cookie characteristics

3. **Protected Endpoint Verification** (85% confidence)
   - Tests access to `/api/summary` (protected route)
   - Distinguishes between auth failures (401) and server errors (500)
   - Retry logic for server errors only

4. **Storage Verification** (60% confidence)
   - Checks client-side localStorage/sessionStorage for auth tokens
   - Supplementary method, lower confidence by design
   - Helps detect client-side auth token persistence

### Consensus Logic

The system uses **weighted consensus** to determine authentication state:
- Each method provides a confidence score (0-1)
- Final decision based on weighted scores vs. configurable threshold (default 60%)
- Falls back to simple majority if confidence data insufficient
- Provides detailed breakdown for debugging

## Common Authentication Issues

### 1. Cookie Synchronization Problems

**Symptoms:**
- Tests pass locally but fail in CI
- "Authentication lost after navigation" errors
- Intermittent failures during navigation

**Diagnosis:**
```typescript
// Check for cookie timing issues
const verification = await verifyAuthentication(page, context);
console.log('Verification results:', verification.results);
console.log('Consensus:', verification.consensusDetails);
```

**Solutions:**
- The adaptive timing system automatically adjusts for CI environments
- For manual control, use CI synchronization helpers:
```typescript
import { navigateWithCISync, waitForAuthStabilization } from './helpers/authDebug';

// Navigate with CI synchronization
await navigateWithCISync(page, context, '/dashboard', 'nav-to-dashboard');

// Wait for auth to stabilize after operations
await waitForAuthStabilization(page, context, 'post-navigation', {
  maxAttempts: 3,
  expectedAuthenticated: true
});
```

### 2. Session API Failures

**Symptoms:**
- `/api/auth/session` returns 500 or timeouts
- "Session API verification failed" in logs

**Diagnosis:**
```bash
# Check if auth endpoints are healthy
node scripts/check-auth-health.js

# Test endpoint manually
curl -H "Cookie: next-auth.session-token=<token>" http://localhost:3000/api/auth/session
```

**Solutions:**
1. **Server not ready**: Ensure server is fully started before tests
2. **Environment variables**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set
3. **Cookie format**: Check that session token is properly base64-encoded JSON

### 3. Protected Endpoint Access Denied

**Symptoms:**
- Protected routes return 401 despite having auth cookie
- "Protected endpoint verification failed" errors

**Diagnosis:**
```typescript
// Test endpoint directly
const response = await page.request.get('/api/summary?startDate=2024-01-01&endDate=2024-12-31');
console.log('Endpoint status:', response.status());
console.log('Response headers:', await response.allHeaders());
```

**Solutions:**
1. **Cookie not sent**: Verify cookie domain matches server domain
2. **Session validation**: Check NextAuth configuration accepts test cookies
3. **Route protection**: Verify the route is properly protected and not over-protected

### 4. Storage State Issues

**Symptoms:**
- "Storage state file not found" errors
- Tests start without authentication
- Global setup failures

**Diagnosis:**
```bash
# Check storage state file
ls -la e2e/storageState.json
cat e2e/storageState.json | jq '.cookies'

# Verify global setup ran
ls -la e2e/storageState-debug.json  # CI only
```

**Solutions:**
1. **Missing global setup**: Verify `globalSetup` is configured in `playwright.config.ts`
2. **File permissions**: Ensure E2E directory is writable
3. **Environment gating**: Check `isMockAuthEnabled()` returns true

## Debugging Procedures

### Step 1: Environment Validation

```bash
# Verify environment variables
echo "NODE_ENV: $NODE_ENV"
echo "E2E_MOCK_AUTH_ENABLED: $E2E_MOCK_AUTH_ENABLED"
echo "NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"

# Check server health
curl -f http://localhost:3000/api/auth/session || echo "Session endpoint not responding"
curl -f http://localhost:3000/api/auth/providers || echo "Providers endpoint not responding"
```

### Step 2: Authentication State Analysis

Use the enhanced verification system to get detailed authentication state:

```typescript
import { verifyAuthentication } from './helpers/authVerification';

// Get comprehensive auth state
const verification = await verifyAuthentication(page, context, {
  includeStorage: true,
  confidenceThreshold: 0.6
});

console.log('Authentication Status:', verification.isAuthenticated);
console.log('Overall Confidence:', verification.confidence);
console.log('Consensus Details:', verification.consensusDetails);

// Examine each method
verification.results.forEach(result => {
  console.log(`${result.method}: ${result.isAuthenticated} (${result.confidence})`);
  console.log(`  Response time: ${result.responseTime}ms`);
  console.log(`  Details:`, result.details);
});
```

### Step 3: Cookie Investigation

```typescript
import { captureAuthDebugSnapshot } from './helpers/authDebug';

// Capture detailed cookie state
const snapshot = await captureAuthDebugSnapshot(page, context, 'investigation');

// Analyze cookie details
const authCookie = snapshot.cookies.find(c => c.name === 'next-auth.session-token');
if (authCookie) {
  console.log('Auth cookie found:');
  console.log('  Domain:', authCookie.domain);
  console.log('  Path:', authCookie.path);
  console.log('  Expires:', new Date(authCookie.expires * 1000));
  console.log('  Security flags:', {
    httpOnly: authCookie.httpOnly,
    secure: authCookie.secure,
    sameSite: authCookie.sameSite
  });
  
  // Decode session data
  try {
    const sessionData = JSON.parse(Buffer.from(authCookie.value, 'base64').toString());
    console.log('  Session data:', sessionData);
  } catch (error) {
    console.log('  Failed to decode session data:', error.message);
  }
} else {
  console.log('No auth cookie found');
  console.log('Available cookies:', snapshot.cookies.map(c => c.name));
}
```

### Step 4: Timing Analysis

For CI-specific timing issues:

```typescript
import { initializeAdaptiveTiming, getCurrentTimingProfile } from './helpers/adaptiveTiming';

// Initialize timing detection
const profile = await initializeAdaptiveTiming(page, context, true);
console.log('Detected timing profile:', profile.name);
console.log('Environment type:', profile.description);
console.log('Base delay:', profile.baseDelay);
console.log('Max retries:', profile.maxRetries);

// Test navigation timing
const start = Date.now();
await page.goto('/dashboard');
await page.waitForLoadState('domcontentloaded');
const navigationTime = Date.now() - start;
console.log('Navigation time:', navigationTime, 'ms');

// Compare against profile expectations
if (navigationTime > profile.maxDelay) {
  console.log('⚠️ Navigation slower than expected for this environment');
}
```

## CI-Specific Debugging

### CI Environment Differences

CI environments often have different characteristics that affect authentication:

1. **Slower performance**: Network latency, CPU constraints
2. **Different timing**: Cookie propagation delays
3. **Security restrictions**: Some headers or cookies may behave differently
4. **Process isolation**: Different process boundaries

### CI Debugging Workflow

1. **Enable debug logging** in CI:
```yaml
env:
  DEBUG: 'pw:api,pw:browser*'
  PWDEBUG: 'console'
```

2. **Collect artifacts** after failures:
```yaml
- name: Upload test artifacts
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-artifacts
    path: |
      test-results/
      e2e/storageState*.json
      e2e/server.log
```

3. **Add debug steps** to CI workflow:
```yaml
- name: Debug authentication state
  if: failure()
  run: |
    echo "=== Authentication Debug ==="
    cat e2e/storageState.json | jq '.cookies[] | select(.name=="next-auth.session-token")'
    echo "=== Server logs (last 50 lines) ==="
    tail -50 e2e/server.log
    echo "=== Environment ==="
    env | grep -E "(NODE_ENV|E2E_|NEXT|AUTH)" | sort
```

### CI Performance Optimization

Use the adaptive timing system to optimize CI performance:

```typescript
// In test setup
import { setupEnhancedTest } from './helpers/testSetup';

const testSetup = await setupEnhancedTest(page, context, {
  testName: 'My Authentication Test',
  enableAdaptiveTiming: true,
  enableAuthDebugging: true
});

// Use optimized timeouts
await page.goto('/dashboard', {
  timeout: testSetup.recommendations.navigation.timeout
});
```

## Error Pattern Reference

### "Authentication lost after navigation"

**Cause**: Cookie not properly synchronized after page navigation
**Solution**: Use CI synchronization helpers or increase confidence threshold

```typescript
// Instead of basic navigation
await page.goto('/dashboard');

// Use enhanced navigation
await navigateWithCISync(page, context, '/dashboard', 'nav-step');
```

### "Session API verification failed after X attempts"

**Cause**: Server not responding or overloaded
**Solution**: Check server health, increase timeouts

```typescript
// Use longer timeouts for problematic environments
const verification = await verifyAuthViaAPI(page, {
  maxRetries: 5,
  timeout: 10000
});
```

### "Authentication confidence too low (X% < Y%)"

**Cause**: Multiple verification methods showing inconsistent results
**Solution**: Investigate individual method failures

```typescript
// Lower confidence threshold temporarily
await assertAuthenticated(page, context, 'Check auth', {
  confidenceThreshold: 0.4  // Lower threshold for debugging
});
```

### "Protected endpoint returned unexpected status: 403"

**Cause**: Authenticated but not authorized (this is actually correct)
**Solution**: Recognize that 403 indicates successful authentication

### "Cookie expired" or "Cookie near expiry"

**Cause**: Test session cookie has expired or will expire soon
**Solution**: Regenerate storage state or extend cookie expiry

```bash
# Regenerate storage state
rm e2e/storageState.json
npm run test:e2e  # Global setup will recreate it
```

## Advanced Debugging Techniques

### Custom Verification Options

```typescript
// Fine-tune verification behavior
const verification = await verifyAuthentication(page, context, {
  includeStorage: false,  // Skip storage check if problematic
  timeoutOptions: {
    maxRetries: 5,
    timeout: 15000
  },
  confidenceThreshold: 0.5  // Lower threshold for flaky environments
});
```

### Manual Method Testing

Test individual verification methods:

```typescript
// Test each method individually
const apiResult = await verifyAuthViaAPI(page);
const cookieResult = await verifyAuthViaCookies(context);
const endpointResult = await verifyAuthViaProtectedEndpoint(page);
const storageResult = await verifyAuthViaStorage(page);

console.log('Method results:');
console.log('  API:', apiResult);
console.log('  Cookie:', cookieResult);
console.log('  Endpoint:', endpointResult);
console.log('  Storage:', storageResult);
```

### Enhanced Error Reporting

```typescript
import { handleAuthenticationFailure } from './helpers/authErrorReporting';

try {
  await assertAuthenticated(page, context);
} catch (error) {
  // Get comprehensive failure analysis
  await handleAuthenticationFailure(
    page, 
    context, 
    'Test Step Name', 
    error, 
    'failure-type-identifier'
  );
  throw error;  // Re-throw after logging
}
```

## Performance Monitoring

### Response Time Analysis

Monitor authentication verification performance:

```typescript
// Track verification performance
const verification = await verifyAuthentication(page, context);

verification.results.forEach(result => {
  if (result.responseTime > 5000) {
    console.warn(`${result.method} verification took ${result.responseTime}ms (slow)`);
  }
});

// Overall performance assessment
if (verification.confidence < 0.8) {
  console.warn('Low authentication confidence may indicate performance issues');
}
```

### Timing Profile Analysis

```typescript
import { getTimingRecommendations } from './helpers/adaptiveTiming';

const authRecommendations = getTimingRecommendations('authentication');
console.log('Recommended authentication timing:', authRecommendations);

if (authRecommendations.timeout > 10000) {
  console.warn('Environment detected as slow - consider optimizing');
}
```

## Escalation Procedures

### When to Escalate

Escalate authentication issues when:
1. Multiple verification methods consistently fail
2. CI failures persist after applying standard solutions
3. Performance degradation affects test reliability
4. New authentication patterns emerge that aren't covered

### Information to Gather

Before escalating, collect:
1. **Environment details**: Node version, OS, CI system
2. **Timing data**: Navigation times, API response times
3. **Verification results**: Full output from `verifyAuthentication()`
4. **Error patterns**: Frequency, specific steps where failures occur
5. **Artifacts**: Storage state files, server logs, screenshots

### Temporary Workarounds

For urgent situations:
```typescript
// Reduce confidence requirements temporarily
const lowConfidenceOptions = {
  confidenceThreshold: 0.3,
  timeoutOptions: { maxRetries: 10, timeout: 20000 }
};

// Skip problematic verification methods
const apiOnlyVerification = await verifyAuthentication(page, context, {
  includeStorage: false  // Skip if storage verification is problematic
});
```

## Maintenance Procedures

### Regular Health Checks

```bash
# Weekly authentication system health check
npm run test:e2e -- e2e/auth.spec.ts --reporter=line
node scripts/check-auth-health.js
```

### Performance Baseline Updates

When CI environment changes:
1. Run timing detection: `initializeAdaptiveTiming(page, context, true)`
2. Update baseline expectations if needed
3. Adjust confidence thresholds if verification patterns change

### Documentation Updates

Keep this guide updated when:
- New authentication patterns are discovered
- CI environment characteristics change
- New verification methods are added
- Common failure patterns evolve

## References

- [E2E Mock Auth Strategy](./E2E_MOCK_AUTH_STRATEGY.md) - Authentication system setup
- [Testing Guidelines](./TESTING_GUIDELINES.md) - General testing practices
- [CI Workflow Alignment](../development/CI_WORKFLOW_ALIGNMENT.md) - CI configuration
- Code references:
  - `e2e/helpers/authVerification.ts` - Verification methods
  - `e2e/helpers/authDebug.ts` - Debugging utilities
  - `e2e/helpers/adaptiveTiming.ts` - Timing optimization
  - `e2e/helpers/authErrorReporting.ts` - Error analysis
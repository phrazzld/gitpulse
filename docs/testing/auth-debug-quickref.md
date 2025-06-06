# Authentication Debug Quick Reference

Quick commands and checks for debugging authentication issues in E2E tests.

## Environment Check
```bash
# Verify required environment variables
echo "NODE_ENV: $NODE_ENV (should be 'test')"
echo "E2E_MOCK_AUTH_ENABLED: $E2E_MOCK_AUTH_ENABLED (should be 'true')"
echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:+SET} (should be SET)"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"
```

## Server Health
```bash
# Check if auth endpoints are responding
curl -f http://localhost:3000/api/auth/session || echo "❌ Session endpoint failed"
curl -f http://localhost:3000/api/auth/providers || echo "❌ Providers endpoint failed"
curl -f http://localhost:3000/api/auth/csrf || echo "❌ CSRF endpoint failed"

# Run comprehensive health check
node scripts/check-auth-health.js
```

## Storage State Inspection
```bash
# Check if storage state file exists
ls -la e2e/storageState.json

# View auth cookie in storage state
cat e2e/storageState.json | jq '.cookies[] | select(.name=="next-auth.session-token")'

# Decode session data from cookie
node -e "
const fs = require('fs');
const state = JSON.parse(fs.readFileSync('e2e/storageState.json'));
const authCookie = state.cookies.find(c => c.name === 'next-auth.session-token');
if (authCookie) {
  const session = JSON.parse(Buffer.from(authCookie.value, 'base64').toString());
  console.log(JSON.stringify(session, null, 2));
} else {
  console.log('No auth cookie found');
}
"
```

## Test Execution
```bash
# Run auth tests with debugging
DEBUG=pw:api,pw:browser* npm run test:e2e -- e2e/auth.spec.ts

# Run with CI environment simulation
CI=true npm run test:e2e -- e2e/auth.spec.ts

# Run single test with full debugging
npm run test:e2e -- e2e/auth.spec.ts --debug --headed
```

## Common Quick Fixes
```bash
# Regenerate storage state
rm e2e/storageState.json
npm run test:e2e  # Global setup will recreate

# Clear all test artifacts
rm -rf test-results/ e2e/storageState*.json

# Reset server if hung
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

## In-Test Debugging (TypeScript)
```typescript
// Get comprehensive auth state
import { verifyAuthentication } from './helpers/authVerification';
const verification = await verifyAuthentication(page, context);
console.log('Auth state:', verification);

// Capture detailed snapshot
import { captureAuthDebugSnapshot } from './helpers/authDebug';
const snapshot = await captureAuthDebugSnapshot(page, context, 'debug');
console.log('Cookie count:', snapshot.cookies.length);

// Check timing profile
import { getCurrentTimingProfile } from './helpers/adaptiveTiming';
const profile = getCurrentTimingProfile();
console.log('Timing profile:', profile.name, profile.description);
```

## Error Pattern Solutions

| Error | Quick Fix |
|-------|-----------|
| "Storage state file not found" | `rm e2e/storageState.json && npm run test:e2e` |
| "Authentication lost after navigation" | Use `navigateWithCISync()` instead of `page.goto()` |
| "Session API verification failed" | Check `node scripts/check-auth-health.js` |
| "Authentication confidence too low" | Check individual method results in verification output |
| "Cookie expired" | Regenerate storage state (see above) |

For comprehensive troubleshooting, see [AUTHENTICATION_TROUBLESHOOTING.md](./AUTHENTICATION_TROUBLESHOOTING.md).
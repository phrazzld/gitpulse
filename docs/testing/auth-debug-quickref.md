# Authentication CI Debugging Quick Reference

Quick reference for troubleshooting authentication issues in CI workflows and E2E tests.

## 🚨 Emergency Commands

### Immediate Health Check
```bash
# Check if configuration is valid
npm run validate:auth-config

# Test authentication endpoints
node scripts/check-auth-health.js

# Check current auth state in tests
cat e2e/storageState.json | jq '.cookies[] | select(.name=="next-auth.session-token")'
```

### Quick CI Status Check
```bash
# Check all workflows use composite actions
grep -l "auth-setup" .github/workflows/*.yml

# Validate environment variables are consistent
for var in NEXTAUTH_URL NEXTAUTH_SECRET E2E_MOCK_AUTH_ENABLED; do
  echo "=== $var ==="; grep -n "$var" .github/workflows/*.yml
done
```

## 🎯 Context-Aware Validation

### Context Testing Commands
```bash
# Test specific validation context
node scripts/ci/validate-auth-tokens.js http://localhost:3000 30000 build
node scripts/ci/validate-auth-tokens.js http://localhost:3000 30000 e2e

# Auto-detect context (default)
node scripts/ci/validate-auth-tokens.js http://localhost:3000 30000 auto

# Test all contexts
for context in build e2e monitoring local; do
  echo "=== $context context ==="
  NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true NEXTAUTH_SECRET=test \
    node scripts/ci/validate-auth-tokens.js http://localhost:3000 10000 $context
done
```

### Context Detection Debugging
```bash
# Check context detection factors
echo "CI: $CI"
echo "AUTH_CONTEXT: $AUTH_CONTEXT"  
ls -la e2e/storageState.json

# Debug context detection
NODE_ENV=test CI=true node scripts/ci/validate-auth-tokens.js http://localhost:3000 10000 auto | grep "Detected"
```

### Context-Specific Issues
```bash
# Build context: Should skip E2E validations
# ✅ 3 tests (env, config, endpoints) - ⏭️ 4 tests skipped

# E2E context: Should run all validations  
# ✅ 7 tests (all validations)

# Check which validations run per context
node scripts/ci/validate-auth-tokens.js http://localhost:3000 30000 build | grep "Will run"
```

## 🔧 Configuration Debugging

### Validate Configuration
```bash
# Full configuration validation
npm run validate:auth-config

# Check for specific drift issues
node scripts/ci/validate-auth-configuration.js | grep -A 5 "Configuration Drift"

# View detailed results
cat ci-metrics/auth-config-validation.json | jq '.configDrift'
```

### Environment Variable Analysis
```bash
# Compare environments between workflows
diff <(grep -A 20 "env:" .github/workflows/ci.yml) \
     <(grep -A 20 "env:" .github/workflows/e2e-tests.yml)

# Check required auth variables
for workflow in ci.yml e2e-tests.yml auth-monitoring.yml; do
  echo "=== $workflow ==="
  grep -E "(NEXTAUTH_|E2E_|NODE_ENV)" .github/workflows/$workflow
done
```

### Composite Action Verification
```bash
# Check composite action usage
grep -r "uses.*auth-setup" .github/workflows/
grep -r "uses.*auth-cleanup" .github/workflows/

# Verify action inputs consistency
grep -A 10 "auth_context" .github/workflows/*.yml
```

## 🧪 Test-Level Debugging

### Local Authentication Testing
```bash
# Run auth tests with full debugging
NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true DEBUG=pw:api,pw:browser* npm run test:e2e -- e2e/auth.spec.ts

# Test specific authentication flows
npm run test:e2e -- e2e/auth-robust.spec.ts --reporter=line

# Check server health before tests
node scripts/check-auth-health.js http://localhost:3000 30000 1000
```

### Storage State Analysis
```bash
# Check cookie details
cat e2e/storageState.json | jq '.cookies[] | select(.name=="next-auth.session-token") | {name, value: (.value[:50] + "..."), domain, expires, httpOnly, secure}'

# Verify storage state exists
ls -la e2e/storageState*.json

# Regenerate if corrupted
rm e2e/storageState.json && npm run test:e2e -- --project=setup
```

## 🏗️ CI Workflow Debugging

### Artifact Analysis
```bash
# Download authentication validation results
gh run download <run-id> -n auth-config-validation-results
cat auth-config-validation.json | jq '.summary'

# Download authentication health monitoring
gh run download <run-id> -n auth-monitoring-*
cat auth-health-latest.json | jq '{healthScore, passRate, errors: (.errors | length)}'

# Check server logs from CI
gh run download <run-id> -n e2e-server-logs
tail -50 e2e-logs/*-server.log
```

### Workflow Configuration Analysis
```bash
# Check auth-setup usage across workflows
for workflow in .github/workflows/{ci,e2e-tests,auth-monitoring}.yml; do
  echo "=== $(basename $workflow) ==="
  grep -A 5 "auth-setup" $workflow || echo "❌ No auth-setup found"
done

# Verify cleanup steps
grep -A 3 "auth-cleanup" .github/workflows/*.yml

# Check environment alignment
grep -A 10 -B 2 "NEXTAUTH_URL\|E2E_MOCK_AUTH_ENABLED" .github/workflows/*.yml
```

### CI Debug Steps Template
Add to workflow for debugging:
```yaml
- name: Debug authentication configuration
  if: failure()
  run: |
    echo "=== Configuration Validation ==="
    npm run validate:auth-config || echo "Validation failed"
    
    echo "=== Auth State ==="
    if [ -f e2e/storageState.json ]; then
      cat e2e/storageState.json | jq '.cookies[] | select(.name=="next-auth.session-token")'
    else
      echo "No storage state file found"
    fi
    
    echo "=== Environment ==="
    env | grep -E "(NODE_ENV|E2E_|NEXT|AUTH)" | sort
    
    echo "=== Server Status ==="
    curl -s http://localhost:3000/api/auth/session || echo "Session endpoint not available"
```

## 📊 Common Failure Patterns

### Configuration Drift
```
❌ Configuration drift detected: 1 issues
ENV_VAR_DRIFT: Environment variable 'NEXTAUTH_SECRET' has different values across workflows
```
**Fix:** Review allowed differences, align environment variables

### Missing Composite Actions
```
❌ Workflow 'main' should use composite actions
COMPOSITE_ACTION_DRIFT: Workflow uses authentication but not composite actions
```
**Fix:** Replace inline auth setup with composite actions

### Authentication Health Alert
```
🚨 Authentication CI Health Alert - CRITICAL
- 🔄 Configuration Drift: 1 issues
- ⚠️ Validation Errors: 2
```
**Fix:** Check artifacts, run local validation, fix drift issues

### Context Validation Failures
```
❌ Storage state file not found at e2e/storageState.json
❌ Build context validation failed for storage state
❌ Wrong context detected: expected e2e, got build
```
**Fix:** Check context detection, verify AUTH_CONTEXT environment variable, ensure proper context in CI

### Test Authentication Failures
```
Authentication lost after navigation
Session API verification failed after 3 attempts
Cookie synchronization timeout
```
**Fix:** Use CI sync helpers, check server health, verify environment

## 🛠️ Emergency Fixes

### Temporary Workarounds
```typescript
// Reduce confidence threshold temporarily
const verification = await verifyAuthentication(page, context, {
  confidenceThreshold: 0.3,
  timeoutOptions: { maxRetries: 10, timeout: 20000 }
});

// Skip problematic verification methods
const apiOnlyVerification = await verifyAuthentication(page, context, {
  includeStorage: false
});
```

### Quick Configuration Fixes
```bash
# Temporarily disable validation in emergency
# Add to CI workflow:
# - name: Validate authentication configuration
#   run: npm run validate:auth-config
#   continue-on-error: true

# Force regenerate auth state
rm e2e/storageState.json e2e/storageState-debug.json
NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true npm run test:e2e -- --project=setup
```

## 📚 Related Documentation

- **Full Guide**: [Authentication Troubleshooting](./AUTHENTICATION_TROUBLESHOOTING.md)
- **CI Patterns**: [Authentication CI Patterns](../development/AUTHENTICATION_CI_PATTERNS.md)
- **Mock Strategy**: [E2E Mock Auth Strategy](./E2E_MOCK_AUTH_STRATEGY.md)
- **Testing Guidelines**: [Testing Guidelines](./TESTING_GUIDELINES.md)

## 🔍 Key File Locations

### Configuration Files
- `.github/workflows/ci.yml` - Main CI workflow
- `.github/workflows/e2e-tests.yml` - Dedicated E2E workflow  
- `.github/workflows/auth-monitoring.yml` - Authentication monitoring
- `.github/actions/auth-setup/action.yml` - Authentication setup composite action
- `.github/actions/auth-cleanup/action.yml` - Authentication cleanup composite action

### Scripts and Utilities
- `scripts/ci/validate-auth-configuration.js` - Configuration validation
- `scripts/check-auth-health.js` - Authentication endpoint health check
- `scripts/ci/validate-auth-tokens.js` - Context-aware JWT token and authentication validation
  - Usage: `node scripts/ci/validate-auth-tokens.js <url> <timeout> [context]`
  - Contexts: `build`, `e2e`, `monitoring`, `local`, `auto` (default)
- `scripts/ci/verify-nextauth-initialization.js` - NextAuth initialization verification

### Test Helpers
- `e2e/helpers/authVerification.ts` - Authentication verification methods
- `e2e/helpers/authDebug.ts` - Debugging utilities
- `e2e/helpers/adaptiveTiming.ts` - Timing optimization
- `e2e/helpers/authErrorReporting.ts` - Error analysis and reporting

### Artifacts and Results
- `ci-metrics/auth-config-validation.json` - Configuration validation results
- `ci-metrics/auth-token-validation.json` - Token validation results  
- `ci-metrics/auth-health-latest.json` - Health monitoring results
- `e2e/storageState.json` - Authentication storage state
- `e2e/storageState-debug.json` - Debug storage state (CI only)
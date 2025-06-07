# Authentication CI Patterns

This document describes the standardized authentication setup patterns for CI workflows in GitPulse.

## Overview

Authentication setup across CI workflows has been standardized using composite actions that provide consistent:

- Environment variable configuration
- Server startup and health checks
- Authentication validation (optional)
- Cleanup procedures
- Configuration drift detection

## Composite Actions

### Location
- Setup: `.github/actions/auth-setup/action.yml`
- Cleanup: `.github/actions/auth-cleanup/action.yml`

### Usage Pattern

```yaml
steps:
  - name: Setup Authentication Environment
    id: auth-setup
    uses: ./.github/actions/auth-setup
    with:
      auth_context: "e2e"                    # Required: e2e, monitoring, ci
      server_timeout: 120000                 # Optional: default 120000ms
      health_check_timeout: 30000           # Optional: default 30000ms
      enable_validation: true               # Optional: default false
      port_cleanup: true                    # Optional: default true

  # Your test steps here - server available at http://localhost:3000

  - name: Cleanup Authentication Environment
    if: always()
    uses: ./.github/actions/auth-cleanup
    with:
      server_pid: ${{ steps.auth-setup.outputs.server_pid }}
      auth_context: "e2e"
```

## Authentication Contexts

### `e2e` Context
- **Purpose**: End-to-end testing
- **Secret**: `playwright-test-secret-key`
- **Use case**: Playwright tests, browser automation

### `monitoring` Context  
- **Purpose**: Authentication health monitoring
- **Secret**: `monitoring-secret-key`
- **Use case**: Scheduled health checks, alerting

### `ci` Context
- **Purpose**: Main CI pipeline
- **Secret**: `ci-test-secret-key`  
- **Use case**: Build and test workflows with authentication

## Configuration Validation

All workflows automatically validate authentication configuration consistency:

```yaml
- name: Validate authentication configuration
  run: npm run validate:auth-config
  # Ensures authentication setup is consistent across all CI workflows
```

This validation performs:
- ✅ Checks that all authentication workflows use composite actions consistently
- ✅ Validates required environment variables are defined
- ✅ Detects configuration drift between workflows  
- ✅ Ensures authentication readiness across all contexts
- ⚠️ Allows expected differences (e.g., NODE_ENV varies by workflow purpose)

**Local validation**: `npm run validate:auth-config`

**Results**: Saved to `ci-metrics/auth-config-validation.json`

## Environment Variables

The composite actions automatically configure:

```yaml
NODE_ENV: test                              # Or production for build contexts
E2E_MOCK_AUTH_ENABLED: true
NEXTAUTH_URL: http://localhost:3000
NEXT_PUBLIC_GITHUB_APP_NAME: pulse-summarizer
NEXTAUTH_SECRET: [context-specific]
GITHUB_OAUTH_CLIENT_ID: mock-client-id
GITHUB_OAUTH_CLIENT_SECRET: mock-client-secret
```

## Configuration Options

### `server_timeout`
- **Type**: Number (milliseconds)
- **Default**: 120000 (2 minutes)
- **Purpose**: How long to wait for server startup

### `health_check_timeout`
- **Type**: Number (milliseconds)  
- **Default**: 30000 (30 seconds)
- **Purpose**: Authentication endpoint health check timeout

### `enable_validation`
- **Type**: Boolean
- **Default**: false
- **Purpose**: Enable comprehensive authentication validation
- **Includes**:
  - JWT token structure validation
  - Session API response verification
  - Authentication flow validation

### `port_cleanup`
- **Type**: Boolean
- **Default**: true
- **Purpose**: Clean up port 3000 before server startup

## Workflow Integration Examples

### Simple E2E Testing

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Validate authentication configuration
        run: npm run validate:auth-config
      
      - name: Setup Authentication Environment
        id: auth-setup
        uses: ./.github/actions/auth-setup
        with:
          auth_context: "e2e"
          
      - name: Run Playwright tests
        run: npm run test:e2e
        
      - name: Cleanup Authentication Environment
        if: always()
        uses: ./.github/actions/auth-cleanup
        with:
          server_pid: ${{ steps.auth-setup.outputs.server_pid }}
          auth_context: "e2e"
```

### CI with Validation

```yaml
name: CI

on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Validate authentication configuration
        run: npm run validate:auth-config
        
      - name: Build
        run: npm run build
        
      - name: Setup Authentication Environment
        id: auth-setup
        uses: ./.github/actions/auth-setup
        with:
          auth_context: "ci"
          enable_validation: true
          
      - name: Run tests
        run: npm test
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Cleanup Authentication Environment
        if: always()
        uses: ./.github/actions/auth-cleanup
        with:
          server_pid: ${{ steps.auth-setup.outputs.server_pid }}
          auth_context: "ci"
```

### Monitoring Workflow

```yaml
name: Auth Monitoring

on:
  schedule:
    - cron: '0 */6 * * *'

jobs:
  monitor-authentication:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Validate authentication configuration
        run: npm run validate:auth-config
        
      - name: Setup Authentication Environment
        id: auth-setup
        uses: ./.github/actions/auth-setup
        with:
          auth_context: "monitoring"
          health_check_timeout: 60000
          
      - name: Run monitoring script
        run: node scripts/ci/monitor-auth-health.js
        
      - name: Cleanup Authentication Environment
        if: always()
        uses: ./.github/actions/auth-cleanup
        with:
          server_pid: ${{ steps.auth-setup.outputs.server_pid }}
          auth_context: "monitoring"
```

## Server Lifecycle

### Startup
1. Port cleanup (if enabled)
2. Environment variable setup
3. Development server start with authentication config
4. Health check verification
5. Optional comprehensive validation

### Runtime
- Server runs at `http://localhost:3000`
- All NextAuth endpoints available
- Mock authentication configured

### Cleanup
- Automatic server termination
- Log artifact upload
- Resource cleanup

## Artifacts

Workflows using authentication composite actions upload:

- **Authentication Configuration Validation**: `auth-config-validation-results`
  - Configuration drift analysis
  - Environment variable validation
  - Composite action usage verification

- **Server Logs**: Located in workflow artifacts
  - Complete server output
  - Authentication validation metrics
  - Health check results

## Migration Guide

### From Inline Authentication Setup

**Before:**
```yaml
steps:
  - name: Start server
    run: |
      NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true npm run dev &
      node scripts/wait-for-server.js http://localhost:3000
      
  - name: Kill server
    if: always()
    run: killall node || true
```

**After:**
```yaml
steps:
  - name: Validate authentication configuration
    run: npm run validate:auth-config
    
  - name: Setup Authentication Environment
    id: auth-setup
    uses: ./.github/actions/auth-setup
    with:
      auth_context: "e2e"
      
  # Your test steps here
      
  - name: Cleanup Authentication Environment
    if: always()
    uses: ./.github/actions/auth-cleanup
    with:
      server_pid: ${{ steps.auth-setup.outputs.server_pid }}
      auth_context: "e2e"
```

### Benefits of Migration

1. **Consistency**: Same authentication setup across all workflows
2. **Maintainability**: Single source of truth for auth configuration
3. **Debugging**: Standardized logging and artifact collection
4. **Reliability**: Consistent health checks and validation
5. **Flexibility**: Configurable timeouts and validation levels
6. **Configuration Validation**: Automatic detection of configuration drift
7. **Alerting**: Integration with monitoring workflows for issue detection

## Troubleshooting

### Configuration Issues

1. **Configuration drift detected**
   - Run `npm run validate:auth-config` locally
   - Review authentication configuration validation results
   - Ensure environment variables match across workflows
   - Check composite action usage consistency

2. **Authentication configuration validation fails**
   - Check that required environment variables are defined
   - Verify composite actions are being used in authentication workflows
   - Review validation artifacts for specific error details

### Runtime Issues

1. **Server startup timeout**
   - Increase `server_timeout`
   - Check server logs in artifacts

2. **Authentication endpoint failures**
   - Enable validation with `enable_validation: true`
   - Review authentication health check logs

3. **Port conflicts**
   - Ensure `port_cleanup: true` (default)
   - Check for other services using port 3000

### Debug Mode

Enable verbose logging by adding environment variables to your job:

```yaml
env:
  DEBUG: "pw:api,pw:browser*"
  PWDEBUG: console
```

## Best Practices

1. **Use appropriate context** for your workflow type (e2e, ci, monitoring)
2. **Enable validation** for critical workflows with `enable_validation: true`
3. **Set appropriate timeouts** based on your CI environment performance
4. **Review artifacts** when debugging authentication issues
5. **Follow cleanup** patterns to prevent resource leaks
6. **Run configuration validation** locally before committing: `npm run validate:auth-config`
7. **Monitor alerts** from authentication monitoring workflow for configuration drift
8. **Always use composite actions** for authentication setup (no inline configuration)

## Related Documentation

- [Authentication Troubleshooting](../testing/AUTHENTICATION_TROUBLESHOOTING.md)
- [CI Workflow Alignment](./CI_WORKFLOW_ALIGNMENT.md)
- [E2E Testing Guide](../testing/README.md)
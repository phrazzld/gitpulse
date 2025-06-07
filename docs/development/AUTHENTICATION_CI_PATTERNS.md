# Authentication CI Patterns

This document describes the standardized authentication setup patterns for CI workflows in GitPulse.

## Overview

Authentication setup across CI workflows has been standardized using a shared workflow component (`auth-shared.yml`) that provides consistent:

- Environment variable configuration
- Server startup and health checks
- Authentication validation (optional)
- Cleanup procedures

## Shared Authentication Component

### Location
`.github/workflows/auth-shared.yml`

### Usage Pattern

```yaml
jobs:
  setup-authentication:
    uses: ./.github/workflows/auth-shared.yml
    with:
      auth_context: "e2e"                    # Required: e2e, monitoring, ci
      server_timeout: 120000                 # Optional: default 120000ms
      health_check_timeout: 30000           # Optional: default 30000ms
      enable_validation: true               # Optional: default false
      port_cleanup: true                    # Optional: default true

  your-job:
    needs: setup-authentication
    runs-on: ubuntu-latest
    steps:
      - name: Your test steps
        run: |
          # Server is available at http://localhost:3000
          # Authentication is configured and ready
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

## Environment Variables

The shared component automatically configures:

```yaml
NODE_ENV: test
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
    uses: ./.github/workflows/auth-shared.yml
    with:
      auth_context: "e2e"
      
  run-tests:
    needs: e2e-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Playwright tests
        run: npm run test:e2e
```

### CI with Validation

```yaml
name: CI

on: [push, pull_request]

jobs:
  auth-setup:
    uses: ./.github/workflows/auth-shared.yml
    with:
      auth_context: "ci"
      enable_validation: true
      
  build-and-test:
    needs: auth-setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
      - name: Run E2E tests
        run: npm run test:e2e
```

### Monitoring Workflow

```yaml
name: Auth Monitoring

on:
  schedule:
    - cron: '0 */6 * * *'

jobs:
  monitor:
    uses: ./.github/workflows/auth-shared.yml
    with:
      auth_context: "monitoring"
      health_check_timeout: 60000
      
  collect-metrics:
    needs: monitor
    runs-on: ubuntu-latest
    steps:
      - name: Run monitoring script
        run: node scripts/ci/monitor-auth-health.js
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

The shared component uploads:

- **Setup Artifacts**: `auth-setup-{context}-{run_id}`
  - Server logs
  - Validation metrics (if enabled)
  - Server PID file

- **Server Logs**: `auth-server-logs-{context}-{run_id}`
  - Complete server output
  - Error logs

## Migration Guide

### From Inline Authentication Setup

**Before:**
```yaml
steps:
  - name: Start server
    run: |
      NODE_ENV=test E2E_MOCK_AUTH_ENABLED=true npm run dev &
      node scripts/wait-for-server.js http://localhost:3000
```

**After:**
```yaml
jobs:
  auth-setup:
    uses: ./.github/workflows/auth-shared.yml
    with:
      auth_context: "e2e"
      
  your-job:
    needs: auth-setup
    # ... rest of your job
```

### Benefits of Migration

1. **Consistency**: Same authentication setup across all workflows
2. **Maintainability**: Single source of truth for auth configuration
3. **Debugging**: Standardized logging and artifact collection
4. **Reliability**: Consistent health checks and validation
5. **Flexibility**: Configurable timeouts and validation levels

## Troubleshooting

### Common Issues

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

1. **Use appropriate context** for your workflow type
2. **Enable validation** for critical workflows
3. **Set appropriate timeouts** based on your CI environment
4. **Review artifacts** when debugging authentication issues
5. **Follow cleanup** patterns to prevent resource leaks

## Related Documentation

- [Authentication Troubleshooting](../testing/AUTHENTICATION_TROUBLESHOOTING.md)
- [CI Workflow Alignment](./CI_WORKFLOW_ALIGNMENT.md)
- [E2E Testing Guide](../testing/README.md)
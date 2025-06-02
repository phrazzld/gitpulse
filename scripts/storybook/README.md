# Storybook CI Scripts

This directory contains scripts to ensure reliable Storybook server startup and accessibility testing in CI environments.

## Problem

The Storybook accessibility tests were failing in CI with "Process exit code 1" during server startup, while working correctly in local environments. The root causes included:
- Server startup race conditions
- Port binding issues in CI containers
- Insufficient error reporting
- Resource constraints affecting startup time

## Solution

We've implemented a robust CI runner with the following features:

### 1. Enhanced Server Diagnostics (`debug-ci-server.js`)
- Checks port availability before starting
- Monitors server health endpoints
- Provides detailed startup progress logging
- Captures and reports startup errors

### 2. Server with Retry Logic (`start-server-with-retry.js`)
- Automatic retry on startup failure (up to 3 attempts)
- Port conflict resolution (tries alternative ports)
- Proper process cleanup on failure
- Health endpoint verification before declaring ready

### 3. CI Test Runner (`run-a11y-tests-ci.js`)
- Orchestrates server startup and test execution
- Waits for server readiness with configurable timeout
- Enhanced error reporting and logging
- Generates detailed test reports
- Ensures proper cleanup regardless of test outcome

## Usage

### In CI Workflows

The scripts are automatically used by our GitHub Actions workflows:

```yaml
- name: Run Accessibility Tests with Enhanced CI Runner
  run: node scripts/storybook/run-a11y-tests-ci.js
  env:
    CI: true
    A11Y_FAILING_IMPACTS: 'critical,serious'
```

### Local Testing

To test the CI setup locally:

```bash
# Build Storybook first
npm run build-storybook

# Run the test script
./scripts/storybook/test-ci-setup.sh
```

### Manual Debugging

For detailed server diagnostics:

```bash
# Check server startup with diagnostics
node scripts/storybook/debug-ci-server.js

# Test server with retry logic
node scripts/storybook/start-server-with-retry.js --keep-alive

# Run full CI test suite
CI=true node scripts/storybook/run-a11y-tests-ci.js
```

## Configuration

### Environment Variables

- `CI`: Set to 'true' to enable CI mode
- `A11Y_FAILING_IMPACTS`: Comma-separated list of impact levels that cause test failure (default: 'critical,serious')
- `DEBUG`: Set to 'true' for verbose logging
- `DEBUG_CI`: Set to 'true' to enable server diagnostics in CI

### Script Options

**debug-ci-server.js**
- `--keep-alive`: Keep server running after startup check

**start-server-with-retry.js**
- `--port=<number>`: Preferred port (default: 6006)
- `--dir=<path>`: Directory to serve (default: storybook-static)
- `--retries=<number>`: Max retry attempts (default: 3)
- `--timeout=<ms>`: Health check timeout (default: 30000)
- `--keep-alive`: Keep server running after startup

## Troubleshooting

### Server Fails to Start

1. Check the log files in `test-logs/` directory
2. Run `debug-ci-server.js` for detailed diagnostics
3. Verify `storybook-static` directory exists and contains valid files
4. Check for port conflicts (default port 6006)

### Tests Timeout

1. Increase timeout in `run-a11y-tests-ci.js` (TEST_TIMEOUT constant)
2. Check server health endpoints are responding
3. Verify stories.json is being generated correctly

### False Positive Failures

1. Check if actual accessibility violations exist
2. Review `A11Y_FAILING_IMPACTS` configuration
3. Check test-results/a11y-summary.md for details

## Monitoring

The scripts generate several artifacts for debugging:

- `test-logs/storybook-server-*.log`: Server startup logs
- `test-logs/a11y-test-output.log`: Test execution logs
- `test-results/a11y-test-report.json`: Structured test report
- `test-results/a11y-summary.md`: Human-readable summary
- `test-results/a11y-error-report.json`: Error details (if failed)

## Future Improvements

1. Add metrics collection for server startup time
2. Implement configurable retry strategies
3. Add support for parallel test execution
4. Create performance benchmarks for CI runs
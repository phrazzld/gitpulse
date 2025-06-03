# Storybook CI Testing Guide

This document provides comprehensive guidance for understanding, troubleshooting, and debugging Storybook accessibility testing in CI environments. It complements the main [STORYBOOK.md](./STORYBOOK.md) documentation by focusing specifically on CI-related challenges and solutions.

## Table of Contents

- [1. CI vs Local Environment Differences](#1-ci-vs-local-environment-differences)
- [2. Common CI Issues and Solutions](#2-common-ci-issues-and-solutions)
- [3. Debugging Procedures](#3-debugging-procedures)
- [4. CI Configuration Reference](#4-ci-configuration-reference)
- [5. Emergency Procedures](#5-emergency-procedures)

## 1. CI vs Local Environment Differences

Understanding the differences between local and CI environments is crucial for effective troubleshooting and test development.

### 1.1 Environment Constraints

**Resource Limitations**
- **Memory**: CI runners have limited memory allocation (typically 7GB on GitHub Actions)
- **CPU**: Shared CPU resources may cause timing-sensitive operations to behave differently
- **Disk I/O**: Network-attached storage may introduce latency not present locally
- **Network**: External dependencies may have different performance characteristics

**Process Management**
- **Port Allocation**: CI environments handle port management differently than local development
- **Process Cleanup**: Zombie processes can accumulate in CI without manual intervention
- **Signal Handling**: Process termination behavior differs between local shells and CI runners

### 1.2 Configuration Differences

**Environment Variables**
```bash
# CI-specific variables automatically set
CI=true
GITHUB_ACTIONS=true
RUNNER_OS=Linux

# Project-specific CI configuration
A11Y_ENHANCED_REPORTING=true
DEBUG=true
NODE_PATH=./node_modules
```

**Timeouts and Retries**
- **Local**: Conservative timeouts for developer experience
- **CI**: Extended timeouts (10+ minutes) to account for resource constraints
- **Retry Logic**: CI implements automatic retries for network operations

**Browser Configuration**
```javascript
// CI browser configuration (headless)
args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']

// Local browser configuration (optional headful mode)
args: [] // Minimal restrictions for development
```

### 1.3 Why These Differences Matter

**Server Startup Timing**
- Local development benefits from warm caches and dedicated resources
- CI requires cold starts and competes for shared resources
- **Solution**: Enhanced retry logic and health checks in `scripts/storybook/start-server-with-retry.js`

**Test Execution**
- Local tests run against stable, dedicated browser instances
- CI tests must handle browser lifecycle management and resource contention
- **Solution**: Robust cleanup procedures and timeout protection

**Error Reporting**
- Local errors can be debugged interactively with full system access
- CI errors require comprehensive logging and artifact collection
- **Solution**: Enhanced logging in `scripts/storybook/run-a11y-tests-ci.js`

## 2. Common CI Issues and Solutions

### 2.1 Server Startup Failures

**Symptoms**
- Tests exit with code 1 during "Start Storybook server and run tests"
- Logs show port binding errors or timeout messages
- Missing `storybook-static/index.html` or `storybook-static/index.json`

**Root Causes**
- Port conflicts from previous test runs
- Storybook build artifacts corrupted or missing
- Resource exhaustion during server startup
- Race conditions in server initialization

**Solutions**
```bash
# Automated in CI workflow
npm run build-storybook    # Ensure fresh build
node scripts/storybook/run-a11y-tests-ci.js  # Enhanced startup with retries
```

**Prevention**
- Always verify build artifacts before starting server
- Implement health checks with appropriate timeouts
- Use unique ports or proper cleanup between runs

### 2.2 Accessibility Test Failures

**Symptoms**
- Tests report accessibility violations that don't occur locally
- Timeout errors during test execution
- Inconsistent results between test runs

**Root Causes**
- Color contrast calculations differ between environments
- Font rendering variations affecting measurements
- Timing-dependent content not fully loaded during testing
- Browser rendering engine differences

**Solutions**
```bash
# Local reproduction
npm run check:a11y:all  # Run full accessibility test suite locally
npm run build-storybook && npx test-storybook  # Test against static build
```

**Investigation Steps**
1. Check `test-results/junit.xml` for specific violation details
2. Compare local and CI color contrast calculations
3. Verify component rendering timing and loading states
4. Review accessibility configuration in `.storybook/test-runner.js`

### 2.3 Coverage JSON Format Issues

**Symptoms**
- CI reports malformed coverage JSON with leading commas
- Coverage parsing failures in CI pipeline
- Tests pass but coverage reports fail

**Root Causes**
- Jest coverage output format inconsistencies
- File system timing issues during coverage generation
- Incomplete coverage file writes

**Solutions**
```bash
# Local validation
npm run validate:coverage  # Check coverage file format
npm test -- --coverage    # Regenerate coverage files
```

**Prevention**
- Use coverage format validation in development workflow
- Implement coverage file validation in CI before processing
- Refer to `scripts/coverage/validate-coverage-format.js` for details

### 2.4 Dependency and Version Conflicts

**Symptoms**
- `Cannot read properties of undefined (reading 'storyStore')` errors
- Version mismatch warnings during installation
- Tests that pass locally but fail in CI

**Root Causes**
- Storybook version incompatibilities with test runner
- Package lock file synchronization issues
- Node.js version differences between local and CI

**Solutions**
```bash
# Verify versions locally
npm ls @storybook/test-runner
npm ls @storybook/react
node --version  # Should match CI version (Node 22)

# Fix common issues
npm ci  # Clean install matching package-lock.json
npm update @storybook/test-runner  # Update to compatible version
```

## 3. Debugging Procedures

### 3.1 Initial Diagnosis

**Step 1: Identify the Failure Point**
```bash
# Check CI logs for specific error location
# Common failure points:
# 1. Dependency installation
# 2. Storybook build
# 3. Server startup
# 4. Test execution
```

**Step 2: Collect Diagnostic Information**
```bash
# Available artifacts (uploaded automatically)
test-logs/a11y-test-output.log      # Test execution logs
test-logs/storybook-server-*.log    # Server startup logs
test-results/a11y-test-report.json  # Structured test results
test-results/junit.xml              # Detailed violation reports
```

**Step 3: Determine Environment Factors**
- Check if the issue is CI-specific by reproducing locally
- Verify Node.js version matches CI environment (Node 22)
- Ensure package-lock.json is synchronized

### 3.2 Server Startup Debugging

**Enable Debug Mode**
```bash
# In CI workflow (manual trigger)
workflow_dispatch -> debug: true

# Local debugging
DEBUG_CI=true node scripts/storybook/run-a11y-tests-ci.js
```

**Debug Output Analysis**
```bash
# Server startup diagnostics
node scripts/storybook/debug-ci-server.js

# Expected outputs:
# ✅ Server ready at http://localhost:6006
# ✅ Health check passed
# ✅ Stories loaded: X stories found
```

**Common Server Issues**
- **Port conflicts**: Look for "EADDRINUSE" errors in logs
- **Build corruption**: Verify `storybook-static/index.html` exists and contains valid HTML
- **Resource exhaustion**: Check for memory or timeout-related errors

### 3.3 Test Execution Debugging

**Identify Specific Failing Stories**
```bash
# Parse junit.xml for detailed violation information
grep -A 10 -B 5 "accessibility violation" test-results/junit.xml

# Common violation patterns:
# - Color contrast failures
# - Missing ARIA labels
# - Invalid HTML structure
```

**Reproduce Locally**
```bash
# Test specific stories
npx test-storybook --stories="**/Button.stories.*"

# Test with CI-like conditions
NODE_ENV=production npm run build-storybook
npx test-storybook --url=http://localhost:6006
```

**Compare Local vs CI Results**
1. Run identical tests locally against static build
2. Check for environment-specific CSS or rendering differences
3. Verify accessibility configuration matches between environments

### 3.4 Log Analysis Techniques

**Server Logs Pattern Recognition**
```bash
# Successful startup pattern
[INFO] Server started successfully
[INFO] Health check passed
[INFO] Stories loaded: N stories

# Failure patterns
[ERROR] Port 6006 already in use
[ERROR] Build artifacts not found
[ERROR] Health check timeout
```

**Test Execution Logs**
```bash
# Success indicators
✅ All accessibility tests passed
📊 Test summary: X passed, 0 failed

# Failure indicators
❌ X accessibility violations detected
⚠️ Tests completed with exit code 1
```

## 4. CI Configuration Reference

### 4.1 Key Configuration Files

**Workflow Configuration**
- `.github/workflows/storybook-a11y.yml` - Main CI workflow
- `.github/workflows/debug-storybook.yml` - Debug workflow for troubleshooting

**Test Configuration**
- `.storybook/test-runner.js` - Test runner configuration with accessibility rules
- `scripts/storybook/run-a11y-tests-ci.js` - Enhanced CI test runner
- `scripts/storybook/start-server-with-retry.js` - Robust server startup

**Build Configuration**
- `.storybook/main.ts` - Storybook build configuration
- `package.json` - Dependencies and script definitions

### 4.2 Environment Variables

**CI Detection**
```bash
CI=true                    # Standard CI environment indicator
GITHUB_ACTIONS=true        # GitHub Actions specific
```

**Test Configuration**
```bash
A11Y_ENHANCED_REPORTING=true     # Enable detailed violation reporting
DEBUG=true                       # Verbose logging output
A11Y_FAILING_IMPACTS=critical,serious  # Violation severity levels
```

**Performance Tuning**
```bash
NODE_PATH=./node_modules    # Explicit module resolution
TEST_TIMEOUT=30000          # Test timeout in milliseconds
```

### 4.3 Timeout Configuration

**Component-Level Timeouts**
```javascript
// In workflow
timeout-minutes: 15  // Overall job timeout
timeout-minutes: 10  // Storybook build timeout
timeout-minutes: 12  // Test execution timeout

// In scripts
TEST_TIMEOUT = 600000  // 10 minutes for CI test execution
HEALTH_CHECK_TIMEOUT = 45000  // 45 seconds for server health check
```

## 5. Emergency Procedures

### 5.1 Critical CI Failures

**If All Tests Are Failing**
1. Check for recent dependency updates that may have introduced breaking changes
2. Verify Storybook build process completes successfully
3. Compare package-lock.json with last known working state
4. Roll back to previous working commit if necessary

**If Server Won't Start**
1. Enable debug mode: Set `DEBUG_CI=true` in workflow
2. Check for port conflicts or resource exhaustion
3. Verify build artifacts: `storybook-static/index.html` and `storybook-static/index.json`
4. Use manual workflow dispatch with debug enabled

### 5.2 Bypassing CI for Urgent Fixes

**Temporary Skip Options**
```bash
# Skip accessibility checks (emergency only)
A11Y_SKIP=1 npm run check:a11y:staged

# Modify workflow paths to avoid triggering
# (Edit .github/workflows/storybook-a11y.yml paths section)
```

**When to Use Emergency Procedures**
- Critical production fixes needed immediately
- Known accessibility issues being addressed separately
- Infrastructure problems preventing normal CI operation

**Recovery Steps**
1. Address the root cause of the CI failure
2. Remove any emergency bypass configurations
3. Verify all tests pass before re-enabling normal CI flow
4. Document the incident and prevention measures

### 5.3 Getting Help

**Information to Collect**
- CI run URL and timestamp
- Error messages from logs
- Local reproduction steps attempted
- Recent changes that may have triggered the issue

**Escalation Path**
1. Check this documentation for known issues and solutions
2. Review recent commits for changes to Storybook or test configuration
3. Examine artifacts from failed CI runs
4. Use debug mode to gather additional diagnostic information

**Documentation Updates**
When new issues are discovered and resolved:
1. Document the issue and solution in this guide
2. Update troubleshooting procedures if necessary
3. Consider automating the solution if it's a common problem

---

## Related Documentation

- [STORYBOOK.md](./STORYBOOK.md) - Complete Storybook usage standards
- [ACCESSIBILITY_CI_SETUP.md](../accessibility/ACCESSIBILITY_CI_SETUP.md) - Accessibility testing configuration
- [STORYBOOK_BUILD_OPTIMIZATION.md](./STORYBOOK_BUILD_OPTIMIZATION.md) - Build performance optimization

For questions or issues not covered in this guide, refer to the project's issue tracker or reach out to the development team with the diagnostic information outlined in section 5.3.
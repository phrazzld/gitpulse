#!/bin/bash

# Test CI Setup Locally
# This script simulates the CI environment to test our Storybook accessibility setup

echo "🧪 Testing CI Setup Locally"
echo "=========================="
echo ""

# Set CI environment variables
export CI=true
export A11Y_FAILING_IMPACTS='critical,serious'
export SKIP_A11Y_FAILURES=false
export DEBUG=true

# Check if Storybook is built
if [ ! -d "storybook-static" ]; then
    echo "❌ Error: storybook-static directory not found"
    echo "Please run 'npm run build-storybook' first"
    exit 1
fi

# Test 1: Server startup diagnostics
echo "Test 1: Server Startup Diagnostics"
echo "---------------------------------"
node scripts/storybook/debug-ci-server.js
SERVER_DIAG_EXIT=$?
echo "Exit code: $SERVER_DIAG_EXIT"
echo ""

# Test 2: Server with retry logic
echo "Test 2: Server with Retry Logic"
echo "------------------------------"
timeout 30s node scripts/storybook/start-server-with-retry.js
SERVER_RETRY_EXIT=$?
echo "Exit code: $SERVER_RETRY_EXIT"
echo ""

# Test 3: Full CI runner (if previous tests passed)
if [ $SERVER_DIAG_EXIT -eq 0 ] && [ $SERVER_RETRY_EXIT -eq 0 ]; then
    echo "Test 3: Full CI Runner"
    echo "---------------------"
    node scripts/storybook/run-a11y-tests-ci.js
    CI_RUNNER_EXIT=$?
    echo "Exit code: $CI_RUNNER_EXIT"
else
    echo "⚠️  Skipping full CI runner test due to previous failures"
    CI_RUNNER_EXIT=1
fi

echo ""
echo "Test Summary"
echo "============"
echo "Server Diagnostics: $([ $SERVER_DIAG_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Server with Retry:  $([ $SERVER_RETRY_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"
echo "Full CI Runner:     $([ $CI_RUNNER_EXIT -eq 0 ] && echo '✅ PASS' || echo '❌ FAIL')"

# Check for log files
echo ""
echo "Log Files Generated:"
echo "-------------------"
ls -la test-logs/ 2>/dev/null || echo "No log files found"

# Exit with failure if any test failed
if [ $SERVER_DIAG_EXIT -ne 0 ] || [ $SERVER_RETRY_EXIT -ne 0 ] || [ $CI_RUNNER_EXIT -ne 0 ]; then
    exit 1
fi

echo ""
echo "✅ All tests passed!"
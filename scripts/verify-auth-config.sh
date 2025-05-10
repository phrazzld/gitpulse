#!/bin/bash
# This script verifies that the Playwright authentication configuration is working correctly

# Set environment variables for testing
export NODE_ENV=test
export E2E_MOCK_AUTH_ENABLED=true

echo "Verifying authentication configuration..."
echo "-------------------------------------------"

# Run the simple authentication verification test
npx playwright test e2e/auth-verification.spec.ts --project=chromium

# Check the exit code
if [ $? -eq 0 ]; then
  echo "-------------------------------------------"
  echo "✅ Authentication configuration is working correctly!"
  echo "Cookie is properly set and the configuration is valid."
  echo "You can now mark T030 as completed in the TODO.md file."
  exit 0
else
  echo "-------------------------------------------"
  echo "❌ Authentication test failed. Check the test output for details."
  exit 1
fi
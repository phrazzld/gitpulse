#!/bin/bash

# Simulate CI Environment for Local Testing
# This script helps reproduce CI conditions locally

set -e

echo "🚀 Simulating CI Environment"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
DEBUG_MODE=false
CLEAN_BUILD=false
MEMORY_LIMIT=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --debug) DEBUG_MODE=true ;;
        --clean) CLEAN_BUILD=true ;;
        --memory=*) MEMORY_LIMIT="${1#*=}" ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --debug       Enable debug mode"
            echo "  --clean       Clean build before running"
            echo "  --memory=SIZE Set memory limit (e.g., 2048)"
            echo "  --help        Show this help"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check command existence
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_status $RED "❌ $1 is not installed"
        return 1
    else
        print_status $GREEN "✅ $1 is available"
        return 0
    fi
}

echo "1️⃣  Checking prerequisites..."
echo "=============================="

# Check required commands
MISSING_DEPS=false
for cmd in node npm npx; do
    if ! check_command $cmd; then
        MISSING_DEPS=true
    fi
done

if [ "$MISSING_DEPS" = true ]; then
    print_status $RED "Missing dependencies. Please install required tools."
    exit 1
fi

echo ""
echo "2️⃣  Setting up CI environment variables..."
echo "==========================================="

# Set CI environment variables
export CI=true
export NODE_ENV=test
export FORCE_COLOR=0
export GITHUB_ACTIONS=true
export RUNNER_OS=Linux
export RUNNER_TEMP=/tmp
export A11Y_FAILING_IMPACTS='critical,serious'

# Set memory limit if specified
if [ -n "$MEMORY_LIMIT" ]; then
    export NODE_OPTIONS="--max-old-space-size=$MEMORY_LIMIT"
    print_status $YELLOW "Memory limit set to ${MEMORY_LIMIT}MB"
fi

# Enable debug mode if requested
if [ "$DEBUG_MODE" = true ]; then
    export DEBUG=true
    export DEBUG_CI=true
    export DEBUG_LEVEL=verbose
    print_status $YELLOW "Debug mode enabled"
fi

# Display environment
echo "Environment variables set:"
env | grep -E "CI|NODE|DEBUG|A11Y|GITHUB|RUNNER" | sort | while read line; do
    echo "  $line"
done

echo ""
echo "3️⃣  Preparing workspace..."
echo "=========================="

# Clean build if requested
if [ "$CLEAN_BUILD" = true ]; then
    print_status $YELLOW "Cleaning previous builds..."
    rm -rf storybook-static test-logs test-results
    rm -rf node_modules/.cache
fi

# Create required directories
mkdir -p test-logs test-results

echo ""
echo "4️⃣  Installing dependencies..."
echo "=============================="

# Use npm ci for deterministic installs (like CI)
if [ ! -d "node_modules" ] || [ "$CLEAN_BUILD" = true ]; then
    print_status $BLUE "Running npm ci..."
    npm ci
else
    print_status $GREEN "Dependencies already installed"
fi

echo ""
echo "5️⃣  Building Storybook..."
echo "========================="

# Build Storybook if not exists or clean build requested
if [ ! -d "storybook-static" ] || [ "$CLEAN_BUILD" = true ]; then
    print_status $BLUE "Building Storybook..."
    npm run build-storybook
else
    print_status $GREEN "Storybook build already exists"
fi

# Verify build
if [ ! -f "storybook-static/index.html" ]; then
    print_status $RED "❌ Storybook build failed!"
    exit 1
fi

echo ""
echo "6️⃣  Running CI condition checks..."
echo "=================================="

node scripts/storybook/test-ci-conditions.js

echo ""
echo "7️⃣  Starting accessibility tests..."
echo "==================================="

# Create a test log file
TEST_LOG="test-logs/ci-simulation-$(date +%Y%m%d-%H%M%S).log"

print_status $BLUE "Running tests (output: $TEST_LOG)..."

# Run the CI test runner
node scripts/storybook/run-a11y-tests-ci.js 2>&1 | tee "$TEST_LOG"

# Capture exit code
TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo "8️⃣  Test Results"
echo "================"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_status $GREEN "✅ Tests passed!"
else
    print_status $RED "❌ Tests failed with exit code: $TEST_EXIT_CODE"
    
    # Run diagnostics
    echo ""
    echo "Running diagnostics..."
    node scripts/storybook/diagnose-failure.js test-logs
fi

# Display artifacts
echo ""
echo "📦 Artifacts created:"
echo "===================="
ls -la test-logs/ 2>/dev/null | tail -n +2 || echo "No log files"
echo ""
ls -la test-results/ 2>/dev/null | tail -n +2 || echo "No result files"

# Cleanup CI environment variables
echo ""
echo "🧹 Cleaning up..."
unset CI NODE_ENV FORCE_COLOR GITHUB_ACTIONS RUNNER_OS RUNNER_TEMP

print_status $BLUE "CI simulation complete!"

exit $TEST_EXIT_CODE
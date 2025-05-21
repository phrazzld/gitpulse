#!/bin/bash

# Set testing environment variables
export GEMINI_API_KEY="test-api-key-for-testing-only"

# Run only API tests
npx jest src/app/api
# Plan for Task T006: Add Tests for Consistent API Error Handling

## Overview

This plan outlines the approach for adding tests to verify that all API routes correctly use the `withErrorHandling` higher-order function (HOF) and produce consistent error responses for different error types.

## Goals

1. Verify that all API routes (contributors, my-activity, my-org-activity, summary, team-activity) correctly handle and transform errors using the `withErrorHandling` HOF
2. Test specific GitHub error scenarios (auth errors, rate limit errors, not found errors, etc.)
3. Verify that each error type maps to the correct HTTP status code and response format
4. Ensure the tests follow the project's testing patterns and best practices

## Implementation Steps

### 1. Create Error Mocks

Create mock implementations for each GitHub error type in `api-test-utils.ts`:
- `GitHubAuthError`
- `GitHubRateLimitError`
- `GitHubNotFoundError`
- `GitHubApiError`
- `GitHubConfigError`
- Generic `GitHubError`
- Regular `Error` (for unexpected errors)

### 2. Enhance Test Utilities

Add utility functions to test-utils.ts to:
- Make it easier to throw specific errors from mocked functions
- Verify error response formats and status codes match expectations for each error type

### 3. Create Common Test Patterns

Develop reusable test patterns that can be applied to each API route:
- Test each error type for each API route
- Verify correct status codes, error messages, and response structure
- Ensure special error properties (e.g., resetAt for rate limit errors, signOutRequired for auth errors) are included

### 4. Implement Tests for Each API Route

For each route:
- Add test cases for each error type
- Ensure errors can originate from different parts of the request handling (auth, data fetching, etc.)
- Verify consistent behaviors across routes

### 5. Verify End-to-End Error Handling

Add tests that simulate errors at different points in the request flow:
- Authentication errors
- Repository fetching errors
- Commit fetching errors
- Other API errors

## Testing Approach

1. **Unit Tests**: Focus on isolated testing of the error handling functions in each route
2. **Mocking Strategy**: 
   - Mock GitHub API functions to throw specific error types
   - Use Jest spies to verify error handling logic
3. **Test Coverage**: Ensure all error types and routes are covered

## Implementation Details

### Create a new test file: `/src/__tests__/api/error-handling.test.ts`

This file will contain focused tests for error handling across all API routes, including:
- Tests for each error type in the `errors.ts` module
- Tests that verify the correct mapping of errors to HTTP status codes
- Tests that verify the correct format of error responses

### Add error handling tests to existing route test files

For each API route test file:
- Add specific tests for error scenarios
- Ensure these tests verify the consistent behavior implemented by `withErrorHandling`

### Key Error Types to Test

Based on `apiErrorHandler.ts`:

1. `GitHubConfigError` → 500 status, "GitHub App not properly configured"
2. `GitHubAuthError` → 403 status, various auth error messages, signOutRequired=true
3. `GitHubRateLimitError` → 429 status, "GitHub API rate limit exceeded", includes resetAt
4. `GitHubNotFoundError` → 404 status, "GitHub resource not found"
5. `GitHubApiError` → variable status, "GitHub API error occurred" 
6. Generic `GitHubError` → 500 status, "GitHub operation failed"
7. Regular `Error` → 500 status, "An error occurred"
8. Unknown error → 500 status, "An unexpected error occurred"

## Success Criteria

1. Tests for all API routes that specifically verify error handling
2. Coverage of all error types defined in `errors.ts`
3. Verification of consistent status codes and response formats
4. Handling of special error properties (resetAt, signOutRequired, etc.)
5. All tests pass after implementation
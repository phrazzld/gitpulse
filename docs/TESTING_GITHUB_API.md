# Testing GitHub API Interactions

This document outlines the challenges and best practices for testing code that interacts with the GitHub API in GitPulse.

## Challenges

1. **Complex External Dependencies**

   - The GitHub API interactions rely on multiple external packages (Octokit, auth-app, etc.)
   - These dependencies have complex internal structures that are difficult to mock properly

2. **Environment Variables**

   - GitHub authentication relies on environment variables that need to be properly mocked
   - Some variables contain sensitive information like private keys

3. **Token Authentication**

   - OAuth tokens and GitHub App installation tokens have different authentication flows
   - Both methods need to be tested independently

4. **Error Handling**
   - Network errors, authentication errors, and API errors need to be simulated
   - Each error path needs to be tested

## Current Testing Approach

For `src/lib/github/auth.ts`, we've implemented a simplified testing approach:

1. **Pure Functions**

   - Functions like `getInstallationManagementUrl` that don't have external dependencies are fully tested
   - They provide good examples of clean unit tests

2. **Simple Mocking**

   - For functions like `createOAuthOctokit`, we mock the Octokit constructor and verify it's called correctly
   - This tests the basic functionality without complex setup

3. **Basic Error Handling**
   - For functions like `getInstallationOctokit`, we test error cases by removing environment variables
   - This allows us to test certain error paths without complex mocking

## Recommendations for Future Improvements

1. **Improved Mocking Strategy**

   - Create more sophisticated mock factories for Octokit and auth-app
   - Design mocks that handle the full request/response cycle

2. **Testing Module Integration**

   - Consider integration tests that test multiple modules together
   - This can reduce the need for complex mocking

3. **Use Real API in Tests**

   - For critical paths, consider using the actual GitHub API with test tokens
   - This can be done in a dedicated test environment

4. **Better Error Simulation**
   - Create utilities for simulating different types of API errors
   - This will help test all error handling paths

## Code Example: Testing a GitHub API Function

```typescript
// Example of effectively mocking the GitHub API
it('handles API errors gracefully', async () => {
  // Mock API error with specific GitHub API error structure
  const mockError = {
    name: 'HttpError',
    status: 403,
    message: 'API rate limit exceeded',
    response: {
      headers: {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1599091200',
      },
    },
  }

  // Mock Octokit instance with method that rejects with the error
  const mockOctokitInstance = {
    rest: {
      apps: {
        listInstallationsForAuthenticatedUser: jest.fn().mockRejectedValue(mockError),
      },
    },
  }

  // Apply the mock implementation
  ;(Octokit as jest.MockedFunction<typeof Octokit>).mockImplementation(
    () => mockOctokitInstance as any
  )

  // Call the function
  const result = await getAllAppInstallations('test-token')

  // Verify the function handled the error correctly
  expect(result).toEqual([])
  expect(logger.error).toHaveBeenCalledWith(
    'github:auth',
    'Error getting GitHub App installations',
    { error: mockError }
  )
})
```

## Resources

1. [Jest Documentation on Mocking](https://jestjs.io/docs/mock-functions)
2. [Octokit Documentation](https://octokit.github.io/rest.js/v18/)
3. [GitHub API Documentation](https://docs.github.com/en/rest)

# API Error Handling Guide

## Overview

This guide documents the standardized approach to error handling in API routes for the GitPulse application. After our verification of existing error handling patterns, we've developed a consistent approach that all API routes should follow to ensure predictable behavior for clients.

## Error Response Format

All API error responses follow this standard format:

```typescript
interface ApiErrorResponse {
  error: string;        // Human-readable error message
  code: string;         // Machine-readable error code
  details?: string;     // More detailed error information
  signOutRequired?: boolean;  // Whether client should clear auth state
  needsInstallation?: boolean; // Whether GitHub App installation is required
  resetAt?: string;     // For rate limit errors, when the limit resets
}
```

## Error Handling Utilities

The `src/lib/auth/apiErrorHandler.ts` module provides utilities for standardized error handling:

1. **`createApiErrorResponse`** - Creates a standardized error response from any error type
2. **`withErrorHandling`** - Higher-order function to wrap route handlers with error handling
3. **`createApiSuccessResponse`** - Creates a standardized success response with caching options

## Error Types & Status Codes

| Error Type | Status Code | Error Code | Description |
|------------|-------------|------------|-------------|
| `GitHubConfigError` | 500 | `GITHUB_APP_CONFIG_ERROR` | Configuration issues (e.g., missing App credentials) |
| `GitHubAuthError` | 403 | `GITHUB_AUTH_ERROR` | Authentication/authorization failures |
| `GitHubAuthError` (scopes) | 403 | `GITHUB_SCOPE_ERROR` | Token missing required permission scopes |
| `GitHubRateLimitError` | 429 | `GITHUB_RATE_LIMIT_ERROR` | API rate limit exceeded |
| `GitHubNotFoundError` | 404 | `GITHUB_NOT_FOUND_ERROR` | Requested resource not found |
| `GitHubApiError` | varies | `GITHUB_API_ERROR` | Other GitHub API errors |
| `Error` | 500 | `API_ERROR` | Generic errors |
| Other | 500 | `UNKNOWN_ERROR` | Unexpected non-Error objects |

## Implementation Example

Here's an example of how to implement error handling in an API route:

```typescript
import { createApiSuccessResponse, createApiErrorResponse, withErrorHandling } from "@/lib/auth/apiErrorHandler";

const MODULE_NAME = "api:example";

async function handleExampleRequest(request: NextRequest, session: any) {
  try {
    // Your API logic here...
    
    return createApiSuccessResponse(responseData);
  } catch (error) {
    return createApiErrorResponse(error, contextData, MODULE_NAME);
  }
}

// Option 1: Manual error handling
export const GET = withAuthValidation(handleExampleRequest);

// Option 2: Automatic error handling with HOF
export const GET = withAuthValidation(
  withErrorHandling(handleExampleRequest, MODULE_NAME)
);
```

## Best Practices

1. **Use Specific Error Types**: When throwing errors, use the most specific error type from `errors.ts`
2. **Include Context**: Always provide meaningful context when logging or creating error responses
3. **Consistent Status Codes**: Use 403 (not 401) for auth errors to prevent automatic redirects
4. **Clear Messages**: Use human-readable messages in the `error` field
5. **Consistent Codes**: Use specific error codes for machine-readable error identification

## Migration Plan

For existing API routes:

1. Import the error handling utilities from `src/lib/auth/apiErrorHandler.ts`
2. Replace custom error handling with the standardized utilities
3. Ensure all thrown errors use the appropriate error types from `errors.ts`
4. Wrap route handlers with `withErrorHandling` for automatic error handling
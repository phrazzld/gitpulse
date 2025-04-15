# API Route Error Handling Analysis

## Overview
This document analyzes the error handling patterns across all API route handlers to verify consistency and proper handling of errors from auth and data modules.

## Error Handling Patterns Found

### 1. Authentication/Authorization Errors

#### Pattern Observed:
- All routes check for session existence and return 401 "Unauthorized" if no session or user
- All routes check for required auth method (OAuth token or installation ID)
- Routes return 401 or 403 with error code "GITHUB_AUTH_ERROR" when no auth method is available

#### Example from `/api/team-activity`:
```typescript
if (!accessToken && !installationId) {
  logger.error(MODULE_NAME, "No authentication method available", {
    hasAccessToken: !!accessToken,
    hasInstallationId: !!installationId
  });
  
  return new NextResponse(JSON.stringify({ 
    error: "GitHub authentication required. Please sign in again.", 
    code: "GITHUB_AUTH_ERROR" 
  }), {
    status: 401,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

### 2. Repository Fetching Errors

#### Pattern Observed:
- All routes have try/catch blocks around repository fetching
- Return 500 status code with error message and code "GITHUB_REPO_ERROR"
- Include original error message in the response

#### Example from `/api/my-activity`:
```typescript
try {
  repositories = await fetchAllRepositories(accessToken, installationId);
} catch (error: any) {
  logger.error(MODULE_NAME, "Error fetching repositories", { error });
  
  return new NextResponse(JSON.stringify({ 
    error: "Error fetching repositories: " + error.message,
    code: "GITHUB_REPO_ERROR"
  }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

### 3. Commit Fetching Errors

#### Pattern Observed:
- All routes have try/catch blocks around commit fetching
- Return 500 status code with error message and code "GITHUB_COMMIT_ERROR"
- Include original error message in the response

#### Example from `/api/my-org-activity`:
```typescript
try {
  allCommits = await fetchCommitsForRepositoriesWithOctokit(
    octokit,
    repoFullNames,
    since,
    until,
    userLogin
  );
} catch (error: any) {
  logger.error(MODULE_NAME, "Error fetching commits", { error });
  
  return new NextResponse(JSON.stringify({ 
    error: "Error fetching commits: " + error.message,
    code: "GITHUB_COMMIT_ERROR"
  }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

### 4. Specific Error Type Handling

#### Pattern Observed:
- Some routes (e.g., `/api/repos`) have more sophisticated error handling, checking for specific error types
- Returns appropriate status codes based on error type (401/403 for auth, 404 for not found, 429 for rate limit)
- Includes error code specific to the error type

#### Example from `/api/repos`:
```typescript
if (error instanceof GitHubConfigError) {
  errorMessage = "GitHub App not properly configured. Please contact the administrator.";
  errorCode = "GITHUB_APP_CONFIG_ERROR";
  statusCode = 500;
} else if (error instanceof GitHubAuthError) {
  // Authentication error handling...
  statusCode = 403;
} else if (error instanceof GitHubRateLimitError) {
  // Rate limit error handling...
  statusCode = 429;
} else if (error instanceof GitHubNotFoundError) {
  // Not found error handling...
  statusCode = 404;
}
```

### 5. General Error Handling

#### Pattern Observed:
- All routes have a general catch block at the outer level
- Log errors with appropriate context
- Return a generic error message with 500 status code

#### Example from `/api/contributors`:
```typescript
catch (error) {
  logger.error(MODULE_NAME, "Error fetching contributors", { error });
  
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  
  return cachedJsonResponse({ 
    error: "Failed to fetch contributors",
    details: errorMessage
  }, 500);
}
```

## Inconsistencies Found

1. **Error Response Format**:
   - Some routes use `NextResponse` directly
   - Others use utility functions like `cachedJsonResponse`
   - Response structure varies (some include code, details, while others don't)

2. **Error Type Handling**:
   - `/api/repos` has detailed error type handling (GitHubAuthError, GitHubRateLimitError, etc.)
   - Other routes have simpler error handling without checking specific error types

3. **Status Codes**:
   - Auth errors use 401 in some routes but 403 in others
   - Generic errors consistently use 500, but the structure varies

4. **Error Codes**:
   - Some routes include error codes ("GITHUB_AUTH_ERROR", "GITHUB_REPO_ERROR")
   - Others don't include specific error codes

## Recommendations

1. **Standardize Error Response Format**:
   - Use consistent response structure across all routes
   - Include `error`, `code`, and optionally `details` fields in all error responses

2. **Improve Error Type Handling**:
   - Adopt the more sophisticated error type handling from `/api/repos` across all routes
   - Use specific error classes from `errors.ts` to determine appropriate status codes and messages

3. **Consistent Auth Error Status Codes**:
   - Standardize on 403 for auth errors (to prevent browser auto-redirect on 401)
   - Include consistent `signOutRequired` flag for auth errors that require re-authentication

4. **Centralize Error Handling**:
   - Consider creating a shared error handling utility for API routes
   - This would ensure consistent handling of different error types across all routes

5. **Improve `createAuthenticatedOctokit` Error Handling**:
   - All routes now use this function, so ensuring it throws the appropriate error types is critical
   - Error information should be preserved when re-thrown
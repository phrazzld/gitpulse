/**
 * Mock implementation of apiErrorHandler for testing
 */
import {
  MockNextResponse,
  MockGitHubError,
  MockGitHubAuthError,
  MockGitHubConfigError,
  MockGitHubRateLimitError,
  MockGitHubNotFoundError,
  MockGitHubApiError,
} from "./error-handling-test-utils";

// Mock consistent error response structure
export interface MockApiErrorResponse {
  error: string;
  code: string;
  details?: string;
  signOutRequired?: boolean;
  needsInstallation?: boolean;
  resetAt?: string;
  [key: string]: unknown;
}

/**
 * Creates a standardized error response for API routes (mock version)
 */
export function mockCreateApiErrorResponse(
  error: unknown,
  context: import("@/types/testing").ErrorContext = {},
  moduleName: string = "api",
): MockNextResponse {
  // Default values
  let errorMessage = "An unexpected error occurred";
  let errorCode = "API_ERROR";
  let statusCode = 500;
  let errorDetails = "";
  let signOutRequired = false;
  const needsInstallation = false;
  let resetAt: string | undefined = undefined;

  // Handle based on error type
  if (error instanceof MockGitHubConfigError) {
    errorMessage = "GitHub App not properly configured";
    errorCode = "GITHUB_APP_CONFIG_ERROR";
    statusCode = 500;
    errorDetails = error.message;
  } else if (error instanceof MockGitHubAuthError) {
    if (error.message.includes("scope")) {
      errorMessage = "GitHub token is missing required permissions";
      errorCode = "GITHUB_SCOPE_ERROR";
    } else if (
      error.message.includes("token") ||
      error.message.includes("expired")
    ) {
      errorMessage = "GitHub authentication token is invalid or expired";
      errorCode = "GITHUB_TOKEN_ERROR";
    } else {
      errorMessage = "GitHub authentication failed";
      errorCode = "GITHUB_AUTH_ERROR";
    }
    statusCode = 403; // Use 403 instead of 401 to prevent automatic browser redirects
    signOutRequired = true;
    errorDetails = error.message;
  } else if (error instanceof MockGitHubRateLimitError) {
    errorMessage = "GitHub API rate limit exceeded";
    errorCode = "GITHUB_RATE_LIMIT_ERROR";
    statusCode = 429;
    errorDetails = error.message;

    // Add reset time if available
    if (error.resetTimestamp) {
      resetAt = new Date(error.resetTimestamp * 1000).toISOString();
    }
  } else if (error instanceof MockGitHubNotFoundError) {
    errorMessage = "GitHub resource not found";
    errorCode = "GITHUB_NOT_FOUND_ERROR";
    statusCode = 404;
    errorDetails = error.message;
  } else if (error instanceof MockGitHubApiError) {
    errorMessage = "GitHub API error occurred";
    errorCode = "GITHUB_API_ERROR";
    statusCode = error.status;
    errorDetails = error.message;
  } else if (error instanceof MockGitHubError) {
    // Generic GitHub error
    errorMessage = "GitHub operation failed";
    errorCode = "GITHUB_ERROR";
    statusCode = 500;
    errorDetails = error.message;
  } else if (error instanceof Error) {
    // Standard JavaScript Error
    errorMessage = "An error occurred";
    errorCode = "API_ERROR";
    statusCode = 500;
    errorDetails = error.message;
  } else {
    // Unknown error type
    errorMessage = "An unexpected error occurred";
    errorCode = "UNKNOWN_ERROR";
    statusCode = 500;
    errorDetails = String(error);
  }

  // Build the error response
  const errorResponse: MockApiErrorResponse = {
    error: errorMessage,
    code: errorCode,
    details: errorDetails,
  };

  // Add optional fields only if they have meaningful values
  if (signOutRequired) {
    errorResponse.signOutRequired = true;
  }

  if (needsInstallation) {
    errorResponse.needsInstallation = true;
  }

  if (resetAt) {
    errorResponse.resetAt = resetAt;
  }

  // Return MockNextResponse with JSON content
  return MockNextResponse.json(errorResponse, {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Higher-order function that wraps an API handler with standardized error handling (mock version)
 */
export function mockWithErrorHandling<
  T extends import("@/types/testing").MockHandlerArgs,
>(
  handler: (...args: T) => Promise<MockNextResponse>,
  moduleName: string,
): (...args: T) => Promise<MockNextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return mockCreateApiErrorResponse(
        error,
        { handlerArgs: args },
        moduleName,
      );
    }
  };
}

// Centralized API error handling utility
import { NextResponse } from "next/server";
import { logger } from "../logger";
import {
  GitHubError,
  GitHubAuthError,
  GitHubConfigError,
  GitHubRateLimitError,
  GitHubNotFoundError,
  GitHubApiError,
} from "../errors";
import {
  ApiErrorResponse,
  ApiHandlerFunction,
  ApiCacheOptions,
} from "@/types/api";
import { GenericRecord } from "@/types/common";
import { randomUUID } from "crypto";

/**
 * Creates a standardized error response for API routes
 *
 * @param error The error that occurred
 * @param context Additional context information for logging
 * @param moduleName The module name for logging purposes
 * @returns NextResponse with appropriate status code and formatted error message
 */
/**
 * Creates a standardized error response for API routes
 *
 * @param error The error that occurred
 * @param context Additional context information for logging
 * @param moduleName The module name for logging purposes
 * @returns NextResponse with appropriate status code and formatted error message
 */
export function createApiErrorResponse(
  error: unknown,
  context: GenericRecord = {},
  moduleName: string = "api",
): NextResponse {
  // Generate a unique request ID for tracking this error
  const requestId = randomUUID();

  // Log the error with provided context, but sanitize sensitive data
  logger.error(moduleName, "API error occurred", {
    requestId,
    ...context,
    // Don't log the full error object which might contain tokens or PII
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
  });

  // Default values
  let errorMessage = "An unexpected error occurred";
  let errorCode = "API_ERROR";
  let statusCode = 500;
  let errorDetails = "";
  let signOutRequired = false;
  const needsInstallation = false;
  let resetAt: string | undefined = undefined;
  let metadata: Record<string, unknown> | undefined = undefined;

  // Handle based on error type
  if (error instanceof GitHubConfigError) {
    errorMessage = "GitHub App not properly configured";
    errorCode = "GITHUB_APP_CONFIG_ERROR";
    statusCode = 500;
    errorDetails = error.message;

    // Add any context from the error
    if (error.context) {
      metadata = { configIssue: true, ...error.context };
    }
  } else if (error instanceof GitHubAuthError) {
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

    // Add any context from the error
    if (error.context) {
      metadata = { ...error.context };
    }
  } else if (error instanceof GitHubRateLimitError) {
    errorMessage = "GitHub API rate limit exceeded";
    errorCode = "GITHUB_RATE_LIMIT_ERROR";
    statusCode = 429;
    errorDetails = error.message;

    // Add reset time if available
    if (error.resetTimestamp) {
      resetAt = new Date(error.resetTimestamp * 1000).toISOString();

      // Calculate time until reset for metadata
      const secondsUntilReset =
        error.resetTimestamp - Math.floor(Date.now() / 1000);
      metadata = {
        secondsUntilReset,
        minutesUntilReset: Math.ceil(secondsUntilReset / 60),
      };
    }

    // Add any context from the error
    if (error.context) {
      metadata = { ...metadata, ...error.context };
    }
  } else if (error instanceof GitHubNotFoundError) {
    errorMessage = "GitHub resource not found";
    errorCode = "GITHUB_NOT_FOUND_ERROR";
    statusCode = 404;
    errorDetails = error.message;

    // Add any context from the error
    if (error.context) {
      metadata = { ...error.context };
    }
  } else if (error instanceof GitHubApiError) {
    errorMessage = "GitHub API error occurred";
    errorCode = "GITHUB_API_ERROR";
    statusCode = error.status;
    errorDetails = error.message;

    // Add any context from the error
    if (error.context) {
      metadata = { ...error.context };
    }
  } else if (error instanceof GitHubError) {
    // Generic GitHub error
    errorMessage = "GitHub operation failed";
    errorCode = "GITHUB_ERROR";
    statusCode = 500;
    errorDetails = error.message;

    // Add any context from the error
    if (error.context) {
      metadata = { ...error.context };
    }
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

  // For validation errors, use a specific code pattern
  if (
    errorMessage.includes("Validation error") ||
    errorDetails.includes("Validation error")
  ) {
    errorCode = "VALIDATION_ERROR";
    statusCode = 400; // Bad request for validation errors
  }

  // Build the error response
  const errorResponse: ApiErrorResponse = {
    error: errorMessage,
    code: errorCode,
    details: errorDetails,
    requestId,
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

  if (metadata && Object.keys(metadata).length > 0) {
    errorResponse.metadata = metadata;
  }

  // Return NextResponse with JSON content
  return NextResponse.json(errorResponse, {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
  });
}

/**
 * Higher-order function that wraps an API handler with standardized error handling
 *
 * @param handler The API route handler to wrap
 * @param moduleName The module name for logging purposes
 * @returns A wrapped handler with standardized error handling
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: ApiHandlerFunction<Args>,
  moduleName: string,
): ApiHandlerFunction<Args> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createApiErrorResponse(error, { handlerArgs: args }, moduleName);
    }
  };
}

/**
 * Creates a standardized success response with caching for API routes
 *
 * @param data The data to include in the response
 * @param status The HTTP status code (default: 200)
 * @param cacheOptions Options for caching the response
 * @returns NextResponse with standardized structure
 */
export function createApiSuccessResponse(
  data: unknown,
  status: number = 200,
  cacheOptions?: {
    etag?: string;
    maxAge?: number;
    staleWhileRevalidate?: number;
  },
): NextResponse {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add cache headers if provided
  if (cacheOptions) {
    if (cacheOptions.etag) {
      headers["ETag"] = cacheOptions.etag;
    }

    if (cacheOptions.maxAge) {
      headers["Cache-Control"] = `private, max-age=${cacheOptions.maxAge}`;

      if (cacheOptions.staleWhileRevalidate) {
        headers["Cache-Control"] +=
          `, stale-while-revalidate=${cacheOptions.staleWhileRevalidate}`;
      }
    }
  }

  return NextResponse.json(data, {
    status,
    headers,
  });
}

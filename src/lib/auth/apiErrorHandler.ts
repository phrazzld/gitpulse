// Centralized API error handling utility
import { NextResponse } from "next/server";
import { logger } from "../logger";
import { 
  GitHubError,
  GitHubAuthError, 
  GitHubConfigError, 
  GitHubRateLimitError, 
  GitHubNotFoundError,
  GitHubApiError 
} from "../errors";

// Consistent error response structure
export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: string;
  signOutRequired?: boolean;
  needsInstallation?: boolean;
  resetAt?: string;
  [key: string]: any; // Allow additional properties
}

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
  context: Record<string, any> = {},
  moduleName: string = "api"
): NextResponse {
  // Log the error with provided context
  logger.error(moduleName, "API error occurred", { ...context, error });
  
  // Default values
  let errorMessage = "An unexpected error occurred";
  let errorCode = "API_ERROR";
  let statusCode = 500;
  let errorDetails = "";
  let signOutRequired = false;
  let needsInstallation = false;
  let resetAt: string | undefined = undefined;
  
  // Handle based on error type
  if (error instanceof GitHubConfigError) {
    errorMessage = "GitHub App not properly configured";
    errorCode = "GITHUB_APP_CONFIG_ERROR";
    statusCode = 500;
    errorDetails = error.message;
  } 
  else if (error instanceof GitHubAuthError) {
    if (error.message.includes('scope')) {
      errorMessage = "GitHub token is missing required permissions";
      errorCode = "GITHUB_SCOPE_ERROR";
    } else if (error.message.includes('token') || error.message.includes('expired')) {
      errorMessage = "GitHub authentication token is invalid or expired";
      errorCode = "GITHUB_TOKEN_ERROR";
    } else {
      errorMessage = "GitHub authentication failed";
      errorCode = "GITHUB_AUTH_ERROR";
    }
    statusCode = 403; // Use 403 instead of 401 to prevent automatic browser redirects
    signOutRequired = true;
    errorDetails = error.message;
  } 
  else if (error instanceof GitHubRateLimitError) {
    errorMessage = "GitHub API rate limit exceeded";
    errorCode = "GITHUB_RATE_LIMIT_ERROR";
    statusCode = 429;
    errorDetails = error.message;
    
    // Add reset time if available
    if (error.resetTimestamp) {
      resetAt = new Date(error.resetTimestamp * 1000).toISOString();
    }
  } 
  else if (error instanceof GitHubNotFoundError) {
    errorMessage = "GitHub resource not found";
    errorCode = "GITHUB_NOT_FOUND_ERROR";
    statusCode = 404;
    errorDetails = error.message;
  } 
  else if (error instanceof GitHubApiError) {
    errorMessage = "GitHub API error occurred";
    errorCode = "GITHUB_API_ERROR";
    statusCode = error.status;
    errorDetails = error.message;
  } 
  else if (error instanceof GitHubError) {
    // Generic GitHub error
    errorMessage = "GitHub operation failed";
    errorCode = "GITHUB_ERROR";
    statusCode = 500;
    errorDetails = error.message;
  } 
  else if (error instanceof Error) {
    // Standard JavaScript Error
    errorMessage = "An error occurred";
    errorCode = "API_ERROR";
    statusCode = 500;
    errorDetails = error.message;
  } 
  else {
    // Unknown error type
    errorMessage = "An unexpected error occurred";
    errorCode = "UNKNOWN_ERROR";
    statusCode = 500;
    errorDetails = String(error);
  }
  
  // Build the error response
  const errorResponse: ApiErrorResponse = {
    error: errorMessage,
    code: errorCode,
    details: errorDetails
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
  
  // Return NextResponse with JSON content
  return NextResponse.json(errorResponse, {
    status: statusCode,
    headers: {
      "Content-Type": "application/json",
    }
  });
}

/**
 * Higher-order function that wraps an API handler with standardized error handling
 * 
 * @param handler The API route handler to wrap
 * @param moduleName The module name for logging purposes
 * @returns A wrapped handler with standardized error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>, 
  moduleName: string
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
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
  data: any,
  status: number = 200,
  cacheOptions?: {
    etag?: string;
    maxAge?: number;
    staleWhileRevalidate?: number;
  }
): NextResponse {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  
  // Add cache headers if provided
  if (cacheOptions) {
    if (cacheOptions.etag) {
      headers["ETag"] = cacheOptions.etag;
    }
    
    if (cacheOptions.maxAge) {
      headers["Cache-Control"] = `private, max-age=${cacheOptions.maxAge}`;
      
      if (cacheOptions.staleWhileRevalidate) {
        headers["Cache-Control"] += `, stale-while-revalidate=${cacheOptions.staleWhileRevalidate}`;
      }
    }
  }
  
  return NextResponse.json(data, {
    status,
    headers
  });
}
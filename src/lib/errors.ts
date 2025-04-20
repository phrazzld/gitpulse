// Custom error classes for GitHub API operations
import { logger } from "./logger";

// Define ErrorOptions type if not available in global scope
type ErrorOptions = {
  cause?: unknown;
  [key: string]: unknown;
};

const MODULE_NAME = "github:errors";

/**
 * Base class for all GitHub utility errors.
 */
export class GitHubError extends Error {
  public readonly cause?: Error;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    options?: ErrorOptions & { context?: Record<string, unknown> },
  ) {
    super(message);
    this.name = this.constructor.name; // Ensure correct name
    this.cause = options?.cause instanceof Error ? options?.cause : undefined;
    this.context = options?.context;
    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error for configuration issues (e.g., missing App ID/Key).
 */
export class GitHubConfigError extends GitHubError {
  constructor(
    message: string,
    options?: ErrorOptions & { context?: Record<string, unknown> },
  ) {
    super(message, options);
  }
}

/**
 * Error for authentication/authorization issues (e.g., invalid token, missing scopes, 401/403).
 */
export class GitHubAuthError extends GitHubError {
  public readonly status: number;

  constructor(
    message: string,
    options?: ErrorOptions & {
      status?: number;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options);
    this.status = options?.status ?? 401; // Default to 401
  }
}

/**
 * Error when a requested resource is not found (404).
 */
export class GitHubNotFoundError extends GitHubError {
  public readonly status: number = 404;

  constructor(
    message: string,
    options?: ErrorOptions & { context?: Record<string, unknown> },
  ) {
    super(message, options);
  }
}

/**
 * Error for API rate limit exceeded issues (403/429).
 */
export class GitHubRateLimitError extends GitHubError {
  public readonly status: number;
  public readonly resetTimestamp?: number; // Unix timestamp (seconds)

  constructor(
    message: string,
    options?: ErrorOptions & {
      status?: number;
      resetTimestamp?: number;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options);
    this.status = options?.status ?? 429; // Default to 429
    this.resetTimestamp = options?.resetTimestamp;
  }
}

/**
 * Generic error for other GitHub API request failures.
 */
export class GitHubApiError extends GitHubError {
  public readonly status: number;

  constructor(
    message: string,
    options?: ErrorOptions & {
      status?: number;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, options);
    this.status = options?.status ?? 500; // Default to 500
  }
}

/**
 * Extract error information from an error object.
 *
 * @param error The caught error
 * @param functionName The name of the function where the error occurred
 * @returns Object containing extracted message, status, and headers
 */
function extractErrorInfo(
  error: unknown,
  functionName: string,
): {
  message: string;
  status?: number;
  headers: Record<string, string>;
} {
  let message = `GitHub operation failed in ${functionName}`;
  let status: number | undefined;
  let headers: Record<string, string> = {};

  // Check if it's an Octokit RequestError like object
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === "string") {
      message = err.message;
    }
    if (typeof err.status === "number") {
      status = err.status;
    }

    // Extract headers from different possible locations
    if (typeof err.response === "object" && err.response !== null) {
      const response = err.response as Record<string, unknown>;
      if (typeof response.headers === "object" && response.headers !== null) {
        headers = response.headers as Record<string, string>;
      }
    } else if (typeof err.headers === "object" && err.headers !== null) {
      headers = err.headers as Record<string, string>;
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = "An unknown error occurred during GitHub operation.";
  }

  return { message, status, headers };
}

/**
 * Check if an error is a rate limit error based on headers.
 *
 * @param headers HTTP headers from the response
 * @returns Object containing whether it's a rate limit error and the reset timestamp
 */
function checkRateLimitError(headers: Record<string, string>): {
  isRateLimitError: boolean;
  resetTimestamp?: number;
} {
  const rateLimitRemaining = headers["x-ratelimit-remaining"];
  const rateLimitReset = headers["x-ratelimit-reset"];

  if (rateLimitRemaining === "0" && rateLimitReset) {
    return {
      isRateLimitError: true,
      resetTimestamp: parseInt(rateLimitReset, 10),
    };
  }

  return { isRateLimitError: false };
}

/**
 * Create error options for GitHub errors.
 *
 * @param error The original error
 * @param context Additional context information
 * @param status HTTP status code
 * @param resetTimestamp Optional rate limit reset timestamp
 * @returns Error options object
 */
function createErrorOptions(
  error: unknown,
  context: Record<string, unknown>,
  status?: number,
  resetTimestamp?: number,
): ErrorOptions & {
  status?: number;
  resetTimestamp?: number;
  context?: Record<string, unknown>;
} {
  return {
    cause: error instanceof Error ? error : undefined,
    status,
    resetTimestamp,
    context,
  };
}

/**
 * Handle authentication and authorization errors.
 *
 * @param message Error message
 * @param status HTTP status code
 * @param headers HTTP headers
 * @param options Error options
 * @returns Never returns, always throws an error
 */
function handleAuthError(
  message: string,
  status: number,
  headers: Record<string, string>,
  options: ErrorOptions & {
    status?: number;
    resetTimestamp?: number;
    context?: Record<string, unknown>;
  },
): never {
  // Check if it's a rate limit error
  const { isRateLimitError, resetTimestamp } = checkRateLimitError(headers);
  if (isRateLimitError) {
    options.resetTimestamp = resetTimestamp;
    throw new GitHubRateLimitError(
      `GitHub API rate limit exceeded. ${message}`,
      options,
    );
  }

  // Check for scope or permission issues
  if (message.includes("scope") || message.includes("permission")) {
    throw new GitHubAuthError(
      `GitHub permission or scope error: ${message}`,
      options,
    );
  }

  // Default auth error
  throw new GitHubAuthError(
    `GitHub authentication/authorization error (Status ${status}): ${message}`,
    options,
  );
}

/**
 * Safely extract error information from an unknown error
 *
 * @param error The unknown error object
 * @returns An object with message and optional error instance
 */
export function safelyExtractError(error: unknown): {
  message: string;
  errorInstance?: Error;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      errorInstance: error,
    };
  }

  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.message === "string") {
      return {
        message: err.message as string,
        // We don't cast non-Error objects to Error here
      };
    }
  }

  return { message: String(error) };
}

/**
 * Helper function to analyze Octokit/generic errors and throw appropriate GitHubError.
 *
 * @param error The caught error
 * @param context Additional context for the error message and logging
 * @returns Never returns, always throws an error
 */
export function handleGitHubError(
  error: unknown,
  context: Record<string, unknown> = {},
): never {
  const functionName =
    (context.functionName as string) || "unknown GitHub function";

  // Log error with sanitized context
  logErrorWithSanitizedContext(error, functionName, context);

  // If it's already one of our custom errors, re-throw it
  if (error instanceof GitHubError) {
    throw error;
  }

  // Extract error information and create error options
  const { message, status, headers } = extractErrorInfo(error, functionName);
  const errorOptions = createErrorOptions(error, context, status);

  // Create and throw appropriate error type
  throw createAppropriateErrorType(message, status, headers, errorOptions);
}

/**
 * Log error with sanitized context to avoid exposing sensitive information
 */
function logErrorWithSanitizedContext(
  error: unknown,
  functionName: string,
  context: Record<string, unknown>,
): void {
  // Create a sanitized context by removing any sensitive fields
  const sanitizedContext = { ...context };

  // Remove any potential token or sensitive auth information
  delete sanitizedContext.token;
  delete sanitizedContext.accessToken;
  delete sanitizedContext.credentials;
  delete sanitizedContext.auth;

  // Log error with safer details
  logger.error(MODULE_NAME, `Error in ${functionName}`, {
    ...sanitizedContext,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    // Don't log the entire error object which might contain sensitive data
  });
}

/**
 * Create and return the appropriate error type based on status code
 */
function createAppropriateErrorType(
  message: string,
  status: number | undefined,
  headers: Record<string, string>,
  errorOptions: ErrorOptions,
): never {
  // Handle different error types based on status code
  switch (status) {
    case 401:
    case 403:
      return handleAuthError(message, status, headers, errorOptions);

    case 404:
      throw new GitHubNotFoundError(
        formatErrorMessage(404, "GitHub resource not found", message),
        errorOptions,
      );

    case 429: // Explicit rate limit status
      return handleRateLimitError(message, headers, errorOptions);

    default:
      return handleDefaultError(message, status, errorOptions);
  }
}

/**
 * Handle rate limit errors (429)
 */
function handleRateLimitError(
  message: string,
  headers: Record<string, string>,
  errorOptions: ErrorOptions,
): never {
  const resetTimestamp = getResetTimestamp(headers);
  errorOptions.resetTimestamp = resetTimestamp;

  throw new GitHubRateLimitError(
    formatErrorMessage(429, "GitHub API rate limit exceeded", message),
    errorOptions,
  );
}

/**
 * Get rate limit reset timestamp from headers
 */
function getResetTimestamp(
  headers: Record<string, string>,
): number | undefined {
  return headers["x-ratelimit-reset"]
    ? parseInt(headers["x-ratelimit-reset"], 10)
    : undefined;
}

/**
 * Handle default error cases
 */
function handleDefaultError(
  message: string,
  status: number | undefined,
  errorOptions: ErrorOptions,
): never {
  if (status && status >= 400 && status < 600) {
    throw new GitHubApiError(
      formatErrorMessage(status, "GitHub API error", message),
      errorOptions,
    );
  }

  // For non-API errors or unknown errors
  throw new GitHubError(
    `Unexpected GitHub utility error: ${message}`,
    errorOptions,
  );
}

/**
 * Format error message with status code and description
 */
function formatErrorMessage(
  status: number,
  description: string,
  message: string,
): string {
  return `${description} (Status ${status}): ${message}`;
}

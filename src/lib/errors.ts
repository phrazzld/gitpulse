// Custom error classes for GitHub API operations
import { logger } from "./logger";

const MODULE_NAME = "github:errors";

/**
 * Base class for all GitHub utility errors.
 */
export class GitHubError extends Error {
  public readonly cause?: Error;
  public readonly context?: Record<string, any>;

  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
    super(message, options);
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
  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
    super(message, options);
  }
}

/**
 * Error for authentication/authorization issues (e.g., invalid token, missing scopes, 401/403).
 */
export class GitHubAuthError extends GitHubError {
  public readonly status: number;

  constructor(message: string, options?: ErrorOptions & { status?: number, context?: Record<string, any> }) {
    super(message, options);
    this.status = options?.status ?? 401; // Default to 401
  }
}

/**
 * Error when a requested resource is not found (404).
 */
export class GitHubNotFoundError extends GitHubError {
  public readonly status: number = 404;

  constructor(message: string, options?: ErrorOptions & { context?: Record<string, any> }) {
    super(message, options);
  }
}

/**
 * Error for API rate limit exceeded issues (403/429).
 */
export class GitHubRateLimitError extends GitHubError {
  public readonly status: number;
  public readonly resetTimestamp?: number; // Unix timestamp (seconds)

  constructor(message: string, options?: ErrorOptions & { status?: number, resetTimestamp?: number, context?: Record<string, any> }) {
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

  constructor(message: string, options?: ErrorOptions & { status?: number, context?: Record<string, any> }) {
    super(message, options);
    this.status = options?.status ?? 500; // Default to 500
  }
}

/**
 * Helper function to analyze Octokit/generic errors and throw appropriate GitHubError.
 * @param error The caught error.
 * @param context Additional context for the error message and logging.
 */
export function handleGitHubError(error: unknown, context: Record<string, any> = {}): never {
    const functionName = context.functionName || 'unknown GitHub function';
    logger.error(MODULE_NAME, `Error in ${functionName}`, { ...context, error });

    if (error instanceof GitHubError) {
        // If it's already one of our custom errors, re-throw it
        throw error;
    }

    let message = `GitHub operation failed in ${functionName}`;
    let status: number | undefined;
    let headers: Record<string, string> = {};

    // Check if it's an Octokit RequestError like object
    if (typeof error === 'object' && error !== null) {
        const err = error as any; // Use any for broader compatibility
        if (typeof err.message === 'string') {
            message = err.message;
        }
        if (typeof err.status === 'number') {
            status = err.status;
        }
        if (typeof err.response?.headers === 'object') {
            headers = err.response.headers;
        } else if (typeof err.headers === 'object') {
            // Sometimes headers are directly on the error object
            headers = err.headers;
        }
    } else if (error instanceof Error) {
        message = error.message;
    } else {
        message = 'An unknown error occurred during GitHub operation.';
    }

    const errorOptions: ErrorOptions & { status?: number, resetTimestamp?: number, context?: Record<string, any> } = {
        cause: error instanceof Error ? error : undefined,
        status: status,
        context: context
    };

    switch (status) {
        case 401:
        case 403:
            // Check for rate limit headers
            const rateLimitRemaining = headers['x-ratelimit-remaining'];
            const rateLimitReset = headers['x-ratelimit-reset'];
            if (rateLimitRemaining === '0' && rateLimitReset) {
                errorOptions.resetTimestamp = parseInt(rateLimitReset, 10);
                throw new GitHubRateLimitError(`GitHub API rate limit exceeded. ${message}`, errorOptions);
            }
            // Check for scope issues mentioned in the message
            if (message.includes('scope') || message.includes('permission')) {
                throw new GitHubAuthError(`GitHub permission or scope error: ${message}`, errorOptions);
            }
            throw new GitHubAuthError(`GitHub authentication/authorization error (Status ${status}): ${message}`, errorOptions);
        case 404:
            throw new GitHubNotFoundError(`GitHub resource not found (Status 404): ${message}`, errorOptions);
        case 429: // Explicit rate limit status
             const resetTimestamp = headers['x-ratelimit-reset'] ? parseInt(headers['x-ratelimit-reset'], 10) : undefined;
             errorOptions.resetTimestamp = resetTimestamp;
             throw new GitHubRateLimitError(`GitHub API rate limit exceeded (Status 429). ${message}`, errorOptions);
        default:
            if (status && status >= 400 && status < 600) {
                throw new GitHubApiError(`GitHub API error (Status ${status}): ${message}`, errorOptions);
            }
            // For non-API errors or unknown errors
            throw new GitHubError(`Unexpected GitHub utility error: ${message}`, errorOptions);
    }
}
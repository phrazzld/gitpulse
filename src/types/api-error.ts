/**
 * Standard API error response interface
 * Based on the format defined in docs/api-error-format.md
 */
export interface ApiErrorResponse {
  /**
   * Human-readable error message for display to users
   */
  error: string;

  /**
   * Machine-readable error code for programmatic handling
   */
  code: string;

  /**
   * More detailed error information, primarily for developers
   */
  details?: string;

  /**
   * Unique identifier for tracking this error across systems
   */
  requestId?: string;

  /**
   * Whether the client should sign the user out due to this error
   */
  signOutRequired?: boolean;

  /**
   * Whether the GitHub App needs to be installed
   */
  needsInstallation?: boolean;

  /**
   * ISO timestamp when a rate limit will reset
   */
  resetAt?: string;

  /**
   * Additional structured data related to the error
   */
  metadata?: Record<string, unknown>;
}

/**
 * Extended Error object that includes API error properties
 */
export interface ApiError extends Error {
  /**
   * Machine-readable error code for programmatic handling
   */
  code?: string;

  /**
   * More detailed error information, primarily for developers
   */
  details?: string;

  /**
   * Unique identifier for tracking this error across systems
   */
  requestId?: string;

  /**
   * Whether the client should sign the user out due to this error
   */
  signOutRequired?: boolean;

  /**
   * Whether the GitHub App needs to be installed
   */
  needsInstallation?: boolean;

  /**
   * ISO timestamp when a rate limit will reset
   */
  resetAt?: string;

  /**
   * Additional structured data related to the error
   */
  metadata?: Record<string, unknown>;
}

/**
 * Create an enhanced Error object from an API error response
 * @param errorData API error response data
 * @returns Enhanced Error object with API error properties
 */
export function createApiError(errorData: ApiErrorResponse): ApiError {
  const error = new Error(errorData.error) as ApiError;

  // Add all standardized properties to the error object
  error.code = errorData.code;
  error.details = errorData.details;
  error.requestId = errorData.requestId;
  error.signOutRequired = errorData.signOutRequired;
  error.needsInstallation = errorData.needsInstallation;
  error.resetAt = errorData.resetAt;
  error.metadata = errorData.metadata;

  return error;
}

/**
 * Extract API error properties from an unknown error object
 * @param error Unknown error object
 * @returns Object with error message and API error properties
 */
export function extractApiErrorInfo(error: unknown): {
  message: string;
  code?: string;
  details?: string;
  requestId?: string;
  signOutRequired?: boolean;
  needsInstallation?: boolean;
  resetAt?: string;
} {
  if (error instanceof Error) {
    const apiError = error as ApiError;

    return {
      message: apiError.message,
      code: apiError.code,
      details: apiError.details,
      requestId: apiError.requestId,
      signOutRequired: apiError.signOutRequired,
      needsInstallation: apiError.needsInstallation,
      resetAt: apiError.resetAt,
    };
  }

  return {
    message: String(error),
  };
}

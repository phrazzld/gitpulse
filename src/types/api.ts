/**
 * API-related type definitions
 * 
 * This file centralizes API response and error handling type definitions
 * used across the application
 */

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: string;
  signOutRequired?: boolean;
  needsInstallation?: boolean;
  resetAt?: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Options for API response caching
 */
export interface ApiCacheOptions {
  etag?: string;
  cacheControl?: string;
  maxAge?: number;
  staleWhileRevalidate?: number;
  isPrivate?: boolean;
  compress?: boolean;
  extraHeaders?: Record<string, string>;
}

/**
 * Parameters used to generate cache keys
 */
export type CacheParams = Record<string, unknown>;

/**
 * Pagination parameters for API responses
 */
export interface PaginationParams {
  cursor?: string;
  limit?: number;
  page?: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Date range parameters for API requests
 */
export interface DateRangeParams {
  since: string;
  until: string;
}

/**
 * Filter parameters for API requests
 */
export interface FilterParams {
  repositories?: string[];
  users?: string[];
  /**
   * @deprecated Organizations filtering is no longer supported in the individual-focused MVP
   */
  organizations?: string[];
  dateRange?: DateRangeParams;
}

/**
 * Higher-order function parameter for API error handling
 */
export type ApiHandlerFunction<Args extends unknown[]> = 
  (...args: Args) => Promise<Response>;

/**
 * Session user information
 */
export interface SessionUser {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

/**
 * Session information including GitHub credentials
 */
export interface SessionInfo {
  user?: SessionUser;
  accessToken?: string;
  installationId?: number;
  profile?: {
    login?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Extension of next-auth Session with our custom fields for type safety
export type GitHubSession = {
  user?: SessionUser;
  accessToken?: string;
  installationId?: number;
  profile?: {
    login?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};
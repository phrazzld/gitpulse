import { NextRequest, NextResponse } from "next/server";

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
export type ApiHandlerFunction<Args extends unknown[]> = (
  ...args: Args
) => Promise<Response>;

/**
 * Session user information
 */
export interface SessionUser {
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

/**
 * GitHub profile information in session
 * This is the type for the profile property that's added to session objects
 * Use this instead of `as any` for accessing profile properties
 */
export interface GitHubProfile {
  login?: string;
  id?: number;
  node_id?: string;
  avatar_url?: string;
  gravatar_id?: string;
  url?: string;
  html_url?: string;
  followers_url?: string;
  following_url?: string;
  gists_url?: string;
  starred_url?: string;
  subscriptions_url?: string;
  organizations_url?: string;
  repos_url?: string;
  events_url?: string;
  received_events_url?: string;
  type?: string;
  site_admin?: boolean;
  name?: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  hireable?: boolean;
  bio?: string;
  twitter_username?: string;
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/**
 * Session information including GitHub credentials
 */
export interface SessionInfo {
  user?: SessionUser;
  accessToken?: string;
  installationId?: number;
  profile?: GitHubProfile;
  expires?: string;
  [key: string]: unknown;
}

// Extension of next-auth Session with our custom fields for type safety
export type GitHubSession = {
  user?: SessionUser;
  accessToken?: string;
  installationId?: number;
  profile?: GitHubProfile;
  expires?: string;
  [key: string]: unknown;
};

/**
 * Type for API route handler functions
 * Use this instead of (req: any) => Promise<Response>
 */
export type ApiRouteHandler = (
  req: NextRequest,
  context?: { params?: Record<string, string | string[]> },
) => Promise<NextResponse>;

/**
 * Type for API middleware functions
 * Use this instead of (handler: any) => (req: any) => Promise<Response>
 */
export type ApiMiddleware = (handler: ApiRouteHandler) => ApiRouteHandler;

/**
 * Type for API request headers
 * Use this for typed access to request headers
 */
export interface ApiRequestHeaders {
  authorization?: string;
  "content-type"?: string;
  "user-agent"?: string;
  accept?: string;
  "accept-encoding"?: string;
  "if-none-match"?: string;
  "if-modified-since"?: string;
  [key: string]: string | undefined;
}

/**
 * Type for standardized API responses
 * Use this for consistent response typing
 */
export interface StandardApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: string;
  details?: string;
  pagination?: PaginationParams;
  metadata?: Record<string, unknown>;
}

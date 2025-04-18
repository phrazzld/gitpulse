/**
 * Activity-related type definitions
 *
 * This file defines types specifically related to GitHub activity data
 * and enables better organization of domain-specific types.
 */

/**
 * Type for activity mode selection
 * Defines the available modes for viewing GitHub activity
 */
export type ActivityMode = "my-activity" | "my-work-activity" | "team-activity";

/**
 * External GitHub API commit data (using snake_case properties)
 * This represents the data as it might come from the GitHub API
 */
export interface GitHubActivityCommit {
  sha: string;
  html_url?: string;
  commit: {
    message: string;
    author?: {
      name?: string;
      date?: string;
    } | null;
  };
  repository?: {
    name?: string;
    full_name?: string;
    html_url?: string;
  };
  [key: string]: unknown;
}

/**
 * Internal activity commit representation using camelCase properties
 * This is the format used for internal processing within the application
 */
export interface InternalActivityCommit {
  sha: string;
  htmlUrl?: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  repository?: {
    name: string;
    fullName: string;
    htmlUrl?: string;
  };
}

/**
 * Activity commit data formatted for display components
 * This is the format used by components like ActivityFeed
 */
export interface ActivityCommit {
  sha: string;
  html_url?: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  repository?: {
    name: string;
    full_name: string;
    html_url?: string;
  };
}

/**
 * API response interface with pagination for activity data
 */
export interface ActivityApiResponse {
  commits?: unknown[];
  pagination?: {
    nextCursor?: string;
    next_cursor?: string;
    hasMore?: boolean;
    has_more?: boolean;
  };
}

/**
 * Result interface for activity data fetchers
 */
export interface ActivityFetcherResult {
  data: ActivityCommit[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Interface for date range filtering
 */
export interface ActivityDateRange {
  since: string;
  until: string;
}

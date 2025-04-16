/**
 * Activity data transformation utilities
 * 
 * This module provides functions to transform GitHub activity data from external
 * API formats (snake_case) to internal formats (camelCase) and into a format
 * compatible with the ActivityFeed component.
 */
import { ActivityCommit } from '@/components/ActivityFeed';
import { MinimalCommit } from './optimize';

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
  contributor?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string | null;
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
  contributor?: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

/**
 * API response interface with pagination
 * Supports both snake_case and camelCase property names for backward compatibility
 */
interface ApiResponse {
  commits?: unknown[];
  pagination?: {
    nextCursor?: string;
    next_cursor?: string;
    hasMore?: boolean;
    has_more?: boolean;
  };
}

/**
 * ActivityFeed fetcher result interface
 */
interface ActivityFetcherResult {
  data: ActivityCommit[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Transforms a commit from external API format to internal camelCase format
 * 
 * @param commit - Raw commit data from API with potentially snake_case properties
 * @returns - Internal representation with consistent camelCase properties
 */
export function transformApiCommit(commit: unknown): InternalActivityCommit {
  // Cast to a more specific type to allow property access
  const rawCommit = commit as Record<string, unknown>;
  
  // Safely extract commit data with null/undefined checks
  const commitData = rawCommit.commit as Record<string, unknown> | undefined;
  const repoData = rawCommit.repository as Record<string, unknown> | undefined;
  const contributorData = rawCommit.contributor as Record<string, unknown> | undefined;
  
  // Create standardized internal representation with camelCase properties
  return {
    sha: String(rawCommit.sha || ''),
    htmlUrl: rawCommit.htmlUrl as string || rawCommit.html_url as string,
    commit: {
      message: commitData?.message as string || '',
      author: {
        name: (commitData?.author as Record<string, unknown> | null)?.name as string || 'Unknown',
        date: (commitData?.author as Record<string, unknown> | null)?.date as string || new Date().toISOString()
      }
    },
    repository: repoData ? {
      name: repoData.name as string || '',
      fullName: repoData.fullName as string || repoData.full_name as string || '',
      htmlUrl: repoData.htmlUrl as string || repoData.html_url as string
    } : undefined,
    contributor: contributorData ? {
      username: contributorData.username as string || '',
      displayName: contributorData.displayName as string || '',
      avatarUrl: contributorData.avatarUrl as string || null
    } : undefined
  };
}

/**
 * Prepares an internal activity commit for the ActivityFeed component
 * Maps camelCase properties to the expected ActivityCommit format (which uses some snake_case)
 * 
 * @param internalCommit - Internal commit with camelCase properties
 * @returns - ActivityCommit format as expected by ActivityFeed component
 */
export function prepareActivityCommit(internalCommit: InternalActivityCommit): ActivityCommit {
  return {
    sha: internalCommit.sha,
    html_url: internalCommit.htmlUrl, // Map camelCase to snake_case for ActivityFeed
    commit: internalCommit.commit,
    repository: internalCommit.repository ? {
      name: internalCommit.repository.name,
      full_name: internalCommit.repository.fullName, // Map camelCase to snake_case for ActivityFeed
      html_url: internalCommit.repository.htmlUrl // Map camelCase to snake_case for ActivityFeed
    } : undefined,
    contributor: internalCommit.contributor
  };
}

/**
 * Formats commit data from API response into a format compatible with ActivityFeed
 * 
 * Internally processes data using camelCase properties, but returns in the format
 * expected by ActivityFeed (with some snake_case properties) for backward compatibility.
 * 
 * @param commits - Raw commits from API with potentially mixed property naming
 * @returns - Formatted commit data for ActivityFeed
 */
export function formatActivityCommits(commits: unknown[]): ActivityCommit[] {
  if (!commits || !Array.isArray(commits)) {
    return [];
  }

  return commits.map(rawCommit => {
    // Transform to internal camelCase format
    const internalCommit = transformApiCommit(rawCommit);
    
    // Transform back to ActivityFeed-compatible format
    return prepareActivityCommit(internalCommit);
  });
}

/**
 * Creates a fetcher function for the ActivityFeed component
 * 
 * @param baseUrl - Base API URL
 * @param params - Additional query parameters
 * @returns - Fetcher function for useProgressiveLoading
 */
export function createActivityFetcher(baseUrl: string, params: Record<string, string>) {
  return async (cursor: string | null, limit: number): Promise<ActivityFetcherResult> => {
    // Build query parameters
    const queryParams = new URLSearchParams({
      ...params,
      limit: limit.toString()
    });

    // Add cursor if it exists
    if (cursor) {
      queryParams.append('cursor', cursor);
    }

    // Fetch data from API
    const response = await fetch(`${baseUrl}?${queryParams.toString()}`);
    
    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error || 'Failed to fetch activity data');
    }
    
    const data = await response.json() as ApiResponse;
    
    // Convert pagination data to internal camelCase format
    const paginationData = data.pagination as Record<string, unknown> | undefined;
    const hasMore = paginationData?.hasMore as boolean || paginationData?.has_more as boolean || false;
    const nextCursor = paginationData?.nextCursor as string || paginationData?.next_cursor as string || null;
    
    // Return formatted data with camelCase pagination info
    return {
      data: formatActivityCommits(data.commits || []),
      nextCursor,
      hasMore
    };
  };
}
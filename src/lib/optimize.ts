/**
 * Utilities for transforming API response payloads
 * 
 * This module provides functions to transform external API data (using snake_case)
 * into consistent internal representations (using camelCase), and to optimize
 * data size for client-side usage.
 */
import { Repository, Commit } from '@/types/github';

// Use type aliases to distinguish between external and internal types
type GitHubRepository = Repository;
type GitHubCommit = Commit;

/**
 * External GitHub contributor data (using snake_case properties)
 */
export interface GitHubContributor {
  login: string;
  name?: string;
  avatar_url?: string;
  commit_count?: number;
  [key: string]: unknown;
}

/**
 * Optimized minimal repository data using camelCase naming convention
 * 
 * @property id - Repository ID
 * @property name - Repository name
 * @property fullName - Repository full name (transformed from full_name)
 * @property ownerLogin - Repository owner login (transformed from owner.login)
 * @property private - Whether the repository is private
 * @property language - Repository primary language
 * @property htmlUrl - Repository HTML URL (transformed from html_url)
 */
export interface MinimalRepository {
  id: number;
  name: string;
  fullName: string;
  ownerLogin: string;
  private: boolean;
  language: string | null;
  htmlUrl?: string;
}

/**
 * Optimized minimal commit data using camelCase naming convention
 * 
 * @property sha - Commit SHA
 * @property message - Commit message
 * @property authorName - Author name (transformed from commit.author.name)
 * @property authorDate - Author date (transformed from commit.author.date)
 * @property authorLogin - Author login (transformed from author.login)
 * @property authorAvatar - Author avatar URL (transformed from author.avatar_url)
 * @property repoName - Repository name (transformed from repository.full_name)
 * @property htmlUrl - Commit HTML URL (transformed from html_url)
 */
export interface MinimalCommit {
  sha: string;
  message: string;
  authorName: string;
  authorDate: string;
  authorLogin?: string;
  authorAvatar?: string;
  repoName?: string;
  htmlUrl?: string;
}

/**
 * Optimized minimal contributor data using camelCase naming convention
 * 
 * @property username - Contributor username (transformed from login)
 * @property displayName - Contributor display name (transformed from name or login)
 * @property avatarUrl - Contributor avatar URL (transformed from avatar_url)
 * @property commitCount - Number of commits (transformed from commit_count)
 */
export interface MinimalContributor {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  commitCount?: number;
}

/**
 * Transform GitHub repository data to internal camelCase representation
 * 
 * @param repo - Full repository object from GitHub API (using snake_case properties)
 * @returns - Transformed repository data with camelCase properties
 */
export function transformRepository(repo: GitHubRepository): MinimalRepository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    ownerLogin: repo.owner.login,
    private: repo.private,
    language: repo.language || null,
    htmlUrl: repo.html_url,
  };
}

/**
 * Transform GitHub commit data to internal camelCase representation
 * 
 * @param commit - Full commit object from GitHub API (using snake_case properties)
 * @returns - Transformed commit data with camelCase properties
 */
export function transformCommit(commit: GitHubCommit): MinimalCommit {
  return {
    sha: commit.sha,
    message: commit.commit.message,
    authorName: commit.commit.author?.name || 'Unknown',
    authorDate: commit.commit.author?.date || new Date().toISOString(),
    authorLogin: commit.author?.login,
    authorAvatar: commit.author?.avatar_url,
    repoName: commit.repository?.full_name,
    htmlUrl: commit.html_url,
  };
}

/**
 * Contributor with flexible properties to support transition period
 * 
 * This interface supports both camelCase and snake_case properties for 
 * backward compatibility during the transition to consistent naming conventions.
 * 
 * @deprecated Use GitHubContributor for external data and MinimalContributor for internal data
 */
export interface ContributorLike {
  // camelCase variants
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  commitCount?: number;
  
  // snake_case variants
  login?: string;
  name?: string;
  avatar_url?: string;
  commit_count?: number;
  
  // Allow additional properties
  [key: string]: unknown;
}

/**
 * Transform contributor data to internal camelCase representation
 * 
 * @param contributor - Contributor object from GitHub API
 * @returns - Transformed contributor data with camelCase properties
 */
export function transformContributor(contributor: GitHubContributor): MinimalContributor {
  return {
    username: contributor.login || 'unknown',
    displayName: contributor.name || contributor.login || 'Unknown',
    avatarUrl: contributor.avatar_url || null,
    commitCount: contributor.commit_count
  };
}

/**
 * LEGACY FUNCTION - For backward compatibility
 * @deprecated Use transformRepository instead for new code
 */
export function optimizeRepository(repo: GitHubRepository): MinimalRepository {
  return transformRepository(repo);
}

/**
 * LEGACY FUNCTION - For backward compatibility
 * @deprecated Use transformCommit instead for new code
 */
export function optimizeCommit(commit: GitHubCommit): MinimalCommit {
  return transformCommit(commit);
}

/**
 * Transform contributor data with support for both naming conventions
 * 
 * This function supports the transition period where both naming conventions
 * might be present in the codebase.
 * 
 * @param contributor - Contributor object with flexible property naming
 * @returns - Transformed contributor data with camelCase properties
 */
export function optimizeContributor(contributor: ContributorLike): MinimalContributor {
  // Find the appropriate username and displayName from either naming convention
  const username = contributor.username || contributor.login || 'unknown';
  const displayName = contributor.displayName || 
                     contributor.name || 
                     contributor.username || 
                     contributor.login || 
                     'Unknown';
  
  return {
    username,
    displayName,
    avatarUrl: contributor.avatarUrl || contributor.avatar_url || null,
    commitCount: contributor.commitCount || contributor.commit_count
  };
}

/**
 * Transform an array of items using a provided transformation function
 * 
 * @param items - Array of items to transform
 * @param transformFn - Function to apply to each item
 * @returns - Array of transformed items
 */
export function transformArray<T, R>(items: T[], transformFn: (item: T) => R): R[] {
  if (!Array.isArray(items)) return [];
  return items.map(transformFn);
}

/**
 * LEGACY FUNCTION - For backward compatibility
 * @deprecated Use transformArray instead for new code
 */
export function optimizeArray<T, R>(items: T[], optimizerFn: (item: T) => R): R[] {
  return transformArray(items, optimizerFn);
}

/**
 * Remove null or undefined values from an object
 * 
 * @param obj - Object to clean
 * @returns - Object without null or undefined values
 */
export function removeNullValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc: Record<string, unknown>, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {}) as Partial<T>;
}

/**
 * Custom JSON serializer for optimized string representation
 * 
 * @param data - Data to serialize
 * @returns - Serialized JSON string
 */
export function optimizedJSONStringify(data: unknown): string {
  // Handle arrays separately for better optimization opportunities
  if (Array.isArray(data)) {
    return `[${data.map(item => 
      typeof item === 'object' && item !== null 
        ? optimizedJSONStringify(item)
        : JSON.stringify(item)
    ).join(',')}]`;
  }
  
  // Regular JSON stringify for other data
  return JSON.stringify(data);
}
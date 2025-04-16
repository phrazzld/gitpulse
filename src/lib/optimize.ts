/**
 * Utilities for optimizing API response payloads
 */
import { Repository, Commit } from '@/types/github';

/**
 * Optimized minimal repository data using camelCase naming convention
 * 
 * @property id - Repository ID
 * @property name - Repository name
 * @property fullName - Repository full name (previously full_name)
 * @property ownerLogin - Repository owner login (previously owner_login)
 * @property private - Whether the repository is private
 * @property language - Repository primary language
 * @property htmlUrl - Repository HTML URL (previously html_url)
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
 * @property authorName - Author name (previously author_name)
 * @property authorDate - Author date (previously author_date)
 * @property authorLogin - Author login (previously author_login)
 * @property authorAvatar - Author avatar URL (previously author_avatar)
 * @property repoName - Repository name (previously repo_name)
 * @property htmlUrl - Commit HTML URL (previously html_url)
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
 * @property username - Contributor username
 * @property displayName - Contributor display name (previously display_name)
 * @property avatarUrl - Contributor avatar URL (previously avatar_url)
 * @property commitCount - Number of commits (previously commit_count)
 */
export interface MinimalContributor {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  commitCount?: number;
}

/**
 * Optimize repository data by removing unnecessary fields and converting to camelCase
 * 
 * @param repo - Full repository object from GitHub (using snake_case properties)
 * @returns - Minimized repository data with camelCase properties
 */
export function optimizeRepository(repo: Repository): MinimalRepository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    ownerLogin: repo.owner.login,
    private: repo.private,
    language: repo.language || null,
    htmlUrl: repo.html_url, // Keep URL for clickable references
  };
}

/**
 * Optimize commit data by removing unnecessary fields and converting to camelCase
 * 
 * @param commit - Full commit object from GitHub (using snake_case properties)
 * @returns - Minimized commit data with camelCase properties
 */
export function optimizeCommit(commit: Commit): MinimalCommit {
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
 * Contributor with flexible properties (used for different API responses)
 * Supports both camelCase and snake_case properties for backward compatibility
 */
export interface ContributorLike {
  username?: string;
  login?: string;
  displayName?: string;
  name?: string;
  avatarUrl?: string;
  avatar_url?: string;
  commitCount?: number;
  commit_count?: number;
  [key: string]: unknown;
}

/**
 * Optimize contributor data and convert to camelCase naming convention
 * 
 * @param contributor - Contributor object with potential extra fields
 * @returns - Minimized contributor data with camelCase properties
 */
export function optimizeContributor(contributor: ContributorLike): MinimalContributor {
  // Find the appropriate username
  const username = contributor.username || contributor.login || 'unknown';
  // Find the appropriate display name
  const displayName = contributor.displayName || contributor.name || contributor.username || contributor.login || 'Unknown';
  
  return {
    username,
    displayName: displayName,
    avatarUrl: contributor.avatarUrl || contributor.avatar_url || null,
    commitCount: contributor.commitCount || contributor.commit_count
  };
}

/**
 * Optimize an array of items using a provided optimization function
 * 
 * @param items - Array of items to optimize
 * @param optimizerFn - Function to apply to each item
 * @returns - Array of optimized items
 */
export function optimizeArray<T, R>(items: T[], optimizerFn: (item: T) => R): R[] {
  if (!Array.isArray(items)) return [];
  return items.map(optimizerFn);
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
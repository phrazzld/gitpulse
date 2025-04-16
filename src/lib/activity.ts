import { ActivityCommit } from '@/components/ActivityFeed';

/**
 * Formats commit data from API response into a format compatible with ActivityFeed.
 * Preserves the snake_case naming convention for properties in ActivityCommit as expected by ActivityFeed,
 * while supporting camelCase properties in the input.
 * 
 * @param commits - Raw commits from API, with either snake_case or camelCase property names
 * @returns - Formatted commit data for ActivityFeed
 */
export function formatActivityCommits(commits: any[]): ActivityCommit[] {
  if (!commits || !Array.isArray(commits)) {
    return [];
  }

  return commits.map(commit => ({
    sha: commit.sha,
    html_url: commit.htmlUrl || commit.html_url, // Support both naming conventions
    commit: {
      message: commit.commit.message,
      author: {
        name: commit.commit.author?.name || 'Unknown',
        date: commit.commit.author?.date || new Date().toISOString()
      }
    },
    repository: commit.repository ? {
      name: commit.repository.name,
      full_name: commit.repository.fullName || commit.repository.full_name, // Support both naming conventions
      html_url: commit.repository.htmlUrl || commit.repository.html_url // Support both naming conventions
    } : undefined,
    contributor: commit.contributor ? {
      username: commit.contributor.username,
      displayName: commit.contributor.displayName, // Already uses camelCase
      avatarUrl: commit.contributor.avatarUrl // Already uses camelCase
    } : undefined
  }));
}

/**
 * Creates a fetcher function for the ActivityFeed component
 * 
 * @param baseUrl - Base API URL
 * @param params - Additional query parameters
 * @returns - Fetcher function for useProgressiveLoading
 */
export function createActivityFetcher(baseUrl: string, params: Record<string, string>) {
  return async (cursor: string | null, limit: number) => {
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch activity data');
    }
    
    const data = await response.json();
    
    // Return formatted data with pagination info
    return {
      data: formatActivityCommits(data.commits || []),
      // Support both camelCase and snake_case property names in pagination info
      nextCursor: data.pagination?.nextCursor || data.pagination?.next_cursor || null,
      hasMore: data.pagination?.hasMore || data.pagination?.has_more || false
    };
  };
}
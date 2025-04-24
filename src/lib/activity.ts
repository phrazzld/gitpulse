import { ActivityCommit } from '@/components/ActivityFeed';
import { logger } from '@/lib/logger';

const MODULE_NAME = 'lib:activity';

/**
 * Safely formats commit data from API responses into a format compatible with ActivityFeed
 * 
 * This function handles multiple possible commit formats:
 * 1. GitHub API commit objects (with nested commit.commit structure)
 * 2. MinimalCommit format from optimize.ts (flat structure with author_name, etc.)
 * 3. Custom commit formats from various endpoints
 * 
 * The function implements defensive coding to handle malformed or incomplete commit data:
 * - Uses optional chaining for all nested property access
 * - Provides fallback values for all properties
 * - Normalizes different data shapes into a consistent ActivityCommit format
 * - Logs warnings for unexpected formats without throwing errors
 * 
 * @param commits - Raw commits from various API sources (with different possible shapes)
 * @returns - Array of safely formatted ActivityCommit objects for display
 */
export function formatActivityCommits(commits: any[]): ActivityCommit[] {
  // Defensive check for invalid input
  if (!commits || !Array.isArray(commits)) {
    logger.warn(MODULE_NAME, 'Invalid commits input (not an array)', { 
      commitsType: typeof commits, 
      isNull: commits === null 
    });
    return [];
  }

  // Map and transform with safety checks on all properties
  return commits.map((commit, index) => {
    try {
      // Safety check - ensure commit is an object
      if (!commit || typeof commit !== 'object') {
        logger.warn(MODULE_NAME, 'Invalid commit object (not an object)', { 
          commitIndex: index,
          commitType: typeof commit 
        });
        return createEmptyCommit();
      }

      // Generate a safe SHA (required field)
      const sha = typeof commit.sha === 'string' && commit.sha.trim() !== '' 
        ? commit.sha 
        : `unknown-${Math.random().toString(36).substring(2, 9)}`;

      // Extract HTML URL (optional)
      const htmlUrl = typeof commit.html_url === 'string' && commit.html_url.trim() !== ''
        ? commit.html_url
        : (typeof commit.url === 'string' ? commit.url : undefined);

      // Handle both GitHub API commit shape and MinimalCommit shape
      let commitMessage: string;
      let authorName: string;
      let authorDate: string;

      // Handle GitHub API commit shape (commit.commit.message)
      if (commit.commit && typeof commit.commit === 'object') {
        // Get message from commit.commit.message (or fallback)
        commitMessage = typeof commit.commit.message === 'string' && commit.commit.message.trim() !== ''
          ? commit.commit.message
          : 'No commit message available';

        // Get author from commit.commit.author (or fallback)
        const commitAuthor = commit.commit.author && typeof commit.commit.author === 'object'
          ? commit.commit.author
          : null;

        authorName = commitAuthor && typeof commitAuthor.name === 'string' && commitAuthor.name.trim() !== ''
          ? commitAuthor.name
          : 'Unknown Author';

        authorDate = commitAuthor && typeof commitAuthor.date === 'string' && commitAuthor.date.trim() !== ''
          ? commitAuthor.date
          : new Date().toISOString();
      } 
      // Handle MinimalCommit shape from optimize.ts (message, author_name, author_date)
      else {
        commitMessage = typeof commit.message === 'string' && commit.message.trim() !== ''
          ? commit.message
          : 'No commit message available';

        authorName = typeof commit.author_name === 'string' && commit.author_name.trim() !== ''
          ? commit.author_name
          : (typeof commit.authorName === 'string' ? commit.authorName : 'Unknown Author');

        authorDate = typeof commit.author_date === 'string' && commit.author_date.trim() !== ''
          ? commit.author_date
          : (typeof commit.authorDate === 'string' ? commit.authorDate : new Date().toISOString());
      }

      // Handle repository information (if available)
      let repository = undefined;
      
      // Check for repository object
      if (commit.repository && typeof commit.repository === 'object') {
        const repoName = typeof commit.repository.name === 'string' ? commit.repository.name : 'Unknown Repo';
        const repoFullName = typeof commit.repository.full_name === 'string' 
          ? commit.repository.full_name 
          : `unknown/${repoName}`;
        const repoUrl = typeof commit.repository.html_url === 'string' 
          ? commit.repository.html_url 
          : undefined;

        repository = {
          name: repoName,
          full_name: repoFullName,
          html_url: repoUrl
        };
      }
      // Check for repo_name (MinimalCommit format)
      else if (typeof commit.repo_name === 'string' && commit.repo_name.trim() !== '') {
        repository = {
          name: commit.repo_name.split('/').pop() || 'Unknown Repo',
          full_name: commit.repo_name,
          html_url: undefined
        };
      }

      // Handle contributor information (if available)
      let contributor = undefined;
      
      // Direct contributor object
      if (commit.contributor && typeof commit.contributor === 'object') {
        contributor = {
          username: typeof commit.contributor.username === 'string' 
            ? commit.contributor.username 
            : 'unknown',
          displayName: typeof commit.contributor.displayName === 'string' 
            ? commit.contributor.displayName 
            : 'Unknown User',
          avatarUrl: typeof commit.contributor.avatarUrl === 'string' 
            ? commit.contributor.avatarUrl 
            : null
        };
      }
      // GitHub-style author object
      else if (commit.author && typeof commit.author === 'object') {
        contributor = {
          username: typeof commit.author.login === 'string' 
            ? commit.author.login 
            : 'unknown',
          displayName: typeof commit.author.name === 'string' 
            ? commit.author.name 
            : (typeof commit.author.login === 'string' ? commit.author.login : 'Unknown User'),
          avatarUrl: typeof commit.author.avatar_url === 'string' 
            ? commit.author.avatar_url 
            : null
        };
      }
      // Minimal author fields (author_login, author_avatar)
      else if (typeof commit.author_login === 'string' || typeof commit.author_avatar === 'string') {
        contributor = {
          username: typeof commit.author_login === 'string' && commit.author_login.trim() !== '' 
            ? commit.author_login 
            : 'unknown',
          displayName: authorName, // Use the already extracted author name
          avatarUrl: typeof commit.author_avatar === 'string' 
            ? commit.author_avatar 
            : null
        };
      }

      // Return formatted ActivityCommit with all fields properly handled
      return {
        sha,
        html_url: htmlUrl,
        commit: {
          message: commitMessage,
          author: {
            name: authorName,
            date: authorDate
          }
        },
        repository,
        contributor
      };
    } catch (error) {
      // If anything unexpected happens, log and return a safe fallback
      logger.error(MODULE_NAME, 'Error formatting commit object', { 
        error, 
        commitIndex: index,
        commitSha: commit?.sha || 'unknown'
      });
      return createEmptyCommit();
    }
  });
}

/**
 * Creates an empty commit object for fallback when commit data is invalid
 * This ensures the UI always has valid data to display
 */
function createEmptyCommit(): ActivityCommit {
  return {
    sha: `empty-${Math.random().toString(36).substring(2, 9)}`,
    html_url: '#',
    commit: {
      message: 'Unable to load commit details',
      author: {
        name: 'Unknown',
        date: new Date().toISOString()
      }
    }
  };
}

/**
 * Safely extracts an error message from any error object
 * 
 * @param error - Any error object or value
 * @param fallback - Fallback message if error cannot be parsed
 * @returns - A safe string error message
 */
function getSafeErrorMessage(error: unknown, fallback: string = 'An unknown error occurred'): string {
  // Handle Error instances
  if (error instanceof Error) {
    return error.message || fallback;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle error-like objects with message property
  if (error && typeof error === 'object') {
    try {
      const errorObj = error as Record<string, unknown>;
      if ('message' in errorObj && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
      
      // Try to convert to string if it has toString
      if (typeof error.toString === 'function') {
        const errorString = error.toString();
        if (errorString !== '[object Object]') {
          return errorString;
        }
      }
      
      // Stringified JSON as last resort for objects
      return `Error object: ${JSON.stringify(error)}`;
    } catch (e) {
      logger.error(MODULE_NAME, 'Failed to extract error message from object', { error, parseError: e });
    }
  }
  
  return fallback;
}

/**
 * Creates a fetcher function for the ActivityFeed component with robust error handling
 * 
 * @param baseUrl - Base API URL
 * @param params - Additional query parameters
 * @returns - Fetcher function for useProgressiveLoading
 */
export function createActivityFetcher(baseUrl: string, params: Record<string, string>) {
  return async (cursor: string | null, limit: number) => {
    logger.debug(MODULE_NAME, 'Creating activity fetcher', { baseUrl, params, cursor, limit });
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        ...params,
        limit: limit.toString()
      });

      // Add cursor if it exists
      if (cursor) {
        queryParams.append('cursor', cursor);
      }

      const url = `${baseUrl}?${queryParams.toString()}`;
      logger.debug(MODULE_NAME, 'Fetching activity data', { url });

      // Fetch data from API
      let response: Response;
      try {
        response = await fetch(url);
      } catch (networkError) {
        logger.error(MODULE_NAME, 'Network error fetching activity data', { url, error: networkError });
        throw new Error(`Network error: ${getSafeErrorMessage(networkError, 'Failed to connect to server')}`);
      }
      
      // Handle HTTP error responses
      if (!response.ok) {
        logger.warn(MODULE_NAME, 'API returned error response', { 
          status: response.status, 
          statusText: response.statusText,
          url 
        });
        
        // Attempt to parse error from JSON response
        let errorMessage = `Error ${response.status}: ${response.statusText || 'Server error'}`;
        
        try {
          const contentType = response.headers.get('content-type');
          
          // Only try to parse JSON if the content type is JSON
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            
            if (errorData && typeof errorData === 'object') {
              if ('error' in errorData && typeof errorData.error === 'string') {
                errorMessage = errorData.error;
              } else if ('message' in errorData && typeof errorData.message === 'string') {
                errorMessage = errorData.message;
              }
              
              // Log any error codes for debugging
              if ('code' in errorData) {
                logger.error(MODULE_NAME, 'API error with code', { 
                  code: errorData.code,
                  message: errorMessage
                });
              }
            }
          } else {
            // Try to get text response if not JSON
            const textResponse = await response.text();
            if (textResponse && textResponse.length < 100) {
              errorMessage = `${errorMessage}: ${textResponse}`;
            }
          }
        } catch (jsonError) {
          logger.error(MODULE_NAME, 'Failed to parse error response', { 
            jsonError, 
            status: response.status 
          });
          // Keep the default error message
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      let data;
      try {
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
          logger.warn(MODULE_NAME, 'Unexpected content type in response', { 
            contentType, 
            url 
          });
          throw new Error('Server returned a non-JSON response');
        }
        
        data = await response.json();
      } catch (jsonError) {
        logger.error(MODULE_NAME, 'JSON parsing error in response', { jsonError });
        throw new Error('Invalid JSON response from server');
      }
      
      // Validate response data structure
      if (!data || typeof data !== 'object') {
        logger.error(MODULE_NAME, 'Invalid response data structure', { 
          dataType: typeof data,
          isNull: data === null
        });
        throw new Error('Invalid response data structure');
      }
      
      // Check for commits array
      if (!('commits' in data) || !Array.isArray(data.commits)) {
        logger.warn(MODULE_NAME, 'Missing or invalid commits array in response', {
          hasCommits: 'commits' in data,
          commitsType: typeof data.commits
        });
        
        // Return empty data rather than failing
        return {
          data: [],
          nextCursor: null,
          hasMore: false
        };
      }
      
      // Format and return data
      logger.debug(MODULE_NAME, 'Successfully fetched activity data', { 
        commitCount: data.commits.length,
        hasMore: !!data.pagination?.hasMore
      });
      
      try {
        // Wrap the formatting in its own try/catch to handle any potential errors
        const formattedCommits = formatActivityCommits(data.commits || []);
        
        return {
          data: formattedCommits,
          nextCursor: data.pagination?.nextCursor || null,
          hasMore: !!data.pagination?.hasMore
        };
      } catch (formatError) {
        // If formatting fails, log the error and return empty data
        logger.error(MODULE_NAME, 'Error formatting commit data', { formatError });
        return {
          data: [],
          nextCursor: null,
          hasMore: false
        };
      }
    } catch (error) {
      // Centralized error handling to ensure ALL errors have a proper message
      logger.error(MODULE_NAME, 'Error in activity fetcher', { error });
      
      // Create a standardized error with safe message
      const safeErrorMessage = getSafeErrorMessage(error, 'Failed to fetch activity data');
      const standardError = new Error(safeErrorMessage);
      
      // Add additional context for debugging if available
      if (error instanceof Error && error.stack) {
        standardError.stack = error.stack;
      }
      
      throw standardError;
    }
  };
}
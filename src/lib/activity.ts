import { ActivityCommit } from '@/components/ActivityFeed';
import { logger } from '@/lib/logger';

const MODULE_NAME = 'lib:activity';

/**
 * Interface for the raw commit data coming from GitHub API
 */
interface RawGitHubCommit {
  sha?: string;
  html_url?: string;
  url?: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
  author?: {
    login?: string;
    avatar_url?: string;
    name?: string;
  };
  repository?: {
    name?: string;
    full_name?: string;
    html_url?: string;
  };
}

/**
 * Interface for the flat commit format from optimize.ts
 */
interface MinimalRawCommit {
  sha?: string;
  message?: string;
  author_name?: string;
  author_date?: string;
  author_login?: string;
  author_avatar?: string;
  repo_name?: string;
  html_url?: string;
  authorName?: string;
  authorDate?: string;
  url?: string;
}

/**
 * Interface for raw commit with contributor information
 */
interface CommitWithContributor {
  sha?: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
  contributor?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string | null;
  };
  message?: string;
  author_name?: string;
  [key: string]: unknown;
}

/**
 * Union type for all possible raw commit formats
 */
type RawCommit = RawGitHubCommit | MinimalRawCommit | CommitWithContributor;

/**
 * Type guards to check which kind of commit object we're dealing with
 */
function isGitHubCommit(commit: RawCommit): commit is RawGitHubCommit {
  return commit && typeof commit === 'object' && 'commit' in commit;
}

function isMinimalCommit(commit: RawCommit): commit is MinimalRawCommit {
  return commit && typeof commit === 'object' && 
    ('message' in commit || 'author_name' in commit || 'author_date' in commit);
}

function isCommitWithContributor(commit: RawCommit): commit is CommitWithContributor {
  return commit && typeof commit === 'object' && 'contributor' in commit;
}

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
export function formatActivityCommits(commits: RawCommit[]): ActivityCommit[] {
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

      // Handle different commit shapes using type guards
      let commitMessage: string;
      let authorName: string;
      let authorDate: string;

      // Handle GitHub API commit shape (commit.commit.message)
      if (isGitHubCommit(commit)) {
        // Get message from commit.commit.message (or fallback)
        commitMessage = commit.commit?.message && typeof commit.commit.message === 'string' && commit.commit.message.trim() !== ''
          ? commit.commit.message
          : 'No commit message available';

        // Get author from commit.commit.author (or fallback)
        const commitAuthor = commit.commit?.author && typeof commit.commit.author === 'object'
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
      else if (isMinimalCommit(commit)) {
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
      // Handle commit with contributor but no specific shape
      else {
        // Try to extract message from various possible locations
        commitMessage = 'No commit message available';
        if (commit.commit?.message && typeof commit.commit.message === 'string') {
          commitMessage = commit.commit.message;
        } else if (typeof (commit as any).message === 'string') {
          commitMessage = (commit as any).message;
        }

        // Try to extract author name from various possible locations
        authorName = 'Unknown Author';
        if (commit.commit?.author?.name && typeof commit.commit.author.name === 'string') {
          authorName = commit.commit.author.name;
        } else if (typeof (commit as any).author_name === 'string') {
          authorName = (commit as any).author_name;
        } else if (typeof (commit as any).authorName === 'string') {
          authorName = (commit as any).authorName;
        }

        // Try to extract author date from various possible locations
        authorDate = new Date().toISOString();
        if (commit.commit?.author?.date && typeof commit.commit.author.date === 'string') {
          authorDate = commit.commit.author.date;
        } else if (typeof (commit as any).author_date === 'string') {
          authorDate = (commit as any).author_date;
        } else if (typeof (commit as any).authorDate === 'string') {
          authorDate = (commit as any).authorDate;
        }
      }

      // Handle repository information (if available)
      let repository = undefined;
      
      if (isGitHubCommit(commit)) {
        // Check for repository object in GitHub commit
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
      } 
      else if (isMinimalCommit(commit)) {
        // Check for repo_name (MinimalCommit format)
        if (typeof commit.repo_name === 'string' && commit.repo_name.trim() !== '') {
          repository = {
            name: commit.repo_name.split('/').pop() || 'Unknown Repo',
            full_name: commit.repo_name,
            html_url: undefined
          };
        }
      }
      else {
        // For other formats, try both approaches
        if ((commit as any).repository && typeof (commit as any).repository === 'object') {
          const repoObj = (commit as any).repository;
          const repoName = typeof repoObj.name === 'string' ? repoObj.name : 'Unknown Repo';
          repository = {
            name: repoName,
            full_name: typeof repoObj.full_name === 'string' ? repoObj.full_name : `unknown/${repoName}`,
            html_url: typeof repoObj.html_url === 'string' ? repoObj.html_url : undefined
          };
        }
        else if (typeof (commit as any).repo_name === 'string') {
          const repoName = (commit as any).repo_name;
          repository = {
            name: repoName.split('/').pop() || 'Unknown Repo',
            full_name: repoName,
            html_url: undefined
          };
        }
      }

      // Handle contributor information (if available)
      let contributor = undefined;
      
      if (isCommitWithContributor(commit)) {
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
      }
      else if (isGitHubCommit(commit)) {
        // GitHub-style author object
        if (commit.author && typeof commit.author === 'object') {
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
      }
      else if (isMinimalCommit(commit)) {
        // Minimal author fields (author_login, author_avatar)
        if (typeof commit.author_login === 'string' || typeof commit.author_avatar === 'string') {
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
      }
      else {
        // Try various contributor formats for other commit types
        const anyCommit = commit as any;
        
        if (anyCommit.contributor && typeof anyCommit.contributor === 'object') {
          const contribObj = anyCommit.contributor;
          contributor = {
            username: typeof contribObj.username === 'string' ? contribObj.username : 'unknown',
            displayName: typeof contribObj.displayName === 'string' ? contribObj.displayName : 'Unknown User',
            avatarUrl: typeof contribObj.avatarUrl === 'string' ? contribObj.avatarUrl : null
          };
        }
        else if (anyCommit.author && typeof anyCommit.author === 'object') {
          const authorObj = anyCommit.author;
          contributor = {
            username: typeof authorObj.login === 'string' ? authorObj.login : 'unknown',
            displayName: typeof authorObj.name === 'string' 
              ? authorObj.name 
              : (typeof authorObj.login === 'string' ? authorObj.login : 'Unknown User'),
            avatarUrl: typeof authorObj.avatar_url === 'string' ? authorObj.avatar_url : null
          };
        }
        else if (typeof anyCommit.author_login === 'string' || typeof anyCommit.author_avatar === 'string') {
          contributor = {
            username: typeof anyCommit.author_login === 'string' ? anyCommit.author_login : 'unknown',
            displayName: authorName,
            avatarUrl: typeof anyCommit.author_avatar === 'string' ? anyCommit.author_avatar : null
          };
        }
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
      if (typeof (error as Record<string, unknown>).toString === 'function') {
        const errorString = (error as { toString(): string }).toString();
        if (errorString !== '[object Object]') {
          return errorString;
        }
      }
      
      // Stringified JSON as last resort for objects
      return `Error object: ${JSON.stringify(error)}`;
    } catch (e) {
      logger.error(MODULE_NAME, 'Failed to extract error message from object', { 
        error: typeof error, 
        parseError: e instanceof Error ? e.message : String(e) 
      });
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
      } catch (networkError: unknown) {
        logger.error(MODULE_NAME, 'Network error fetching activity data', { 
          url, 
          error: networkError instanceof Error ? networkError.message : String(networkError) 
        });
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
        } catch (jsonError: unknown) {
          logger.error(MODULE_NAME, 'Failed to parse error response', { 
            jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError), 
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
      } catch (jsonError: unknown) {
        logger.error(MODULE_NAME, 'JSON parsing error in response', { 
          jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError) 
        });
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
      } catch (formatError: unknown) {
        // If formatting fails, log the error and return empty data
        logger.error(MODULE_NAME, 'Error formatting commit data', { 
          formatError: formatError instanceof Error ? formatError.message : String(formatError) 
        });
        return {
          data: [],
          nextCursor: null,
          hasMore: false
        };
      }
    } catch (error: unknown) {
      // Centralized error handling to ensure ALL errors have a proper message
      logger.error(MODULE_NAME, 'Error in activity fetcher', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
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
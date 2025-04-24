Okay, I understand the problem. The "Cannot read properties of undefined (reading 'message')" error indicates that somewhere in the error handling chain, we are trying to access the `message` property of a variable that is either `undefined` or an object that doesn't have a `message` property.

Given the flow: API -> `createActivityFetcher` -> `useProgressiveLoading` -> `ActivityFeed`, and the fact that fixes have been attempted in multiple places, the most likely issues are:

1.  **Inconsistent Error Object Structure:** An error is thrown or passed that isn't a standard `Error` object or doesn't conform to the expected structure (e.g., `{ message: '...' }`).
2.  **Error Transformation Issues:** An intermediate step (like the `try...catch` in `SummaryView`) might be catching a well-formed error but then throwing a new, malformed one, or even swallowing the error incorrectly.
3.  **API Response Handling:** The API might return an error response that isn't handled correctly by `createActivityFetcher` (e.g., non-JSON response body on error, or JSON without an `error` field).

Let's systematically fix the chain, ensuring robust error handling at each step.

**1. Ensure APIs Return Consistent Error JSON**

The API routes should consistently return JSON objects with an `error` field when something goes wrong. Let's modify the error handling in the API routes.

```typescript
// /src/app/api/my-activity/route.ts
// ... other imports ...
import { optimizedJsonResponse, generateETag, isCacheValid, notModifiedResponse, CacheTTL } from "@/lib/cache";
import { optimizeCommit, MinimalCommit } from "@/lib/optimize"; // Removed unused optimizeRepository, MinimalRepository
// ...

export async function GET(request: NextRequest) {
  // ... (logging, session check) ...

  if (!session || !session.user) {
    logger.warn(MODULE_NAME, "Unauthorized request - no valid session", { sessionExists: !!session });
    // Use optimizedJsonResponse for consistency
    return await optimizedJsonResponse(request, { error: "Unauthorized", code: "UNAUTHORIZED" }, 401);
  }

  // ... (get params) ...

  try {
    // ... (get user info) ...

    const accessToken = session.accessToken as string;
    const installationId = session.installationId as number;

    if (!accessToken && !installationId) {
      logger.error(MODULE_NAME, "No authentication method available", { hasAccessToken: !!accessToken, hasInstallationId: !!installationId });
      // Use optimizedJsonResponse for consistency
      return await optimizedJsonResponse(request, {
        error: "GitHub authentication required. Please sign in again.",
        code: "GITHUB_AUTH_ERROR"
      }, 401);
    }

    // Fetch repositories
    let repositories: Repository[] = [];
    try {
      repositories = await fetchAllRepositories(accessToken, installationId);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch repositories";
      logger.error(MODULE_NAME, "Error fetching repositories", { errorMessage, error });
      // Use optimizedJsonResponse for consistency
      return await optimizedJsonResponse(request, {
        error: `Error fetching repositories: ${errorMessage}`,
        code: "GITHUB_REPO_ERROR"
      }, 500);
    }

    // ... (filter repos if needed - not in this file, but relevant for others) ...

    // Fetch commits
    let allCommits: Commit[] = [];
    try {
      // ... (fetchCommitsForRepositories call) ...
    } catch (error: any) {
      const errorMessage = error.message || "Failed to fetch commits";
      logger.error(MODULE_NAME, "Error fetching commits", { errorMessage, error });
      // Use optimizedJsonResponse for consistency
      return await optimizedJsonResponse(request, {
        error: `Error fetching commits: ${errorMessage}`,
        code: "GITHUB_COMMIT_ERROR"
      }, 500);
    }

    // ... (process commits, pagination, build response) ...

    // Return successful response
    return await optimizedJsonResponse(request, response, 200, {
      etag,
      maxAge: CacheTTL.SHORT,
      compress: true
    });

  } catch (error: any) {
    const errorMessage = error.message || "An unexpected error occurred processing the request.";
    logger.error(MODULE_NAME, "Unexpected error processing request", { errorMessage, error });
    // Use optimizedJsonResponse for consistency
    return await optimizedJsonResponse(request, {
      error: `An unexpected server error occurred: ${errorMessage}`,
      code: "UNEXPECTED_ERROR"
    }, 500);
  }
}

// ... (helper functions) ...
```

**Apply similar changes to `/src/app/api/my-org-activity/route.ts` and `/src/app/api/team-activity/route.ts`**:

*   Replace `new NextResponse(JSON.stringify({ error: ... }), { status: ... })` with `await optimizedJsonResponse(request, { error: ..., code: ... }, status)`.
*   Ensure *all* error paths generate a meaningful `errorMessage` string before passing it to `optimizedJsonResponse`.
*   Consistently include a `code` field in error responses.

**2. Refine `createActivityFetcher` Error Handling**

This function seems mostly correct, but let's add logging and slightly refine the error messages.

```typescript
// /src/lib/activity.ts
import { ActivityCommit } from '@/components/ActivityFeed';
import { logger } from '@/lib/logger'; // Import logger

const MODULE_NAME = 'lib:activity';

// ... (formatActivityCommits remains the same) ...

export function createActivityFetcher(baseUrl: string, params: Record<string, string>) {
  return async (cursor: string | null, limit: number) => {
    const url = `${baseUrl}?${new URLSearchParams({
      ...params,
      limit: limit.toString(),
      ...(cursor && { cursor }), // More concise way to add cursor
    }).toString()}`;

    logger.debug(MODULE_NAME, 'Fetching activity data', { url });

    try {
      const response = await fetch(url);

      if (!response.ok) {
        let errorData: any = null;
        let errorMessage = `Error ${response.status}: ${response.statusText || 'Failed to fetch activity data'}`;
        let errorCode = `HTTP_${response.status}`;

        try {
          // Attempt to parse error from JSON response
          errorData = await response.json();
          if (errorData && typeof errorData === 'object' && errorData.error) {
            errorMessage = typeof errorData.error === 'string'
              ? errorData.error
              : JSON.stringify(errorData.error); // Handle non-string errors
            if (errorData.code) {
              errorCode = errorData.code;
            }
          }
          logger.warn(MODULE_NAME, 'API request failed with JSON response', { url, status: response.status, errorData });
        } catch (jsonError) {
          // Handle case where response is not valid JSON
          logger.warn(MODULE_NAME, 'API request failed with non-JSON response', { url, status: response.status, statusText: response.statusText });
          // Use the original HTTP status error message
        }
        // Create an error with potentially more info
        const error = new Error(errorMessage);
        (error as any).code = errorCode; // Attach code if available
        throw error;
      }

      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (jsonError: any) {
        logger.error(MODULE_NAME, 'Failed to parse successful JSON response', { url, error: jsonError.message });
        throw new Error('Invalid response format from server');
      }

      // Validate response data structure
      if (!data || typeof data !== 'object' || !Array.isArray(data.commits) || typeof data.pagination !== 'object') {
         logger.error(MODULE_NAME, 'Invalid response data structure', { url, responseData: data });
         throw new Error('Invalid response data structure from server');
      }

      logger.debug(MODULE_NAME, 'Successfully fetched activity data', { url, count: data.commits.length, hasMore: data.pagination?.hasMore });

      return {
        data: formatActivityCommits(data.commits || []),
        nextCursor: data.pagination?.nextCursor || null,
        hasMore: data.pagination?.hasMore || false
      };
    } catch (error) {
      // Ensure all errors propagated from here are actual Error instances with a message
      if (error instanceof Error) {
        logger.error(MODULE_NAME, `Error during activity fetch for ${url}`, { errorMessage: error.message, code: (error as any).code, stack: error.stack });
        throw error; // Re-throw the original Error object
      } else {
        // This case should be less likely now, but handle defensively
        const errorMessage = 'An unexpected error occurred while fetching activity data';
        logger.error(MODULE_NAME, `Caught non-Error exception during activity fetch for ${url}`, { error });
        throw new Error(errorMessage);
      }
    }
  };
}
```

**3. Strengthen `useProgressiveLoading` Error Handling**

The `getErrorMessage` function is key here. Let's make it even more robust and add logging.

```typescript
// /src/hooks/useProgressiveLoading.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger'; // Import logger

const MODULE_NAME = 'hooks:useProgressiveLoading';

// ... (types remain the same) ...

/**
 * Helper function to safely extract error messages from various error types
 */
function getErrorMessage(error: unknown): string {
  const defaultErrorMessage = 'An unexpected error occurred while loading data.';

  if (error instanceof Error) {
    // Standard Error objects - use message if available, otherwise default
    return error.message || defaultErrorMessage;
  }

  if (error && typeof error === 'object') {
    // Check for common error properties
    if ('message' in error && typeof error.message === 'string' && error.message.trim() !== '') {
      return error.message;
    }
    if ('error' in error && typeof error.error === 'string' && error.error.trim() !== '') {
      return error.error; // Handle cases where API returns { error: '...' } directly
    }
    // Fallback for objects without a clear message
    logger.warn(MODULE_NAME, 'Received error object without standard message property', { errorObject: JSON.stringify(error) });
    return defaultErrorMessage;
  }

  if (typeof error === 'string' && error.trim() !== '') {
    // String errors
    return error;
  }

  // Log unexpected error types
  logger.warn(MODULE_NAME, 'Received unknown error type', { errorType: typeof error, errorValue: error });
  return defaultErrorMessage; // Final fallback
}


export function useProgressiveLoading<T>(
  fetchFn: FetchFunction<T>,
  options: ProgressiveLoadingOptions = {}
) {
  // ... (state, refs, options destructuring remain the same) ...

  const loadInitialData = useCallback(async () => {
    // ... (loading state updates) ...
    loadingRef.current = true;

    try {
      // ... (call fetchFn) ...
      setState({
        items: data,
        loading: false, initialLoading: false, incrementalLoading: false,
        hasMore,
        error: null
      });
      nextCursorRef.current = nextCursor || null;
      logger.debug(MODULE_NAME, 'Initial data loaded successfully', { itemCount: data.length, hasMore });
    } catch (error) {
      const errorMessage = getErrorMessage(error); // Use the robust helper
      setState(prev => ({
        ...prev,
        loading: false, initialLoading: false, incrementalLoading: false,
        error: errorMessage // Store the extracted message string
      }));
      // Log the original error object AND the extracted message for comparison
      logger.error(MODULE_NAME, 'Error in loadInitialData', { extractedMessage: errorMessage, originalError: error });
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFn, initialLimit]);

  const loadMore = useCallback(async () => {
    // ... (loading state updates) ...
    loadingRef.current = true;

    try {
      // ... (call fetchFn) ...
      setState(prev => ({
        items: [...prev.items, ...data],
        loading: false, initialLoading: false, incrementalLoading: false,
        hasMore,
        error: null
      }));
      nextCursorRef.current = nextCursor || null;
      logger.debug(MODULE_NAME, 'More data loaded successfully', { addedCount: data.length, totalCount: state.items.length + data.length, hasMore });
    } catch (error) {
      const errorMessage = getErrorMessage(error); // Use the robust helper
      setState(prev => ({
        ...prev,
        loading: false, initialLoading: false, incrementalLoading: false,
        error: errorMessage // Store the extracted message string
      }));
      // Log the original error object AND the extracted message
      logger.error(MODULE_NAME, 'Error in loadMore', { extractedMessage: errorMessage, originalError: error });
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFn, additionalItemsPerPage, state.hasMore, state.items]); // Added state.items dependency

  // ... (reset function remains the same) ...

  return {
    ...state,
    loadInitialData,
    loadMore,
    reset
  };
}
```

**4. Simplify `SummaryView` Error Handling**

The `loadCommits` function passed to `ActivityFeed` should *not* have its own `try...catch`. It should let errors from `createActivityFetcher` propagate naturally to `useProgressiveLoading`.

```typescript
// /src/components/dashboard/SummaryView.tsx
import React from 'react';
import ActivityFeed from '@/components/ActivityFeed';
import SummaryStats from '@/components/dashboard/SummaryStats';
import SummaryDetails from '@/components/dashboard/SummaryDetails';
import { createActivityFetcher } from '@/lib/activity';
import { ActivityMode, CommitSummary, DateRange, FilterState } from '@/types/dashboard';
import { logger } from '@/lib/logger'; // Import logger

const MODULE_NAME = 'components:SummaryView';

// ... (SummaryViewProps interface remains the same) ...

const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  activityMode,
  dateRange,
  activeFilters,
  installationIds,
  loading = false
}) => {
  if (!summary) return null;

  // Define the loadCommits function *outside* the JSX for clarity
  const loadCommitsForFeed = React.useCallback(async (cursor: string | null, limit: number) => {
    // No try...catch here! Let errors propagate.

    // Build appropriate parameters based on current mode
    const params: Record<string, string> = {
      since: dateRange.since,
      until: dateRange.until
    };

    // Add organization filter if applicable
    if (activeFilters.organizations.length > 0) {
      params.organizations = activeFilters.organizations.join(',');
    }

    // If installation IDs available, include them
    if (installationIds.length > 0) {
      params.installation_ids = installationIds.join(',');
    }

    // Determine which API endpoint to use based on the current mode
    let apiEndpoint = '/api/my-activity';
    if (activityMode === 'my-work-activity') {
      apiEndpoint = '/api/my-org-activity';
    } else if (activityMode === 'team-activity') {
      apiEndpoint = '/api/team-activity';
    }

    // Log the attempt to create the fetcher
    logger.debug(MODULE_NAME, 'Creating activity fetcher', { apiEndpoint, params });

    // Create and use the fetcher
    const fetcher = createActivityFetcher(apiEndpoint, params);
    // The fetcher itself handles errors and throws Error instances
    // useProgressiveLoading will catch these and extract the message
    return await fetcher(cursor, limit);

  }, [activityMode, dateRange, activeFilters.organizations, installationIds]); // Dependencies for useCallback

  return (
    <div className="mt-8 border rounded-lg p-6" style={{ /* styles */ }}>
      {/* Terminal-like header */}
      {/* ... */}

      {/* Activity Feed */}
      {/* Check if summary.commits exists before rendering the feed section */}
      {/* The feed itself handles its own loading/empty states */}
      <div className="mb-8">
        <div className="flex items-center mb-3">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--electric-blue)' }}></div>
          <h3 className="text-sm uppercase" style={{ color: 'var(--electric-blue)' }}>
            COMMIT ACTIVITY
          </h3>
        </div>

        <ActivityFeed
          // Pass the simplified loadCommits function
          loadCommits={loadCommitsForFeed}
          useInfiniteScroll={true}
          initialLimit={30}
          additionalItemsPerPage={20}
          showRepository={true}
          showContributor={activityMode === 'team-activity'}
          emptyMessage={`No ${activityMode.replace('-', ' ')} data found for the selected filters.`}
          // The default errorMessage in ActivityFeed is fine, as useProgressiveLoading provides the specific message
        />
      </div>


      {/* Stats dashboard */}
      <SummaryStats summary={summary} className="mb-8" />

      {/* AI Summary */}
      {summary.aiSummary && (
        <SummaryDetails aiSummary={summary.aiSummary} />
      )}
    </div>
  );
};

export default SummaryView;
```

**5. Review `ActivityFeed` Error Display**

The existing error display logic in `ActivityFeed.tsx` looks correct. It receives the `error` state (which is now guaranteed to be a string or null by `useProgressiveLoading`) and displays it.

```typescript
// /src/components/ActivityFeed.tsx
// ... imports ...

export default function ActivityFeed({
  // ... props ...
  errorMessage = 'Failed to load activity data. Please try again.', // Default prefix
  // ... other props
}: ActivityFeedProps) {
  const {
    // ... other state from useProgressiveLoading ...
    error,
    // ...
  } = useProgressiveLoading<ActivityCommit>(loadCommits, { /* options */ });

  // ... other hooks and logic ...

  // Handle error states
  if (error) {
    // 'error' is guaranteed to be a string here by useProgressiveLoading
    // Concatenate the generic prefix with the specific error message
    const fullErrorMessage = `${errorMessage}${error ? `: ${error}` : ''}`;

    return (
      <div className="p-4 rounded-md border" style={{ /* error styles */ }}>
        <div className="flex items-start">
          {/* Error Icon */}
          <svg className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {/* Display the combined message */}
          <div>{fullErrorMessage}</div>
        </div>
      </div>
    );
  }

  // ... rest of the component (empty state, loading state, list rendering) ...
}
```

**Summary of Changes:**

1.  **APIs:** Consistently return JSON `{ error: "message", code: "..." }` on failure using `optimizedJsonResponse`.
2.  **`createActivityFetcher`:** Improved error parsing from API responses, added logging, ensures it throws standard `Error` objects with messages (and potentially codes).
3.  **`useProgressiveLoading`:** Enhanced `getErrorMessage` to handle various error types more robustly, added logging, ensures the `error` state is always a string or null.
4.  **`SummaryView`:** Removed the redundant `try...catch` within the `loadCommits` prop, allowing errors from `createActivityFetcher` to propagate directly to `useProgressiveLoading`.
5.  **`ActivityFeed`:** Confirmed its error display logic is sound given the guarantees from `useProgressiveLoading`.

These changes establish a clearer, more robust error handling flow where each layer has specific responsibilities: APIs format errors consistently, `createActivityFetcher` handles HTTP/parsing issues and normalizes errors, `useProgressiveLoading` catches these errors and extracts a display message for the state, and `ActivityFeed` displays that message. This should eliminate the "Cannot read properties of undefined (reading 'message')" error.
# Known Bugs and Issues

This document lists known bugs, issues, and limitations in the GitPulse application, along with investigation status and potential solutions.

## Active Issues

### B001 - ActivityFeed Error Handling Issue

**Description:**  
When loading commits in the activity feed, users sometimes see the error: "Failed to load activity data. Please try again.: Cannot read properties of undefined (reading 'message')". The activity feed shows a loading spinner that never completes, and eventually displays this error.

**Status:** Fixed

**Investigation:**  
- The error appeared to be related to error handling in the `ActivityFeed` component
- When an API error occurs, the error handling in `createActivityFetcher` function attempted to read the `message` property from an error response
- If the response was not in valid JSON format or if the structure wasn't as expected, the error handling code failed with "Cannot read properties of undefined"
- The issue was in how errors were propagated through the `useProgressiveLoading` hook to the component

**Fix Implemented:**  
1. Completely refactored error handling in `createActivityFetcher` to:
   - Add try/catch blocks around all async operations
   - Handle non-JSON responses gracefully
   - Properly validate response data structure
   - Ensure all errors have proper messages

2. Enhanced the `useProgressiveLoading` hook with:
   - A dedicated `getErrorMessage` helper function to safely extract error messages
   - Consistent error handling across all catch blocks
   - Detailed error logging for debugging
   - Type-safe error handling for various error types

3. Updated the `ActivityFeed` component to:
   - Sanitize error messages before display
   - Handle null/undefined error messages gracefully
   - Format error message display to avoid undefined access issues

4. Added comprehensive error handling to `SummaryView`'s `loadCommits` function:
   - Detailed error logging with stack traces
   - Proper error message extraction from different error types
   - Consistent error propagation

**Result:**
The ActivityFeed now handles all error cases gracefully, including:
- Invalid API responses
- Non-JSON error responses
- Network errors
- Unexpected data structures
- Null or undefined error messages

No more "Cannot read properties of undefined" errors should occur, as all potential error paths have proper fallbacks.

**Monitoring:**
We should continue to monitor error rates after deployment and consider adding more unit tests for these error paths in a future task.

## Resolved Issues

### B001 - ActivityFeed Error Handling Issue
Fixed in commit for task T031. Implemented comprehensive error handling throughout the activity data loading workflow.
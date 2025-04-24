# Known Bugs and Issues

This document lists known bugs, issues, and limitations in the GitPulse application, along with investigation status and potential solutions.

## Active Issues

### B001 - ActivityFeed Error Handling Issue

**Description:**  
When loading commits in the activity feed, users sometimes see the error: "Failed to load activity data. Please try again.: Cannot read properties of undefined (reading 'message')". The activity feed shows a loading spinner that never completes, and eventually displays this error.

**Status:** Partially Fixed (awaiting testing)

**Investigation:**  
- The error appears to be related to error handling in the `ActivityFeed` component
- When an API error occurs, the current error handling in `createActivityFetcher` function attempts to read the `message` property from an error response
- If the response is not in valid JSON format or if the structure isn't as expected, the error handling code fails with "Cannot read properties of undefined"
- The issue is likely in how we propagate errors through the `useProgressiveLoading` hook to the component

**Attempted Fix:**  
1. Updated `ActivityFeed` component to handle null error messages
2. Improved error handling in `createActivityFetcher` to catch JSON parsing errors
3. Added additional error handling in `SummaryView` component's `loadCommits` function
4. Made error display more robust to handle undefined error messages

**Next Steps:**  
- Test the fixes in various error scenarios
- Consider adding more comprehensive error logging
- Monitor error rates after deployment
- Add unit tests for error handling paths

## Resolved Issues

No issues have been marked as resolved yet.
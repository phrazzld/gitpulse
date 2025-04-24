# T031 - Fix ActivityFeed Error Handling

## Problem Analysis

After reviewing the codebase, I've found that the "Cannot read properties of undefined (reading 'message')" error is occurring because:

1. When the API returns an error, the error formatting might break if:
   - The API response is not valid JSON
   - The error response doesn't have the expected structure
   - An unexpected error type is passed through the chain

2. The current error handling in `createActivityFetcher` has been improved to handle JSON parsing errors, but there are still edge cases that might lead to undefined values being passed along.

3. The error propagation chain:
   ```
   API → createActivityFetcher → useProgressiveLoading → ActivityFeed
   ```
   Is not consistently handling all types of errors at every step.

## Fix Plan

The key to resolving this issue is implementing consistent error handling throughout the entire chain:

1. In `lib/activity.ts`:
   - Refactor error handling to ensure ALL errors have a valid message
   - Add type guards to validate error objects before accessing properties
   - Create a standardized error format for consistency

2. In `hooks/useProgressiveLoading.ts`:
   - Enhance error message extraction to safely handle ANY type of error
   - Always provide a fallback error message if extraction fails
   - Ensure error.message is never undefined before setting state

3. In `components/ActivityFeed.tsx`:
   - Create a safer error display mechanism that never accesses undefined properties
   - Validate the error message before rendering
   - Add defensive code to handle all possible error states

4. In `components/dashboard/SummaryView.tsx`:
   - Add comprehensive error normalization before propagation
   - Log detailed error information for debugging
   - Transform all error types into a consistent format

## Implementation Approach

1. Start with the deepest point in the chain (lib/activity.ts)
2. Work upward through each layer, ensuring robust error handling
3. Add extensive guards and validation at each step
4. Use TypeScript type guards to ensure type safety
5. Provide fallback mechanisms for all potential edge cases
6. Test each layer independently to ensure it handles invalid inputs

This approach will ensure that no matter what type of error occurs at any point in the chain, it will be properly formatted and safely displayed to the user without causing secondary errors.
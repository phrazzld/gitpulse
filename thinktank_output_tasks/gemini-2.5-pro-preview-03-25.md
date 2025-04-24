Okay, here are the generated tasks based on the `CONSULTANT-PLAN.md` analysis, formatted for `TODO.md` and continuing the numbering from T031.

```markdown
**T032 - Refactor `formatActivityCommits` for Robustness**
*   Analyze potential variations and missing properties in commit data structures based on the error and code context.
*   Rewrite `formatActivityCommits` in `lib/activity.ts` to defensively handle potentially missing or malformed properties (e.g., `commit.commit`, `commit.commit.message`, `commit.author`, `commit.committer`).
*   Use optional chaining (`?.`) and nullish coalescing (`??`) or explicit checks (`if (commit && commit.commit)`) to prevent runtime errors.
*   Provide sensible default values (e.g., "Unknown Message", "Unknown Author") if critical properties are missing, ensuring the function always returns a valid `FormattedCommitInfo`.
*   Add JSDoc comments explaining the expected structure and the defensive measures taken.
*   Status: Not Started
*   Estimate: Medium
*   Depends On:

**T033 - Add Specific Error Handling in `createActivityFetcher`**
*   In `lib/activity.ts`, locate the call to `formatActivityCommits` within `createActivityFetcher`.
*   Wrap this specific call in its own `try...catch` block.
*   If an error occurs during formatting (caught by the new `try...catch`), log the original error details (including the problematic data if possible without exposing sensitive info) using the logger module at an appropriate level (e.g., `WARN` or `ERROR`).
*   Instead of re-throwing the raw error, throw a new, standardized error (e.g., `new Error('Failed to format commit data. Some activity items may be incomplete.')`) to provide a user-friendlier message upstream.
*   Ensure existing network/parsing error handling in `createActivityFetcher` remains intact and also logs appropriately.
*   Status: Not Started
*   Estimate: Small
*   Depends On: T032

**T034 - Enhance Error Handling in `useProgressiveLoading` Hook**
*   In `hooks/useProgressiveLoading.ts`, implement a robust utility function (e.g., `getErrorMessage(error: unknown): string`) that can accept any type of error (`unknown`) and return a safe, displayable string message.
    *   This function should check `error.message`, handle plain strings, and provide a generic fallback like "An unexpected error occurred."
*   Modify the `catch` block(s) within the hook's data fetching logic.
*   Call the new `getErrorMessage` utility to process any caught error before setting the `error` state.
*   Ensure the `setError` state update always receives a valid string, preventing the `error` state itself from being `null` or `undefined` when an error condition exists.
*   Add detailed logging within the `catch` block using the logger module, capturing the raw error before normalization.
*   Status: Not Started
*   Estimate: Medium
*   Depends On: T033

**T035 - Simplify Error Handling in `SummaryView.tsx`**
*   Review the error handling logic within `SummaryView.tsx`.
*   Identify and remove any redundant `try...catch` blocks that simply re-wrap or re-process errors already handled by the `useProgressiveLoading` hook.
*   Allow errors caught and processed by the hook (T034) to propagate naturally to the component's state.
*   Ensure the component correctly uses the `error` state provided by the hook for conditional rendering or display.
*   Status: Not Started
*   Estimate: Small
*   Depends On: T034

**T036 - Ensure Safe Error Display in `ActivityFeed.tsx`**
*   In `ActivityFeed.tsx`, locate where the `error` state from the `useProgressiveLoading` hook is displayed.
*   Add explicit checks to ensure the `error` object/value exists and has the expected `message` property (or is directly a string, based on T034 implementation) before attempting to access or display it.
*   Use the safely extracted error message (guaranteed to be a string by T034) for display.
*   Update the display logic to show the error message cleanly, removing any concatenation that might fail if parts are undefined.
*   Action: Mark T031 as Completed [x]
*   Status: Not Started
*   Estimate: Small
*   Depends On: T034
```
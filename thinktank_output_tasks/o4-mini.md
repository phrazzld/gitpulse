**T032 - Enhance `formatActivityCommits` with Defensive Coding**  
- Actions:  
  - Open `lib/activity.ts` and locate the `formatActivityCommits` function  
  - Use optional chaining (e.g. `commit.commit?.message`) for all nested property accesses  
  - Normalize incoming commit shapes: skip or sanitize entries where `commit.commit` is missing  
  - Provide a fallback string (e.g. `"No commit message available"`) when message is undefined  
  - Add or update unit tests in `lib/activity.spec.ts` to cover malformed commit objects  
- Status: Not Started  
- Estimate: Medium  
- Depends On: T031  

**T033 - Wrap `formatActivityCommits` Call in Error-Transforming Try/Catch**  
- Actions:  
  - In `lib/activity.ts`, find `createActivityFetcher` and its invocation of `formatActivityCommits`  
  - Surround `formatActivityCommits` with a `try/catch` block  
  - Catch `TypeError` and rethrow a new `Error("Invalid data format for activity commits")`  
  - Allow non-`TypeError` exceptions to bubble up unchanged  
- Status: Not Started  
- Estimate: Small  
- Depends On: T032  

**T034 - Add Structured Logging to `createActivityFetcher`**  
- Actions:  
  - Import the project’s `logger` module into `lib/activity.ts`  
  - Log a DEBUG entry before the fetch begins and after a successful format  
  - In the catch block, log an ERROR with context (`correlationId`, error stack)  
  - Ensure log entries include `timestamp`, `level`, `message`, and relevant IDs  
- Status: Not Started  
- Estimate: Small  
- Depends On: T033  

**T035 - Improve Error Message Extraction in `useProgressiveLoading`**  
- Actions:  
  - Open `hooks/useProgressiveLoading.ts`  
  - Implement a `getErrorMessage(error: unknown): string` helper that:  
    • Returns `error.message` if available and a string  
    • Otherwise, safely stringifies the error or returns `"An unexpected error occurred"`  
  - Use this helper when setting the hook’s error state to guarantee a non-empty string  
  - Add unit tests in `useProgressiveLoading.spec.ts` to cover various error shapes (string, object, null)  
- Status: Not Started  
- Estimate: Medium  
- Depends On: T034  

**T036 - Simplify Error Flow in `SummaryView`**  
- Actions:  
  - Open `components/SummaryView.tsx`  
  - Remove any redundant `try/catch` around the fetcher call in the render logic  
  - Ensure errors from the fetcher are handled only by `useProgressiveLoading`  
  - Update or remove related tests to reflect the simplified flow  
- Status: Not Started  
- Estimate: Small  
- Depends On: T035  

**T037 - Safely Display Error Messages in `ActivityFeed`**  
- Actions:  
  - Open `components/ActivityFeed.tsx`  
  - Before accessing `error.message`, use optional chaining or the `getErrorMessage` helper from the hook  
  - Provide a UI fallback (e.g. `"Unknown error"`) if the message is still empty  
  - Add component tests (`ActivityFeed.spec.tsx`) to verify the UI doesn’t crash when `error` is undefined or has no `message`  
- Status: Not Started  
- Estimate: Medium  
- Depends On: T036  

**T038 - Mark Original Task T031 as Completed**  
- Actions:  
  - In the TODO.md entry for T031, add the line:  
    - “Mark T031 as Completed [x]”  
  - Change `Status:` of T031 to `Completed`  
- Status: Not Started  
- Estimate: Small  
- Depends On: T037
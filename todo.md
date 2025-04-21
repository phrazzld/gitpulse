# Todo Tasks for CI Fix

## State Management with Zustand

- [x] **T000: Set up Zustand as application state manager**
  - Install Zustand package: `npm install zustand`
  - Create a state store directory structure at `src/state`
  - Create initial store configuration in `src/state/store.ts`
  - Implement core types in `src/state/types.ts`
  - Create an example store slice for dashboard state
  - Add utility hooks in `src/state/hooks.ts` for accessing store state
  - Document Zustand usage patterns in `docs/state-management.md`
  - Update relevant components to demonstrate Zustand pattern
  - **Depends On:** None
  - **Priority:** High - foundation for dashboard state refactoring

## `useActivityData` Hook Test Failures

- [x] **Fix "hasMore" Flag Issue**

  - Examine how `hasMore` is set in `src/hooks/useActivityData.ts`
  - Debug why `result.current.hasMore` is `false` when it should be `true` after first page load
  - Update implementation to set correct `hasMore` value based on API response
  - Verify fix resolves the test "should handle load more correctly"

- [x] **Fix Error State Handling**

  - Inspect error handling logic in `src/hooks/useActivityData.ts`
  - Debug why error message isn't being set (currently `null` instead of expected value)
  - Update error handler to properly set error state with message from API
  - Verify fix resolves the test "should handle error states correctly"

- [x] **Resolve Mock Function Call Count Issue**

  - Identify why `mockFetcherFn` is being called 79 times instead of 2
  - Check useEffect dependency arrays for potential infinite loops
  - Ensure proper mock reset between test cases
  - Update implementation to prevent excessive function calls
  - Verify fix resolves the test "should reset state when dependencies change"

- [x] **Fix Loading State in Reset Method**

  - Review the reset method implementation in `src/hooks/useActivityData.ts`
  - Debug why `loading` state is `true` when it should be `false` after reset
  - Ensure reset method properly resets all state properties including loading
  - Verify fix resolves the test "should reset data when calling reset method"

- [x] **Update Test Async Handling**

  - Review all async operations in the tests
  - Add proper await/act wrapping for all state updates
  - Ensure tests wait for all state transitions before assertions
  - Update any race conditions in the test suite

- [x] **Verify Full Test Suite**

  - Run complete test suite locally after all fixes
  - Ensure no regressions in other tests
  - Run lint and type checks before committing changes
  - Document any intentional behavior changes

- [x] **Create PR with Fixes**
  - Commit changes with descriptive message
  - Push changes to feature branch
  - Verify CI passes with all tests

## GitHub Setup Validation Tests

- [x] **Update GitHub setup validation tests to expect 307 status code**

  - File: `src/__tests__/api/validation/github-setup.test.ts`
  - Change `expect(response.status).toBe(302)` to `expect(response.status).toBe(307)` in the following tests:
    - "should redirect with error for non-integer installation IDs"
    - "should redirect with error for negative installation IDs"
    - "should redirect with error for non-numeric installation IDs"
    - "should redirect with error for missing installation ID"
    - "should redirect to homepage when no session exists"
  - Add a comment explaining why we expect 307 instead of 302 for Next.js redirects

- [x] **Verify tests pass with updated status code expectations**

  - Run the GitHub setup validation tests
  - Ensure all tests pass with the updated expectations
  - Run the full test suite to check for any regressions

- [x] **Commit and push changes**
  - Create a clear commit message explaining the fix
  - Push changes to feature branch
  - Verify CI passes with all tests

## New CI Failure: Missing ActivityFeedComponents Module

- [x] **Fix ActivityFeedComponents Test**

  - File: `src/components/dashboard/__tests__/ActivityFeedComponents.test.tsx`
  - Issue: The test is trying to import from a non-existent '../ActivityFeedComponents'
  - Created a barrel file to export the components from their actual locations
  - Verified test passes with the new exports

- [x] **Commit and push changes**
  - Created a commit specifically for this fix
  - Pushed changes to feature branch
  - Will verify CI passes with all tests

## Maximum Update Depth Bug Fix

- [ ] **T001: Consolidate dashboard state into a single state object**

  - In `src/app/dashboard/dashboardHooks.ts`, refactor the `useDashboardState` hook
  - Replace individual useState calls with a single consolidated state object
  - Create or update `DashboardState` TypeScript interface
  - Ensure all previously tracked state is included in the new object
  - **Depends On:** None
  - **AC Ref:** None

- [ ] **T002: Refactor handleRepositoryFetchSuccess to use single state update**

  - In `src/app/dashboard/dashboardHooks.ts`, update `handleRepositoryFetchSuccess`
  - Replace multiple sequential setState calls with a single setDashboardState call
  - Make sure all properties (repositories, authMethod, installationIds, etc.) are updated
  - Include proper null/undefined handling for optional values
  - **Depends On:** T001
  - **AC Ref:** None

- [ ] **T003: Memoize authentication and installation error handlers**

  - Identify any callback functions like `handleAuthError` and `handleAppInstallationNeeded`
  - Wrap them in useCallback with minimal dependency arrays
  - Ensure they maintain stable references across renders
  - **Depends On:** T001
  - **AC Ref:** None

- [ ] **T004: Update fetchRepositories to use consolidated state**

  - Update the useCallback for fetchRepositories
  - Remove individual state setters from dependencies
  - Replace them with the single setDashboardState
  - Verify fetchRepositories still calls handleRepositoryFetchSuccess correctly
  - **Depends On:** T002, T003
  - **AC Ref:** None

- [ ] **T005: Update dashboard page components to use consolidated state**

  - In `src/app/dashboard/page.tsx`, update code to use the new dashboardState
  - Destructure needed values from dashboardState
  - Review useEffect dependency arrays and remove any unnecessary dependencies
  - Clean up unused imports and variables
  - **Depends On:** T004
  - **AC Ref:** None

- [ ] **T006: Verify the fix resolves the infinite update loop**
  - Run the application locally
  - Monitor the console for the "Maximum update depth exceeded" error
  - Verify repository data loads correctly
  - Test various user interactions to ensure no rendering issues
  - Document verification steps and results
  - **Depends On:** T005
  - **AC Ref:** None

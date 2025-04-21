# Todo Tasks for CI Fix

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

# CI Failure Summary

## PR Information
- **PR #19**: Implement Atomic Design pattern and Storybook integration
- **Branch**: feature/atomic-design-storybook
- **Date**: 2025-05-16
- **Status**: 2 Failed Checks, 1 Passing Check

## Failed Checks

### 1. build-and-test

#### Error Details
Multiple test suites failed with a total of 19 test failures:

**Test Summary:**
- 6 test suites failed
- 35 test suites passed
- 19 tests failed
- 1 test skipped
- 350 tests passed
- Total: 370 tests

**Failed Test Suites:**
1. `src/app/api/summary/__tests__/handlers.test.ts`
2. `src/lib/github/__tests__/repositories.test.ts`
3. `src/lib/github/__tests__/auth.test.ts`
4. `src/lib/github/__tests__/utils.test.ts`
5. `src/lib/github/__tests__/commits.test.ts`
6. `scripts/__tests__/check-a11y-staged-stories.test.js`

**Key Failures:**

1. **Summary API Handlers**
   - `fetchCommitsWithAuthMethod` tests failing
   - Expected `fetchCommitsForRepositories` to be called 2 times, but was called 0 times
   - Test for "me" special case failing - expected 1 commit but received 3

2. **GitHub Modules**
   - Authentication validation tests failing
   - Repository fetching tests showing mock/spy setup issues
   - Commit fetching tests showing promise rejection issues
   - Utils error formatting tests failing

3. **Pre-commit Script**
   - `detectStagedStoryFiles` test failing - expected array of files but received empty array

### 2. storybook-a11y

#### Error Details
Multiple accessibility test failures with 22 failed tests:

**Test Summary:**
- 3 test suites failed
- 3 test suites passed
- 22 tests failed
- 24 tests passed
- Total: 46 tests

**Component Failures:**
- `LoadMoreButton` stories
- `ModeSelector` stories
- `OperationsPanel` stories

#### Common Issues
- Color contrast failures
- Interactive element accessibility violations
- Button name accessibility issues

## Passing Checks

### Playwright E2E Tests
- All end-to-end tests pass successfully

## Root Cause Analysis

1. **Build-and-test failures**:
   - Appear to be related to mock/spy setup in Jest tests
   - Some tests are expecting functions to be called but the mocks aren't properly configured
   - The new pre-commit script test needs adjustment for detecting staged files correctly

2. **Storybook-a11y failures**:
   - Despite recent color contrast fixes, accessibility violations persist
   - Components still have color contrast issues
   - The atomic design migration may have affected accessibility configurations

## Technical Context
- Recent commits show work on accessibility improvements
- Atomic design pattern implementation is in progress
- Pre-commit hooks were recently added for accessibility checking

## Impact
- PRs cannot be merged until these failures are resolved
- Unit tests need mock/spy fixes
- Accessibility violations must be addressed
- Pre-commit script tests need correction
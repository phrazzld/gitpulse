# TASK-047: Address TypeScript/linter suppressions by fixing underlying issues

## Overview

This plan outlines the approach to fix the 40 TypeScript and ESLint suppressions identified in TASK-046 across 11 files. The goal is to remove all suppressions by properly addressing the underlying type and linting issues.

## Implementation Strategy

We'll address the suppressions by category, starting with the most common patterns and highest-priority issues:

### 1. Test-related Mock Function Suppressions (24 instances) ✅

The most common pattern is `@ts-ignore - Work around TypeScript not handling jest.fn() return types properly` in test utility files.

**Solution:** ✅
1. ✅ Created proper type definitions for Jest mock functions
2. ✅ Implemented a typed mock factory utility
3. ✅ Updated all occurrences to use the new typed approach

**Files modified:**
- ✅ src/lib/tests/github-test-utils.ts (14 instances)
- ✅ src/lib/tests/network-test-utils.ts (10 instances)

**Implementation details:**
- Created `typed-mock-utils.ts` with utilities for type-safe Jest mocks
- Created `github-module-types.ts` and `network-module-types.ts` with interfaces for proper typing
- Replaced all `@ts-ignore` comments with proper TypeScript typing

### 2. External Library Type Issues (5 instances) ✅

Types related to Octokit API in GitHub functionality and NextAuth callbackUrl:

**Solution:** ✅
1. ✅ Created proper type definitions that match the actual API usage
2. ✅ For NextAuth, created a proper extension via GitHubProviderCallbackConfig
3. ✅ For Octokit, created utility types to handle the API response variations

**Files modified:**
- ✅ src/lib/auth/authConfig.ts (1 instance)
- ✅ src/lib/github.ts (2 instances)
- ✅ src/lib/github/repositories.ts (2 instances)

**Implementation details:**
- Created `src/lib/auth/githubProviderTypes.ts` with the proper typing for NextAuth's GitHub provider
- Created `src/lib/github/octokitTypes.ts` with type helpers for Octokit API responses
- Implemented proper type guards and safe accessors for handling variable API response structures

### 3. Test Edge Cases for Null/Undefined (4 instances) ✅

Tests using null/undefined values with @ts-ignore:

**Solution:** ✅
1. ✅ Created a TestCommitSummary interface to properly handle null/undefined values
2. ✅ Used TypeScript union types and utility functions for type safety
3. ✅ Updated the tests to use properly typed props

**Files modified:**
- ✅ src/components/dashboard/__tests__/SummaryStats.test.tsx (2 instances)
- ✅ src/components/organisms/__tests__/SummaryStats.test.tsx (2 instances)

**Implementation details:**
- Created `dashboardExtensions.ts` with TestCommitSummary interface that allows nullable stats
- Added getSafeStats utility function to handle null/undefined values properly
- Updated SummaryStats components to use the utility function and extended types
- Removed @ts-ignore comments in test files with proper typing

### 4. React Hook Dependencies (2 instances) ✅

ESLint react-hooks/exhaustive-deps rule disabled in useEffect:

**Solution:** ✅
1. ✅ Created a custom hook to encapsulate the initial data loading logic
2. ✅ Used proper dependency management in the custom hook
3. ✅ Replaced problematic useEffect calls with the custom hook

**Files modified:**
- ✅ src/components/ActivityFeed.tsx (1 instance)
- ✅ src/components/organisms/ActivityFeed.tsx (1 instance)

**Implementation details:**
- Created useLoadInitialData.ts to handle initial data loading with proper dependency tracking
- Used useCallback with correct dependencies for the loading function
- Removed the ESLint suppressions by using the new custom hook

### 5. Next.js Image Mocking (2 instances) ✅

ESLint @next/next/no-img-element rule disabled in test mocks:

**Solution:** ✅
1. ✅ Created an ESLint-safe mock for Next.js Image
2. ✅ Updated test files to use div elements instead of img

**Files modified:**
- ✅ src/components/dashboard/__tests__/Header.test.tsx (1 instance)
- ✅ src/components/organisms/__tests__/Header.test.tsx (1 instance)

**Implementation details:**
- Created reusable imageMock.tsx for future tests
- Implemented inline ESLint-safe mock in Header tests using div elements
- Updated tests to use data-testid instead of alt text for querying elements

### 6. Other TypeScript Suppressions (3 instances)

Miscellaneous suppressions:

**Solution:**
- Analyze each case individually and create appropriate type solutions

**Files to modify:**
- src/lib/tests/index.ts (2 instances)
- src/components/dashboard/__tests__/RepositorySection.test.tsx (2 instances)

## Implementation Order

1. ✅ **Jest Mock Type Utilities** - Created reusable solution for all mock-related suppressions
2. ✅ **External Library Types** - Fixed critical API-related types for Octokit and NextAuth
3. ✅ **Component Test Edge Cases** - Updated types to handle null/undefined test cases
4. ✅ **ESLint Suppressions** - Fixed React hooks and Next.js Image issues
5. **Remaining TypeScript Suppressions** - Fix the remaining miscellaneous suppressions

## Progress

- ✅ Completed: 37 suppressions (92.5% of total)
- 🔄 In Progress: Remaining TypeScript Suppressions
- ⏱️ Pending: None

## Testing Strategy

For each fix:
1. Verify TypeScript compiles successfully (`npm run typecheck`)
2. Run the relevant tests to ensure they pass
3. Check that no new errors are introduced
4. Confirm the code still functions as expected

## Success Criteria

1. All suppressions removed from the codebase
2. TypeScript and ESLint pass with no errors
3. All tests continue to pass
4. No functionality is broken by the changes
5. Code is more maintainable and type-safe
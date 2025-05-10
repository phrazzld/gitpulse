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

### 2. External Library Type Issues (5 instances)

Types related to Octokit API in GitHub functionality and NextAuth callbackUrl:

**Solution:**
1. Create proper type definitions that match the actual API usage
2. For NextAuth, create a proper extension of the GitHubProvider type
3. For Octokit, create utility types to handle the API response variations

**Files to modify:**
- src/lib/auth/authConfig.ts (1 instance)
- src/lib/github.ts (2 instances)
- src/lib/github/repositories.ts (2 instances)

### 3. Test Edge Cases for Null/Undefined (4 instances)

Tests using null/undefined values with @ts-ignore:

**Solution:**
1. Update component props types to properly handle null/undefined values
2. Use TypeScript union types (e.g., `| null | undefined`)
3. Update the tests to use the properly typed props

**Files to modify:**
- src/components/dashboard/__tests__/SummaryStats.test.tsx (2 instances)
- src/components/organisms/__tests__/SummaryStats.test.tsx (2 instances)

### 4. React Hook Dependencies (2 instances)

ESLint react-hooks/exhaustive-deps rule disabled in useEffect:

**Solution:**
1. Analyze why dependencies are omitted
2. Either include all dependencies or refactor to eliminate the need for the suppression
3. If dependency omission is intentional, add a clear explanation comment

**Files to modify:**
- src/components/ActivityFeed.tsx (1 instance)
- src/components/organisms/ActivityFeed.tsx (1 instance)

### 5. Next.js Image Mocking (2 instances)

ESLint @next/next/no-img-element rule disabled in test mocks:

**Solution:**
1. Create a shared mock for Next.js Image that doesn't trigger the warning
2. Update both test files to use the shared mock

**Files to modify:**
- src/components/dashboard/__tests__/Header.test.tsx (1 instance)
- src/components/organisms/__tests__/Header.test.tsx (1 instance)

### 6. Other TypeScript Suppressions (3 instances)

Miscellaneous suppressions:

**Solution:**
- Analyze each case individually and create appropriate type solutions

**Files to modify:**
- src/lib/tests/index.ts (2 instances)
- src/components/dashboard/__tests__/RepositorySection.test.tsx (2 instances)

## Implementation Order

1. ✅ **Jest Mock Type Utilities** - Created reusable solution for all mock-related suppressions
2. **External Library Types** - Fix critical API-related types for Octokit and NextAuth
3. **Component Test Edge Cases** - Update types to handle null/undefined test cases
4. **ESLint Suppressions** - Address React hooks and Next.js Image issues
5. **Remaining TypeScript Suppressions** - Fix the remaining miscellaneous suppressions

## Progress

- ✅ Completed: 24 suppressions (60% of total)
- 🔄 In Progress: External Library Type Issues
- ⏱️ Pending: Component Test Edge Cases, ESLint Suppressions, Remaining Suppressions

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
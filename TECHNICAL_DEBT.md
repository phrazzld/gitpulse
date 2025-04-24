# Technical Debt

This document tracks known technical debt in the GitPulse codebase that should be addressed in future refactoring efforts.

## Code Size Issues

Some files still exceed the recommended 500-line limit:

1. **`src/lib/github.ts` (853 lines)**
   - Despite the previous refactoring (T020-T025), this file remains large
   - The main GitHub client functionality should be further decomposed
   - Consider extracting more utility functions and type definitions
   - Priority: Medium

2. **`src/app/api/summary/__tests__/handlers.test.ts` (501 lines)**
   - Just barely over the limit (501 lines)
   - Test files are typically longer and less concerning than production code
   - Consider splitting into separate test files for each handler function group
   - Priority: Low

## Other Technical Debt

1. **Improve Type Safety**
   - Some areas still use loose typing (e.g., Record<string, any>)
   - Add more strict type definitions to improve reliability
   - Priority: Medium

2. **Further Component Decomposition**
   - Some UI components like `OperationsPanel.tsx` (466 lines) are approaching the line limit
   - Continue decomposing large components into smaller, focused ones
   - Priority: Medium

3. **Test Coverage**
   - Increase test coverage for critical paths
   - Add more integration tests for end-to-end user flows
   - Priority: High

4. **Performance Optimization**
   - Identify and fix performance bottlenecks in data fetching and rendering
   - Add appropriate memoization for computed values and components
   - Priority: Medium

## Recently Addressed Issues

1. **`src/components/ActivityFeed.tsx`**
   - Reduced from 547 to 409 lines by extracting CommitItem component
   - Completed as part of T029
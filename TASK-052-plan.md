# TASK-052 Plan: Implement router context for Next.js testing

## Overview

This task involves creating a RouterContext for Next.js App Router testing to replace global router mocks with a proper context-based approach. This will improve testing patterns by making dependencies explicit and removing global mocking.

## Current State Assessment

Currently, the codebase likely uses a global mock for Next.js router like this:
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    // other router properties
  })
}));
```

This approach causes several issues:
1. Global state that affects all tests
2. Implicit dependencies
3. Difficult to customize per test
4. Harder to maintain

## Implementation Plan

1. **Create RouterContext**: 
   - Implement a React context for router state
   - Provide a hook for consuming the context
   - Include all common router properties and methods for the App Router

2. **Add RouterProvider Component**:
   - Create a provider component that accepts router configuration
   - Implement default values for all router properties
   - Add mock implementations for router methods (push, replace, etc.)

3. **Create Testing Utilities**:
   - Add utility functions for wrapping components with RouterProvider
   - Include helper functions for common router testing patterns
   - Create types for router mock configuration

4. **Remove Global Mocking**:
   - Identify and replace global router mocks with context-based approach
   - Update existing tests to use the new context provider

## Files to Change

1. Create new file: `/src/lib/tests/router-context.tsx`
2. Update: `/src/lib/tests/react-test-utils.ts` to include router context utilities
3. Create documentation: `/docs/ROUTER_TESTING.md` to explain usage 
4. Add tests: `/src/lib/tests/__tests__/router-context.test.ts`

## Testing Strategy

1. Create tests for the router context itself
2. Test both basic and advanced usage patterns
3. Verify router functions (push, replace, etc.) can be properly mocked

## Success Criteria

- Router context is properly implemented with TypeScript types
- Testing utilities make it easy to use the context
- No more global router mocks in the codebase
- All tests pass with the new approach
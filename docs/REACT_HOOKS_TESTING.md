# React Hooks Testing Guide

This document provides guidance on how to test React hooks in the GitPulse project using our custom testing utilities.

## Table of Contents

1. [Introduction](#introduction)
2. [Testing Utilities Overview](#testing-utilities-overview)
3. [Basic Hook Testing](#basic-hook-testing)
4. [Testing Hooks with Context](#testing-hooks-with-context)
5. [Testing Async Hooks](#testing-async-hooks)
6. [Testing Common Hooks](#testing-common-hooks)
7. [Best Practices](#best-practices)

## Introduction

Testing React hooks requires special utilities to handle their stateful nature and integration with React's lifecycle. GitPulse uses the native `renderHook` functionality from `@testing-library/react` (v16.3.0+) to test hooks, with custom utilities to make testing more robust and easier.

## Testing Utilities Overview

Our test utilities are located in `src/lib/tests/react-test-utils.ts`. The key functions include:

- `renderHookSafely`: Safely renders a hook with error handling and additional wait utilities
- `withContext`: Creates a wrapper for testing hooks that use context
- `createMockContext`: Creates a mock context and provider for testing
- `renderAsyncHook`: Helper for testing async hooks that fetch data
- `mockNextRouter`: Mocks the Next.js router for testing
- `mockNextAuthSession`: Mocks the next-auth session for testing

## Basic Hook Testing

To test a basic hook:

```typescript
import { renderHookSafely } from '@/lib/tests/react-test-utils';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments counter correctly', () => {
    const { result } = renderHookSafely(() => useCounter());
    
    expect(result.current.count).toBe(0);
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

## Testing Hooks with Context

For hooks that use React context, use the `withContext` or `createMockContext` helpers:

```typescript
import { renderHookSafely, withContext } from '@/lib/tests/react-test-utils';
import { ThemeContext } from '@/contexts/theme';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  it('reads theme from context', () => {
    const mockTheme = { mode: 'dark', toggleMode: jest.fn() };
    
    const { result } = renderHookSafely(() => useTheme(), {
      wrapper: withContext(ThemeContext, mockTheme)
    });
    
    expect(result.current.mode).toBe('dark');
    
    act(() => {
      result.current.toggleMode();
    });
    
    expect(mockTheme.toggleMode).toHaveBeenCalled();
  });
});
```

Or with `createMockContext`:

```typescript
import { renderHookSafely, createMockContext } from '@/lib/tests/react-test-utils';
import { useTheme } from './useTheme';

// Somewhere in your setup
const { Context: ThemeContext, Provider: ThemeProvider } = createMockContext({
  mode: 'light',
  toggleMode: jest.fn()
});

// In your test
describe('useTheme', () => {
  it('reads theme from context', () => {
    const mockTheme = { mode: 'dark', toggleMode: jest.fn() };
    
    const { result } = renderHookSafely(() => useTheme(), {
      wrapper: ({ children }) => <ThemeProvider value={mockTheme}>{children}</ThemeProvider>
    });
    
    // Test as usual
  });
});
```

## Testing Async Hooks

For hooks that perform asynchronous operations, use the async utilities:

```typescript
import { renderHookSafely } from '@/lib/tests/react-test-utils';
import { useDataFetcher } from './useDataFetcher';

describe('useDataFetcher', () => {
  it('fetches data and updates state', async () => {
    // Mock the fetch function
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test data' })
    });
    
    const { result, waitFor } = renderHookSafely(() => useDataFetcher());
    
    // Initial state
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    
    // Trigger the fetch
    act(() => {
      result.current.fetchData();
    });
    
    // Loading state
    expect(result.current.loading).toBe(true);
    
    // Wait for the fetch to complete
    await waitFor(() => !result.current.loading);
    
    // Check the result
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ data: 'test data' });
  });
});
```

Alternatively, use the `renderAsyncHook` helper:

```typescript
import { renderAsyncHook } from '@/lib/tests/react-test-utils';
import { useDataFetcher } from './useDataFetcher';

describe('useDataFetcher', () => {
  it('fetches data and updates state', async () => {
    const mockData = { data: 'test data' };
    const { result, waitFor, triggerSuccess } = renderAsyncHook(
      () => useDataFetcher(),
      mockData
    );
    
    // Initial state
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    
    // Trigger the fetch
    act(() => {
      result.current.fetchData();
    });
    
    // Loading state
    expect(result.current.loading).toBe(true);
    
    // Resolve the fetch with mock data
    triggerSuccess();
    
    // Wait for the state to update
    await waitFor(() => !result.current.loading);
    
    // Check the result
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockData);
  });
});
```

## Testing Common Hooks

### Testing Next.js router hooks

```typescript
import { renderHookSafely, mockNextRouter } from '@/lib/tests/react-test-utils';
import { useNavigation } from './useNavigation';

describe('useNavigation', () => {
  it('navigates to a new page', () => {
    const { router } = mockNextRouter();
    
    const { result } = renderHookSafely(() => useNavigation());
    
    act(() => {
      result.current.goToHomePage();
    });
    
    expect(router.push).toHaveBeenCalledWith('/');
  });
});
```

### Testing authentication hooks

```typescript
import { renderHookSafely, mockNextAuthSession } from '@/lib/tests/react-test-utils';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('gets user information', () => {
    const { session } = mockNextAuthSession({
      data: {
        user: { name: 'Test User', email: 'test@example.com' },
        expires: '2023-12-31T23:59:59.999Z'
      },
      status: 'authenticated'
    });
    
    const { result } = renderHookSafely(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(session.data.user);
  });
});
```

## Best Practices

1. **Use `act` for state updates**: Always wrap state updates in `act()` to ensure React processes them correctly.

2. **Use `waitFor` for async updates**: Use `waitFor` with a specific condition rather than arbitrary timeouts.

3. **Mock external dependencies**: Mock API calls, router, auth, etc., but avoid mocking internal implementation details.

4. **Test behavior, not implementation**: Focus on what the hook does, not how it does it.

5. **Keep tests focused**: Test one aspect of behavior per test case.

6. **Set up and tear down properly**: Reset mocks between tests using `beforeEach` and `afterEach`.

7. **Test error cases**: Don't just test the happy path; also test how the hook handles errors.

8. **Use descriptive test names**: Make it clear what behavior is being tested.

Example:

```typescript
// ❌ Bad - Testing implementation details
it('calls useState and useEffect', () => {
  // ...
});

// ✅ Good - Testing behavior
it('fetches data when component mounts and displays loading state while fetching', () => {
  // ...
});
```
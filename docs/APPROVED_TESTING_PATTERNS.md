# Approved Testing Patterns

This document outlines the approved testing patterns for the GitPulse project. It provides a comprehensive guide to the recommended approaches for testing different types of components, with a focus on mocking external dependencies and handling asynchronous operations.

## Table of Contents

1. [Core Testing Principles](#core-testing-principles)
2. [Mocking Strategy](#mocking-strategy)
3. [Async Testing Patterns](#async-testing-patterns)
4. [Component Testing Patterns](#component-testing-patterns)
5. [Hook Testing Patterns](#hook-testing-patterns)
6. [API/Service Testing Patterns](#apiservice-testing-patterns)
7. [Common Anti-Patterns to Avoid](#common-anti-patterns-to-avoid)
8. [Test Utilities Reference](#test-utilities-reference)

## Core Testing Principles

Our testing approach is guided by the following core principles:

1. **Test Behavior, Not Implementation** - Focus on what the component does, not how it does it.
2. **Mock Only External Boundaries** - Never mock internal collaborators; refactor the code for testability instead.
3. **Write Deterministic Tests** - Tests should always produce the same result given the same input.
4. **Keep Tests Independent** - Tests should not depend on each other or share mutable state.
5. **Test for Edge Cases** - Consider empty lists, error conditions, and boundary values.
6. **Focus on User Experience** - Test what the user would see and interact with.

## Mocking Strategy

### Approved Mocking Patterns

The following patterns are approved for mocking external dependencies:

#### External Network Calls

```typescript
// Using the FetchProvider for dependency injection
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ data: 'mock data' })
});

render(
  <FetchProvider fetchImplementation={mockFetch}>
    <ComponentThatFetchesData />
  </FetchProvider>
);
```

Or using our network test utilities:

```typescript
import { setupFetchMocks } from '@/lib/tests/network-test-utils';

// Inside your test:
const fetchMocks = setupFetchMocks();
fetchMocks.mockSuccess({ data: 'mock data' });

// Test component that uses fetch
// ...

// Verify fetch was called correctly
fetchMocks.expectFetchCalls([
  ['/api/endpoint']
]);

// Clean up
fetchMocks.restore();
```

#### Date/Time

```typescript
import { createMockDate } from '@/lib/tests/dateMock';

it('formats date correctly', () => {
  const { restore } = createMockDate('2023-01-15T12:00:00Z');
  
  try {
    // Test code that uses Date
    const result = formatDate(); // Uses Date internally
    expect(result).toBe('2023-01-15');
  } finally {
    // Always restore the original Date
    restore();
  }
});
```

#### Auth State

```typescript
// For testing components that use authentication
import { mockNextAuthSession } from '@/lib/tests/react-test-utils';

const mockSession = {
  data: {
    user: { name: 'Test User', email: 'test@example.com' },
    expires: '2023-12-31'
  },
  status: 'authenticated'
};

const { session, useSession, signIn, signOut, resetMocks } = mockNextAuthSession(mockSession);

// Now test components that require auth
// Clean up with resetMocks()
```

#### External Services

When testing code that depends on external services like GitHub, use dependency injection and mock the dependencies:

```typescript
// Example from handlers.test.ts - mock dependencies instead of services
const mockDeps = {
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  githubService: {
    fetchAllRepositories: jest.fn().mockResolvedValue([]),
    fetchCommitsForRepositories: jest.fn().mockResolvedValue([])
  },
  // other dependencies...
};

const handlers = createSummaryHandlers(mockDeps);
```

### What NOT to Mock

#### Internal Collaborators

❌ **NEVER mock internal modules or collaborators within your application**:

```typescript
// BAD PRACTICE - Do not do this
jest.mock('@/components/SomeComponent', () => () => <div>Mocked Component</div>);
jest.mock('@/lib/utils', () => ({ 
  formatDate: () => '2023-01-01' 
}));
```

Instead, refactor the code to accept dependencies explicitly or use dependency injection.

#### Direct Manipulation of globals

❌ **NEVER directly manipulate global objects**:

```typescript
// BAD PRACTICE - Do not do this
global.Date = jest.fn(() => new Date('2023-01-01'));
global.fetch = jest.fn().mockResolvedValue({});
```

Instead, use the provided utilities like `createMockDate` and `setupFetchMocks`.

## Async Testing Patterns

### Testing Promises and Async Functions

Use `async/await` with proper error handling:

```typescript
it('should fetch data successfully', async () => {
  // Arrange
  const mockData = { id: 1, name: 'Test' };
  fetchMocks.mockSuccess(mockData);
  
  // Act
  await act(async () => {
    await component.fetchData();
  });
  
  // Assert
  await waitFor(() => {
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Testing Error Handling

```typescript
it('should handle errors gracefully', async () => {
  // Arrange
  fetchMocks.mockError({ message: 'Error fetching data' }, 500);
  
  // Act
  await act(async () => {
    await component.fetchData();
  });
  
  // Assert
  await waitFor(() => {
    expect(screen.getByText('Error fetching data')).toBeInTheDocument();
  });
});
```

### Testing Loading States

```typescript
it('should show loading state while fetching', async () => {
  // Arrange
  let resolvePromise: (value: any) => void;
  const promise = new Promise(resolve => { resolvePromise = resolve; });
  mockFetch.mockImplementationOnce(() => promise);
  
  // Act
  act(() => {
    component.fetchData();
  });
  
  // Assert - check loading state is displayed
  expect(screen.getByTestId('loading')).toBeInTheDocument();
  
  // Resolve the promise to complete the test
  act(() => {
    resolvePromise({ ok: true, json: () => Promise.resolve({ data: 'test' }) });
  });
  
  // Wait for loading state to disappear
  await waitFor(() => {
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
});
```

## Component Testing Patterns

### Testing Component Rendering

```typescript
it('renders with default props', () => {
  render(<Button>Click Me</Button>);

  const button = screen.getByRole("button", { name: "Click Me" });
  expect(button).toBeInTheDocument();
  expect(button).toHaveAttribute("type", "button");
  expect(button).not.toBeDisabled();
});
```

### Testing Component Interactions

```typescript
it('calls onClick handler when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);

  const button = screen.getByRole("button", { name: "Click Me" });
  fireEvent.click(button);

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Component States

```typescript
it('shows loading spinner when loading', () => {
  render(<Button loading>Loading</Button>);

  const button = screen.getByRole("button", { name: "Loading" });
  const spinner = button.querySelector(".animate-spin");

  expect(spinner).toBeInTheDocument();
  expect(button).toBeDisabled();
  expect(button).toHaveAttribute("aria-busy", "true");
});
```

### Testing Component Variants

```typescript
it('renders with different variants', () => {
  const { rerender } = render(<Button variant="primary">Primary</Button>);
  let button = screen.getByRole("button", { name: "Primary" });
  expect(button).toBeInTheDocument();

  rerender(<Button variant="secondary">Secondary</Button>);
  button = screen.getByRole("button", { name: "Secondary" });
  expect(button).toBeInTheDocument();
});
```

### Testing Accessibility

```typescript
it('has correct aria attributes when loading', () => {
  render(<Button loading>Loading</Button>);

  const button = screen.getByRole("button", { name: "Loading" });
  expect(button).toHaveAttribute("aria-busy", "true");
  expect(button).toBeDisabled();
});

it('has custom aria-label when provided', () => {
  render(<Button aria-label="Custom Label">Button Text</Button>);

  const button = screen.getByLabelText("Custom Label");
  expect(button).toHaveAttribute("aria-label", "Custom Label");
  expect(button).toHaveTextContent("Button Text");
});
```

## Hook Testing Patterns

### Basic Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '../useCounter';

it('should increment counter', () => {
  const { result } = renderHook(() => useCounter());
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.count).toBe(1);
});
```

### Testing Async Hooks

Use our `renderHookSafely` utility and `waitFor`:

```typescript
import { renderHookSafely } from '@/lib/tests/react-test-utils';
import { useAsyncData } from '../useAsyncData';

it('should fetch data and update state', async () => {
  // Set up fetch mock
  fetchMocks.mockSuccess({ data: 'test data' });
  
  // Render the hook
  const { result, waitFor } = renderHookSafely(() => useAsyncData());
  
  // Initially data should be null and loading should be true
  expect(result.current.data).toBeNull();
  expect(result.current.loading).toBe(true);
  
  // Wait for the hook to update
  await waitFor(() => result.current.loading === false);
  
  // Check final state
  expect(result.current.data).toEqual('test data');
  expect(result.current.error).toBeNull();
});
```

### Using `renderAsyncHook` for Controlled Async Testing

For more control over the async behavior, use `renderAsyncHook`:

```typescript
import { renderAsyncHook } from '@/lib/tests/react-test-utils';
import { useData } from '../useData';

it('should handle success and error states', async () => {
  const mockData = { id: 1, name: 'Test' };
  
  // Render the hook with mock data
  const { result, triggerSuccess, triggerError } = renderAsyncHook(
    () => useData(),
    mockData
  );
  
  // Initial state
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toBeNull();
  
  // Trigger success
  act(() => {
    triggerSuccess();
  });
  
  // Wait for state to update
  await waitFor(() => !result.current.loading);
  
  // Check success state
  expect(result.current.data).toEqual(mockData);
  
  // Set up another test case
  const { result: errorResult, triggerError: triggerErr } = renderAsyncHook(
    () => useData(),
    null
  );
  
  // Trigger error
  act(() => {
    triggerErr(new Error('Test error'));
  });
  
  // Wait for state to update
  await waitFor(() => !errorResult.current.loading);
  
  // Check error state
  expect(errorResult.current.error).toBe('Test error');
});
```

### Testing Hooks with Context Providers

```typescript
import { renderHookSafely, withContext } from '@/lib/tests/react-test-utils';
import { FetchContext } from '@/contexts/FetchContext';

it('should use context value', async () => {
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue({ data: 'test' })
  });
  
  // Create a wrapper with the context provider
  const wrapper = withContext(FetchContext, { fetch: mockFetch });
  
  // Render the hook with the wrapper
  const { result } = renderHookSafely(() => useFetchData(), { wrapper });
  
  // Test the hook behavior
  await act(async () => {
    await result.current.fetchData();
  });
  
  expect(mockFetch).toHaveBeenCalled();
});
```

## API/Service Testing Patterns

### Testing API Handlers

```typescript
import { createSummaryHandlers } from '../handlers';

describe('Summary API Handlers', () => {
  // Create mock dependencies for the handler
  const mockDeps = {
    logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    githubService: {
      fetchAllRepositories: jest.fn().mockResolvedValue([]),
      // other methods...
    },
    // other dependencies...
  };
  
  let handlers;
  
  beforeEach(() => {
    jest.clearAllMocks();
    handlers = createSummaryHandlers(mockDeps);
  });
  
  it('should filter repositories correctly', () => {
    const mockRepositories = [
      { id: 1, full_name: 'org1/repo1', owner: { login: 'org1' } },
      { id: 2, full_name: 'org2/repo2', owner: { login: 'org2' } }
    ];
    
    const result = handlers.filterRepositoriesByOrgAndRepoNames(
      mockRepositories,
      ['org1']
    );
    
    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('org1/repo1');
  });
  
  it('should handle async operations', async () => {
    // Set up mock implementation for a specific test case
    mockDeps.githubService.fetchCommitsForRepositories.mockResolvedValueOnce([
      { sha: '123', commit: { message: 'Test commit' } }
    ]);
    
    const result = await handlers.fetchCommitsWithAuthMethod(
      { 'oauth': ['org/repo'] },
      'fake-token',
      '2023-01-01',
      '2023-01-31'
    );
    
    expect(result).toHaveLength(1);
    expect(mockDeps.githubService.fetchCommitsForRepositories).toHaveBeenCalledWith(
      'fake-token',
      undefined,
      ['org/repo'],
      '2023-01-01',
      '2023-01-31',
      undefined
    );
  });
});
```

### Testing API Routes

```typescript
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the dependencies that the route uses
jest.mock('@/lib/auth/apiAuth', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { name: 'Test User', email: 'test@example.com' }
  })
}));

describe('API Route', () => {
  it('should return data for authenticated users', async () => {
    // Create a mock request
    const req = new NextRequest('https://example.com/api/data');
    
    // Call the route handler
    const response = await GET(req);
    
    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
  });
  
  it('should handle errors correctly', async () => {
    // Mock implementation to trigger an error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock some dependency to throw an error
    require('@/lib/auth/apiAuth').getServerSession.mockRejectedValueOnce(
      new Error('Auth error')
    );
    
    // Create a mock request
    const req = new NextRequest('https://example.com/api/data');
    
    // Call the route handler
    const response = await GET(req);
    
    // Verify the error response
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
```

## Common Anti-Patterns to Avoid

### 1. Direct Mocking of Internal Modules

❌ **Avoid**:
```typescript
jest.mock('@/components/SomeInternalComponent');
jest.mock('@/lib/internalUtils');
```

✅ **Instead**:
- Use dependency injection
- Refactor code to accept dependencies explicitly
- Use context providers for shared dependencies

### 2. Relying on Implementation Details

❌ **Avoid**:
```typescript
// Testing implementation details
expect(component.state.value).toBe('test');
expect(instance.privateMethod()).toBe(true);
```

✅ **Instead**:
- Test visible behavior and outputs
- Use public APIs and rendered output

### 3. Brittle Selectors

❌ **Avoid**:
```typescript
// Querying by class or arbitrary attributes
screen.getByClass('submit-button');
container.querySelector('.form > div > button');
```

✅ **Instead**:
- Use semantic queries by role, text, or label
- Add test-specific attributes like `data-testid` when necessary

### 4. Handling Async Operations Incorrectly

❌ **Avoid**:
```typescript
// Missing await or act
component.fetchData();
expect(screen.getByText('Data')).toBeInTheDocument();

// Timer-based solutions
setTimeout(() => {
  expect(screen.getByText('Data')).toBeInTheDocument();
  done();
}, 1000);
```

✅ **Instead**:
- Use `act` for state updates
- Use `waitFor` or `findBy` queries for async assertions
- Use our test utilities like `renderHookSafely` and `renderAsyncHook`

### 5. Global State Mutation

❌ **Avoid**:
```typescript
// Directly modifying globals
global.localStorage = mockLocalStorage;
global.window.location.href = '/test';
```

✅ **Instead**:
- Use dependency injection for globals
- Mock at the lowest possible level
- Create specific test utilities for common globals

## Test Utilities Reference

GitPulse provides several test utilities to simplify testing. Here's a quick reference:

### Network Testing Utilities

- `setupFetchMocks()`: Sets up mock implementations for fetch
  - `mockSuccess(data, status, headers)`: Mocks successful responses
  - `mockError(data, status, statusText, headers)`: Mocks error responses
  - `mockNetworkError(message)`: Mocks network failures
  - `mockMultiple(responses)`: Sets up multiple sequential responses
  - `expectFetchCalls(calls)`: Verifies fetch was called correctly
  - `reset()`: Clears mock call history
  - `restore()`: Restores original fetch implementation

### Date Mocking Utilities

- `createMockDate(dateString)`: Creates a mock date for testing
  - Returns `{ date, MockDate, restore }` where `restore()` resets the original Date

### React Testing Utilities

- `renderWithProviders(ui, options)`: Renders components with custom providers
- `renderHookSafely(hookFn, options)`: Safely renders hooks with enhanced utilities
  - `waitForNextUpdate()`: Waits for the hook result to update
  - `waitFor(callback)`: Enhanced version of RTL's waitFor
  - `waitForValueToChange(selector)`: Waits for a specific value to change

- `renderAsyncHook(hookFn, mockData, options)`: Helper for testing async hooks
  - `triggerSuccess()`: Resolves the mock fetch promise
  - `triggerError(error)`: Rejects the mock fetch promise
  - `restoreFetch()`: Restores the original fetch

- `withContext(Context, value)`: Creates a wrapper function for context providers
- `createMockContext(defaultValue)`: Creates a mock context and provider
- `mockNextAuthSession(mockSession)`: Creates a mock for next-auth's session hook

### Jest Enhancement Utilities

- `setupJestMatchers()`: Extends Jest with custom matchers
  - `toEqualWithDetail(expected)`: Enhanced deep equality with detailed output
  - `toMatchObjectWithDetail(expected)`: Enhanced partial object matching

- Helper functions:
  - `formatObject(obj, indent)`: Formats objects for error messages
  - `formatDiff(actual, expected, message)`: Enhances error messages for object comparison
  - `findFirstDifference(actual, expected)`: Finds the first difference between objects
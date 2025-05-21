# Next.js App Router Testing Guide

This guide shows how to use the RouterContext for testing components that use Next.js App Router.

## Testing with Router Context

GitPulse provides a context-based approach for testing Next.js App Router functionality, which eliminates the need for global mocks.

## Basic Usage

```tsx
// Import the necessary utilities
import { 
  RouterProvider, 
  createRouterWrapper 
} from '@/lib/tests/react-test-utils';

// Test a component that uses the router
describe('MyComponent', () => {
  it('should navigate to a new page when button is clicked', async () => {
    // Create a router mock
    const routerPush = jest.fn();
    
    // Create a wrapper with custom router values
    const wrapper = createRouterWrapper({
      push: routerPush,
      pathname: '/current-page'
    });
    
    // Render with the router context
    const { getByText } = render(<MyComponent />, { wrapper });
    
    // Trigger navigation
    fireEvent.click(getByText('Go to Dashboard'));
    
    // Verify navigation occurred
    expect(routerPush).toHaveBeenCalledWith('/dashboard');
  });
});
```

## Testing Hooks that Use Router

```tsx
// For testing hooks that use router
import { renderHook } from '@testing-library/react';
import { createRouterWrapper } from '@/lib/tests/react-test-utils';

// Test a hook that uses router
describe('useMyHook', () => {
  it('should return correct values', () => {
    // Set up router mock values
    const router = { 
      pathname: '/dashboard', 
      params: { id: '123' },
      push: jest.fn()
    };
    
    // Create a wrapper
    const wrapper = createRouterWrapper(router);
    
    // Render the hook with router context
    const { result } = renderHook(() => useMyHook(), { wrapper });
    
    // Assert on the results
    expect(result.current.isCurrentPage).toBe(true);
  });
});
```

## Advanced: Testing Router Events and Navigation

```tsx
// Testing async navigation events
it('should handle async navigation', async () => {
  // Create custom router with promise-based navigation
  const router = {
    push: jest.fn().mockImplementation(() => Promise.resolve())
  };
  
  const wrapper = createRouterWrapper(router);
  
  // Test component that performs navigation
  const { result } = renderHook(() => {
    const router = useRouter();
    return {
      navigate: async () => {
        await router.push('/dashboard');
        return true;
      }
    };
  }, { wrapper });
  
  // Perform navigation
  let navigated;
  await act(async () => {
    navigated = await result.current.navigate();
  });
  
  // Verify navigation occurred
  expect(navigated).toBe(true);
  expect(router.push).toHaveBeenCalledWith('/dashboard');
});
```

## Available Router Properties

The router context provides these default properties:

```tsx
{
  // Navigation methods
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  
  // Route information
  pathname: '/',
  params: {},
  searchParams: new URLSearchParams()
}
```

You can override any of these properties when creating your router wrapper.

## Legacy Support

While we recommend using the new context-based approach, legacy code can still use the `mockNextRouter` function. This function has been updated to use the new router context internally:

```tsx
import { mockNextRouter } from '@/lib/tests/react-test-utils';

describe('LegacyComponent', () => {
  beforeEach(() => {
    // Legacy approach - still works but is deprecated
    const { router } = mockNextRouter({ pathname: '/settings' });
  });
  
  // Your tests...
});
```

## Benefits of Context-Based Router Testing

- **Explicit dependencies**: Makes the router dependency explicit in your tests
- **Isolation**: Each test has its own router instance
- **Type safety**: Proper TypeScript typing for router properties and methods
- **Easier testing**: Simplified assertions and router state control
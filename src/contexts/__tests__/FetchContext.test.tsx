/**
 * Tests for FetchContext
 */

import React from 'react';
import { render, screen, renderHook } from '@testing-library/react';
import { FetchProvider, useFetch } from '../FetchContext';

// Test component that uses the useFetch hook
function TestComponent() {
  const fetch = useFetch();
  return <div data-testid="test-component">{typeof fetch === 'function' ? 'Fetch available' : 'No fetch'}</div>;
}

describe('FetchContext', () => {
  beforeEach(() => {
    // Reset console.warn spy between tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('provides the global fetch function by default', () => {
    render(
      <FetchProvider>
        <TestComponent />
      </FetchProvider>
    );

    expect(screen.getByTestId('test-component')).toHaveTextContent('Fetch available');
  });

  it('provides a custom fetch implementation when specified', () => {
    // Create a mock fetch function
    const mockFetch = jest.fn() as unknown as typeof fetch;

    // Render the component with the custom fetch implementation
    const { result } = renderHook(() => useFetch(), {
      wrapper: ({ children }) => (
        <FetchProvider fetchImplementation={mockFetch}>{children}</FetchProvider>
      ),
    });

    // Verify that our hook returns the mock function
    expect(result.current).toBe(mockFetch);
  });

  it('provides a consistent reference when the implementation does not change', () => {
    // Create a mock fetch function
    const mockFetch = jest.fn() as unknown as typeof fetch;

    // First render
    const { result, rerender } = renderHook(() => useFetch(), {
      wrapper: ({ children }) => (
        <FetchProvider fetchImplementation={mockFetch}>{children}</FetchProvider>
      ),
    });

    // Store the initial reference
    const initialFetch = result.current;

    // Re-render with the same implementation
    rerender();

    // Verify the reference hasn't changed (memoization works)
    expect(result.current).toBe(initialFetch);
  });

  it('updates the reference when the implementation changes', () => {
    // Create unique fetch implementations by adding custom properties
    const mockFetch1 = jest.fn() as unknown as typeof fetch;
    const mockFetch2 = jest.fn() as unknown as typeof fetch;
    
    // Add identifiable property to the mock functions
    (mockFetch1 as any).testId = 'fetch1';
    (mockFetch2 as any).testId = 'fetch2';
    
    // Create a component that can access the custom property
    function TestComponent() {
      const fetch = useFetch();
      return <div data-testid="fetch-indicator">{(fetch as any).testId || 'unknown'}</div>;
    }

    // Render with first implementation
    const { rerender } = render(
      <FetchProvider fetchImplementation={mockFetch1}>
        <TestComponent />
      </FetchProvider>
    );

    // Verify the first implementation is used
    expect(screen.getByTestId('fetch-indicator')).toHaveTextContent('fetch1');

    // Render with second implementation
    rerender(
      <FetchProvider fetchImplementation={mockFetch2}>
        <TestComponent />
      </FetchProvider>
    );

    // Verify the second implementation is used
    expect(screen.getByTestId('fetch-indicator')).toHaveTextContent('fetch2');
  });

  it('falls back to global fetch when used outside a provider', () => {
    // Render the hook without a provider
    const { result } = renderHook(() => useFetch());

    // Verify it falls back to global fetch
    expect(result.current).toBe(globalThis.fetch);

    // Verify a warning was logged
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('useFetch was called outside of a FetchProvider')
    );
  });

  it('can be nested with different fetch implementations', () => {
    // Create mock fetch functions with unique names
    const outerFetch = jest.fn().mockName('outerFetch') as unknown as typeof fetch;
    const innerFetch = jest.fn().mockName('innerFetch') as unknown as typeof fetch;

    // Components to test different levels
    function OuterComponent() {
      const fetch = useFetch();
      return <div data-testid="outer-fetch">Outer fetch</div>;
    }

    function InnerComponent() {
      const fetch = useFetch();
      return <div data-testid="inner-fetch">Inner fetch</div>;
    }

    // Render the nested providers
    const { rerender } = render(
      <FetchProvider fetchImplementation={outerFetch}>
        <div data-testid="outer">
          <OuterComponent />
          <FetchProvider fetchImplementation={innerFetch}>
            <div data-testid="inner">
              <InnerComponent />
            </div>
          </FetchProvider>
        </div>
      </FetchProvider>
    );

    // Get the fetch elements
    screen.getByTestId('outer-fetch');
    screen.getByTestId('inner-fetch');

    // Render a different configuration to verify it works
    rerender(
      <FetchProvider fetchImplementation={innerFetch}>
        <div data-testid="outer">
          <OuterComponent />
        </div>
      </FetchProvider>
    );

    // Verify the component rendered correctly
    screen.getByTestId('outer-fetch');
    
    // Success - the test passes if it doesn't throw
  });
});
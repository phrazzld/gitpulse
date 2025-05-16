/**
 * React Testing Utilities
 *
 * This module provides utility functions for testing React components and hooks.
 * It includes functions for rendering components with custom providers and
 * testing hooks outside of components.
 */

import * as React from 'react';
import { ReactElement, ReactNode, Context, createContext, useContext, act } from 'react';
import { render, RenderOptions, RenderResult, renderHook, RenderHookResult, RenderHookOptions, waitFor } from '@testing-library/react';
import { setupFetchMocks } from './network-test-utils';
import {
  RouterProvider,
  useRouter,
  createRouterWrapper,
  setupRouterMock
} from './router-context';

/**
 * Custom wrapper for rendering components with specific providers
 * @param ui - React component to render
 * @param options - Standard render options plus any custom providers
 * @returns Result from render function
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    wrappers?: Array<(children: ReactNode) => ReactElement>
  }
): RenderResult {
  const { wrappers = [], ...restOptions } = options || {};

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    return wrappers.reduce((wrapped, WrapperComponent) => {
      return WrapperComponent(wrapped);
    }, children as ReactElement);
  };

  return render(ui, { wrapper: Wrapper, ...restOptions });
}

/**
 * Type for hook testing result with enhanced async utilities
 * Extends RTL's RenderHookResult with additional conveniences
 */
export type SafeRenderHookResult<Result, Props> = Omit<
  RenderHookResult<Result, Props>,
  'waitFor'
> & {
  /**
   * Wait for the hook result to update
   * @deprecated Use waitFor with a specific condition instead - this method will be removed in a future version
   */
  waitForNextUpdate: (options?: { timeout?: number }) => Promise<void>;
  
  /**
   * Enhanced version of RTL's waitFor that automatically wraps in act() for hook testing
   * @param callback - Predicate function to determine when to stop waiting
   * @param options - Configuration options for waiting
   */
  waitFor: (callback: () => boolean | void, options?: { timeout?: number; interval?: number }) => Promise<void>;
  
  /**
   * Wait for a specific value to change, as determined by the selector function
   * @param selector - Function that returns the value to watch
   * @param options - Configuration options for waiting
   */
  waitForValueToChange: (selector: () => unknown, options?: { timeout?: number; interval?: number }) => Promise<void>;
};

/**
 * Safely render a hook with enhanced utilities for async testing
 * Prevents "An update to X inside a test was not wrapped in act(...)" warnings
 * @param hookFn - Hook function to render
 * @param options - Hook rendering options
 * @returns Enhanced hook rendering result with additional utilities
 */
export function renderHookSafely<Result, Props>(
  hookFn: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'> & { 
    wrapper?: React.ComponentType<{children: React.ReactNode}>; 
  }
): SafeRenderHookResult<Result, Props> {
  // Use RTL's native renderHook directly
  const result = renderHook<Result, Props>(hookFn, options);

  /**
   * @deprecated This method is kept for backward compatibility but may be removed in the future.
   * Use waitFor with a specific condition instead.
   */
  const safeWaitForNextUpdate = async (waitOptions?: { timeout?: number }) => {
    try {
      // Store the initial reference to compare against
      const initialRef = result.result.current;
      
      await act(async () => {
        await waitFor(
          () => result.result.current !== initialRef,
          { timeout: waitOptions?.timeout || 1000 }
        );
      });
    } catch (error: unknown) {
      const e = error as Error;
      if (e.name === 'TimeoutError' || e.message.includes('Timed out')) {
        // Maintain consistent error format for backward compatibility
        const waitError = new Error('Timed out in waitForNextUpdate');
        waitError.name = 'WaitError';
        throw waitError;
      }
      console.error('Error in waitForNextUpdate:', e);
      throw e;
    }
  };

  /**
   * Enhanced waitFor that properly wraps RTL's waitFor in act()
   */
  const safeWaitFor = async (
    callback: () => boolean | void,
    waitOptions?: { timeout?: number; interval?: number }
  ) => {
    try {
      // Use RTL's native waitFor but ensure it's wrapped in act()
      await act(async () => {
        await waitFor(callback, {
          timeout: waitOptions?.timeout,
          interval: waitOptions?.interval
        });
      });
    } catch (error: unknown) {
      const e = error as Error;
      if (e.name === 'TimeoutError' || e.message.includes('Timed out')) {
        const waitError = new Error(`Timed out in waitFor: ${e.message}`);
        waitError.name = 'WaitError';
        throw waitError;
      }
      throw e;
    }
  };

  /**
   * waitForValueToChange implemented as a thin wrapper around waitFor
   */
  const safeWaitForValueToChange = async (
    selector: () => unknown,
    waitOptions?: { timeout?: number; interval?: number }
  ) => {
    try {
      // Get initial value just once to avoid recomputing it
      const initialValue = selector();
      
      await act(async () => {
        await waitFor(
          () => {
            const newValue = selector();
            
            // Handle different types appropriately
            if (typeof initialValue !== 'object' && typeof newValue !== 'object') {
              // For primitives, just do a direct comparison
              return initialValue !== newValue;
            }
            
            // Handle null values
            if (initialValue === null || newValue === null) {
              return initialValue !== newValue;
            }
            
            // For objects, use reference equality
            return initialValue !== newValue;
          },
          {
            timeout: waitOptions?.timeout,
            interval: waitOptions?.interval
          }
        );
      });
    } catch (error: unknown) {
      const e = error as Error;
      if (e.name === 'TimeoutError' || e.message.includes('Timed out')) {
        const waitError = new Error('Timed out waiting for value to change');
        waitError.name = 'WaitError';
        throw waitError;
      }
      console.error('Error in waitForValueToChange:', e);
      throw e;
    }
  };

  // Return an enhanced result object that extends RTL's native result
  return {
    result: result.result,
    rerender: result.rerender,
    unmount: result.unmount,
    waitForNextUpdate: safeWaitForNextUpdate,
    waitFor: safeWaitFor,
    waitForValueToChange: safeWaitForValueToChange
  };
}

/**
 * Creates a wrapper function for testing hooks that use context
 * @param Context - The React context to provide a value for
 * @param value - The value to provide to the context
 * @returns A wrapper function to use with renderHook
 */
export function withContext<T>(Context: Context<T>, value: T) {
  const ContextWrapper = ({ children }: { children: ReactNode }) => {
    // Pass children as the third argument to React.createElement instead of in props
    return React.createElement(Context.Provider, { value }, children);
  };
  // Add display name for ESLint
  ContextWrapper.displayName = 'ContextWrapper';
  return ContextWrapper;
}

/**
 * Creates a mock context and provider for testing
 * @param defaultValue - Default value for the context
 * @returns Context, Provider, and hooks for updating the context value
 */
export function createMockContext<T>(defaultValue: T) {
  const Context = createContext<T>(defaultValue);
  const useTestContext = () => useContext(Context);
  
  const TestProvider: React.FC<{ value?: T; children: ReactNode }> = ({ 
    value = defaultValue, 
    children 
  }) => {
    // Pass children as the third argument to React.createElement instead of in props
    return React.createElement(Context.Provider, { value }, children);
  };
  
  return {
    Context,
    Provider: TestProvider,
    useTestContext
  };
}


/**
 * Helper for testing async hooks that fetch data
 * @param hookFn - The hook function to call
 * @param mockData - The mock data to resolve with
 * @param options - Options to pass to renderHook
 * @returns The rendered hook with additional utilities
 */
export function renderAsyncHook<Result, Props, Data>(
  hookFn: (props: Props) => Result,
  mockData: Data,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'> & { wrapper?: React.ComponentType<{children: React.ReactNode}>; }
): SafeRenderHookResult<Result, Props> & { 
  mockData: Data; 
  triggerSuccess: () => void; 
  triggerError: (error: Error) => void; 
  restoreFetch: () => void;
} {
  let resolvePromise: (value: Data) => void;
  let rejectPromise: (reason: Error) => void;
  
  // Create a promise that we can resolve/reject on demand
  const promise = new Promise<Data>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  
  // Set up local fetch mocks instead of directly modifying global.fetch
  const fetchMocks = setupFetchMocks();
  
  // Use a custom implementation that returns our controlled promise
  (global.fetch as jest.Mock).mockImplementation(() => promise);
  
  // Use our enhanced renderHook utility
  const result = renderHookSafely(hookFn, options);
  
  // Add an unmount handler to restore the original fetch
  const originalUnmount = result.unmount;
  result.unmount = () => {
    fetchMocks.restore();
    originalUnmount();
  };
  
  // Functions to resolve/reject the promise from tests
  const triggerSuccess = () => resolvePromise(mockData);
  const triggerError = (error: Error) => rejectPromise(error);
  
  return {
    ...result,
    mockData,
    triggerSuccess,
    triggerError,
    restoreFetch: fetchMocks.restore
  };
}

/**
 * Function that mocks the useRouter hook from Next.js
 *
 * DEPRECATED: Use RouterProvider from router-context.tsx instead.
 * This function will be removed in a future version.
 *
 * @param mockRouter - Override default mock router values
 * @returns Mock router implementation
 */
export function mockNextRouter(mockRouter = {}) {
  // Import from our router-context to ensure consistent mock values
  const { setupRouterMock } = require('./router-context');
  const { mockUseRouter, resetMock } = setupRouterMock(mockRouter);
  
  // For backward compatibility
  const router = mockUseRouter();
  
  return {
    router,
    useRouter: mockUseRouter,
    reset: resetMock
  };
}

/**
 * Creates a mock for the next/auth session hook
 * @param mockSession - Override default mock session values
 * @returns Mock session utilities
 */
export function mockNextAuthSession(mockSession = null) {
  const useSession = jest.spyOn(require('next-auth/react'), 'useSession');
  const session = mockSession || {
    data: {
      user: { name: 'Test User', email: 'test@example.com' },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    },
    status: 'authenticated',
    update: jest.fn()
  };

  useSession.mockReturnValue(session);

  const signIn = jest.fn().mockResolvedValue({ ok: true, error: null });
  const signOut = jest.fn().mockResolvedValue({ ok: true });
  
  jest.spyOn(require('next-auth/react'), 'signIn').mockImplementation(signIn);
  jest.spyOn(require('next-auth/react'), 'signOut').mockImplementation(signOut);

  return {
    session,
    useSession,
    signIn,
    signOut,
    resetMocks() {
      useSession.mockClear();
      signIn.mockClear();
      signOut.mockClear();
    }
  };
}

// Export router context utilities
export {
  RouterProvider,
  useRouter,
  createRouterWrapper,
  setupRouterMock
};
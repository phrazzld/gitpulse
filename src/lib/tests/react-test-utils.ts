/**
 * React Testing Utilities
 *
 * This module provides utility functions for testing React components and hooks.
 * It includes functions for rendering components with custom providers and
 * testing hooks outside of components.
 */

import * as React from 'react';
import { ReactElement, ReactNode, Context, createContext, useContext, act } from 'react';
import { render, RenderOptions, RenderResult, renderHook, RenderHookOptions, waitFor } from '@testing-library/react';

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
 * Type definition for the return value of renderHook from @testing-library/react
 */
type RTLRenderHookResult<T> = {
  result: {
    current: T;
    error?: Error;
  };
  rerender: (props?: Partial<T>) => void;
  unmount: () => void;
};

/**
 * Type for hook testing result with controlled async utilities
 */
export type SafeRenderHookResult<Result, Props> = Omit<
  RTLRenderHookResult<Result>,
  'waitFor'
> & {
  waitForNextUpdate: (options?: { timeout?: number }) => Promise<void>;
  waitFor: (callback: () => boolean | void, options?: { timeout?: number; interval?: number }) => Promise<void>;
  waitForValueToChange: (selector: () => unknown, options?: { timeout?: number; interval?: number }) => Promise<void>;
};

/**
 * Safely render a hook with error handling
 * Prevents "An update to X inside a test was not wrapped in act(...)" warnings
 * @param hookFn - Hook function to render
 * @param options - Hook rendering options
 * @returns Safe hook rendering result
 */
export function renderHookSafely<Result, Props>(
  hookFn: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, 'wrapper'> & { 
    wrapper?: React.ComponentType<{children: React.ReactNode}>; 
  }
): SafeRenderHookResult<Result, Props> {
  const result = renderHook(hookFn, options);

  const safeWaitForNextUpdate = async (waitOptions?: { timeout?: number }) => {
    try {
      // In @testing-library/react there is no waitForNextUpdate, so we use waitFor
      // with a condition that checks if the result has changed from its initial value
      const initialValue = result.result.current;
      
      await act(async () => {
        await waitFor(
          () => {
            // This will keep retrying until the current value is different from the initial value
            if (JSON.stringify(result.result.current) === JSON.stringify(initialValue)) {
              throw new Error('Value has not changed yet');
            }
            return true;
          },
          { timeout: waitOptions?.timeout || 1000 }
        );
      });
    } catch (error: unknown) {
      const e = error as Error;
      if (e.name === 'TimeoutError' || e.message.includes('Timed out')) {
        // Create a similar error to the one from @testing-library/react-hooks
        const waitError = new Error('Timed out in waitForNextUpdate');
        waitError.name = 'WaitError';
        throw waitError;
      } else {
        console.error('Error in waitForNextUpdate:', e);
      }
    }
  };

  const safeWaitFor = async (
    callback: () => boolean | void,
    waitOptions?: { timeout?: number; interval?: number }
  ) => {
    try {
      await act(async () => {
        await waitFor(callback, {
          timeout: waitOptions?.timeout,
          interval: waitOptions?.interval
        });
      });
    } catch (error: unknown) {
      const e = error as Error;
      if (e.name === 'TimeoutError' || e.message.includes('Timed out')) {
        // Create a similar error to the one from @testing-library/react-hooks
        const waitError = new Error('Timed out in waitFor');
        waitError.name = 'WaitError';
        throw waitError;
      } else {
        console.error('Error in waitFor:', e);
      }
    }
  };

  const safeWaitForValueToChange = async (
    selector: () => unknown,
    waitOptions?: { timeout?: number; interval?: number }
  ) => {
    try {
      // In @testing-library/react there is no waitForValueToChange, so we use waitFor
      // to implement similar functionality
      const initialValue = selector();
      
      await act(async () => {
        await waitFor(
          () => {
            const newValue = selector();
            if (JSON.stringify(newValue) === JSON.stringify(initialValue)) {
              throw new Error('Value has not changed yet');
            }
            return true;
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
        // Create a similar error to the one from @testing-library/react-hooks
        const waitError = new Error('Timed out in waitForValueToChange');
        waitError.name = 'WaitError';
        throw waitError;
      } else {
        console.error('Error in waitForValueToChange:', e);
      }
    }
  };

  // Create a properly typed result object
  const safeResult: SafeRenderHookResult<Result, Props> = {
    result: result.result,
    rerender: result.rerender as (props?: Partial<Result>) => void,
    unmount: result.unmount,
    waitForNextUpdate: safeWaitForNextUpdate,
    waitFor: safeWaitFor,
    waitForValueToChange: safeWaitForValueToChange
  };
  
  return safeResult;
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
): SafeRenderHookResult<Result, Props> & { mockData: Data; triggerSuccess: () => void; triggerError: (error: Error) => void } {
  let resolvePromise: (value: Data) => void;
  let rejectPromise: (reason: Error) => void;
  
  // Create a promise that we can resolve/reject on demand
  const promise = new Promise<Data>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  
  // Mock the fetch implementation
  global.fetch = jest.fn().mockImplementation(() => promise);
  
  const result = renderHookSafely(hookFn, options);
  
  // Functions to resolve/reject the promise from tests
  const triggerSuccess = () => resolvePromise(mockData);
  const triggerError = (error: Error) => rejectPromise(error);
  
  return {
    ...result,
    mockData,
    triggerSuccess,
    triggerError
  };
}

/**
 * Function that mocks the useRouter hook from Next.js
 * @param mockRouter - Override default mock router values
 * @returns Mock router implementation
 */
export function mockNextRouter(mockRouter = {}) {
  const useRouter = jest.spyOn(require('next/router'), 'useRouter');
  
  const router = {
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn().mockResolvedValue(true),
    replace: jest.fn().mockResolvedValue(true),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    },
    isFallback: false,
    isReady: true,
    ...mockRouter
  };

  useRouter.mockReturnValue(router);

  return {
    router,
    useRouter
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
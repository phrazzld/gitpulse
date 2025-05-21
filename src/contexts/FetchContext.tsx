/**
 * FetchContext
 * 
 * This module provides a React context for fetch dependency injection.
 * It allows for easier testing and more flexibility when making HTTP requests.
 */

import React, { createContext, useContext, ReactNode, useMemo, useRef } from 'react';

/**
 * TypeScript type definition for a fetch-like function
 * This matches the signature of the global fetch function
 */
export type FetchFunction = typeof fetch;

/**
 * Interface for the context value
 */
interface FetchContextValue {
  /**
   * The fetch function to use for HTTP requests
   */
  fetch: FetchFunction;
  /**
   * Flag to indicate if we're using a custom fetch implementation
   * or the default one
   */
  isCustomImplementation: boolean;
}

/**
 * Create the fetch context with a default value that uses global fetch
 */
const FetchContext = createContext<FetchContextValue>({
  fetch: globalThis.fetch,
  isCustomImplementation: false,
});

/**
 * Props for the FetchProvider component
 */
interface FetchProviderProps {
  /**
   * Custom fetch implementation to provide
   * If not provided, falls back to global fetch
   */
  fetchImplementation?: FetchFunction;
  
  /**
   * Child components that will have access to the context
   */
  children: ReactNode;
}

/**
 * Provider component that makes fetch available to all children
 * 
 * @param props - Component props
 * @returns React component
 */
export function FetchProvider({ fetchImplementation, children }: FetchProviderProps): React.ReactElement {
  // Use the provided fetch implementation or fall back to global fetch
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<FetchContextValue>(
    () => ({
      fetch: fetchImplementation || globalThis.fetch,
      isCustomImplementation: !!fetchImplementation,
    }),
    [fetchImplementation]
  );

  return (
    <FetchContext.Provider value={contextValue}>
      {children}
    </FetchContext.Provider>
  );
}

/**
 * Hook to access the fetch function from the context
 * 
 * @returns The fetch function from the context, or global fetch as fallback
 */
export function useFetch(): FetchFunction {
  const context = useContext(FetchContext);
  
  // Create the ref unconditionally to follow React Hooks rules
  const hasWarned = useRef(false);
  
  // Check if we're using the default context (not inside a provider)
  if (!context.isCustomImplementation && !hasWarned.current) {
    console.warn(
      'useFetch was called outside of a FetchProvider. ' +
      'Falling back to global fetch. ' +
      'This is not recommended for production code.'
    );
    hasWarned.current = true;
  }
  
  return context.fetch;
}
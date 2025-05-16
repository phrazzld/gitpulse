/**
 * Router Context for Next.js Testing
 * 
 * This module provides a context-based approach for mocking Next.js App Router
 * (next/navigation) in tests.
 */

import React, { createContext, useContext, ReactNode, useMemo } from 'react';

/**
 * Types for App Router (next/navigation)
 * Based on Next.js 14 App Router navigation APIs
 */
interface AppRouterContextValue {
  push: jest.Mock;
  replace: jest.Mock;
  refresh: jest.Mock;
  back: jest.Mock;
  forward: jest.Mock;
  prefetch: jest.Mock;
  pathname: string;
  params: Record<string, string | string[]>;
  searchParams: URLSearchParams | Record<string, string | string[]>;
  [key: string]: any; // For any additional properties
}

// Create context for App Router
const RouterContext = createContext<AppRouterContextValue | undefined>(undefined);

// Provider Props
interface RouterProviderProps {
  router?: Partial<AppRouterContextValue>;
  children: ReactNode;
}

/**
 * Default values for App Router
 */
const defaultRouter: AppRouterContextValue = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  pathname: '/',
  params: {},
  searchParams: new URLSearchParams()
};

/**
 * Router Provider for App Router testing
 */
export function RouterProvider({
  router = {},
  children
}: RouterProviderProps): React.ReactElement {
  // Merge defaults with provided values
  const routerValue = useMemo(
    () => ({ ...defaultRouter, ...router }),
    [router]
  );

  return (
    <RouterContext.Provider value={routerValue}>
      {children}
    </RouterContext.Provider>
  );
}

/**
 * Hook to use the Router context
 */
export function useRouter(): AppRouterContextValue {
  const context = useContext(RouterContext);
  
  if (context === undefined) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  
  return context;
}

/**
 * Setup mock for next/navigation App Router
 */
export function setupRouterMock(router: Partial<AppRouterContextValue> = {}): {
  mockUseRouter: jest.Mock;
  resetMock: () => void;
} {
  const routerValue = { ...defaultRouter, ...router };
  const mockUseRouter = jest.fn().mockReturnValue(routerValue);
  
  // Mock the next/navigation module
  jest.mock('next/navigation', () => ({
    useRouter: () => mockUseRouter()
  }));
  
  const resetMock = () => {
    mockUseRouter.mockReset().mockReturnValue(routerValue);
    Object.values(routerValue).forEach(value => {
      if (typeof value === 'function' && 'mockClear' in value) {
        (value as jest.Mock).mockClear();
      }
    });
  };
  
  return { mockUseRouter, resetMock };
}

/**
 * Create a wrapper for testing components that use router
 */
export function createRouterWrapper(router?: Partial<AppRouterContextValue>) {
  // Define wrapper component with display name for ESLint
  const RouterWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <RouterProvider router={router}>
      {children}
    </RouterProvider>
  );
  
  // Add display name for ESLint
  RouterWrapper.displayName = 'RouterWrapper';
  
  return RouterWrapper;
}
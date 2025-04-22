/**
 * Improved test wrapper for Dashboard component
 * Uses real internal components and only mocks external boundaries
 *
 * @jest-environment jsdom
 * @jest-file
 */
import React, { useEffect } from "react";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import Dashboard from "@/app/dashboard/page";
import {
  mockSession,
  mockRepositories,
  mockSummary,
  mockDateRange,
} from "../test-utils";
import {
  ZustandIntegrationProvider,
  setIntegrationStoreData,
} from "./ZustandIntegrationTestHelpers";

// This file is a test helper, not a test itself
export const TEST_SKIP = true;

interface Props {
  mockFetch?: jest.Mock;
  mockSession?: any;
  children?: ReactNode;
  initialData?: {
    repositories?: any[];
    summary?: any;
    dateRange?: any;
    expandedPanels?: string[];
    showRepoList?: boolean;
    loading?: boolean;
    error?: string | null;
    activeFilters?: any;
  };
}

/**
 * Wraps the Dashboard component in necessary providers for testing
 * Only mocks external boundaries (APIs, authentication, etc.)
 * Now supports Zustand state management with direct hook state access
 */
export function ImprovedDashboardTestWrapper({
  mockFetch,
  mockSession: sessionOverride = mockSession,
  children,
  initialData = {
    repositories: mockRepositories,
    summary: mockSummary,
    dateRange: mockDateRange,
    expandedPanels: [],
    showRepoList: true,
    loading: false,
    error: null,
  },
}: Props) {
  // Set up mock fetch
  useEffect(() => {
    const originalFetch = window.fetch;

    if (mockFetch) {
      window.fetch = mockFetch;
    }

    return () => {
      window.fetch = originalFetch;
    };
  }, [mockFetch]);

  // Mock localStorage for testing
  useEffect(() => {
    const originalLocalStorage = window.localStorage;
    const mockLocalStorage = {
      getItem: jest.fn((key) => {
        // Return a mock lastRepositoryRefresh time
        if (key === "lastRepositoryRefresh") {
          return Date.now().toString();
        }
        return null;
      }),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn(() => null),
    };

    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    return () => {
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
      });
    };
  }, []);

  // Mock cache for repositories
  useEffect(() => {
    // Mock the getStaleItem function from localStorageCache
    jest.mock(
      "@/lib/localStorageCache",
      () => ({
        setCacheItem: jest.fn(),
        getCacheItem: jest.fn(),
        getStaleItem: jest.fn().mockImplementation((key) => {
          if (key.includes("repos:")) {
            return {
              data: mockRepositories,
              isStale: false,
            };
          }
          return { data: null, isStale: true };
        }),
        ClientCacheTTL: { LONG: 3600000 },
      }),
      { virtual: true },
    );
  }, []);

  // Mock ResizeObserver
  useEffect(() => {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    const originalResizeObserver = window.ResizeObserver;
    window.ResizeObserver = MockResizeObserver;

    return () => {
      window.ResizeObserver = originalResizeObserver;
    };
  }, []);

  // Mock matchMedia
  useEffect(() => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    return () => {
      window.matchMedia = originalMatchMedia;
    };
  }, []);

  // Set initial state data when the component mounts
  useEffect(() => {
    setIntegrationStoreData(initialData);
  }, []);

  return (
    <SessionProvider session={sessionOverride}>
      <ZustandIntegrationProvider initialData={initialData}>
        {children || <Dashboard />}
      </ZustandIntegrationProvider>
    </SessionProvider>
  );
}

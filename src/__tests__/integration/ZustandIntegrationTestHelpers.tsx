/**
 * Zustand Integration Test Helpers
 *
 * Provides utilities to set up and interact with Zustand state for integration tests.
 * Builds on the unit test helpers but with specific focus on integration testing needs.
 */
import React, { ReactNode, useEffect } from "react";
import { create } from "zustand";
import { createDashboardSlice } from "@/state/slices/dashboardSlice";
import { RootState, StateSlice } from "@/state/types";
import {
  mockRepositories,
  mockSummary,
  mockDateRange,
  mockActiveFilters,
} from "../test-utils";

// Create a test store that can be used across integration tests
const integrationTestStore = create<RootState>((set, get) => ({
  [StateSlice.Dashboard]: {
    ...createDashboardSlice(set, get),
  },
}));

// Reset the integration test store to a clean state
export const resetIntegrationStore = () => {
  const currentState = integrationTestStore.getState()[StateSlice.Dashboard];

  // Create a clean state object (excluding methods)
  const resetState = { ...currentState };

  // Remove all methods from the state object
  Object.keys(resetState).forEach((key) => {
    if (typeof resetState[key] === "function") {
      delete resetState[key];
    }
  });

  // Set repositories to empty array and reset loading states
  resetState.repositories = [];
  resetState.loading = false;
  resetState.initialLoad = true;
  resetState.error = null;

  // Reset the state
  integrationTestStore.setState({
    [StateSlice.Dashboard]: {
      ...resetState,
      // Maintain all action methods from current state
      ...Object.keys(currentState)
        .filter((key) => typeof currentState[key] === "function")
        .reduce((methods, key) => {
          methods[key] = currentState[key];
          return methods;
        }, {}),
    },
  });
};

// Set test data in the integration store
export const setIntegrationStoreData = ({
  repositories = mockRepositories,
  summary = mockSummary,
  dateRange = mockDateRange,
  activeFilters = mockActiveFilters,
  expandedPanels = [],
  showRepoList = true,
  loading = false,
  error = null,
} = {}) => {
  integrationTestStore.setState((state) => ({
    [StateSlice.Dashboard]: {
      ...state[StateSlice.Dashboard],
      repositories,
      summary,
      dateRange,
      activeFilters,
      expandedPanels,
      showRepoList,
      loading,
      error,
      initialLoad: false,
    },
  }));
};

/**
 * Integration Test Provider Component
 * Wraps components for integration testing with a controlled Zustand state
 */
export const ZustandIntegrationProvider = ({
  children,
  initialData = {},
}: {
  children: ReactNode;
  initialData?: any;
}) => {
  // Set initial data on mount
  useEffect(() => {
    setIntegrationStoreData(initialData);

    // Clean up on unmount
    return () => {
      resetIntegrationStore();
    };
  }, []);

  return <>{children}</>;
};

// Export hooks mocks for integration tests
export const dashboardHookMocks = {
  useDashboardState: () =>
    integrationTestStore.getState()[StateSlice.Dashboard],

  useUIState: () => {
    const state = integrationTestStore.getState()[StateSlice.Dashboard];
    return {
      error: state.error,
      loading: state.loading,
      showRepoList: state.showRepoList,
      expandedPanels: state.expandedPanels,
      setShowRepoList: state.setShowRepoList,
      togglePanel: state.togglePanel,
      setExpandedPanels: state.setExpandedPanels,
    };
  },

  useDateRange: () => {
    const state = integrationTestStore.getState()[StateSlice.Dashboard];
    return {
      dateRange: state.dateRange,
      since: state.dateRange.since,
      until: state.dateRange.until,
      updateDateRange: (since: string, until: string) => {
        state.setDateRange(since, until);
      },
    };
  },

  useFilters: () => {
    const state = integrationTestStore.getState()[StateSlice.Dashboard];
    return {
      filters: state.activeFilters,
      updateFilters: (filters: any) => {
        state.setActiveFilters(filters);
      },
    };
  },

  useDashboardRepository: () => {
    const state = integrationTestStore.getState()[StateSlice.Dashboard];
    return {
      repositories: state.repositories,
      loading: state.loading,
      fetchRepositories: state.fetchRepositories,
      setRepositories: state.setRepositories,
    };
  },

  usePanelExpansion: () => {
    const state = integrationTestStore.getState()[StateSlice.Dashboard];
    return {
      expandedPanels: state.expandedPanels,
      handlePanelExpand: (panelId: string) => {
        state.togglePanel(panelId);
      },
    };
  },

  useSummaryGeneration: () => {
    const state = integrationTestStore.getState()[StateSlice.Dashboard];
    return {
      summary: state.summary,
      setSummary: state.setSummary,
      generateSummary: jest.fn().mockImplementation((e) => {
        if (e && typeof e.preventDefault === "function") {
          e.preventDefault();
        }
        return Promise.resolve({});
      }),
    };
  },

  useErrorHandlers: () => {
    const state = integrationTestStore.getState()[StateSlice.Dashboard];
    return {
      handleAuthError: state.handleAuthError,
      handleAppInstallationNeeded: state.handleAppInstallationNeeded,
    };
  },

  useInstallations: () => {
    const state = integrationTestStore.getState()[StateSlice.Dashboard];
    return {
      authMethod: state.authMethod,
      needsInstallation: state.needsInstallation,
      installationIds: state.installationIds,
      installations: state.installations,
      currentInstallations: state.currentInstallations,
    };
  },
};

// Helper function to mock all hooks
export const mockAllZustandHooks = () => {
  jest.mock("@/state/hooks", () => dashboardHookMocks);
  jest.mock("@/state", () => dashboardHookMocks);
};

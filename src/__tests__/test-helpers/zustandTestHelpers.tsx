import React, { ReactNode } from "react";
import { create } from "zustand";
import { createDashboardSlice } from "@/state/slices/dashboardSlice";
import { RootState, StateSlice } from "@/state/types";

/**
 * Create a test store with only the dashboard slice
 * This isolates the dashboard state logic for testing
 */
const useTestStore = create<RootState>((set, get) => ({
  [StateSlice.Dashboard]: {
    ...createDashboardSlice(set, get),
  },
}));

/**
 * Reset test store to initial state
 * This should be called in beforeEach for consistent test state
 */
export const resetTestStore = () => {
  // Extract the initial state from the slice
  const initialState = useTestStore.getState()[StateSlice.Dashboard];

  // Reset to initial state, excluding the action functions
  const stateToClear = { ...initialState };

  // Filter out properties that are functions (actions)
  Object.keys(stateToClear).forEach((key) => {
    if (typeof stateToClear[key] === "function") {
      delete stateToClear[key];
    }
  });

  // Set dashboard slice state
  useTestStore.setState({
    [StateSlice.Dashboard]: stateToClear,
  });
};

/**
 * Set specific state in the test store
 * Useful for setting up test scenarios
 */
export const setTestStoreState = (partialState: Partial<any>) => {
  useTestStore.setState((state) => ({
    [StateSlice.Dashboard]: {
      ...state[StateSlice.Dashboard],
      ...partialState,
    },
  }));
};

// Export hooks that use our test store
// These will be imported by tests directly instead of using jest.mock
export const useUIState = () => {
  const state = useTestStore.getState()[StateSlice.Dashboard];
  return {
    error: state.error,
    showRepoList: state.showRepoList,
    expandedPanels: state.expandedPanels,
    setShowRepoList: state.setShowRepoList,
    togglePanel: state.togglePanel,
    setExpandedPanels: state.setExpandedPanels,
  };
};

export const useDashboardRepository = () => {
  const state = useTestStore.getState()[StateSlice.Dashboard];
  return {
    repositories: state.repositories,
    loading: state.loading,
    initialLoad: state.initialLoad,
    fetchRepositories: state.fetchRepositories,
    setRepositories: state.setRepositories,
  };
};

export const useDateRange = () => {
  const state = useTestStore.getState()[StateSlice.Dashboard];
  return {
    dateRange: state.dateRange,
    setDateRange: state.setDateRange,
  };
};

export const useFilters = () => {
  const state = useTestStore.getState()[StateSlice.Dashboard];
  return {
    activeFilters: state.activeFilters,
    setActiveFilters: state.setActiveFilters,
  };
};

export const useErrorHandlers = () => {
  const state = useTestStore.getState()[StateSlice.Dashboard];
  return {
    handleAuthError: state.handleAuthError,
    handleAppInstallationNeeded: state.handleAppInstallationNeeded,
  };
};

export const usePanelExpansion = () => {
  const state = useTestStore.getState()[StateSlice.Dashboard];
  return {
    expandedPanels: state.expandedPanels,
    handlePanelExpand: state.togglePanel,
    setExpandedPanels: state.setExpandedPanels,
  };
};

export const useInstallations = () => {
  const state = useTestStore.getState()[StateSlice.Dashboard];
  return {
    authMethod: state.authMethod,
    needsInstallation: state.needsInstallation,
    installationIds: state.installationIds,
    installations: state.installations,
    currentInstallations: state.currentInstallations,
  };
};

export const useSummaryGeneration = () => {
  const state = useTestStore.getState()[StateSlice.Dashboard];
  return {
    summary: state.summary,
    setSummary: state.setSummary,
    generateSummary: jest.fn().mockImplementation((e) => {
      e?.preventDefault?.();
      return Promise.resolve({});
    }),
  };
};

/**
 * Provider wrapper for testing components that use Zustand hooks
 * This ensures consistent behavior with the actual application
 */
export const ZustandTestProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

/**
 * Zustand Store Hooks
 *
 * This file contains custom hooks for accessing specific slices of state
 * and deriving values from the store.
 */

import { useCallback } from "react";
import { useStore } from "./store";
import { StateSlice, RootState } from "./types";
import { Repository } from "@/types/github";
import { CommitSummary } from "@/types/summary";
import { DashboardFilterState } from "@/types/dashboard";

/**
 * Type for selector functions
 */
type Selector<T> = (state: RootState) => T;

/**
 * Hook to select a specific slice of state
 */
const useStoreSlice = <T>(selector: Selector<T>) => {
  return useStore(selector);
};

/**
 * Hook to access dashboard state
 */
export const useDashboardState = () => {
  return useStoreSlice((state) => state[StateSlice.Dashboard]);
};

/**
 * Hook to access auth state
 */
export const useAuthState = () => {
  return useStoreSlice((state) => state[StateSlice.Auth]);
};

/**
 * Hook for accessing the error handlers from auth slice
 *
 * These error handlers are memoized and will consistently update
 * all related state in an atomic operation.
 */
export const useErrorHandlers = () => {
  const handleAuthError = useStore(
    (state) => state[StateSlice.Auth].handleAuthError,
  );

  const handleAppInstallationNeeded = useStore(
    (state) => state[StateSlice.Auth].handleAppInstallationNeeded,
  );

  return {
    handleAuthError,
    handleAppInstallationNeeded,
  };
};

/**
 * Hook to access settings state
 */
export const useSettingsState = () => {
  return useStoreSlice((state) => state[StateSlice.Settings]);
};

/**
 * Hook to access repositories with additional functionality
 */
export const useRepositories = () => {
  const { repositories, loading, error } = useDashboardState();
  const setRepositories = useStore(
    (state) => state[StateSlice.Dashboard].setRepositories,
  );

  const updateRepositories = useCallback(
    (newRepositories: Repository[]) => {
      setRepositories(newRepositories);
    },
    [setRepositories],
  );

  return {
    repositories,
    loading,
    error,
    updateRepositories,
  };
};

/**
 * Hook to access and manipulate summary data
 */
export const useSummary = () => {
  const { summary, loading, error } = useDashboardState();
  const setSummary = useStore(
    (state) => state[StateSlice.Dashboard].setSummary,
  );

  return {
    summary,
    loading,
    error,
    setSummary,
  };
};

/**
 * Hook to access and manipulate date range
 */
export const useDateRange = () => {
  const { dateRange } = useDashboardState();
  const setDateRange = useStore(
    (state) => state[StateSlice.Dashboard].setDateRange,
  );

  const updateDateRange = useCallback(
    (since: string, until: string) => {
      setDateRange(since, until);
    },
    [setDateRange],
  );

  return {
    ...dateRange,
    updateDateRange,
  };
};

/**
 * Hook to access and manipulate filters
 */
export const useFilters = () => {
  const { activeFilters } = useDashboardState();
  const setActiveFilters = useStore(
    (state) => state[StateSlice.Dashboard].setActiveFilters,
  );

  const updateFilters = useCallback(
    (filters: DashboardFilterState) => {
      setActiveFilters(filters);
    },
    [setActiveFilters],
  );

  return {
    filters: activeFilters,
    updateFilters,
  };
};

/**
 * Hook to access and manipulate UI state
 */
export const useUIState = () => {
  const dashboard = useDashboardState();
  const togglePanel = useStore(
    (state) => state[StateSlice.Dashboard].togglePanel,
  );
  const setExpandedPanels = useStore(
    (state) => state[StateSlice.Dashboard].setExpandedPanels,
  );
  const setShowRepoList = useStore(
    (state) => state[StateSlice.Dashboard].setShowRepoList,
  );

  return {
    expandedPanels: dashboard.expandedPanels,
    showRepoList: dashboard.showRepoList,
    togglePanel,
    setExpandedPanels,
    setShowRepoList,
  };
};

/**
 * Hook to access and manipulate installation state
 */
export const useInstallations = () => {
  const dashboard = useDashboardState();
  const setInstallationIds = useStore(
    (state) => state[StateSlice.Dashboard].setInstallationIds,
  );
  const setInstallations = useStore(
    (state) => state[StateSlice.Dashboard].setInstallations,
  );
  const setCurrentInstallations = useStore(
    (state) => state[StateSlice.Dashboard].setCurrentInstallations,
  );
  const setNeedsInstallation = useStore(
    (state) => state[StateSlice.Dashboard].setNeedsInstallation,
  );

  return {
    installationIds: dashboard.installationIds,
    installations: dashboard.installations,
    currentInstallations: dashboard.currentInstallations,
    needsInstallation: dashboard.needsInstallation,
    setInstallationIds,
    setInstallations,
    setCurrentInstallations,
    setNeedsInstallation,
  };
};

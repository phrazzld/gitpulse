/**
 * Zustand Store Hooks
 *
 * This file contains custom hooks for accessing specific slices of state
 * and deriving values from the store.
 *
 * All hooks in this file use the safe store access patterns from useSafeStore.ts
 * to ensure proper error handling and type safety.
 */

import { useCallback } from "react";
import { StateSlice } from "./types";
import { Repository } from "@/types/github";
import { CommitSummary } from "@/types/summary";
import { DashboardFilterState } from "@/types/dashboard";
import {
  useSafeSlice,
  useSafeSelector,
  useSafeAction,
  useSafeObject,
  createHooksFactory,
} from "./hooks/useSafeStore";

/**
 * Create hook factories for each slice to ensure type safety
 */
const dashboardHooks = createHooksFactory(StateSlice.Dashboard);
const authHooks = createHooksFactory(StateSlice.Auth);
const settingsHooks = createHooksFactory(StateSlice.Settings);

/**
 * Hook to access dashboard state
 * This now contains all repository-related state to reduce duplication
 */
export const useDashboardState = () => {
  return useSafeSlice(StateSlice.Dashboard) || {};
};

/**
 * Hook to access auth state
 */
export const useAuthState = () => {
  return useSafeSlice(StateSlice.Auth) || {};
};

/**
 * Hook for accessing the error handlers from auth slice
 *
 * These error handlers are memoized and will consistently update
 * all related state in an atomic operation.
 */
export const useErrorHandlers = () => {
  const handleAuthError = useSafeAction(
    StateSlice.Auth,
    "handleAuthError",
    (message?: string) => {
      console.error("Auth error handler not available:", message);
    },
  );

  const handleAppInstallationNeeded = useSafeAction(
    StateSlice.Auth,
    "handleAppInstallationNeeded",
    () => {
      console.error("App installation handler not available");
    },
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
  return useSafeSlice(StateSlice.Settings) || {};
};

/**
 * Hook to access repositories with additional functionality
 */
export const useRepositories = () => {
  // Use safe selectors with fallbacks for each property
  const state = useSafeObject({
    repositories: {
      selector: (state) => state[StateSlice.Dashboard]?.repositories,
      fallback: [] as Repository[],
    },
    loading: {
      selector: (state) => state[StateSlice.Dashboard]?.loading,
      fallback: false,
    },
    error: {
      selector: (state) => state[StateSlice.Dashboard]?.error,
      fallback: null,
    },
  });

  // Get the setRepositories action with a safe fallback
  const setRepositories = useSafeAction(
    StateSlice.Dashboard,
    "setRepositories",
    (repos: Repository[]) => {
      console.warn("setRepositories action not available, using fallback");
      return repos;
    },
  );

  // Create a memoized update function
  const updateRepositories = useCallback(
    (newRepositories: Repository[]) => {
      setRepositories(newRepositories);
    },
    [setRepositories],
  );

  return {
    ...state,
    updateRepositories,
  };
};

/**
 * Hook to access and manipulate summary data
 */
export const useSummary = () => {
  // Use safe selectors with fallbacks for each property
  const state = useSafeObject({
    summary: {
      selector: (state) => state[StateSlice.Dashboard]?.summary,
      fallback: null as CommitSummary | null,
    },
    loading: {
      selector: (state) => state[StateSlice.Dashboard]?.loading,
      fallback: false,
    },
    error: {
      selector: (state) => state[StateSlice.Dashboard]?.error,
      fallback: null,
    },
  });

  // Get the setSummary action with a safe fallback
  const setSummary = useSafeAction(
    StateSlice.Dashboard,
    "setSummary",
    (summary: CommitSummary | null) => {
      console.warn("setSummary action not available, using fallback");
      return summary;
    },
  );

  return {
    ...state,
    setSummary,
  };
};

/**
 * Hook to access and manipulate date range
 */
export const useDateRange = () => {
  // Use safe selector for dateRange
  const dateRange = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.dateRange,
    { since: "", until: "" },
  );

  // Get the setDateRange action with a safe fallback
  const setDateRange = useSafeAction(
    StateSlice.Dashboard,
    "setDateRange",
    (since: string, until: string) => {
      console.warn("setDateRange action not available, using fallback");
    },
  );

  // Create a memoized update function
  const updateDateRange = useCallback(
    (since: string, until: string) => {
      setDateRange(since, until);
    },
    [setDateRange],
  );

  // Ensure safe access to date properties
  const since = dateRange?.since || "";
  const until = dateRange?.until || "";

  return {
    dateRange,
    since,
    until,
    updateDateRange,
  };
};

/**
 * Hook to access and manipulate filters
 */
export const useFilters = () => {
  // Use safe selector for activeFilters
  const activeFilters = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.activeFilters,
    { repositories: [] },
  );

  // Get the setActiveFilters action with a safe fallback
  const setActiveFilters = useSafeAction(
    StateSlice.Dashboard,
    "setActiveFilters",
    (filters: DashboardFilterState) => {
      console.warn("setActiveFilters action not available, using fallback");
    },
  );

  // Create a memoized update function
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
  // Use safe selectors for UI state properties
  const state = useSafeObject({
    expandedPanels: {
      selector: (state) => state[StateSlice.Dashboard]?.expandedPanels,
      fallback: [],
    },
    showRepoList: {
      selector: (state) => state[StateSlice.Dashboard]?.showRepoList,
      fallback: true,
    },
    loading: {
      selector: (state) => state[StateSlice.Dashboard]?.loading,
      fallback: false,
    },
    error: {
      selector: (state) => state[StateSlice.Dashboard]?.error,
      fallback: null,
    },
  });

  // Get UI state actions with safe fallbacks
  const togglePanel = useSafeAction(
    StateSlice.Dashboard,
    "togglePanel",
    (panelId: string) => {
      console.warn("togglePanel action not available, using fallback");
    },
  );

  const setExpandedPanels = useSafeAction(
    StateSlice.Dashboard,
    "setExpandedPanels",
    (panels: string[]) => {
      console.warn("setExpandedPanels action not available, using fallback");
    },
  );

  const setShowRepoList = useSafeAction(
    StateSlice.Dashboard,
    "setShowRepoList",
    (show: boolean) => {
      console.warn("setShowRepoList action not available, using fallback");
    },
  );

  return {
    ...state,
    togglePanel,
    setExpandedPanels,
    setShowRepoList,
  };
};

/**
 * Hook to access and manipulate installation state
 */
export const useInstallations = () => {
  // Use safe selectors for all installation properties
  const state = useSafeObject({
    installationIds: {
      selector: (state) => state[StateSlice.Dashboard]?.installationIds,
      fallback: [],
    },
    installations: {
      selector: (state) => state[StateSlice.Dashboard]?.installations,
      fallback: [],
    },
    currentInstallations: {
      selector: (state) => state[StateSlice.Dashboard]?.currentInstallations,
      fallback: [],
    },
    needsInstallation: {
      selector: (state) => state[StateSlice.Dashboard]?.needsInstallation,
      fallback: false,
    },
    authMethod: {
      selector: (state) => state[StateSlice.Dashboard]?.authMethod,
      fallback: null,
    },
    loading: {
      selector: (state) => state[StateSlice.Dashboard]?.loading,
      fallback: false,
    },
    error: {
      selector: (state) => state[StateSlice.Dashboard]?.error,
      fallback: null,
    },
  });

  // Get installation actions with safe fallbacks
  const setInstallationIds = useSafeAction(
    StateSlice.Dashboard,
    "setInstallationIds",
    (ids: number[]) => {
      console.warn("setInstallationIds action not available, using fallback");
    },
  );

  const setInstallations = useSafeAction<
    typeof StateSlice.Dashboard,
    "setInstallations",
    [installations: Array<Record<string, unknown>>]
  >(
    StateSlice.Dashboard,
    "setInstallations",
    (installations: Array<Record<string, unknown>>) => {
      console.warn("setInstallations action not available, using fallback");
    },
  );

  const setCurrentInstallations = useSafeAction<
    typeof StateSlice.Dashboard,
    "setCurrentInstallations",
    [installations: Array<Record<string, unknown>>]
  >(
    StateSlice.Dashboard,
    "setCurrentInstallations",
    (installations: Array<Record<string, unknown>>) => {
      console.warn(
        "setCurrentInstallations action not available, using fallback",
      );
    },
  );

  const setNeedsInstallation = useSafeAction(
    StateSlice.Dashboard,
    "setNeedsInstallation",
    (needs: boolean) => {
      console.warn("setNeedsInstallation action not available, using fallback");
    },
  );

  return {
    ...state,
    setInstallationIds,
    setInstallations,
    setCurrentInstallations,
    setNeedsInstallation,
  };
};

/**
 * Hook for panel expansion state
 */
export const usePanelExpansion = () => {
  // Use safe selector for expandedPanels
  const expandedPanels = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.expandedPanels,
    [],
  );

  // Get togglePanel action with safe fallback
  const togglePanel = useSafeAction(
    StateSlice.Dashboard,
    "togglePanel",
    (panelId: string) => {
      console.warn("togglePanel action not available, using fallback");
    },
  );

  // Create a memoized handler function
  const handlePanelExpand = useCallback(
    (panelId: string) => {
      togglePanel(panelId);
    },
    [togglePanel],
  );

  return {
    expandedPanels,
    handlePanelExpand,
  };
};

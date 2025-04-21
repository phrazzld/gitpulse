/**
 * Dashboard State Slice
 *
 * This slice manages dashboard state including repositories, filters, and UI state.
 */

import { StateCreator } from "zustand";
import { DashboardState, RootState, StateSlice } from "../types";
import { Repository, Installation } from "@/types/github";
import { CommitSummary } from "@/types/summary";
import { CLIENT_CACHE_TTL } from "@/lib/constants";
import { setCacheItem } from "@/lib/localStorageCache";

// Helper function to get dates
const getLastWeekDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
};

const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

export interface DashboardSliceActions {
  // Repository actions
  setRepositories: (repositories: Repository[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialLoad: (initialLoad: boolean) => void;
  setError: (error: string | null) => void;

  // Date range actions
  setDateRange: (since: string, until: string) => void;

  // Summary actions
  setSummary: (summary: CommitSummary | null) => void;

  // UI state actions
  setShowRepoList: (show: boolean) => void;
  togglePanel: (panelId: string) => void;
  setExpandedPanels: (panels: string[]) => void;
  setActiveFilters: (filters: { repositories: string[] }) => void;

  // Auth related actions
  setAuthMethod: (method: string | null) => void;
  setNeedsInstallation: (needs: boolean) => void;

  // Installation related actions
  setInstallationIds: (ids: number[]) => void;
  setInstallations: (installations: Installation[]) => void;
  setCurrentInstallations: (installations: Installation[]) => void;

  // Handle repository fetch actions
  handleRepositoryFetchSuccess: (
    repositories: Repository[],
    authMethod?: string | null,
    installationId?: number | null,
    installationIds?: number[],
    installations?: Installation[],
    currentInstallation?: Installation | null,
    currentInstallations?: Installation[],
    needsInstallation?: boolean,
  ) => void;

  // Reset actions
  resetDashboard: () => void;
}

// Initial state for the dashboard slice (no actions included)
const initialDashboardState = {
  repositories: [],
  summary: null,
  installationIds: [],
  installations: [],
  currentInstallations: [],
  loading: false,
  initialLoad: true,
  error: null,
  showRepoList: true,
  expandedPanels: [],
  activeFilters: { repositories: [] },
  authMethod: null,
  needsInstallation: false,
  dateRange: {
    since: getLastWeekDate(),
    until: getTodayDate(),
  },
};

/**
 * Creates the dashboard slice with state and actions
 */
export const createDashboardSlice: StateCreator<
  RootState,
  [],
  [],
  DashboardState & DashboardSliceActions
> = (set, get) => ({
  // Initial state
  ...initialDashboardState,

  // Actions
  setRepositories: (repositories) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        repositories,
      },
    })),

  setLoading: (loading) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        loading,
      },
    })),

  setInitialLoad: (initialLoad) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        initialLoad,
      },
    })),

  setError: (error) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        error,
      },
    })),

  setDateRange: (since, until) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        dateRange: { since, until },
      },
    })),

  setSummary: (summary) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        summary,
      },
    })),

  setShowRepoList: (showRepoList) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        showRepoList,
      },
    })),

  togglePanel: (panelId) =>
    set((state) => {
      const dashboard = state[StateSlice.Dashboard];
      const expandedPanels = dashboard.expandedPanels.includes(panelId)
        ? dashboard.expandedPanels.filter((id) => id !== panelId)
        : [...dashboard.expandedPanels, panelId];

      return {
        [StateSlice.Dashboard]: {
          ...dashboard,
          expandedPanels,
        },
      };
    }),

  setExpandedPanels: (expandedPanels) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        expandedPanels,
      },
    })),

  setActiveFilters: (activeFilters) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        activeFilters,
      },
    })),

  setAuthMethod: (authMethod) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        authMethod,
      },
    })),

  setNeedsInstallation: (needsInstallation) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        needsInstallation,
      },
    })),

  setInstallationIds: (installationIds) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        installationIds,
      },
    })),

  setInstallations: (installations) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        installations,
      },
    })),

  setCurrentInstallations: (currentInstallations) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        currentInstallations,
      },
    })),

  // Composite action for handling repository fetch success - atomic state update
  handleRepositoryFetchSuccess: (
    repositories,
    authMethod = null,
    installationId = null,
    installationIds = [],
    installations = [],
    currentInstallation = null,
    currentInstallations = [],
    needsInstallation = false,
  ) => {
    set((state) => {
      const dashboard = state[StateSlice.Dashboard];

      // Process installationIds
      const updatedInstallationIds =
        installationIds.length > 0
          ? installationIds
          : installationId
            ? [installationId]
            : dashboard.installationIds;

      // Process currentInstallations
      const updatedCurrentInstallations =
        currentInstallations.length > 0
          ? currentInstallations
          : currentInstallation
            ? [currentInstallation]
            : dashboard.currentInstallations;

      // Cache repositories
      if (repositories.length > 0) {
        const cacheKey = `repos:user`; // Cache key could be more specific if needed
        setCacheItem(cacheKey, repositories, CLIENT_CACHE_TTL.LONG);
      }

      // Cache installations
      if (installations.length > 0) {
        setCacheItem("installations", installations, CLIENT_CACHE_TTL.LONG);
      }

      // Cache current installations
      if (updatedCurrentInstallations.length > 0) {
        setCacheItem(
          "currentInstallations",
          updatedCurrentInstallations,
          CLIENT_CACHE_TTL.LONG,
        );
      }

      // Return updated state
      return {
        [StateSlice.Dashboard]: {
          ...dashboard,
          repositories,
          authMethod: authMethod ?? dashboard.authMethod,
          installationIds: updatedInstallationIds,
          installations:
            installations.length > 0 ? installations : dashboard.installations,
          currentInstallations: updatedCurrentInstallations,
          needsInstallation,
          error: null, // Clear previous errors
        },
      };
    });
  },

  // Reset dashboard state
  resetDashboard: () => {
    // Create a complete state with both data and methods
    set((state) => {
      const currentState = state[StateSlice.Dashboard];
      return {
        [StateSlice.Dashboard]: {
          ...initialDashboardState,
          // Keep all the action methods
          setRepositories: currentState.setRepositories,
          setLoading: currentState.setLoading,
          setInitialLoad: currentState.setInitialLoad,
          setError: currentState.setError,
          setDateRange: currentState.setDateRange,
          setSummary: currentState.setSummary,
          setShowRepoList: currentState.setShowRepoList,
          togglePanel: currentState.togglePanel,
          setExpandedPanels: currentState.setExpandedPanels,
          setActiveFilters: currentState.setActiveFilters,
          setAuthMethod: currentState.setAuthMethod,
          setNeedsInstallation: currentState.setNeedsInstallation,
          setInstallationIds: currentState.setInstallationIds,
          setInstallations: currentState.setInstallations,
          setCurrentInstallations: currentState.setCurrentInstallations,
          handleRepositoryFetchSuccess:
            currentState.handleRepositoryFetchSuccess,
          resetDashboard: currentState.resetDashboard,
        },
      };
    });
  },
});

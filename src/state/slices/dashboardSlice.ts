/**
 * Dashboard State Slice
 *
 * This slice manages dashboard state including repositories, filters, and UI state.
 * It now includes all repository-related functionality previously in repositorySlice.
 */

import { StateCreator } from "zustand";
import { DashboardState, RootState, StateSlice } from "../types";
import { Repository, Installation } from "@/types/github";
import { CommitSummary } from "@/types/summary";
import { CLIENT_CACHE_TTL, STORAGE_REFRESH } from "@/lib/constants";
import { setCacheItem, getStaleItem } from "@/lib/localStorageCache";

/**
 * Get installation ID from cookie
 */
function getInstallationIdFromCookie(): number | null {
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  const installCookie = getCookie("github_installation_id");

  if (installCookie) {
    console.log("Found GitHub installation cookie:", installCookie);
    // Parse the installation ID from cookie and use it
    const installationId = parseInt(installCookie, 10);
    if (!isNaN(installationId)) {
      return installationId;
    }
  }

  return null;
}

/**
 * Clear installation cookie
 */
function clearInstallationCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "github_installation_id=; path=/; max-age=0; samesite=lax";
}

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
  setLastRefreshTime: (time: number) => void;

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

  // Repository fetch actions
  fetchRepositories: (
    selectedInstallationId?: number,
    email?: string,
    forceFetch?: boolean,
  ) => Promise<boolean>;
  shouldRefreshRepositories: (accessToken?: string) => boolean;

  // Error handling actions
  handleAuthError: (customMessage?: string) => void;
  handleAppInstallationNeeded: (customMessage?: string) => void;
  handleRepositoryFetchError: (response: Response) => Promise<boolean>;

  // Handle repository fetch actions with atomic updates
  handleRepositoryFetchSuccess: (
    repositories: Repository[],
    authMethod?: string | null,
    installationId?: number | null,
    installationIds?: number[],
    installations?: Installation[],
    currentInstallation?: Installation | null,
    currentInstallations?: Installation[],
    needsInstallation?: boolean,
    cacheKey?: string,
  ) => boolean;

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
  lastRefreshTime: null,
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

  setLastRefreshTime: (lastRefreshTime) =>
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        lastRefreshTime,
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

  // Error handling actions
  handleAuthError: (customMessage) => {
    console.log("GitHub authentication issue detected.");
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        error:
          customMessage ||
          "GitHub authentication issue detected. Your token may be invalid, expired, or missing required permissions. Please sign out and sign in again to grant all necessary permissions.",
      },
    }));
  },

  handleAppInstallationNeeded: (customMessage) => {
    console.log("GitHub App installation needed.");
    set((state) => ({
      [StateSlice.Dashboard]: {
        ...state[StateSlice.Dashboard],
        needsInstallation: true,
        error:
          customMessage ||
          "GitHub App installation required. Please install the GitHub App to access all your repositories, including private ones.",
      },
    }));
  },

  // Helper function to handle fetch errors
  handleRepositoryFetchError: async function (
    response: Response,
  ): Promise<boolean> {
    // Parse the error response using the standardized API error format
    const errorData: {
      error?: string;
      code?: string;
      details?: string;
      requestId?: string;
      signOutRequired?: boolean;
      needsInstallation?: boolean;
      resetAt?: string;
      metadata?: Record<string, unknown>;
    } = await response.json();

    // Log the error with request ID if available for debugging
    if (errorData.requestId) {
      console.error(
        `API Error [${errorData.requestId}]:`,
        errorData.error,
        errorData.code,
      );
    }

    // Check if app installation is needed
    if (errorData.needsInstallation) {
      // GitHub App not installed
      const state = get()[StateSlice.Dashboard];
      state.handleAppInstallationNeeded();
      return false;
    }

    // Check if authentication error (rely on standardized fields)
    if (
      errorData.signOutRequired ||
      response.status === 401 ||
      response.status === 403 ||
      errorData.code === "GITHUB_AUTH_ERROR" ||
      errorData.code === "GITHUB_TOKEN_ERROR" ||
      errorData.code === "GITHUB_SCOPE_ERROR" ||
      errorData.code === "GITHUB_APP_CONFIG_ERROR"
    ) {
      // Auth error - token expired, invalid, or missing required scopes
      const state = get()[StateSlice.Dashboard];
      state.handleAuthError();
      return false;
    }

    // Create error object with all standardized properties
    const error = new Error(errorData.error || "Failed to fetch repositories");

    // Add all standardized properties to the error object
    Object.assign(error, {
      code: errorData.code || "API_ERROR",
      details: errorData.details,
      requestId: errorData.requestId,
      signOutRequired: errorData.signOutRequired || false,
      needsInstallation: errorData.needsInstallation || false,
      resetAt: errorData.resetAt,
      metadata: errorData.metadata,
    });

    throw error;
  },

  // Repository fetch action
  fetchRepositories: async function (
    selectedInstallationId?: number,
    email: string = "user",
    forceFetch: boolean = false,
  ): Promise<boolean> {
    // Create a consistent cache key
    const cacheKey = `repos:${email}`;

    // If we already have repositories from a previous session, maintain them while fetching fresh data
    if (!forceFetch && !selectedInstallationId) {
      // Check for cached data using stale-while-revalidate approach
      const { data: cachedRepos, isStale } =
        getStaleItem<Repository[]>(cacheKey);

      // If we have cached data, use it immediately
      if (cachedRepos && cachedRepos.length > 0) {
        set((state) => ({
          [StateSlice.Dashboard]: {
            ...state[StateSlice.Dashboard],
            repositories: cachedRepos,
          },
        }));
        console.log("Using cached repositories:", cachedRepos.length);

        // If data is fresh enough, don't fetch
        if (!isStale) {
          console.log("Cache is fresh, skipping fetch");
          return true;
        }

        // If data is stale, continue with fetch in background but don't show loading state
        console.log("Cache is stale, fetching in background");
        forceFetch = true;
      }
    }

    try {
      // Only show loading if we don't have cached data
      if (!forceFetch) {
        set((state) => ({
          [StateSlice.Dashboard]: {
            ...state[StateSlice.Dashboard],
            loading: true,
          },
        }));
      }

      // Add installation_id query parameter if it was provided
      const url = selectedInstallationId
        ? `/api/repos?installation_id=${selectedInstallationId}`
        : "/api/repos";

      const response: Response = await fetch(url);

      if (!response.ok) {
        const dashboard = get()[StateSlice.Dashboard];
        return await dashboard.handleRepositoryFetchError(response);
      }

      const data = await response.json();

      // Handle successful fetch with atomic update
      const dashboard = get()[StateSlice.Dashboard];
      return dashboard.handleRepositoryFetchSuccess(
        data.repositories,
        data.authMethod,
        data.installationId,
        data.installationIds,
        data.installations,
        data.currentInstallation,
        data.currentInstallations,
        data.needsInstallation,
        cacheKey,
      );
    } catch (error: unknown) {
      console.error("Error fetching repositories:", error);

      // Handle standardized API error format
      if (error instanceof Error) {
        // Check for API-specific properties
        const apiError = error as Error & {
          code?: string;
          details?: string;
          requestId?: string;
          signOutRequired?: boolean;
          needsInstallation?: boolean;
          resetAt?: string;
          metadata?: Record<string, unknown>;
        };

        // If it's a sign-out required error that wasn't caught earlier
        if (apiError.signOutRequired) {
          const state = get()[StateSlice.Dashboard];
          state.handleAuthError();
          return false;
        }

        // If it's an installation needed error that wasn't caught earlier
        if (apiError.needsInstallation) {
          const state = get()[StateSlice.Dashboard];
          state.handleAppInstallationNeeded();
          return false;
        }

        // Include error details in the message if available
        let errorMessage = apiError.message;
        if (apiError.details && !errorMessage.includes(apiError.details)) {
          errorMessage = `${errorMessage}${
            apiError.details ? `: ${apiError.details}` : ""
          }`;
        }

        // Add request ID for logging if available
        if (apiError.requestId) {
          console.error(`API Error [${apiError.requestId}]: ${errorMessage}`);
        }

        set((state) => ({
          [StateSlice.Dashboard]: {
            ...state[StateSlice.Dashboard],
            error: errorMessage,
          },
        }));
      } else {
        set((state) => ({
          [StateSlice.Dashboard]: {
            ...state[StateSlice.Dashboard],
            error: "Failed to fetch repositories. Please try again.",
          },
        }));
      }
      return false;
    } finally {
      if (!forceFetch) {
        set((state) => ({
          [StateSlice.Dashboard]: {
            ...state[StateSlice.Dashboard],
            loading: false,
          },
        }));
      }
    }
  },

  // Utility to check if repositories should be refreshed
  shouldRefreshRepositories: (accessToken) => {
    // Don't refresh if we have no session
    if (!accessToken) return false;

    const state = get()[StateSlice.Dashboard];

    // Get last refresh time from state
    const lastRefreshTime = state.lastRefreshTime;

    // Check if we have cached repository data
    const cacheKey = `repos:user`;

    // Get stale data if available - stale data is invalid but usable while we refresh
    const { data: cachedData, isStale } = getStaleItem<Repository[]>(cacheKey);

    // If we have cached data but it's stale, allow a refresh
    if (cachedData && isStale) {
      return true;
    }

    // If we have valid cached data, don't refresh
    if (cachedData) {
      return false;
    }

    // If we have no cached data but have repositories in state, use legacy check
    if (state.repositories.length > 0 && lastRefreshTime) {
      // Use longer TTL for repository data
      const timeSinceLastRefresh = Date.now() - lastRefreshTime;
      // Using a constant from STORAGE_REFRESH
      const REPOSITORY_REFRESH_INTERVAL =
        STORAGE_REFRESH.REPOSITORY_REFRESH_INTERVAL || 30 * 60 * 1000; // 30 minutes
      return timeSinceLastRefresh > REPOSITORY_REFRESH_INTERVAL;
    }

    // No cache, no repositories - must refresh
    return true;
  },

  /**
   * Composite action for handling repository fetch success with atomic state update
   *
   * This action updates all repository-related state in a single atomic operation.
   * Using a single atomic update prevents the "Maximum update depth exceeded" error
   * that can occur with multiple sequential state updates.
   *
   * @param repositories - The list of repositories to set in state
   * @param authMethod - The authentication method used (e.g., 'oauth', 'github_app')
   * @param installationId - Single installation ID (used if installationIds is empty)
   * @param installationIds - List of installation IDs
   * @param installations - List of available GitHub App installations
   * @param currentInstallation - Current active installation (used if currentInstallations is empty)
   * @param currentInstallations - List of current active installations
   * @param needsInstallation - Flag indicating if GitHub App installation is needed
   * @param cacheKey - Optional key for caching repositories (defaults to 'repos:user')
   */
  handleRepositoryFetchSuccess: (
    repositories,
    authMethod = null,
    installationId = null,
    installationIds = [],
    installations = [],
    currentInstallation = null,
    currentInstallations = [],
    needsInstallation = false,
    cacheKey?: string,
  ) => {
    // Default cache key if not provided
    const repoCacheKey = cacheKey || "repos:user";
    set((state) => {
      const dashboard = state[StateSlice.Dashboard];

      // Process installationIds with improved null/undefined handling
      const updatedInstallationIds =
        installationIds && installationIds.length > 0
          ? installationIds
          : installationId
            ? [installationId]
            : dashboard.installationIds;

      // Process currentInstallations with improved null/undefined handling
      const updatedCurrentInstallations =
        currentInstallations && currentInstallations.length > 0
          ? currentInstallations
          : currentInstallation
            ? [currentInstallation]
            : dashboard.currentInstallations;

      // Cache repositories if they exist
      if (repositories && repositories.length > 0) {
        setCacheItem(repoCacheKey, repositories, CLIENT_CACHE_TTL.LONG);
      }

      // Cache installations if they exist
      if (installations && installations.length > 0) {
        setCacheItem("installations", installations, CLIENT_CACHE_TTL.LONG);
        console.log("Available installations:", installations.length);
      }

      // Cache current installations if they exist
      if (
        updatedCurrentInstallations &&
        updatedCurrentInstallations.length > 0
      ) {
        setCacheItem(
          "currentInstallations",
          updatedCurrentInstallations,
          CLIENT_CACHE_TTL.LONG,
        );
        console.log(
          "Current installation:",
          currentInstallation?.account?.login ||
            updatedCurrentInstallations[0]?.account?.login ||
            "unknown",
        );
      }

      // Return updated state in a single atomic update
      return {
        [StateSlice.Dashboard]: {
          ...dashboard,
          repositories: repositories || dashboard.repositories,
          loading: false, // Ensure loading is reset
          initialLoad: false, // Mark initial load as complete
          authMethod: authMethod ?? dashboard.authMethod,
          installationIds: updatedInstallationIds,
          installations:
            installations && installations.length > 0
              ? installations
              : dashboard.installations,
          currentInstallations: updatedCurrentInstallations,
          needsInstallation: !!needsInstallation,
          error: null, // Clear previous errors
        },
      };
    });

    // Set a flag in localStorage to track the last refresh time
    // This is used by the window focus refresh mechanism
    localStorage.setItem("lastRepositoryRefresh", Date.now().toString());

    return true; // Return a consistent value for callers expecting a boolean
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
          setLastRefreshTime: currentState.setLastRefreshTime,
          fetchRepositories: currentState.fetchRepositories,
          handleRepositoryFetchError: currentState.handleRepositoryFetchError,
          shouldRefreshRepositories: currentState.shouldRefreshRepositories,
          handleAuthError: currentState.handleAuthError,
          handleAppInstallationNeeded: currentState.handleAppInstallationNeeded,
          handleRepositoryFetchSuccess:
            currentState.handleRepositoryFetchSuccess,
          resetDashboard: currentState.resetDashboard,
        },
      };
    });
  },
});

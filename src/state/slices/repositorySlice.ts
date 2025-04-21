/**
 * Repository State Slice for Zustand
 *
 * This slice manages repository-related state, including fetching repositories,
 * caching, and handling authentication/installation state.
 */

import { StateCreator } from "zustand";
import { RootState, StateSlice } from "../types";
import { Repository, Installation } from "@/types/github";
import { CLIENT_CACHE_TTL } from "@/lib/constants";
import { setCacheItem, getStaleItem } from "@/lib/localStorageCache";

export interface RepositoryState {
  // Data state
  repositories: Repository[];
  installationIds: number[];
  installations: Installation[];
  currentInstallations: Installation[];
  loading: boolean;
  initialLoad: boolean;
  error: string | null;
  authMethod: string | null;
  needsInstallation: boolean;
  lastRefreshTime: number | null;
}

export interface RepositoryActions {
  // Basic state setters
  setRepositories: (repositories: Repository[]) => void;
  setInstallationIds: (ids: number[]) => void;
  setInstallations: (installations: Installation[]) => void;
  setCurrentInstallations: (installations: Installation[]) => void;
  setLoading: (loading: boolean) => void;
  setInitialLoad: (initialLoad: boolean) => void;
  setError: (error: string | null) => void;
  setAuthMethod: (method: string | null) => void;
  setNeedsInstallation: (needs: boolean) => void;
  setLastRefreshTime: (time: number) => void;

  // Complex actions
  fetchRepositories: (
    selectedInstallationId?: number,
    email?: string,
    forceFetch?: boolean,
  ) => Promise<boolean>;

  // Error handlers
  handleAuthError: () => void;
  handleAppInstallationNeeded: () => void;

  // Utility actions
  shouldRefreshRepositories: (accessToken?: string) => boolean;
  reset: () => void;
}

/**
 * Response type for repository API
 */
interface ReposResponse {
  repositories: Repository[];
  authMethod?: string;
  installationId?: number | null;
  installationIds?: number[];
  installations?: Installation[];
  currentInstallation?: Installation | null;
  currentInstallations?: Installation[];
  error?: string;
  code?: string;
  needsInstallation?: boolean;
}

// Initial state for the repository slice
const initialRepositoryState: RepositoryState = {
  repositories: [],
  installationIds: [],
  installations: [],
  currentInstallations: [],
  loading: false,
  initialLoad: true,
  error: null,
  authMethod: null,
  needsInstallation: false,
  lastRefreshTime: null,
};

/**
 * Creates the repository slice with state and actions
 */
export const createRepositorySlice: StateCreator<
  RootState,
  [],
  [],
  RepositoryState & RepositoryActions
> = (set, get) => {
  /**
   * Helper function to handle fetch errors
   */
  const handleRepositoryFetchError = async (
    response: Response,
  ): Promise<boolean> => {
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
      const state = get()[StateSlice.Repository];
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
      const state = get()[StateSlice.Repository];
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
  };

  /**
   * Helper function to handle fetch success with atomic state update
   *
   * This function updates all repository-related state in a single atomic operation.
   * Using a single atomic update prevents the "Maximum update depth exceeded" error
   * that can occur with multiple sequential state updates.
   */
  const handleRepositoryFetchSuccess = (
    data: ReposResponse,
    cacheKey: string,
  ): boolean => {
    // Cache the repositories for future use with 1 hour TTL
    if (data.repositories && data.repositories.length > 0) {
      setCacheItem(cacheKey, data.repositories, CLIENT_CACHE_TTL.LONG);
    }

    // Process installationIds with improved null/undefined handling
    const updatedInstallationIds =
      data.installationIds && data.installationIds.length > 0
        ? data.installationIds
        : data.installationId
          ? [data.installationId]
          : [];

    // Process currentInstallations with improved null/undefined handling
    const updatedCurrentInstallations =
      data.currentInstallations && data.currentInstallations.length > 0
        ? data.currentInstallations
        : data.currentInstallation
          ? [data.currentInstallation]
          : [];

    // Cache installations if they exist
    if (data.installations && data.installations.length > 0) {
      setCacheItem("installations", data.installations, CLIENT_CACHE_TTL.LONG);
      console.log("Available installations:", data.installations.length);
    }

    // Cache current installations if they exist
    if (updatedCurrentInstallations && updatedCurrentInstallations.length > 0) {
      setCacheItem(
        "currentInstallations",
        updatedCurrentInstallations,
        CLIENT_CACHE_TTL.LONG,
      );

      console.log(
        "Current installation:",
        data.currentInstallation?.account?.login ||
          updatedCurrentInstallations[0]?.account?.login ||
          "unknown",
      );
    }

    // Get current state to preserve values that aren't being updated
    const currentState = get()[StateSlice.Repository];

    // Update all state in a single atomic operation
    set((state) => ({
      [StateSlice.Repository]: {
        ...state[StateSlice.Repository],
        repositories: data.repositories || currentState.repositories,
        loading: false, // Ensure loading is reset
        initialLoad: false, // Mark initial load as complete
        authMethod: data.authMethod || currentState.authMethod,
        installationIds:
          updatedInstallationIds.length > 0
            ? updatedInstallationIds
            : currentState.installationIds,
        installations:
          data.installations && data.installations.length > 0
            ? data.installations
            : currentState.installations,
        currentInstallations:
          updatedCurrentInstallations.length > 0
            ? updatedCurrentInstallations
            : currentState.currentInstallations,
        needsInstallation: !!data.needsInstallation,
        error: null, // Clear previous errors
        lastRefreshTime: Date.now(),
      },
    }));

    // Set a flag in localStorage to track the last refresh time
    // This is used by the window focus refresh mechanism
    localStorage.setItem("lastRepositoryRefresh", Date.now().toString());

    return true;
  };

  return {
    // Initial state
    ...initialRepositoryState,

    // Basic state setters
    setRepositories: (repositories) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          repositories,
        },
      })),

    setInstallationIds: (installationIds) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          installationIds,
        },
      })),

    setInstallations: (installations) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          installations,
        },
      })),

    setCurrentInstallations: (currentInstallations) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          currentInstallations,
        },
      })),

    setLoading: (loading) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          loading,
        },
      })),

    setInitialLoad: (initialLoad) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          initialLoad,
        },
      })),

    setError: (error) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          error,
        },
      })),

    setAuthMethod: (authMethod) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          authMethod,
        },
      })),

    setNeedsInstallation: (needsInstallation) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          needsInstallation,
        },
      })),

    setLastRefreshTime: (lastRefreshTime) =>
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          lastRefreshTime,
        },
      })),

    // Error handlers
    handleAuthError: () => {
      console.log("GitHub authentication issue detected.");
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          error:
            "GitHub authentication issue detected. Your token may be invalid, expired, or missing required permissions. Please sign out and sign in again to grant all necessary permissions.",
        },
      }));
    },

    handleAppInstallationNeeded: () => {
      console.log("GitHub App installation needed.");
      set((state) => ({
        [StateSlice.Repository]: {
          ...state[StateSlice.Repository],
          needsInstallation: true,
          error:
            "GitHub App installation required. Please install the GitHub App to access all your repositories, including private ones.",
        },
      }));
    },

    // Complex actions
    fetchRepositories: async (
      selectedInstallationId,
      email = "user",
      forceFetch = false,
    ) => {
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
            [StateSlice.Repository]: {
              ...state[StateSlice.Repository],
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
            [StateSlice.Repository]: {
              ...state[StateSlice.Repository],
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
          return await handleRepositoryFetchError(response);
        }

        const data: ReposResponse = await response.json();

        // Handle successful fetch with atomic update
        return handleRepositoryFetchSuccess(data, cacheKey);
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
            const state = get()[StateSlice.Repository];
            state.handleAuthError();
            return false;
          }

          // If it's an installation needed error that wasn't caught earlier
          if (apiError.needsInstallation) {
            const state = get()[StateSlice.Repository];
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
            [StateSlice.Repository]: {
              ...state[StateSlice.Repository],
              error: errorMessage,
            },
          }));
        } else {
          set((state) => ({
            [StateSlice.Repository]: {
              ...state[StateSlice.Repository],
              error: "Failed to fetch repositories. Please try again.",
            },
          }));
        }
        return false;
      } finally {
        if (!forceFetch) {
          set((state) => ({
            [StateSlice.Repository]: {
              ...state[StateSlice.Repository],
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

      const state = get()[StateSlice.Repository];

      // Get last refresh time from state
      const lastRefreshTime = state.lastRefreshTime;

      // Check if we have cached repository data
      const cacheKey = `repos:user`;

      // Get stale data if available - stale data is invalid but usable while we refresh
      const { data: cachedData, isStale } =
        getStaleItem<Repository[]>(cacheKey);

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
        // Using a constant would be better here, but for now:
        const REPOSITORY_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
        return timeSinceLastRefresh > REPOSITORY_REFRESH_INTERVAL;
      }

      // No cache, no repositories - must refresh
      return true;
    },

    // Reset state to initial values
    reset: () => {
      set((state) => {
        const currentState = state[StateSlice.Repository];
        return {
          [StateSlice.Repository]: {
            ...initialRepositoryState,
            // Keep all action methods when resetting to maintain functionality
            setRepositories: currentState.setRepositories,
            setInstallationIds: currentState.setInstallationIds,
            setInstallations: currentState.setInstallations,
            setCurrentInstallations: currentState.setCurrentInstallations,
            setLoading: currentState.setLoading,
            setInitialLoad: currentState.setInitialLoad,
            setError: currentState.setError,
            setAuthMethod: currentState.setAuthMethod,
            setNeedsInstallation: currentState.setNeedsInstallation,
            setLastRefreshTime: currentState.setLastRefreshTime,
            fetchRepositories: currentState.fetchRepositories,
            handleAuthError: currentState.handleAuthError,
            handleAppInstallationNeeded:
              currentState.handleAppInstallationNeeded,
            shouldRefreshRepositories: currentState.shouldRefreshRepositories,
            reset: currentState.reset,
          },
        };
      });
    },
  };
};

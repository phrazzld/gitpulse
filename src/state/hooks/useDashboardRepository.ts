/**
 * Dashboard Repository Hooks
 *
 * Custom hooks for working with repository state in the dashboard.
 * These hooks encapsulate the repository-related functionality from the Zustand store.
 *
 * This hook has been refactored to use dashboardSlice instead of repositorySlice.
 * It now uses the safe store access patterns to ensure proper error handling and type safety.
 */

import { useCallback, useEffect } from "react";
import { StateSlice } from "../types";
import { Repository } from "@/types/github";
import { useSafeSelector, useSafeAction } from "./useSafeStore";

// T201: Add module-level debug log
console.log("useDashboardRepository.ts module is being loaded");

/**
 * Default state value for when the store is not available
 */
const DEFAULT_STATE = {
  repositories: [] as Repository[],
  loading: false,
  error: null as string | null,
  installationIds: [] as number[],
  installations: [] as Array<Record<string, unknown>>,
  currentInstallations: [] as Array<Record<string, unknown>>,
  authMethod: null as string | null,
  needsInstallation: false,
  initialLoad: true,
};

/**
 * Hook for accessing and managing repository state
 *
 * Uses safe selectors and actions with proper fallbacks to ensure resilience
 * against undefined or null values.
 */
export function useDashboardRepository() {
  // T201: Debug log at start of hook
  console.log("useDashboardRepository: Hook function executing", {
    timestamp: new Date().toISOString(),
    renderPhase: "initial",
  });

  // Use safe selectors with proper fallbacks for all state properties
  const repositories = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.repositories,
    DEFAULT_STATE.repositories,
  );

  const loading = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.loading,
    DEFAULT_STATE.loading,
  );

  const error = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.error,
    DEFAULT_STATE.error,
  );

  const installationIds = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.installationIds,
    DEFAULT_STATE.installationIds,
  );

  const installations = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.installations,
    DEFAULT_STATE.installations,
  );

  const currentInstallations = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.currentInstallations,
    DEFAULT_STATE.currentInstallations,
  );

  const authMethod = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.authMethod,
    DEFAULT_STATE.authMethod,
  );

  const needsInstallation = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.needsInstallation,
    DEFAULT_STATE.needsInstallation,
  );

  const initialLoad = useSafeSelector(
    (state) => state[StateSlice.Dashboard]?.initialLoad,
    DEFAULT_STATE.initialLoad,
  );

  // Get actions with safe fallbacks
  const fetchRepositories = useSafeAction<
    typeof StateSlice.Dashboard,
    "fetchRepositories",
    [installationId?: number, userEmail?: string],
    Promise<boolean>
  >(StateSlice.Dashboard, "fetchRepositories", async () => {
    console.warn("fetchRepositories action not available, using fallback");
    return false;
  });

  const shouldRefreshRepositories = useSafeAction<
    typeof StateSlice.Dashboard,
    "shouldRefreshRepositories",
    [accessToken?: string],
    boolean
  >(StateSlice.Dashboard, "shouldRefreshRepositories", () => {
    console.warn(
      "shouldRefreshRepositories action not available, using fallback",
    );
    return false;
  });

  const setInitialLoad = useSafeAction(
    StateSlice.Dashboard,
    "setInitialLoad",
    (value: boolean) => {
      console.warn("setInitialLoad action not available, using fallback");
    },
  );

  const handleAuthError = useSafeAction(
    StateSlice.Dashboard,
    "handleAuthError",
    (message?: string) => {
      console.warn(
        "handleAuthError action not available, using fallback:",
        message,
      );
    },
  );

  const handleAppInstallationNeeded = useSafeAction(
    StateSlice.Dashboard,
    "handleAppInstallationNeeded",
    () => {
      console.warn(
        "handleAppInstallationNeeded action not available, using fallback",
      );
    },
  );

  // Effect to update initialLoad status after first fetch completes
  useEffect(() => {
    // T201: Debug log for useEffect in useDashboardRepository
    console.log("useDashboardRepository: useEffect for initialLoad triggered", {
      loading,
      repositoriesLength: repositories?.length || 0,
      initialLoad,
      timestamp: new Date().toISOString(),
    });

    // Check if we should update initialLoad
    const shouldUpdateInitialLoad =
      !loading && repositories && repositories.length > 0 && initialLoad;

    console.log("useDashboardRepository: Should update initialLoad?", {
      shouldUpdateInitialLoad,
      conditionDetails: {
        notLoading: !loading,
        repositoriesExist: !!repositories,
        repositoriesNotEmpty: repositories?.length > 0,
        isInitialLoad: initialLoad,
      },
    });

    if (shouldUpdateInitialLoad) {
      console.log("useDashboardRepository: Setting initialLoad to false");
      setInitialLoad(false);
    }
  }, [loading, repositories, initialLoad, setInitialLoad]);

  /**
   * Fetch repositories with cookie handling
   */
  const fetchRepositoriesWithCookieHandling = useCallback(
    async (sessionEmail?: string, sessionToken?: string) => {
      console.log("fetchRepositoriesWithCookieHandling called", {
        sessionEmail,
        sessionToken,
      });

      // Check for GitHub installation cookie
      const installationId = getInstallationIdFromCookie();

      let success = false;
      try {
        if (installationId) {
          success = (await fetchRepositories(
            installationId,
            sessionEmail,
          )) as boolean;

          if (success) {
            // Update localStorage for legacy code compatibility
            localStorage.setItem(
              "lastRepositoryRefresh",
              Date.now().toString(),
            );
          }

          // Clear the cookie after using it
          clearInstallationCookie();
          return success;
        }

        // No installation cookie found, proceed with normal fetch
        success = (await fetchRepositories(undefined, sessionEmail)) as boolean;

        if (success) {
          localStorage.setItem("lastRepositoryRefresh", Date.now().toString());
        }

        return success;
      } catch (error) {
        console.error("Error in fetchRepositoriesWithCookieHandling:", error);
        return false;
      }
    },
    [fetchRepositories],
  );

  /**
   * Setup window focus refresh logic
   */
  const setupWindowFocusRefresh = useCallback(
    (sessionToken?: string) => {
      const handleFocus = () => {
        try {
          // Only refresh if needed
          if (shouldRefreshRepositories(sessionToken)) {
            console.log(
              "Window focused, refreshing repositories (due to cache expiration)",
            );
            fetchRepositories()
              .then((result) => {
                // Update the last refresh time
                const success = result as boolean;
                if (success) {
                  localStorage.setItem(
                    "lastRepositoryRefresh",
                    Date.now().toString(),
                  );
                }
              })
              .catch((error: Error) => {
                console.error(
                  "Error refreshing repositories on window focus:",
                  error,
                );
              });
          } else {
            console.log(
              "Window focused, skipping repository refresh (recently fetched)",
            );
          }
        } catch (error) {
          console.error("Error in handleFocus:", error);
        }
      };

      // Add window focus event listener
      window.addEventListener("focus", handleFocus);

      // Return cleanup function
      return () => {
        window.removeEventListener("focus", handleFocus);
      };
    },
    [fetchRepositories, shouldRefreshRepositories],
  );

  // Log state for debugging
  console.log("useDashboardRepository state:", {
    repositoriesCount: repositories?.length || 0,
    loading,
    hasError: !!error,
    installationIds,
    initialLoad,
  });

  return {
    // State properties
    repositories,
    loading,
    error,
    installationIds,
    installations,
    currentInstallations,
    authMethod,
    needsInstallation,
    initialLoad,

    // Actions
    fetchRepositories,
    fetchRepositoriesWithCookieHandling,
    setupWindowFocusRefresh,
    handleAuthError,
    handleAppInstallationNeeded,
  };
}

/**
 * Get installation ID from cookie
 *
 * Note: This function is duplicated in dashboardSlice.ts.
 * In a future update, we should refactor to use a shared utility.
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
 *
 * Note: This function is duplicated in dashboardSlice.ts.
 * In a future update, we should refactor to use a shared utility.
 */
function clearInstallationCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "github_installation_id=; path=/; max-age=0; samesite=lax";
}

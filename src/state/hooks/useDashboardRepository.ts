/**
 * Dashboard Repository Hooks
 *
 * Custom hooks for working with repository state in the dashboard.
 * These hooks encapsulate the repository-related functionality from the Zustand store.
 *
 * This hook has been refactored to use dashboardSlice instead of repositorySlice.
 */

import { useCallback, useEffect } from "react";
import { useStore } from "../store";
import { StateSlice } from "../types";
import { Repository } from "@/types/github";

// T201: Add module-level debug log
console.log("useDashboardRepository.ts module is being loaded");

/**
 * Hook for accessing and managing repository state
 */
export function useDashboardRepository() {
  // T201: Debug log at start of hook
  console.log("useDashboardRepository: Hook function executing", {
    timestamp: new Date().toISOString(),
    renderPhase: "initial",
  });

  // Check store initialization before accessing
  const storeState = useStore.getState();
  console.log("useDashboardRepository: Store state check", {
    hasStore: !!storeState,
    storeKeys: storeState ? Object.keys(storeState) : [],
    hasDashboardSlice: !!storeState?.[StateSlice.Dashboard],
    timestamp: new Date().toISOString(),
  });

  // Repository state from dashboard slice
  console.log(
    "useDashboardRepository: About to access dashboard slice from store",
  );
  const dashboard = useStore((state) => state[StateSlice.Dashboard]);
  console.log("useDashboardRepository: Dashboard slice result", {
    hasDashboard: !!dashboard,
    dashboardType: typeof dashboard,
    dashboardKeys: dashboard ? Object.keys(dashboard) : [],
    timestamp: new Date().toISOString(),
  });

  // Log state presence for debugging
  if (!dashboard) {
    console.error(
      "Dashboard state is not available in useDashboardRepository",
      {
        storeState: !!storeState,
        storeStateType: typeof storeState,
        timestamp: new Date().toISOString(),
      },
    );

    // Return minimal defaults - container will handle this case
    return {
      repositories: [],
      loading: false,
      error: null,
      installationIds: [],
      installations: [],
      currentInstallations: [],
      authMethod: null,
      needsInstallation: false,
      initialLoad: true,
    };
  }

  // Extract state properties with defensive defaults
  const {
    repositories = [],
    loading = false,
    error = null,
    installationIds = [],
    installations = [],
    currentInstallations = [],
    authMethod = null,
    needsInstallation = false,
    initialLoad = true,
  } = dashboard;

  // Repository actions - get from dashboard slice with null-safety
  const fetchRepositories =
    useStore((state) => state[StateSlice.Dashboard]?.fetchRepositories) ||
    (() => Promise.resolve(false));

  const shouldRefreshRepositories =
    useStore(
      (state) => state[StateSlice.Dashboard]?.shouldRefreshRepositories,
    ) || (() => false);

  const setInitialLoad =
    useStore((state) => state[StateSlice.Dashboard]?.setInitialLoad) ||
    (() => {});

  const handleAuthError =
    useStore((state) => state[StateSlice.Dashboard]?.handleAuthError) ||
    (() => {});

  const handleAppInstallationNeeded =
    useStore(
      (state) => state[StateSlice.Dashboard]?.handleAppInstallationNeeded,
    ) || (() => {});

  // Effect to update initialLoad status after first fetch completes
  useEffect(() => {
    // T201: Debug log for useEffect in useDashboardRepository
    console.log("useDashboardRepository: useEffect for initialLoad triggered", {
      loading,
      hasRepositories: !!repositories,
      repositoriesLength: repositories ? repositories.length : -1,
      initialLoad,
      hasSetInitialLoad: typeof setInitialLoad === "function",
      timestamp: new Date().toISOString(),
    });

    // Check if we should update initialLoad
    const shouldUpdateInitialLoad =
      !loading && repositories && repositories.length > 0 && initialLoad;
    console.log("useDashboardRepository: Should update initialLoad?", {
      shouldUpdateInitialLoad,
      conditionDetails: {
        notLoading: !loading,
        hasRepositoriesArray: !!repositories,
        repositoriesNotEmpty: repositories && repositories.length > 0,
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

      // Check if fetchRepositories exists
      if (!fetchRepositories) {
        console.error("fetchRepositories function is not available");
        return false;
      }

      // Check for GitHub installation cookie
      const installationId = getInstallationIdFromCookie();

      let success = false;
      try {
        if (installationId) {
          success = await fetchRepositories(installationId, sessionEmail);

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
        success = await fetchRepositories(undefined, sessionEmail);

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
      // Check if required functions exist
      if (!shouldRefreshRepositories || !fetchRepositories) {
        console.error(
          "Required functions not available for window focus refresh",
        );
        return () => {}; // Return no-op cleanup function
      }

      const handleFocus = () => {
        try {
          // Only refresh if needed
          if (shouldRefreshRepositories(sessionToken)) {
            console.log(
              "Window focused, refreshing repositories (due to cache expiration)",
            );
            fetchRepositories()
              .then((success) => {
                // Update the last refresh time
                if (success) {
                  localStorage.setItem(
                    "lastRepositoryRefresh",
                    Date.now().toString(),
                  );
                }
              })
              .catch((error) => {
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
    repositories,
    loading,
    error,
    installationIds,
    installations,
    initialLoad,
  });

  return {
    // State
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

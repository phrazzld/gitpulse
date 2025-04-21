/**
 * Dashboard Repository Hooks
 *
 * Custom hooks for working with repository state in the dashboard.
 * These hooks encapsulate the repository-related functionality from the Zustand store.
 */

import { useCallback, useEffect } from "react";
import { useStore } from "../store";
import { StateSlice } from "../types";
import { Repository } from "@/types/github";

/**
 * Hook for accessing and managing repository state
 */
export function useDashboardRepository() {
  // Repository state
  const repositories = useStore(
    (state) => state[StateSlice.Repository].repositories,
  );
  const loading = useStore((state) => state[StateSlice.Repository].loading);
  const error = useStore((state) => state[StateSlice.Repository].error);
  const installationIds = useStore(
    (state) => state[StateSlice.Repository].installationIds,
  );
  const installations = useStore(
    (state) => state[StateSlice.Repository].installations,
  );
  const currentInstallations = useStore(
    (state) => state[StateSlice.Repository].currentInstallations,
  );
  const authMethod = useStore(
    (state) => state[StateSlice.Repository].authMethod,
  );
  const needsInstallation = useStore(
    (state) => state[StateSlice.Repository].needsInstallation,
  );
  const initialLoad = useStore(
    (state) => state[StateSlice.Repository].initialLoad,
  );

  // Repository actions
  const fetchRepositories = useStore(
    (state) => state[StateSlice.Repository].fetchRepositories,
  );
  const shouldRefreshRepositories = useStore(
    (state) => state[StateSlice.Repository].shouldRefreshRepositories,
  );
  const setInitialLoad = useStore(
    (state) => state[StateSlice.Repository].setInitialLoad,
  );
  const handleAuthError = useStore(
    (state) => state[StateSlice.Repository].handleAuthError,
  );
  const handleAppInstallationNeeded = useStore(
    (state) => state[StateSlice.Repository].handleAppInstallationNeeded,
  );

  // Effect to update initialLoad status after first fetch completes
  useEffect(() => {
    if (!loading && repositories.length > 0 && initialLoad) {
      setInitialLoad(false);
    }
  }, [loading, repositories.length, initialLoad, setInitialLoad]);

  /**
   * Fetch repositories with cookie handling
   */
  const fetchRepositoriesWithCookieHandling = useCallback(
    async (sessionEmail?: string, sessionToken?: string) => {
      // Check for GitHub installation cookie
      const installationId = getInstallationIdFromCookie();

      let success = false;
      if (installationId) {
        success = await fetchRepositories(installationId, sessionEmail);

        if (success) {
          // Update localStorage for legacy code compatibility
          localStorage.setItem("lastRepositoryRefresh", Date.now().toString());
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
    },
    [fetchRepositories],
  );

  /**
   * Setup window focus refresh logic
   */
  const setupWindowFocusRefresh = useCallback(
    (sessionToken?: string) => {
      const handleFocus = () => {
        // Only refresh if needed
        if (shouldRefreshRepositories(sessionToken)) {
          console.log(
            "Window focused, refreshing repositories (due to cache expiration)",
          );
          fetchRepositories().then((success) => {
            // Update the last refresh time
            if (success) {
              localStorage.setItem(
                "lastRepositoryRefresh",
                Date.now().toString(),
              );
            }
          });
        } else {
          console.log(
            "Window focused, skipping repository refresh (recently fetched)",
          );
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

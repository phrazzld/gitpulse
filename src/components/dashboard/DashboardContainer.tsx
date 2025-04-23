"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLoadingState from "@/components/DashboardLoadingState";
import { useStore } from "@/state/store";
import { StateSlice } from "@/state/types";
import { useDashboardRepository } from "@/state";
import { withZustand } from "@/state/withZustand";
import { useSafeSelector } from "@/state/hooks/useSafeStore";

// T201: Add debug logs for component mounting verification
console.log("DashboardContainer.tsx module is being loaded");

interface DashboardContainerProps {
  children: ReactNode;
}

/**
 * Dashboard Container Component
 *
 * Handles data fetching, authentication, and session management.
 * Acts as a container for the dashboard layout, providing data to child components.
 *
 * Child components can directly access state via hooks rather than receiving props.
 *
 * Note: This component is wrapped with withZustand HOC at the bottom of this file
 * to ensure the store is hydrated before the component renders.
 */
function DashboardContainer({ children }: DashboardContainerProps) {
  // T201: Debug log at the very top of component render
  console.log("DashboardContainer: Component function executing", {
    timestamp: new Date().toISOString(),
    renderPhase: "initial",
  });

  // T202: Check if store is hydrated - use safe selector with fallback
  const isStoreHydrated = useSafeSelector((state) => state.isHydrated, false);
  console.log("DashboardContainer: Store hydration check", { isStoreHydrated });

  const { data: session, status } = useSession();
  console.log("DashboardContainer: Session status", {
    status,
    hasSession: !!session,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  console.log("DashboardContainer: isInitialized state", { isInitialized });

  // Access dashboard slice with safe selector to ensure store is initialized
  // T201: Debug store access
  console.log("DashboardContainer: About to access Zustand store");
  const storeState = useStore.getState();
  console.log("DashboardContainer: Full store state available?", {
    hasStore: !!storeState,
    storeKeys: storeState ? Object.keys(storeState) : [],
    hasDashboardSlice: !!storeState?.[StateSlice.Dashboard],
    isHydrated: storeState?.isHydrated,
  });

  // With withZustand HOC, it's now safe to access dashboard state with safe selector
  const dashboardState = useSafeSelector(
    (state) => state[StateSlice.Dashboard],
    {
      // Provide default values for dashboard state to satisfy TypeScript
      repositories: [],
      loading: false,
      error: null,
      installationIds: [],
      installations: [],
      currentInstallations: [],
      authMethod: null,
      needsInstallation: false,
      initialLoad: true,
      fetchRepositories: async () => false,
      shouldRefreshRepositories: () => false,
      setInitialLoad: () => {},
      setRepositories: () => {},
      setLoading: () => {},
      setError: () => {},
      handleAuthError: () => {},
      handleAppInstallationNeeded: () => {},
    },
  );
  console.log("DashboardContainer: Retrieved dashboard state", {
    hasDashboardState: !!dashboardState,
    initialLoad: dashboardState.initialLoad,
  });

  // Get repository data and actions from Zustand
  console.log("DashboardContainer: About to call useDashboardRepository");
  const {
    initialLoad = true, // Default to true to show loading state
    fetchRepositoriesWithCookieHandling,
    setupWindowFocusRefresh,
  } = useDashboardRepository() || {};

  // Ensure store is initialized - run once on mount
  useEffect(() => {
    // T201: Enhanced debug logging for store initialization
    console.log(
      "DashboardContainer: useEffect for store initialization triggered",
      {
        hasDashboardState: !!dashboardState,
        timestamp: new Date().toISOString(),
      },
    );

    if (dashboardState) {
      // Check all relevant properties with defensive access
      const hasRepos =
        Array.isArray(dashboardState.repositories) &&
        dashboardState.repositories.length > 0;
      const repoCount = Array.isArray(dashboardState.repositories)
        ? dashboardState.repositories.length
        : -1;

      console.log(
        "DashboardContainer: Dashboard state initialized with details:",
        {
          initialLoad: dashboardState.initialLoad,
          hasRepos: hasRepos,
          repoCount: repoCount,
          hasActions: {
            hasFetchRepositories:
              typeof dashboardState.fetchRepositories === "function",
            hasSetInitialLoad:
              typeof dashboardState.setInitialLoad === "function",
            hasSetRepositories:
              typeof dashboardState.setRepositories === "function",
          },
          stateType: typeof dashboardState,
          storeStructure: Object.keys(dashboardState),
        },
      );

      setIsInitialized(true);
    } else {
      console.error(
        "DashboardContainer: Dashboard state not initialized properly - state is falsy",
      );
    }
  }, [dashboardState]);

  // Setup window focus refresh handler
  useEffect(() => {
    if (session?.accessToken && setupWindowFocusRefresh) {
      try {
        return setupWindowFocusRefresh(session.accessToken);
      } catch (error) {
        console.error("Error setting up window focus refresh:", error);
      }
    }
    return undefined; // Explicitly return undefined for TypeScript
  }, [session, setupWindowFocusRefresh]);

  // Fetch repositories when session is available
  useEffect(() => {
    const fetchRepos = async () => {
      if (session) {
        try {
          console.log("DashboardContainer: Fetching repositories for session", {
            user: session.user?.name,
            email: session.user?.email,
          });

          if (fetchRepositoriesWithCookieHandling) {
            await fetchRepositoriesWithCookieHandling(
              session.user?.email as string,
              session.accessToken as string,
            ).catch((error) => {
              console.error("Error fetching repositories:", error);
            });
          } else {
            // Fallback direct fetch
            console.log("Fallback: Direct fetch to /api/repos");
            const response = await fetch("/api/repos");
            if (response.ok) {
              const data = await response.json();
              console.log("Fetched repositories:", data);

              // If we had to use the fallback, update the state directly
              if (dashboardState && dashboardState.setRepositories) {
                dashboardState.setRepositories(data.repositories || []);
                dashboardState.setInitialLoad(false);
              }
            } else {
              console.error("Failed to fetch repositories:", response.status);
            }
          }
        } catch (error) {
          console.error("Error in repository fetch effect:", error);
        }
      }
    };

    // Only fetch if store is initialized
    if (isInitialized) {
      fetchRepos();
    }
  }, [
    session,
    fetchRepositoriesWithCookieHandling,
    isInitialized,
    dashboardState,
  ]);

  // T204: Show enhanced loading state with more details during initialization
  if (status === "loading" || initialLoad || !isInitialized) {
    return (
      <DashboardLoadingState
        status={status}
        isInitialLoad={initialLoad}
        isStoreInitialized={isInitialized}
        message={
          status === "loading"
            ? "Authenticating..."
            : initialLoad
              ? "Loading repositories..."
              : "Initializing dashboard..."
        }
      />
    );
  }

  // Render children (the dashboard layout) once data is loaded
  console.log("DashboardContainer: Rendering children", {
    timestamp: new Date().toISOString(),
    renderPhase: "final",
    hasSession: !!session,
    initialLoad,
    isInitialized,
    status,
  });

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="fixed top-2 right-2 px-2 py-1 rounded bg-muted text-muted-foreground text-xs border">
        Dashboard Container Rendered: {new Date().toLocaleTimeString()}
      </div>
      <div className="container mx-auto p-4">{children}</div>
    </div>
  );
}

// Export the component wrapped with withZustand HOC
// This ensures the store is hydrated before the component renders
export default withZustand(
  DashboardContainer,
  <DashboardLoadingState
    status="loading"
    message="Initializing application state..."
  />,
);

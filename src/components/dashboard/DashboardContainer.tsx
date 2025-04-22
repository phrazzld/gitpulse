"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardLoadingState from "@/components/DashboardLoadingState";
import { useStore } from "@/state/store";
import { StateSlice } from "@/state/types";
import { useDashboardRepository } from "@/state";

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
 */
export default function DashboardContainer({
  children,
}: DashboardContainerProps) {
  // T201: Debug log at the very top of component render
  console.log("DashboardContainer: Component function executing", {
    timestamp: new Date().toISOString(),
    renderPhase: "initial",
  });

  const { data: session, status } = useSession();
  console.log("DashboardContainer: Session status", {
    status,
    hasSession: !!session,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  console.log("DashboardContainer: isInitialized state", { isInitialized });

  // Access dashboard slice directly first to ensure store is initialized
  // T201: Debug store access
  console.log("DashboardContainer: About to access Zustand store");
  const storeState = useStore.getState();
  console.log("DashboardContainer: Full store state available?", {
    hasStore: !!storeState,
    storeKeys: storeState ? Object.keys(storeState) : [],
    hasDashboardSlice: !!storeState?.[StateSlice.Dashboard],
  });

  const dashboardState = useStore((state) => state[StateSlice.Dashboard]);
  console.log("DashboardContainer: Retrieved dashboard state", {
    hasDashboardState: !!dashboardState,
    initialLoad: dashboardState?.initialLoad,
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

  // Show loading state during initial session loading or first data fetch
  if (status === "loading" || initialLoad || !isInitialized) {
    return <DashboardLoadingState />;
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
    <div className="w-full h-full">
      {/* T201: Additional diagnostic div */}
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          padding: "10px",
          background: "black",
          color: "lime",
          border: "1px solid lime",
          zIndex: 9999,
        }}
      >
        Dashboard Container Rendered: {new Date().toLocaleTimeString()}
      </div>

      {children}
    </div>
  );
}

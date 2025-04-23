"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import DashboardContainer from "@/components/dashboard/DashboardContainer";
import DashboardContent from "@/components/dashboard/DashboardContent";
import SimpleDashboard from "@/components/dashboard/SimpleDashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";
import { useStore } from "@/state/store";
import { StateSlice } from "@/state/types";
import { useDashboardRepository } from "@/state";
import {
  useErrorHandlers,
  useUIState,
  usePanelExpansion,
  useSummaryGeneration,
  useDateRange,
} from "@/state";

// T204: Module-level debug log
console.log("Dashboard page.tsx module is being loaded");

/**
 * Dashboard Page Component
 *
 * Main dashboard view with activity metrics, summary panels, and commit timeline.
 * Redesigned with improved component responsibility separation.
 *
 * @returns The dashboard page component
 */
export default function Dashboard() {
  // T201: Add debug log at start of component render
  console.log("Dashboard page: Component function executing", {
    timestamp: new Date().toISOString(),
    renderPhase: "initial",
  });

  // T203: Add state to track initialization errors
  const [hasStateError, setHasStateError] = useState(false);
  const [stateError, setStateError] = useState<Error | null>(null);

  // Detect state initialization issues
  useEffect(() => {
    try {
      // Check if store is accessible
      const storeState = useStore.getState();
      console.log("Dashboard page: Checking store state", {
        hasStore: !!storeState,
        isHydrated: storeState?.isHydrated,
        hasDashboardSlice: !!storeState?.[StateSlice.Dashboard],
      });

      // Check for critical conditions that would cause rendering to fail
      if (!storeState || !storeState[StateSlice.Dashboard]) {
        console.error("Dashboard state not properly initialized");
        setStateError(new Error("Dashboard state not properly initialized"));
        setHasStateError(true);
      }
    } catch (err) {
      console.error("Error checking store state:", err);
      setStateError(
        err instanceof Error
          ? err
          : new Error("Unknown error checking store state"),
      );
      setHasStateError(true);
    }
  }, []);

  const { data: session } = useSession();
  console.log("Dashboard page: Session data", {
    hasSession: !!session,
    user: session?.user?.name,
  });

  // Minimal state needed for the layout component
  console.log("Dashboard page: About to access state hooks");
  const { error: uiError } = useUIState();
  const { expandedPanels, handlePanelExpand } = usePanelExpansion();
  const { generateSummary } = useSummaryGeneration();
  const { handleAuthError } = useErrorHandlers();

  // Fetch repository data from hook - T204: Centralize state access in the page component
  const {
    repositories = [],
    loading = false,
    error = null,
  } = useDashboardRepository();

  // Get date range from useDateRange hook directly - safer than trying to get it from useDashboardRepository
  const { dateRange = { since: "", until: "" } } = useDateRange();

  console.log("Dashboard page: State hooks accessed", {
    hasUiError: !!uiError,
    expandedPanelsCount: expandedPanels?.length || 0,
    hasGenerateSummary: typeof generateSummary === "function",
    hasHandleAuthError: typeof handleAuthError === "function",
    repositoriesCount: repositories.length,
    loading,
    hasError: !!error,
  });

  console.log("Dashboard page: About to render component tree");

  // T203: If we detected a state error, render the simplified dashboard
  if (hasStateError) {
    console.log("Dashboard page: Rendering SimpleDashboard due to state error");
    return <SimpleDashboard error={stateError} />;
  }

  return (
    // T203: Wrap with ErrorBoundary that renders SimpleDashboard on error
    <ErrorBoundary
      fallback={(error, errorInfo) => (
        <SimpleDashboard error={error} errorInfo={errorInfo} />
      )}
    >
      <div>
        <DashboardContainer>
          <DashboardErrorBoundary
            componentId="dashboard-page-root"
            contextInfo={{
              hasSession: !!session,
              repositoryCount: repositories?.length || 0,
              hasError: !!error,
              isLoading: loading,
            }}
            fallback={(props) => (
              <SimpleDashboard
                error={props.error}
                errorInfo={props.errorInfo?.componentStack || ""}
              />
            )}
          >
            <DashboardContent
              session={session}
              repositories={repositories}
              loading={loading}
              error={error}
              expandedPanels={expandedPanels}
              onPanelExpand={handlePanelExpand}
              generateSummary={generateSummary}
              handleAuthError={handleAuthError}
              dateRange={dateRange}
            />
          </DashboardErrorBoundary>
        </DashboardContainer>
      </div>
    </ErrorBoundary>
  );
}

"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { ActivityMode } from "@/types/activity";
import DashboardLoadingState from "@/components/DashboardLoadingState";
import { DashboardGridContainer } from "@/components/dashboard/layout";
import { Card } from "@/components/library";
import AuthenticationStatusBanner from "@/components/dashboard/AuthenticationStatusBanner";
import FilterControls from "@/components/dashboard/FilterControls";
import RepositoryInfoPanel from "@/components/dashboard/RepositoryInfoPanel";
import ActionButton from "@/components/dashboard/ActionButton";
import DashboardSummaryPanel from "@/components/dashboard/DashboardSummaryPanel";
import ActivityOverviewPanel from "@/components/dashboard/ActivityOverviewPanel";
import ActivityFeedPanel from "@/components/dashboard/ActivityFeedPanel";
import {
  useDashboardState,
  useDateRange,
  useFilters,
  useUIState,
  useInstallations,
  usePanelExpansion,
  useErrorHandlers,
  useDashboardRepository,
  useActivityMetrics,
  useSummaryGeneration,
} from "@/state";

// Helper function to get GitHub App installation URL
function getGitHubAppInstallUrl() {
  // Use the provided app name or a generic message if not configured
  const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;

  if (!appName) {
    // If no app name is configured, we'll create a more informative error
    console.error(
      "GitHub App name not configured. Please set NEXT_PUBLIC_GITHUB_APP_NAME environment variable.",
    );
    return "https://github.com/apps/installations/new";
  }

  // Use the standard GitHub App installation URL - our custom handler will intercept it
  return `https://github.com/apps/${appName}/installations/new`;
}

/**
 * Dashboard Page Component
 *
 * Main dashboard view with activity metrics, summary panels, and commit timeline.
 * Redesigned to use the new dashboard components with improved UI.
 *
 * @returns The dashboard page component
 */
export default function Dashboard() {
  const { data: session, status } = useSession();

  // Get state and actions from Zustand hooks
  const {
    loading: uiLoading,
    error: uiError,
    showRepoList,
    setShowRepoList,
  } = useUIState();
  const { dateRange, updateDateRange } = useDateRange();
  const { filters: activeFilters, updateFilters } = useFilters();
  const { expandedPanels, handlePanelExpand } = usePanelExpansion();
  const {
    installationIds,
    installations,
    needsInstallation,
    authMethod,
    error: installationError,
  } = useInstallations();

  // Activity mode is hardcoded to 'my-activity' as we no longer support team/org views
  const activityMode: ActivityMode = "my-activity";

  // Get repository data and actions from Zustand
  const {
    repositories,
    loading: repoLoading,
    initialLoad,
    error: repoError,
    fetchRepositoriesWithCookieHandling,
    setupWindowFocusRefresh,
  } = useDashboardRepository();

  // Get summary generation functionality
  const { generateSummary } = useSummaryGeneration();

  // Get error handlers
  const { handleAuthError } = useErrorHandlers();

  // Calculate metrics directly from Zustand store
  const metrics = useActivityMetrics();

  // Dashboard state from Zustand store
  const { summary } = useDashboardState();

  // Setup window focus refresh handler
  useEffect(() => {
    if (session?.accessToken) {
      return setupWindowFocusRefresh(session.accessToken);
    }
    return undefined; // Explicitly return undefined for TypeScript
  }, [session, setupWindowFocusRefresh]);

  // Fetch repositories when session is available
  useEffect(() => {
    if (session) {
      fetchRepositoriesWithCookieHandling(
        session.user?.email as string,
        session.accessToken as string,
      );
    }
  }, [session, fetchRepositoriesWithCookieHandling]);

  // Function to handle date range changes
  const handleDateRangeChange = (newDateRange: {
    since: string;
    until: string;
  }) => {
    updateDateRange(newDateRange.since, newDateRange.until);
  };

  // Function to handle filter changes
  const handleFilterChange = (newFilters: { repositories: string[] }) => {
    updateFilters(newFilters);
    console.log("Filters updated:", newFilters);
  };

  // Determine loading state for UI components
  const isLoading = uiLoading || repoLoading;

  // Determine error state for UI components
  const error = uiError || repoError || installationError;

  // Show loading state during initial session loading or first data fetch
  if (status === "loading" || initialLoad) {
    return <DashboardLoadingState />;
  }

  return (
    <div
      className="bg-dark-slate min-h-screen"
      data-testid="dashboard-container"
    >
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DashboardGridContainer className="px-4 py-6 sm:px-0">
          {/* Authentication Status and Control Panel - full width */}
          <div className="col-span-12">
            <Card
              padding="lg"
              radius="md"
              shadow="lg"
              className="mb-6"
              style={{
                backgroundColor: "rgba(27, 43, 52, 0.7)",
                backdropFilter: "blur(5px)",
                borderColor: "var(--neon-green)",
                boxShadow: "0 0 15px rgba(0, 255, 135, 0.15)",
              }}
            >
              {/* Terminal-like header */}
              <DashboardHeader />

              <AuthenticationStatusBanner
                error={error}
                authMethod={authMethod}
                needsInstallation={needsInstallation}
                getGitHubAppInstallUrl={getGitHubAppInstallUrl}
                handleAuthError={handleAuthError}
                signOutCallback={signOut}
              />

              {/* Filters and Configuration */}
              <FilterControls
                activityMode={activityMode}
                dateRange={dateRange}
                activeFilters={activeFilters}
                installations={installations}
                loading={isLoading}
                handleDateRangeChange={handleDateRangeChange}
                session={session}
              />

              {/* Wrap the controls in a form */}
              <form onSubmit={generateSummary} className="space-y-8">
                {/* Repository information panel */}
                <RepositoryInfoPanel
                  repositories={repositories}
                  showRepoList={showRepoList}
                  loading={isLoading}
                  activeFilters={activeFilters}
                  setShowRepoList={setShowRepoList}
                />

                {/* Command buttons */}
                <ActionButton loading={isLoading} />
              </form>
            </Card>
          </div>

          {/* New Dashboard Summary Metrics Panel - full width */}
          <div className="col-span-12">
            <DashboardSummaryPanel
              commits={metrics.commits}
              repositories={metrics.repositories}
              activeDays={metrics.activeDays}
              isLoading={isLoading}
              error={error}
              data-testid="dashboard-summary-panel"
            />
          </div>

          {/* Activity Overview Panel with AI Insights - full width */}
          <div className="col-span-12">
            <ActivityOverviewPanel
              summary={summary}
              isLoading={isLoading}
              error={error}
              truncated={!expandedPanels.includes("activity-overview")}
              onViewMore={() => handlePanelExpand("activity-overview")}
              data-testid="activity-overview-panel"
            />
          </div>

          {/* Activity Feed Timeline - full width */}
          <div className="col-span-12">
            <ActivityFeedPanel
              dateRange={dateRange}
              filters={activeFilters}
              installationIds={installationIds}
              mode={activityMode}
              maxItems={summary?.commits?.length ? undefined : 25}
              isLoading={isLoading}
              showRepository={true}
              truncated={!expandedPanels.includes("activity-feed")}
              onViewMore={() => handlePanelExpand("activity-feed")}
              data-testid="activity-feed-panel"
            />
          </div>
        </DashboardGridContainer>
      </div>
    </div>
  );
}

// Dashboard header component
function DashboardHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <div
          className="w-2 h-2 rounded-full mr-2"
          style={{ backgroundColor: "var(--neon-green)" }}
        ></div>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--neon-green)" }}
        >
          COMMIT ANALYSIS MODULE
        </h2>
      </div>
      <div
        className="px-2 py-1 text-xs rounded"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          border: "1px solid var(--electric-blue)",
          color: "var(--electric-blue)",
        }}
      >
        OPERATIONAL STATUS: ACTIVE
      </div>
    </div>
  );
}

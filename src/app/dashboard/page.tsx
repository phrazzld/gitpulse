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
      <div className="max-w-7xl mx-auto py-lg sm:px-lg lg:px-xl">
        <DashboardGridContainer className="px-md py-lg sm:px-0 gap-lg">
          {/* Authentication Status and Control Panel - full width at all breakpoints */}
          <div className="col-span-12">
            <Card
              padding="lg"
              radius="md"
              shadow="lg"
              className="border border-neon-green bg-dark-slate/70 backdrop-blur-sm"
              style={{
                boxShadow: "0 0 15px rgba(0, 255, 135, 0.15)",
              }}
            >
              {/* Terminal-like header */}
              <DashboardHeader />

              <div className="mt-lg">
                <AuthenticationStatusBanner
                  error={error}
                  authMethod={authMethod}
                  needsInstallation={needsInstallation}
                  getGitHubAppInstallUrl={getGitHubAppInstallUrl}
                  handleAuthError={handleAuthError}
                  signOutCallback={signOut}
                />
              </div>

              {/* Filters and Configuration */}
              <div className="mt-lg">
                <FilterControls
                  activityMode={activityMode}
                  dateRange={dateRange}
                  activeFilters={activeFilters}
                  installations={installations}
                  loading={isLoading}
                  handleDateRangeChange={handleDateRangeChange}
                  session={session}
                />
              </div>

              {/* Wrap the controls in a form */}
              <form onSubmit={generateSummary} className="mt-lg space-y-lg">
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

          {/* Dashboard Summary Metrics Panel - full width on mobile, half width on md and above */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <DashboardSummaryPanel
              commits={metrics.commits}
              repositories={metrics.repositories}
              activeDays={metrics.activeDays}
              isLoading={isLoading}
              error={error}
              data-testid="dashboard-summary-panel"
            />
          </div>

          {/* Activity Overview Panel with AI Insights - full width on mobile, half width on md, two-thirds on lg */}
          <div className="col-span-12 md:col-span-6 lg:col-span-8">
            <ActivityOverviewPanel
              summary={summary}
              isLoading={isLoading}
              error={error}
              truncated={!expandedPanels.includes("activity-overview")}
              onViewMore={() => handlePanelExpand("activity-overview")}
              data-testid="activity-overview-panel"
            />
          </div>

          {/* Activity Feed Timeline - full width at all breakpoints due to content importance */}
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
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        <div className="w-2 h-2 rounded-full mr-sm bg-neon-green"></div>
        <h2 className="text-xl font-bold text-neon-green">
          COMMIT ANALYSIS MODULE
        </h2>
      </div>
      <div className="px-sm py-xs text-xs rounded border border-electric-blue text-electric-blue bg-black/30">
        OPERATIONAL STATUS: ACTIVE
      </div>
    </div>
  );
}

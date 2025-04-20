"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { ActivityMode } from "@/types/activity";
import DashboardLoadingState from "@/components/DashboardLoadingState";
import AuthenticationStatusBanner from "@/components/dashboard/AuthenticationStatusBanner";
import FilterControls from "@/components/dashboard/FilterControls";
import RepositoryInfoPanel from "@/components/dashboard/RepositoryInfoPanel";
import ActionButton from "@/components/dashboard/ActionButton";
import DashboardSummaryPanel from "@/components/dashboard/DashboardSummaryPanel";
import ActivityOverviewPanel from "@/components/dashboard/ActivityOverviewPanel";
import ActivityFeedPanel from "@/components/dashboard/ActivityFeedPanel";
import { GITHUB_API, CLIENT_CACHE_TTL, STORAGE_REFRESH } from "@/lib/constants";
import { setCacheItem, getStaleItem } from "@/lib/localStorageCache";
import { CommitSummary } from "@/types/summary";
import { Repository, Installation } from "@/types/github";
import { DashboardFilterState } from "@/types/dashboard";
import {
  useDashboardState,
  useRepositoryFetching,
  useSummaryGeneration,
  useActivityMetrics,
  useWindowFocusRefresh,
} from "./dashboardHooks";

// Type for API response
type ReposResponse = {
  repositories: Repository[];
  authMethod?: string;
  installationId?: RequestedInstallationId;
  installationIds?: InstallationId[];
  installations?: Installation[];
  currentInstallation?: Installation | null;
  currentInstallations?: Installation[];
  error?: string;
  code?: string;
  needsInstallation?: boolean;
};

// Type definitions for Dashboard component state
type InstallationId = number;
type RequestedInstallationId = InstallationId | null;

// Type for date range state
interface DateRangeState {
  since: string;
  until: string;
}

// Helper functions for date formatting
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getLastWeekDate() {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return lastWeek.toISOString().split("T")[0];
}

// Helper function to get GitHub App installation URL
function getGitHubAppInstallUrl() {
  // Use the provided app name or a generic message if not configured
  const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;

  if (!appName) {
    // If no app name is configured, we'll create a more informative error
    console.error(
      "GitHub App name not configured. Please set NEXT_PUBLIC_GITHUB_APP_NAME environment variable.",
    );
    return GITHUB_API.APP_INSTALLATION_URL_FRAGMENT;
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

  // Initialize all dashboard state
  const {
    repositories,
    setRepositories,
    loading,
    setLoading,
    initialLoad,
    setInitialLoad,
    dateRange,
    setDateRange,
    summary,
    setSummary,
    error,
    setError,
    showRepoList,
    setShowRepoList,
    authMethod,
    setAuthMethod,
    needsInstallation,
    setNeedsInstallation,
    installationIds,
    setInstallationIds,
    installations,
    setInstallations,
    currentInstallations,
    setCurrentInstallations,
    expandedPanels,
    setExpandedPanels,
    activeFilters,
    setActiveFilters,
  } = useDashboardState(getLastWeekDate, getTodayDate);

  // Activity mode is hardcoded to 'my-activity' as we no longer support team/org views
  const activityMode: ActivityMode = "my-activity";

  // Error handling callbacks
  const { handleAuthError, handleAppInstallationNeeded } = useErrorHandling(
    setError,
    setNeedsInstallation,
  );

  // Repository fetching logic
  const sessionState = session
    ? {
        user: {
          email: session.user?.email || undefined,
        },
        accessToken: session.accessToken || undefined,
      }
    : null;

  const { fetchRepositories, shouldRefreshRepositories } =
    useRepositoryFetching(
      sessionState,
      repositories,
      setRepositories,
      setLoading,
      setError,
      setAuthMethod,
      setInstallationIds,
      setInstallations,
      setCurrentInstallations,
      setNeedsInstallation,
      handleAuthError,
      handleAppInstallationNeeded,
    );

  // Window focus refresh effect
  useWindowFocusRefresh(
    sessionState,
    fetchRepositories,
    shouldRefreshRepositories,
  );

  // Fetch repositories when session is available
  useEffect(() => {
    if (session) {
      // Check for GitHub installation cookie
      const installationId = getInstallationIdFromCookie();

      if (installationId) {
        fetchRepositories(installationId).then((success) => {
          if (success) {
            localStorage.setItem(
              "lastRepositoryRefresh",
              Date.now().toString(),
            );
          }
        });
        // Clear the cookie after using it
        clearInstallationCookie();
        return;
      }

      // No installation cookie found, proceed with normal fetch
      fetchRepositories().then((success) => {
        if (success) {
          localStorage.setItem("lastRepositoryRefresh", Date.now().toString());
        }
      });
    }
  }, [session, fetchRepositories]);

  // Update initialLoad status after first fetch completes
  useEffect(() => {
    if (!loading && repositories.length > 0 && initialLoad) {
      setInitialLoad(false);
    }
  }, [loading, repositories, initialLoad, setInitialLoad]);

  // Function to handle date range changes
  const handleDateRangeChange = useCallback(
    (newDateRange: DateRangeState) => {
      setDateRange(newDateRange);
    },
    [setDateRange],
  );

  // Function to handle repository filter changes
  const handleFilterChange = useCallback(
    (newFilters: DashboardFilterState) => {
      setActiveFilters(newFilters);
      console.log("Filters updated:", newFilters);
    },
    [setActiveFilters],
  );

  // Handler for panel expansion
  const handlePanelExpand = useCallback(
    (panelId: string) => {
      setExpandedPanels((prev) =>
        prev.includes(panelId)
          ? prev.filter((id) => id !== panelId)
          : [...prev, panelId],
      );
    },
    [setExpandedPanels],
  );

  // Function to generate activity summary
  const { generateSummary } = useSummaryGeneration(
    dateRange,
    installationIds,
    activeFilters,
    setLoading,
    setError,
    setSummary,
    setAuthMethod,
    setInstallationIds,
    setInstallations,
    setCurrentInstallations,
    setNeedsInstallation,
    handleAuthError,
    handleAppInstallationNeeded,
  );

  // Show loading state during initial session loading or first data fetch
  if (status === "loading" || initialLoad) {
    return <DashboardLoadingState />;
  }

  // Calculate activity metrics from summary data
  const metrics = useActivityMetrics(summary, repositories);

  return (
    <div
      className="bg-dark-slate min-h-screen"
      data-testid="dashboard-container"
    >
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Authentication Status and Control Panel */}
          <div
            className="border rounded-lg p-6 mb-8"
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
              loading={loading}
              handleDateRangeChange={handleDateRangeChange}
              session={session}
            />

            {/* Wrap the controls in a form */}
            <form onSubmit={generateSummary} className="space-y-8">
              {/* Repository information panel */}
              <RepositoryInfoPanel
                repositories={repositories}
                showRepoList={showRepoList}
                loading={loading}
                activeFilters={activeFilters}
                setShowRepoList={setShowRepoList}
              />

              {/* Command buttons */}
              <ActionButton loading={loading} />
            </form>
          </div>

          {/* New Dashboard Summary Metrics Panel */}
          <DashboardSummaryPanel
            commits={metrics.commits}
            repositories={metrics.repositories}
            activeDays={metrics.activeDays}
            isLoading={loading}
            error={error}
            data-testid="dashboard-summary-panel"
          />

          {/* Activity Overview Panel with AI Insights */}
          <ActivityOverviewPanel
            summary={summary}
            isLoading={loading}
            error={error}
            truncated={!expandedPanels.includes("activity-overview")}
            onViewMore={() => handlePanelExpand("activity-overview")}
            data-testid="activity-overview-panel"
          />

          {/* Activity Feed Timeline */}
          <ActivityFeedPanel
            dateRange={dateRange}
            filters={activeFilters}
            installationIds={installationIds}
            mode={activityMode}
            maxItems={summary?.commits?.length ? undefined : 25}
            isLoading={loading}
            showRepository={true}
            truncated={!expandedPanels.includes("activity-feed")}
            onViewMore={() => handlePanelExpand("activity-feed")}
            data-testid="activity-feed-panel"
          />
        </div>
      </div>
    </div>
  );
}

// Error handling functions
function useErrorHandling(
  setError: (error: string | null) => void,
  setNeedsInstallation: (needsInstallation: boolean) => void,
) {
  const handleAuthError = useCallback(() => {
    console.log("GitHub authentication issue detected.");
    setError(
      "GitHub authentication issue detected. Your token may be invalid, expired, or missing required permissions. Please sign out and sign in again to grant all necessary permissions.",
    );
  }, [setError]);

  const handleAppInstallationNeeded = useCallback(() => {
    console.log("GitHub App installation needed.");
    setNeedsInstallation(true);
    setError(
      "GitHub App installation required. Please install the GitHub App to access all your repositories, including private ones.",
    );
  }, [setError, setNeedsInstallation]);

  return { handleAuthError, handleAppInstallationNeeded };
}

// Cookie handling functions
function getInstallationIdFromCookie(): number | null {
  const getCookie = (name: string) => {
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

function clearInstallationCookie() {
  document.cookie = "github_installation_id=; path=/; max-age=0; samesite=lax";
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

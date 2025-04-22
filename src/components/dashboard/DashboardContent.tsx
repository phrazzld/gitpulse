"use client";

import { Repository } from "@/types/github";
import { Session } from "next-auth";
import { ActivityMode } from "@/types/activity";
import { DashboardGridContainer } from "@/components/dashboard/layout";
import { Card } from "@/components/library";
import AuthenticationStatusBanner from "@/components/dashboard/AuthenticationStatusBanner";
import FilterControls from "@/components/dashboard/FilterControls";
import RepositoryInfoPanel from "@/components/dashboard/RepositoryInfoPanel";
import ActionButton from "@/components/dashboard/ActionButton";
import DashboardSummaryPanel from "@/components/dashboard/DashboardSummaryPanel";
import ActivityOverviewPanel from "@/components/dashboard/ActivityOverviewPanel";
import ActivityFeedPanel from "@/components/dashboard/ActivityFeedPanel";
import TerminalHeader from "@/components/dashboard/TerminalHeader";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";
import {
  ActivityFeedFallback,
  ActivityOverviewFallback,
  FilterControlsFallback,
  RepositoryPanelFallback,
  GenericPanelFallback,
} from "@/components/dashboard/ErrorFallbacks";
import { signOut } from "next-auth/react";

/**
 * Dashboard Content Component Props
 */
interface DashboardContentProps {
  session: Session | null;
  repositories: Repository[];
  loading: boolean;
  error: string | null;
  expandedPanels: string[];
  onPanelExpand: (panelId: string) => void;
  generateSummary: (e: React.FormEvent) => Promise<void>;
  handleAuthError: (message?: string) => void;
  dateRange?: {
    since: string;
    until: string;
  };
}

/**
 * DashboardContent Component
 *
 * Main content component for the dashboard that receives data through props
 * instead of accessing Zustand state directly. This improves predictability
 * of the rendering flow and makes the component hierarchy more explicit.
 */
export default function DashboardContent({
  session,
  repositories,
  loading,
  error,
  expandedPanels,
  onPanelExpand,
  generateSummary,
  handleAuthError,
  dateRange = { since: "", until: "" },
}: DashboardContentProps) {
  // Helper function to get GitHub App installation URL
  function getGitHubAppInstallUrl() {
    const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;

    if (!appName) {
      console.error(
        "GitHub App name not configured. Please set NEXT_PUBLIC_GITHUB_APP_NAME environment variable.",
      );
      return "https://github.com/apps/installations/new";
    }

    return `https://github.com/apps/${appName}/installations/new`;
  }

  // Activity mode is hardcoded to 'my-activity' as we no longer support team/org views
  const activityMode: ActivityMode = "my-activity";

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        backgroundColor: "hsl(var(--dark-slate)) !important",
        display: "block !important",
        visibility: "visible",
        opacity: "1 !important",
        position: "relative",
        zIndex: 102,
      }}
      data-testid="dashboard-container"
    >
      {/* 
        Main dashboard container with progressive padding:
        - Consistent vertical padding (py-lg) at all breakpoints
        - Horizontal padding increases at breakpoints:
          - Default: No horizontal padding for maximum content space on mobile
          - sm: px-lg medium horizontal padding for improved readability on tablets
          - lg: px-xl larger horizontal padding on desktops for optimal content width
        - max-w-7xl sets maximum content width to prevent excessive line lengths on large displays
        - mx-auto centers the container when max-width is reached
      */}
      <div
        className="max-w-7xl mx-auto py-lg sm:px-lg lg:px-xl"
        style={{
          position: "relative",
          display: "block !important",
          visibility: "visible",
          backgroundColor: "hsl(var(--dark-slate)) !important",
        }}
      >
        {/* 
          Dashboard grid layout with larger gap (gap-lg) for better visual separation between panels.
          Horizontal padding scales based on screen size:
          - Default: px-md for minimal spacing on mobile
          - sm breakpoint and up: px-0 to maximize content space within container boundaries
          - Maintains py-lg vertical padding consistently across breakpoints
        */}
        <DashboardGridContainer
          className="px-md py-lg sm:px-0 gap-lg"
          style={{
            display: "grid !important",
            visibility: "visible",
            opacity: "1 !important",
          }}
        >
          {/* 
            Authentication Status and Control Panel spans full width (col-span-12) across all breakpoints
            to emphasize importance of authentication state and control options.
            This critical component maintains consistent width to ensure visibility and accessibility.
          */}
          <div className="col-span-12">
            <DashboardErrorBoundary
              componentId="main-dashboard-card"
              fallback={(props) => <GenericPanelFallback {...props} />}
              contextInfo={{ sessionStatus: session ? "active" : "none" }}
            >
              <Card
                padding="lg"
                radius="md"
                shadow="lg"
                className="border backdrop-blur-sm"
                style={{
                  backgroundColor: "hsla(var(--dark-slate), 0.7)",
                  borderColor: "hsl(var(--neon-green))",
                  boxShadow: "0 0 15px rgba(0, 255, 135, 0.15)",
                }}
              >
                {/* Terminal-like header */}
                <TerminalHeader />

                <div className="mt-lg">
                  <DashboardErrorBoundary
                    componentId="auth-status-banner"
                    contextInfo={{ session: session ? "exists" : "null" }}
                  >
                    <AuthenticationStatusBanner
                      getGitHubAppInstallUrl={getGitHubAppInstallUrl}
                      handleAuthError={handleAuthError}
                      signOutCallback={signOut}
                    />
                  </DashboardErrorBoundary>
                </div>

                {/* Filters and Configuration */}
                <div className="mt-lg">
                  <DashboardErrorBoundary
                    componentId="filter-controls"
                    fallback={(props) => <FilterControlsFallback {...props} />}
                    contextInfo={{ activityMode, dateRange }}
                  >
                    <FilterControls
                      activityMode={activityMode}
                      session={session}
                    />
                  </DashboardErrorBoundary>
                </div>

                {/* Wrap the controls in a form */}
                <form onSubmit={generateSummary} className="mt-lg space-y-lg">
                  {/* Repository information panel */}
                  <DashboardErrorBoundary
                    componentId="repository-info-panel"
                    fallback={(props) => <RepositoryPanelFallback {...props} />}
                    contextInfo={{
                      repoCount: repositories?.length || 0,
                      loading,
                    }}
                  >
                    <RepositoryInfoPanel
                      repositories={repositories}
                      loading={loading}
                    />
                  </DashboardErrorBoundary>

                  {/* Command buttons */}
                  <DashboardErrorBoundary componentId="action-button">
                    <ActionButton />
                  </DashboardErrorBoundary>
                </form>
              </Card>
            </DashboardErrorBoundary>
          </div>

          {/* 
            Dashboard Summary Metrics Panel - Responsive width strategy:
            - Mobile (default): Full width (col-span-12) to maximize readability on small screens
            - Tablet (md): Half width (col-span-6) to create side-by-side layout with Activity Overview
            - Desktop (lg): One-third width (col-span-4) to create balanced 1/3 - 2/3 layout
            
            This narrower panel on larger screens creates visual hierarchy emphasizing that this
            contains summary data while preserving readability on all devices.
          */}
          <div className="col-span-12 md:col-span-6 lg:col-span-4">
            <DashboardErrorBoundary
              componentId="dashboard-summary-panel"
              fallback={(props) => <GenericPanelFallback {...props} />}
              contextInfo={{ repoCount: repositories?.length || 0 }}
            >
              <DashboardSummaryPanel
                data-testid="dashboard-summary-panel"
                repositories={repositories}
              />
            </DashboardErrorBoundary>
          </div>

          {/* 
            Activity Overview Panel with AI Insights - Responsive width strategy:
            - Mobile (default): Full width (col-span-12) for maximum readability on small screens
            - Tablet (md): Half width (col-span-6) to create side-by-side layout with Summary Panel
            - Desktop (lg): Two-thirds width (col-span-8) to allocate more space for detailed insights
            
            The panel receives more horizontal space on desktop compared to the Summary Panel 
            because it contains richer content including AI insights that benefit from additional width.
          */}
          <div className="col-span-12 md:col-span-6 lg:col-span-8">
            <DashboardErrorBoundary
              componentId="activity-overview-panel"
              fallback={(props) => <ActivityOverviewFallback {...props} />}
              contextInfo={{
                truncated: !expandedPanels.includes("activity-overview"),
                repoCount: repositories?.length || 0,
              }}
            >
              <ActivityOverviewPanel
                truncated={!expandedPanels.includes("activity-overview")}
                onViewMore={() => onPanelExpand("activity-overview")}
                data-testid="activity-overview-panel"
                repositories={repositories}
              />
            </DashboardErrorBoundary>
          </div>

          {/* 
            Activity Feed Timeline - Full width (col-span-12) at all breakpoints due to:
            1. Content importance - this is the primary interactive element for reviewing commits
            2. Table-like data display that requires sufficient width for readability
            3. Chronological timeline presentation works best as a full-width component
          */}
          <div className="col-span-12">
            <DashboardErrorBoundary
              componentId="activity-feed-panel"
              fallback={(props) => <ActivityFeedFallback {...props} />}
              contextInfo={{
                mode: activityMode,
                truncated: !expandedPanels.includes("activity-feed"),
                repoCount: repositories?.length || 0,
              }}
            >
              <ActivityFeedPanel
                mode={activityMode}
                showRepository={true}
                truncated={!expandedPanels.includes("activity-feed")}
                onViewMore={() => onPanelExpand("activity-feed")}
                data-testid="activity-feed-panel"
                repositories={repositories}
              />
            </DashboardErrorBoundary>
          </div>
        </DashboardGridContainer>
      </div>
    </div>
  );
}

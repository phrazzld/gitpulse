"use client";

import { useSession, signOut } from "next-auth/react";
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
import DashboardContainer from "@/components/dashboard/DashboardContainer";
import {
  useErrorHandlers,
  useUIState,
  usePanelExpansion,
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
 * Redesigned with improved component responsibility separation.
 *
 * @returns The dashboard page component
 */
export default function Dashboard() {
  const { data: session } = useSession();

  // Minimal state needed for the layout component
  const { error: uiError } = useUIState();
  const { expandedPanels, handlePanelExpand } = usePanelExpansion();
  const { generateSummary } = useSummaryGeneration();
  const { handleAuthError } = useErrorHandlers();

  // Activity mode is hardcoded to 'my-activity' as we no longer support team/org views
  const activityMode: ActivityMode = "my-activity";

  return (
    <DashboardContainer>
      <div
        className="bg-dark-slate min-h-screen"
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
        <div className="max-w-7xl mx-auto py-lg sm:px-lg lg:px-xl">
          {/* 
            Dashboard grid layout with larger gap (gap-lg) for better visual separation between panels.
            Horizontal padding scales based on screen size:
            - Default: px-md for minimal spacing on mobile
            - sm breakpoint and up: px-0 to maximize content space within container boundaries
            - Maintains py-lg vertical padding consistently across breakpoints
          */}
          <DashboardGridContainer className="px-md py-lg sm:px-0 gap-lg">
            {/* 
              Authentication Status and Control Panel spans full width (col-span-12) across all breakpoints
              to emphasize importance of authentication state and control options.
              This critical component maintains consistent width to ensure visibility and accessibility.
            */}
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
                <TerminalHeader />

                <div className="mt-lg">
                  <AuthenticationStatusBanner
                    getGitHubAppInstallUrl={getGitHubAppInstallUrl}
                    handleAuthError={handleAuthError}
                    signOutCallback={signOut}
                  />
                </div>

                {/* Filters and Configuration */}
                <div className="mt-lg">
                  <FilterControls
                    activityMode={activityMode}
                    session={session}
                  />
                </div>

                {/* Wrap the controls in a form */}
                <form onSubmit={generateSummary} className="mt-lg space-y-lg">
                  {/* Repository information panel */}
                  <RepositoryInfoPanel />

                  {/* Command buttons */}
                  <ActionButton />
                </form>
              </Card>
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
              <DashboardSummaryPanel data-testid="dashboard-summary-panel" />
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
              <ActivityOverviewPanel
                truncated={!expandedPanels.includes("activity-overview")}
                onViewMore={() => handlePanelExpand("activity-overview")}
                data-testid="activity-overview-panel"
              />
            </div>

            {/* 
              Activity Feed Timeline - Full width (col-span-12) at all breakpoints due to:
              1. Content importance - this is the primary interactive element for reviewing commits
              2. Table-like data display that requires sufficient width for readability
              3. Chronological timeline presentation works best as a full-width component
            */}
            <div className="col-span-12">
              <ActivityFeedPanel
                mode={activityMode}
                showRepository={true}
                truncated={!expandedPanels.includes("activity-feed")}
                onViewMore={() => handlePanelExpand("activity-feed")}
                data-testid="activity-feed-panel"
              />
            </div>
          </DashboardGridContainer>
        </div>
      </div>
    </DashboardContainer>
  );
}

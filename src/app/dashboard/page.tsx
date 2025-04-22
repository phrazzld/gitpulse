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

            {/* Dashboard Summary Metrics Panel - full width on mobile, half width on md and above */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4">
              <DashboardSummaryPanel data-testid="dashboard-summary-panel" />
            </div>

            {/* Activity Overview Panel with AI Insights - full width on mobile, half width on md, two-thirds on lg */}
            <div className="col-span-12 md:col-span-6 lg:col-span-8">
              <ActivityOverviewPanel
                truncated={!expandedPanels.includes("activity-overview")}
                onViewMore={() => handlePanelExpand("activity-overview")}
                data-testid="activity-overview-panel"
              />
            </div>

            {/* Activity Feed Timeline - full width at all breakpoints due to content importance */}
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

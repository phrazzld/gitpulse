"use client";

import { Repository } from "@/types/github";
import { Session } from "next-auth";
import { ActivityMode } from "@/types/activity";
import { DashboardGridContainer } from "@/components/dashboard/layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
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
    <div className="w-full min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-6 px-4">
        <DashboardGridContainer>
          {/* Main Card - span full width */}
          <div className="col-span-12">
            <DashboardErrorBoundary
              componentId="main-dashboard-card"
              fallback={(props) => <GenericPanelFallback {...props} />}
              contextInfo={{ sessionStatus: session ? "active" : "none" }}
            >
              <Card className="border-primary/20">
                <CardHeader className="border-b border-primary/10">
                  <TerminalHeader />
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
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
                  <div className="pt-4">
                    <DashboardErrorBoundary
                      componentId="filter-controls"
                      fallback={(props) => (
                        <FilterControlsFallback {...props} />
                      )}
                      contextInfo={{ activityMode, dateRange }}
                    >
                      <FilterControls
                        activityMode={activityMode}
                        session={session}
                      />
                    </DashboardErrorBoundary>
                  </div>

                  {/* Wrap the controls in a form */}
                  <form onSubmit={generateSummary} className="pt-4 space-y-6">
                    {/* Repository information panel */}
                    <DashboardErrorBoundary
                      componentId="repository-info-panel"
                      fallback={(props) => (
                        <RepositoryPanelFallback {...props} />
                      )}
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
                </CardContent>
              </Card>
            </DashboardErrorBoundary>
          </div>

          {/* Summary Metrics Panel */}
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

          {/* Activity Overview Panel */}
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

          {/* Activity Feed Timeline - Full width */}
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

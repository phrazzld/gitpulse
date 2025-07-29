import React from 'react';
import ActivityFeed from '@/components/ActivityFeed';
import SummaryStats from '@/components/dashboard/SummaryStats';
import SummaryDetails from '@/components/dashboard/SummaryDetails';
import { createActivityFetcher } from '@/lib/activity';
import { ActivityMode, CommitSummary, DateRange, FilterState } from '@/types/dashboard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface SummaryViewProps {
  /**
   * The commit summary data to display
   */
  summary: CommitSummary | null;
  
  /**
   * The current activity mode
   */
  activityMode: ActivityMode;
  
  /**
   * The selected date range
   */
  dateRange: DateRange;
  
  /**
   * Active filters applied to the data
   */
  activeFilters: FilterState;
  
  /**
   * Installation IDs for GitHub App
   */
  installationIds: readonly number[];
  
  /**
   * Whether the component is in a loading state
   */
  loading?: boolean;
}

/**
 * Displays a comprehensive summary view of GitHub activity
 */
const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  activityMode,
  dateRange,
  activeFilters,
  installationIds,
  loading = false
}) => {
  if (!summary) return null;

  return (
    <Card className="mt-8">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-3 bg-primary"></div>
            <h2 className="text-xl font-bold text-primary">
              COMMIT ANALYSIS: {summary.user?.toUpperCase()}
            </h2>
          </div>
          <Badge variant="outline" className="text-xs gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-foreground animate-pulse"></span>
            <span>ANALYSIS COMPLETE</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Activity Feed with Progressive Loading */}
        {summary.commits && (
          <div className="mb-8">
            <div className="flex items-center mb-3">
              <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
              <h3 className="text-sm font-medium uppercase">
                COMMIT ACTIVITY
              </h3>
            </div>
          
          <ActivityFeed
            loadCommits={async (cursor, limit) => {
              // Build appropriate parameters based on current mode
              const params: Record<string, string> = {
                since: dateRange.since,
                until: dateRange.until
              };
              
              // Add organization filter if applicable
              if (activeFilters.organizations.length > 0) {
                params.organizations = activeFilters.organizations.join(',');
              }
              
              // If installation IDs available, include them
              if (installationIds.length > 0) {
                params.installation_ids = installationIds.join(',');
              }
              
              // Determine which API endpoint to use based on the current mode
              let apiEndpoint = '/api/my-activity';
              
              if (activityMode === 'my-work-activity') {
                apiEndpoint = '/api/my-org-activity';
              } else if (activityMode === 'team-activity') {
                apiEndpoint = '/api/team-activity';
              }
              
              // Create the fetcher and use it directly - errors will propagate to useProgressiveLoading
              // which has robust error handling already implemented
              const fetcher = createActivityFetcher(apiEndpoint, params);
              return fetcher(cursor, limit);
            }}
            useInfiniteScroll={true}
            initialLimit={30}
            additionalItemsPerPage={20}
            showRepository={true}
            showContributor={activityMode === 'team-activity'}
            emptyMessage={`No ${activityMode.replace('-', ' ')} data found for the selected filters.`}
          />
          </div>
        )}

        {/* Stats dashboard with cyber styling */}
        <SummaryStats summary={summary} className="mb-8" />

        {summary.aiSummary && (
          <SummaryDetails aiSummary={summary.aiSummary} />
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryView;
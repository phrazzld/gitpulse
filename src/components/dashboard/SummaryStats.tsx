import React from 'react';
import { CommitSummary } from '@/types/dashboard';
import { Card, CardContent } from '@/components/ui/card';

export interface SummaryStatsProps {
  /**
   * The commit summary data to display statistics for
   */
  summary: CommitSummary;
  
  /**
   * Additional CSS class to apply to the container
   */
  className?: string;
}

/**
 * Displays a dashboard of commit activity statistics
 */
const SummaryStats: React.FC<SummaryStatsProps> = ({ 
  summary,
  className = ''
}) => {
  return (
    <div className={`${className}`}>
      <h3 className="text-sm font-medium mb-3">
        Metrics Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">COMMIT COUNT</p>
            <p className="text-3xl font-mono">
              {summary.stats.totalCommits}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">REPOSITORIES</p>
            <p className="text-3xl font-mono">
              {summary.stats.repositories.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">ACTIVE DAYS</p>
            <p className="text-3xl font-mono">
              {summary.stats.dates.length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SummaryStats;
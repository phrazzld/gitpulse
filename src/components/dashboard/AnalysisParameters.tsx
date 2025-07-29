'use client';

import { ActivityMode, DateRange } from '@/types/dashboard';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface AnalysisParametersProps {
  /**
   * The currently selected activity mode
   */
  activityMode: ActivityMode;

  /**
   * The currently selected date range
   */
  dateRange: DateRange;

  /**
   * The organizations currently selected in filters
   */
  organizations?: readonly string[];

  /**
   * Whether to show the help text at the bottom of the component
   */
  showHelpText?: boolean;
}

/**
 * Displays the current analysis parameters in a styled card
 */
export default function AnalysisParameters({
  activityMode,
  dateRange,
  organizations = [],
  showHelpText = true
}: AnalysisParametersProps) {
  // Map activity mode to display text
  const getActivityModeDisplay = (mode: ActivityMode): string => {
    switch (mode) {
      case 'my-activity':
        return 'MY ACTIVITY';
      case 'my-work-activity':
        return 'MY WORK ACTIVITY';
      case 'team-activity':
        return 'TEAM ACTIVITY';
      default:
        // This should never happen with the current ActivityMode type
        return 'UNKNOWN MODE';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2 bg-primary"></div>
          <h3 className="text-sm font-medium uppercase">
            ANALYSIS PARAMETERS
          </h3>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Activity mode */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">MODE</span>
          <Badge variant="secondary" className="text-xs">
            {getActivityModeDisplay(activityMode)}
          </Badge>
        </div>
        
        {/* Date range */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">DATE RANGE</span>
          <Badge variant="outline" className="text-xs">
            {dateRange.since} to {dateRange.until}
          </Badge>
        </div>
        
        {/* Organizations (if any) */}
        {organizations.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">ORGANIZATIONS</span>
            <Badge variant="outline" className="text-xs">
              {organizations.length} SELECTED
            </Badge>
          </div>
        )}
        
        {/* Help text */}
        {showHelpText && (
          <div className="mt-3 pt-3 border-t border-muted">
            <div className="text-xs text-foreground">
              Configure your analysis parameters above, then click the Analyze Commits button below to generate insights.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
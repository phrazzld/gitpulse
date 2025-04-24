'use client';

import { ActivityMode, DateRange } from '@/types/dashboard';

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
    <div className="rounded-lg border bg-opacity-70 p-4" style={{ 
      backgroundColor: 'rgba(27, 43, 52, 0.7)',
      backdropFilter: 'blur(5px)',
      borderColor: 'var(--neon-green)',
    }}>
      {/* Header */}
      <div className="flex items-center mb-3">
        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--neon-green)' }}></div>
        <h3 className="text-sm uppercase" style={{ color: 'var(--neon-green)' }}>
          ANALYSIS PARAMETERS
        </h3>
      </div>
      
      {/* Parameters list */}
      <div className="space-y-3">
        {/* Activity mode */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--electric-blue)' }}>MODE</span>
          <span className="text-xs px-2 py-1 rounded" style={{ 
            backgroundColor: 'rgba(0, 255, 135, 0.1)',
            color: 'var(--neon-green)'
          }}>
            {getActivityModeDisplay(activityMode)}
          </span>
        </div>
        
        {/* Date range */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--electric-blue)' }}>DATE RANGE</span>
          <span className="text-xs px-2 py-1 rounded" style={{ 
            backgroundColor: 'rgba(59, 142, 234, 0.1)',
            color: 'var(--electric-blue)'
          }}>
            {dateRange.since} to {dateRange.until}
          </span>
        </div>
        
        {/* Organizations (if any) */}
        {organizations.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--electric-blue)' }}>ORGANIZATIONS</span>
            <span className="text-xs px-2 py-1 rounded" style={{ 
              backgroundColor: 'rgba(59, 142, 234, 0.1)',
              color: 'var(--electric-blue)'
            }}>
              {organizations.length} SELECTED
            </span>
          </div>
        )}
        
        {/* Help text */}
        {showHelpText && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0, 255, 135, 0.2)' }}>
            <div className="text-xs" style={{ color: 'var(--foreground)' }}>
              Configure your analysis parameters above, then click the Analyze Commits button below to generate insights.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
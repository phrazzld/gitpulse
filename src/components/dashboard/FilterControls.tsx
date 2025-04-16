import React from 'react';
import ModeSelector, { ActivityMode } from '@/components/ModeSelector';
import DateRangePicker, { DateRange } from '@/components/DateRangePicker';
import OrganizationPicker from '@/components/OrganizationPicker';
import { FilterState } from '@/app/dashboard/page';
import { Installation } from '@/types/github';
import { Session } from 'next-auth';

interface Props {
  activityMode: ActivityMode;
  dateRange: DateRange;
  activeFilters: FilterState;
  installations: Installation[];
  loading: boolean;
  handleModeChange: (mode: ActivityMode) => void;
  handleDateRangeChange: (newDateRange: DateRange) => void;
  handleOrganizationChange: (selectedOrgs: string[]) => void;
  session: Session | null;
}

export default function FilterControls({
  activityMode,
  dateRange,
  activeFilters,
  installations,
  loading,
  handleModeChange,
  handleDateRangeChange,
  handleOrganizationChange,
  session
}: Props) {
  return (
    <div className="mb-8 border rounded-lg p-6" style={{ 
      backgroundColor: 'rgba(27, 43, 52, 0.8)',
      backdropFilter: 'blur(5px)',
      borderColor: 'var(--electric-blue)',
      boxShadow: '0 0 15px rgba(59, 142, 234, 0.15)'
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--electric-blue)' }}></div>
          <h3 className="text-sm font-bold uppercase" style={{ color: 'var(--electric-blue)' }}>
            ANALYSIS FILTERS
          </h3>
        </div>
        <div className="px-2 py-1 text-xs rounded flex items-center" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
          border: '1px solid var(--electric-blue)',
          color: 'var(--electric-blue)'
        }}>
          <span>CONFIGURE PARAMETERS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Mode and Organizations (when visible) */}
        <div className="space-y-6">
          <ModeSelector
            selectedMode={activityMode}
            onChange={handleModeChange}
            disabled={loading}
          />
          
          {/* OrganizationPicker conditionally shown based on mode */}
          {(activityMode === 'my-work-activity' || activityMode === 'team-activity') && (
            <div className="flex items-center justify-center w-full">
              <div className="w-full max-w-xl">
                <OrganizationPicker
                  organizations={installations
                    .filter(installation => installation.account !== null)
                    .map(installation => ({
                      id: installation.id,
                      login: installation.account!.login,
                      type: installation.account!.type || 'User', // Provide a default
                      avatarUrl: installation.account!.avatarUrl
                    }))}
                  selectedOrganizations={activeFilters.organizations}
                  onSelectionChange={handleOrganizationChange}
                  mode={activityMode}
                  disabled={loading}
                  isLoading={loading}
                  currentUsername={session?.user?.name || undefined}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Right column - Date and Analysis Info */}
        <div className="space-y-6">
          <DateRangePicker
            dateRange={dateRange}
            onChange={handleDateRangeChange}
            disabled={loading}
          />
          
          {/* Analysis Parameters Info Card */}
          <div className="rounded-lg border bg-opacity-70 p-4" style={{ 
            backgroundColor: 'rgba(27, 43, 52, 0.7)',
            backdropFilter: 'blur(5px)',
            borderColor: 'var(--neon-green)',
          }}>
            <div className="flex items-center mb-3">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--neon-green)' }}></div>
              <h3 className="text-sm uppercase" style={{ color: 'var(--neon-green)' }}>
                ANALYSIS PARAMETERS
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--electric-blue)' }}>MODE</span>
                <span className="text-xs px-2 py-1 rounded" style={{ 
                  backgroundColor: 'rgba(0, 255, 135, 0.1)',
                  color: 'var(--neon-green)'
                }}>
                  {activityMode === 'my-activity' ? 'MY ACTIVITY' : 
                   activityMode === 'my-work-activity' ? 'MY WORK ACTIVITY' : 
                   'TEAM ACTIVITY'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--electric-blue)' }}>DATE RANGE</span>
                <span className="text-xs px-2 py-1 rounded" style={{ 
                  backgroundColor: 'rgba(59, 142, 234, 0.1)',
                  color: 'var(--electric-blue)'
                }}>
                  {dateRange.since} to {dateRange.until}
                </span>
              </div>
              
              {activeFilters.organizations.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--electric-blue)' }}>ORGANIZATIONS</span>
                  <span className="text-xs px-2 py-1 rounded" style={{ 
                    backgroundColor: 'rgba(59, 142, 234, 0.1)',
                    color: 'var(--electric-blue)'
                  }}>
                    {activeFilters.organizations.length} SELECTED
                  </span>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(0, 255, 135, 0.2)' }}>
                <div className="text-xs" style={{ color: 'var(--foreground)' }}>
                  Configure your analysis parameters above, then click the Analyze Commits button below to generate insights.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
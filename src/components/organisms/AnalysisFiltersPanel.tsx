import React from 'react';
import ModeSelector, { ActivityMode } from '@/components/atoms/ModeSelector';
import OrganizationPicker from '@/components/organisms/OrganizationPicker';
import { Installation } from '@/types/dashboard';

export interface AnalysisFiltersPanelProps {
  /**
   * Current activity mode
   */
  activityMode: ActivityMode;
  
  /**
   * Whether the panel is in a loading state
   */
  loading: boolean;
  
  /**
   * List of available GitHub App installations
   */
  installations: readonly Installation[];
  
  /**
   * Current active filters
   */
  activeFilters: {
    contributors: readonly string[];
    organizations: readonly string[];
    repositories: readonly string[];
  };
  
  /**
   * Current user's name
   */
  userName?: string | null;
  
  /**
   * Function to handle activity mode changes
   */
  onModeChange: (mode: ActivityMode) => void;
  
  /**
   * Function to handle organization selection changes
   */
  onOrganizationChange: (selectedOrgs: readonly string[]) => void;
}

/**
 * Panel component for configuring analysis filters
 */
export default function AnalysisFiltersPanel({
  activityMode,
  loading,
  installations,
  activeFilters,
  userName,
  onModeChange,
  onOrganizationChange
}: AnalysisFiltersPanelProps) {
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
            onChange={onModeChange}
            disabled={loading}
          />
          
          {/* OrganizationPicker conditionally shown based on mode */}
          {(activityMode === 'my-work-activity' || activityMode === 'team-activity') && (
            <div className="flex items-center justify-center w-full">
              <div className="w-full max-w-xl">
                <OrganizationPicker
                  organizations={installations.map(installation => ({
                    id: installation.id,
                    login: installation.account.login,
                    type: installation.account.type,
                    avatarUrl: installation.account.avatarUrl
                  }))}
                  selectedOrganizations={activeFilters.organizations}
                  onSelectionChange={onOrganizationChange}
                  mode={activityMode}
                  disabled={loading}
                  isLoading={loading}
                  currentUsername={userName || undefined}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
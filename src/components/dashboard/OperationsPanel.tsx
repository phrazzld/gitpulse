import React from 'react';
import { ActivityMode } from '@/components/ui/ModeSelector';
import { FilterState, Installation } from '@/types/dashboard';
import { getGitHubAppInstallUrl } from '@/lib/dashboard-utils';

// Import new components
import TerminalHeader from '@/components/molecules/TerminalHeader';
import ErrorAlert from '@/components/molecules/ErrorAlert';
import AuthStatusBanner from '@/components/molecules/AuthStatusBanner';
import AccountSelectionPanel from '@/components/organisms/AccountSelectionPanel';
import AnalysisFiltersPanel from '@/components/organisms/AnalysisFiltersPanel';

export interface OperationsPanelProps {
  /**
   * Current error message to display
   */
  error: string | null;
  
  /**
   * Whether the panel is in a loading state
   */
  loading: boolean;
  
  /**
   * Whether GitHub App installation is needed
   */
  needsInstallation: boolean;
  
  /**
   * Authentication method (github_app or oauth)
   */
  authMethod: string | null;
  
  /**
   * List of available GitHub App installations
   */
  installations: readonly Installation[];
  
  /**
   * List of current GitHub App installations
   */
  currentInstallations: readonly Installation[];
  
  /**
   * Current activity mode
   */
  activityMode: ActivityMode;
  
  /**
   * Current active filters
   */
  activeFilters: {
    contributors: string[];
    organizations: string[];
    repositories: string[];
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
  onOrganizationChange: (selectedOrgs: string[]) => void;
  
  /**
   * Function to handle filter changes
   */
  onFilterChange: (newFilters: FilterState) => void;
  
  /**
   * Function to switch between GitHub installations
   */
  onSwitchInstallations: (installIds: number[]) => void;
  
  /**
   * Function to sign out
   */
  onSignOut: (options?: { callbackUrl: string }) => void;
}

/**
 * Operations Panel component displaying error messages, auth status, and filters
 */
export default function OperationsPanel({
  error,
  loading,
  needsInstallation,
  authMethod,
  installations,
  currentInstallations,
  activityMode,
  activeFilters,
  userName,
  onModeChange,
  onOrganizationChange,
  onFilterChange,
  onSwitchInstallations,
  onSignOut
}: OperationsPanelProps) {
  return (
    <div className="border rounded-lg p-6 mb-8" style={{ 
      backgroundColor: 'rgba(27, 43, 52, 0.7)',
      backdropFilter: 'blur(5px)',
      borderColor: 'var(--neon-green)',
      boxShadow: '0 0 15px rgba(0, 255, 135, 0.15)'
    }}>
      {/* Terminal-like header */}
      <TerminalHeader title="COMMIT ANALYSIS MODULE" />
      
      {/* Error display with cyberpunk style */}
      {error && (
        <ErrorAlert 
          message={error} 
          needsInstallation={needsInstallation} 
          installationUrl={getGitHubAppInstallUrl()} 
          onSignOut={onSignOut} 
        />
      )}
      
      {/* GitHub App authentication status banner */}
      {authMethod && (
        <AuthStatusBanner 
          authMethod={authMethod}
          needsInstallation={needsInstallation}
          installations={installations}
          currentInstallations={currentInstallations}
        />
      )}
      
      {/* Consolidated Account Selection Panel */}
      {authMethod === 'github_app' && installations.length > 0 && (
        <AccountSelectionPanel 
          installations={installations}
          currentInstallations={currentInstallations}
          onSwitchInstallations={onSwitchInstallations}
        />
      )}
      
      {/* Improved Filters Container */}
      <AnalysisFiltersPanel 
        activityMode={activityMode}
        loading={loading}
        installations={installations}
        activeFilters={activeFilters}
        userName={userName}
        onModeChange={onModeChange}
        onOrganizationChange={onOrganizationChange}
      />
    </div>
  );
}
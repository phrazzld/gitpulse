import React from 'react';
import { ActivityMode } from '@/components/ui/ModeSelector';
import { FilterState, Installation } from '@/types/dashboard';

// Import new components
import TerminalHeader from '@/components/molecules/TerminalHeader';
import ErrorAlert from '@/components/molecules/ErrorAlert';
import AuthStatusBanner from '@/components/molecules/AuthStatusBanner';
import AccountSelectionPanel from '@/components/organisms/AccountSelectionPanel';
import AnalysisFiltersPanel from '@/components/organisms/AnalysisFiltersPanel';

// Import custom hook
import { useOperationsPanel } from '@/hooks/dashboard/useOperationsPanel';

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
  onOrganizationChange: (selectedOrgs: readonly string[]) => void;
  
  /**
   * Function to handle filter changes
   */
  onFilterChange: (newFilters: FilterState) => void;
  
  /**
   * Function to switch between GitHub installations
   */
  onSwitchInstallations: (installIds: readonly number[]) => void;
  
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
  // Use the custom hook to handle component logic
  const {
    isGitHubAppAuth,
    hasInstallations,
    installationUrl,
    handleModeChange,
    handleOrganizationChange,
    handleSwitchInstallations,
    handleSignOut
  } = useOperationsPanel({
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
  });

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
          installationUrl={installationUrl} 
          onSignOut={handleSignOut} 
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
      {isGitHubAppAuth && hasInstallations && (
        <AccountSelectionPanel 
          installations={installations}
          currentInstallations={currentInstallations}
          onSwitchInstallations={handleSwitchInstallations}
        />
      )}
      
      {/* Improved Filters Container */}
      <AnalysisFiltersPanel 
        activityMode={activityMode}
        loading={loading}
        installations={installations}
        activeFilters={activeFilters}
        userName={userName}
        onModeChange={handleModeChange}
        onOrganizationChange={handleOrganizationChange}
      />
    </div>
  );
}
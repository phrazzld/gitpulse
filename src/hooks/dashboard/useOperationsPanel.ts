import { useMemo, useCallback } from 'react';
import { ActivityMode, FilterState, Installation } from '@/types/dashboard';
import { getGitHubAppInstallUrl } from '@/lib/dashboard-utils';
import { logger } from '@/lib/logger';

const MODULE_NAME = 'hooks:useOperationsPanel';

interface UseOperationsPanelProps {
  /**
   * Current error message
   */
  error: string | null;
  
  /**
   * Loading state indicator
   */
  loading: boolean;
  
  /**
   * Whether GitHub App installation is needed
   */
  needsInstallation: boolean;
  
  /**
   * Authentication method
   */
  authMethod: string | null;
  
  /**
   * Available GitHub App installations
   */
  installations: readonly Installation[];
  
  /**
   * Current active GitHub App installations
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

interface UseOperationsPanelResult {
  /**
   * Current error message
   */
  error: string | null;
  
  /**
   * Loading state indicator
   */
  loading: boolean;
  
  /**
   * Whether GitHub App installation is needed
   */
  needsInstallation: boolean;
  
  /**
   * Authentication method
   */
  authMethod: string | null;
  
  /**
   * Available GitHub App installations
   */
  installations: readonly Installation[];
  
  /**
   * Current active GitHub App installations
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
    contributors: readonly string[];
    organizations: readonly string[];
    repositories: readonly string[];
  };
  
  /**
   * Current user's name
   */
  userName?: string | null;
  
  /**
   * GitHub App installation URL
   */
  installationUrl: string;
  
  /**
   * Handle activity mode changes
   */
  handleModeChange: (mode: ActivityMode) => void;
  
  /**
   * Handle organization selection changes
   */
  handleOrganizationChange: (selectedOrgs: readonly string[]) => void;
  
  /**
   * Handle filter changes
   */
  handleFilterChange: (newFilters: FilterState) => void;
  
  /**
   * Handle switching between GitHub installations
   */
  handleSwitchInstallations: (installIds: readonly number[]) => void;
  
  /**
   * Handle sign out
   */
  handleSignOut: (options?: { callbackUrl: string }) => void;
  
  /**
   * Check if GitHub App auth is active
   */
  isGitHubAppAuth: boolean;
  
  /**
   * Check if there are available installations
   */
  hasInstallations: boolean;
  
  /**
   * Check if there are current installations
   */
  hasCurrentInstallations: boolean;
}

/**
 * Custom hook for managing the Operations Panel component state and logic
 * 
 * @param props - Input state and callbacks
 * @returns Processed state and handler functions for the Operations Panel
 */
export function useOperationsPanel({
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
}: UseOperationsPanelProps): UseOperationsPanelResult {
  // Get GitHub App installation URL
  const installationUrl = useMemo(() => getGitHubAppInstallUrl(), []);
  
  // Derived state
  const isGitHubAppAuth = useMemo(() => authMethod === 'github_app', [authMethod]);
  const hasInstallations = useMemo(() => installations.length > 0, [installations]);
  const hasCurrentInstallations = useMemo(() => currentInstallations.length > 0, [currentInstallations]);
  
  // Handle activity mode changes
  const handleModeChange = useCallback((mode: ActivityMode) => {
    logger.debug(MODULE_NAME, 'Changing activity mode', { from: activityMode, to: mode });
    onModeChange(mode);
  }, [activityMode, onModeChange]);
  
  // Handle organization selection changes
  const handleOrganizationChange = useCallback((selectedOrgs: readonly string[]) => {
    logger.debug(MODULE_NAME, 'Changing organization selection', { selectedOrgs });
    onOrganizationChange(selectedOrgs);
  }, [onOrganizationChange]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    logger.debug(MODULE_NAME, 'Changing filters', { newFilters });
    onFilterChange(newFilters);
  }, [onFilterChange]);
  
  // Handle switching between GitHub installations
  const handleSwitchInstallations = useCallback((installIds: readonly number[]) => {
    logger.debug(MODULE_NAME, 'Switching installations', { installIds });
    onSwitchInstallations(installIds);
  }, [onSwitchInstallations]);
  
  // Handle sign out
  const handleSignOut = useCallback((options?: { callbackUrl: string }) => {
    logger.debug(MODULE_NAME, 'Signing out', { options });
    onSignOut(options || { callbackUrl: '/' });
  }, [onSignOut]);
  
  return {
    error,
    loading,
    needsInstallation,
    authMethod,
    installations,
    currentInstallations,
    activityMode,
    activeFilters,
    userName,
    installationUrl,
    handleModeChange,
    handleOrganizationChange,
    handleFilterChange,
    handleSwitchInstallations,
    handleSignOut,
    isGitHubAppAuth,
    hasInstallations,
    hasCurrentInstallations
  };
}
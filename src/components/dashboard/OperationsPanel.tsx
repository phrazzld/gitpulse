import React from 'react';
import ModeSelector, { ActivityMode } from '@/components/ui/ModeSelector';
import OrganizationPicker from '@/components/OrganizationPicker';
import { DateRange, FilterState, Installation } from '@/types/dashboard';
import { getGitHubAppInstallUrl } from '@/lib/dashboard-utils';
import { getInstallationManagementUrl } from '@/lib/github/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Shield, Plus, Settings } from 'lucide-react';

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
    <Card className="mb-8">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Commit Analysis Module</CardTitle>
          <Badge variant="outline">
            Status: Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error display */}
        {error && (
          <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 flex flex-col md:flex-row md:items-center">
            <div className="flex items-start text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
              <div>System Alert: {error}</div>
            </div>
            <div className="md:ml-auto mt-3 md:mt-0 flex space-x-3">
              {needsInstallation && (
                <>
                  {getGitHubAppInstallUrl() === "#github-app-not-configured" ? (
                    <Badge variant="destructive">
                      App Not Configured
                    </Badge>
                  ) : (
                    <Button asChild variant="outline" size="sm">
                      <a href={getGitHubAppInstallUrl()}>
                        Install GitHub App
                      </a>
                    </Button>
                  )}
                </>
              )}
              {error.includes('authentication') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSignOut({ callbackUrl: '/' })}
                >
                  Reinitialize Session
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* GitHub App authentication status banner */}
        {authMethod && (
          <div className={`p-3 rounded-md border ${
            authMethod === 'github_app' 
              ? 'border-muted/50 bg-muted/10' 
              : 'border-muted/50 bg-muted/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className={`h-5 w-5 mr-2 ${
                  authMethod === 'github_app' ? 'text-foreground' : 'text-foreground'
                }`} />
                <div className={authMethod === 'github_app' ? 'text-foreground' : 'text-foreground'}>
                  {authMethod === 'github_app' 
                    ? 'GitHub App Integration Active' 
                    : 'Using OAuth Authentication'}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {/* Install More Accounts button */}
                {authMethod === 'github_app' && installations.length > 0 && (
                  <Button asChild variant="outline" size="sm">
                    <a href={getGitHubAppInstallUrl()}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Account
                    </a>
                  </Button>
                )}
                
                {/* Manage current installation */}
                {authMethod === 'github_app' && currentInstallations.length > 0 && (
                  <Button asChild variant="default" size="sm">
                    <a
                      href={getInstallationManagementUrl(
                        currentInstallations[0].id, 
                        currentInstallations[0].account.login, 
                        currentInstallations[0].account.type
                      )}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Manage
                    </a>
                  </Button>
                )}
                
                {/* Install button for OAuth users */}
                {authMethod !== 'github_app' && !needsInstallation && (
                  <>
                    {getGitHubAppInstallUrl() === "#github-app-not-configured" ? (
                      <Badge variant="destructive">
                        App Needs Setup
                      </Badge>
                    ) : (
                      <Button asChild variant="outline" size="sm">
                        <a href={getGitHubAppInstallUrl()}>
                          Upgrade to App
                        </a>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Consolidated Account Selection Panel */}
        {authMethod === 'github_app' && installations.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Available Accounts & Organizations</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={getGitHubAppInstallUrl()}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Account
                    </a>
                  </Button>
                  
                  {currentInstallations.length > 0 && (
                    <Button asChild variant="default" size="sm">
                      <a
                        href={getInstallationManagementUrl(
                          currentInstallations[0].id, 
                          currentInstallations[0].account.login, 
                          currentInstallations[0].account.type
                        )}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Manage Current
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium mb-2 text-muted-foreground">Active Accounts:</p>
                  <div className="border rounded-md p-3">
                    {currentInstallations.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        No accounts selected. Select accounts to analyze.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentInstallations.map(installation => (
                          <Badge 
                            key={installation.id}
                            variant="secondary"
                            className="pr-1"
                          >
                            {installation.account.login}
                            <Button
                              onClick={() => {
                                // Remove this installation from current installations
                                const newInstallIds = currentInstallations
                                  .filter(inst => inst.id !== installation.id)
                                  .map(inst => inst.id);
                                onSwitchInstallations(newInstallIds);
                              }}
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-5 w-5 p-0 hover:bg-transparent"
                            >
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Select one or more accounts to analyze. This determines which repositories you&apos;ll have access to for analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Analysis Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis Filters</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
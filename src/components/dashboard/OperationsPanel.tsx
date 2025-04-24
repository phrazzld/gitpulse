import React from 'react';
import ModeSelector, { ActivityMode } from '@/components/ModeSelector';
import OrganizationPicker from '@/components/OrganizationPicker';
import { DateRange, FilterState, Installation } from '@/types/dashboard';
import { getGitHubAppInstallUrl } from '@/lib/dashboard-utils';
import { getInstallationManagementUrl } from '@/lib/github/auth';

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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'var(--neon-green)' }}></div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--neon-green)' }}>
            COMMIT ANALYSIS MODULE
          </h2>
        </div>
        <div className="px-2 py-1 text-xs rounded" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
          border: '1px solid var(--electric-blue)',
          color: 'var(--electric-blue)'
        }}>
          OPERATIONAL STATUS: ACTIVE
        </div>
      </div>

      {/* Error display with cyberpunk style */}
      {error && (
        <div className="mb-6 p-4 rounded-md border flex flex-col md:flex-row md:items-center" style={{
          backgroundColor: 'rgba(255, 59, 48, 0.1)',
          borderColor: 'var(--crimson-red)',
          color: 'var(--crimson-red)'
        }}>
          <div className="flex items-start">
            <svg className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>SYSTEM ALERT: {error}</div>
          </div>
          <div className="md:ml-auto mt-3 md:mt-0 flex space-x-3">
            {needsInstallation && (
              <>
                {getGitHubAppInstallUrl() === "#github-app-not-configured" ? (
                  <div className="px-4 py-1 text-sm rounded-md" style={{ 
                    backgroundColor: 'rgba(255, 59, 48, 0.1)',
                    color: 'var(--crimson-red)',
                    border: '1px solid var(--crimson-red)'
                  }}>
                    APP NOT CONFIGURED
                  </div>
                ) : (
                  <a
                    href={getGitHubAppInstallUrl()}
                    className="px-4 py-1 text-sm rounded-md transition-all duration-200"
                    style={{ 
                      backgroundColor: 'var(--dark-slate)',
                      color: 'var(--neon-green)',
                      border: '1px solid var(--neon-green)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--neon-green)';
                      e.currentTarget.style.color = 'var(--dark-slate)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--dark-slate)';
                      e.currentTarget.style.color = 'var(--neon-green)';
                    }}
                  >
                    INSTALL GITHUB APP
                  </a>
                )}
              </>
            )}
            {error.includes('authentication') && (
              <button
                className="px-4 py-1 text-sm rounded-md transition-all duration-200"
                style={{ 
                  backgroundColor: 'var(--dark-slate)',
                  color: 'var(--electric-blue)',
                  border: '1px solid var(--electric-blue)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--electric-blue)';
                  e.currentTarget.style.color = 'var(--dark-slate)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--dark-slate)';
                  e.currentTarget.style.color = 'var(--electric-blue)';
                }}
                onClick={() => onSignOut({ callbackUrl: '/' })}
              >
                REINITIALIZE SESSION
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* GitHub App authentication status banner */}
      {authMethod && (
        <div className="mb-6 p-3 rounded-md border" style={{
          backgroundColor: authMethod === 'github_app' 
            ? 'rgba(0, 255, 135, 0.1)' 
            : 'rgba(59, 142, 234, 0.1)',
          borderColor: authMethod === 'github_app' 
            ? 'var(--neon-green)' 
            : 'var(--electric-blue)',
          color: authMethod === 'github_app' 
            ? 'var(--neon-green)' 
            : 'var(--electric-blue)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                {authMethod === 'github_app' 
                  ? 'GITHUB APP INTEGRATION ACTIVE' 
                  : 'USING OAUTH AUTHENTICATION'}
              </div>
            </div>
            
            <div className="flex space-x-2">
              {/* Install More Accounts button */}
              {authMethod === 'github_app' && installations.length > 0 && (
                <a
                  href={getGitHubAppInstallUrl()}
                  className="text-xs px-2 py-1 rounded-md flex items-center"
                  style={{ 
                    backgroundColor: 'rgba(59, 142, 234, 0.1)',
                    color: 'var(--electric-blue)',
                    border: '1px solid var(--electric-blue)'
                  }}
                >
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  ADD ACCOUNT
                </a>
              )}
              
              {/* Manage current installation */}
              {authMethod === 'github_app' && currentInstallations.length > 0 && (
                <a
                  href={getInstallationManagementUrl(
                    currentInstallations[0].id, 
                    currentInstallations[0].account.login, 
                    currentInstallations[0].account.type
                  )}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: 'var(--neon-green)',
                    border: '1px solid var(--neon-green)'
                  }}
                >
                  MANAGE
                </a>
              )}
              
              {/* Install button for OAuth users */}
              {authMethod !== 'github_app' && !needsInstallation && (
                <>
                  {getGitHubAppInstallUrl() === "#github-app-not-configured" ? (
                    <div className="text-xs px-2 py-1 rounded-md" style={{ 
                      backgroundColor: 'rgba(255, 59, 48, 0.1)',
                      color: 'var(--crimson-red)',
                      border: '1px solid var(--crimson-red)'
                    }}>
                      APP NEEDS SETUP
                    </div>
                  ) : (
                    <a
                      href={getGitHubAppInstallUrl()}
                      className="text-xs px-2 py-1 rounded-md transition-all duration-200"
                      style={{ 
                        backgroundColor: 'var(--dark-slate)',
                        color: 'var(--neon-green)',
                        border: '1px solid var(--neon-green)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--neon-green)';
                        e.currentTarget.style.color = 'var(--dark-slate)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--dark-slate)';
                        e.currentTarget.style.color = 'var(--neon-green)';
                      }}
                    >
                      UPGRADE TO APP
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Consolidated Account Selection Panel */}
      {authMethod === 'github_app' && installations.length > 0 && (
        <div className="mb-6 p-3 rounded-md border" style={{
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderColor: 'var(--electric-blue)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ color: 'var(--electric-blue)' }}>
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm" style={{ color: 'var(--electric-blue)' }}>AVAILABLE ACCOUNTS & ORGANIZATIONS</span>
            </div>
            
            <div className="flex space-x-2">
              <a
                href={getGitHubAppInstallUrl()}
                className="text-xs px-2 py-1 rounded-md flex items-center"
                style={{ 
                  backgroundColor: 'rgba(59, 142, 234, 0.1)',
                  color: 'var(--electric-blue)',
                  border: '1px solid var(--electric-blue)'
                }}
              >
                <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ADD ACCOUNT
              </a>
              
              {currentInstallations.length > 0 && (
                <a
                  href={getInstallationManagementUrl(
                    currentInstallations[0].id, 
                    currentInstallations[0].account.login, 
                    currentInstallations[0].account.type
                  )}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded-md"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    color: 'var(--neon-green)',
                    border: '1px solid var(--neon-green)'
                  }}
                >
                  MANAGE CURRENT
                </a>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xl">
              <div className="text-xs font-bold mb-2" style={{ color: 'var(--neon-green)' }}>ACTIVE ACCOUNTS:</div>
              {installations.length > 0 && (
                <div className="w-full">
                  <div className="text-xs font-bold mb-2" style={{ color: 'var(--neon-green)' }}>ACTIVE ACCOUNTS:</div>
                  {/* Render account selector component */}
                  <div className="border p-3 rounded" style={{ borderColor: 'var(--electric-blue)' }}>
                    {currentInstallations.length === 0 ? (
                      <div className="text-xs italic" style={{ color: 'var(--foreground)' }}>
                        No accounts selected. Select accounts to analyze.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {currentInstallations.map(installation => (
                          <div 
                            key={installation.id}
                            className="px-2 py-1 rounded-md text-xs flex items-center"
                            style={{ 
                              backgroundColor: 'rgba(0, 255, 135, 0.1)',
                              color: 'var(--neon-green)',
                              border: '1px solid var(--neon-green)'
                            }}
                          >
                            {installation.account.login}
                            <button
                              onClick={() => {
                                // Remove this installation from current installations
                                const newInstallIds = currentInstallations
                                  .filter(inst => inst.id !== installation.id)
                                  .map(inst => inst.id);
                                onSwitchInstallations(newInstallIds);
                              }}
                              className="ml-2 text-xs"
                              style={{ color: 'var(--neon-green)' }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs" style={{ color: 'var(--foreground)' }}>
                Select one or more accounts to analyze. This determines which repositories you&apos;ll have access to for analysis.
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Improved Filters Container */}
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
    </div>
  );
}
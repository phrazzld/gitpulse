import React from 'react';
import { Installation } from '@/types/dashboard';
import { getGitHubAppInstallUrl } from '@/lib/dashboard-utils';
import { getInstallationManagementUrl } from '@/lib/github/auth';

export interface AuthStatusBannerProps {
  /**
   * Authentication method (github_app or oauth)
   */
  authMethod: string;
  
  /**
   * Whether GitHub App installation is needed
   */
  needsInstallation?: boolean;
  
  /**
   * List of available GitHub App installations
   */
  installations: readonly Installation[];
  
  /**
   * List of current GitHub App installations
   */
  currentInstallations: readonly Installation[];
}

/**
 * Banner component displaying authentication status and related actions
 */
export default function AuthStatusBanner({ 
  authMethod, 
  needsInstallation = false,
  installations,
  currentInstallations
}: AuthStatusBannerProps) {
  const isGitHubApp = authMethod === 'github_app';
  const hasInstallations = installations.length > 0;
  const hasCurrentInstallations = currentInstallations.length > 0;
  const isAppNotConfigured = getGitHubAppInstallUrl() === "#github-app-not-configured";
  
  return (
    <div className="mb-6 p-3 rounded-md border" style={{
      backgroundColor: isGitHubApp 
        ? 'rgba(0, 255, 135, 0.1)' 
        : 'rgba(59, 142, 234, 0.1)',
      borderColor: isGitHubApp 
        ? 'var(--neon-green)' 
        : 'var(--electric-blue)',
      color: isGitHubApp 
        ? 'var(--neon-green)' 
        : 'var(--electric-blue)'
    }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            {isGitHubApp 
              ? 'GITHUB APP INTEGRATION ACTIVE' 
              : 'USING OAUTH AUTHENTICATION'}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {/* Install More Accounts button */}
          {isGitHubApp && hasInstallations && (
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
          {isGitHubApp && hasCurrentInstallations && (
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
          {!isGitHubApp && !needsInstallation && (
            <>
              {isAppNotConfigured ? (
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
  );
}
import React from 'react';

interface Props {
  error: string | null;
  authMethod: string | null;
  needsInstallation: boolean;
  getGitHubAppInstallUrl: () => string;
  handleAuthError: () => void;
  signOutCallback: (options?: { callbackUrl: string }) => void;
}

export default function AuthenticationStatusBanner({
  error,
  authMethod,
  needsInstallation,
  getGitHubAppInstallUrl,
  handleAuthError,
  signOutCallback
}: Props) {
  return (
    <>
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
                onClick={() => signOutCallback({ callbackUrl: '/' })}
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
    </>
  );
}
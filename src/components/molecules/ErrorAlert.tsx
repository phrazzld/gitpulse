import React from 'react';

export interface ErrorAlertProps {
  /**
   * The error message to display
   */
  message: string;
  
  /**
   * Whether GitHub App installation is needed
   */
  needsInstallation?: boolean;
  
  /**
   * URL for GitHub App installation
   */
  installationUrl?: string;
  
  /**
   * Function to handle sign out
   */
  onSignOut?: (options?: { callbackUrl: string }) => void;
}

/**
 * Error alert component displaying error messages with optional action buttons
 */
export default function ErrorAlert({ 
  message, 
  needsInstallation = false, 
  installationUrl, 
  onSignOut 
}: ErrorAlertProps) {
  const isAuthError = message.includes('authentication');
  const isAppNotConfigured = installationUrl === "#github-app-not-configured";
  
  return (
    <div className="mb-6 p-4 rounded-md border flex flex-col md:flex-row md:items-center" style={{
      backgroundColor: 'rgba(255, 59, 48, 0.1)',
      borderColor: 'var(--crimson-red)',
      color: 'var(--crimson-red)'
    }}>
      <div className="flex items-start">
        <svg className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div>SYSTEM ALERT: {message}</div>
      </div>
      
      <div className="md:ml-auto mt-3 md:mt-0 flex space-x-3">
        {needsInstallation && (
          <>
            {isAppNotConfigured ? (
              <div className="px-4 py-1 text-sm rounded-md" style={{ 
                backgroundColor: 'rgba(255, 59, 48, 0.1)',
                color: 'var(--crimson-red)',
                border: '1px solid var(--crimson-red)'
              }}>
                APP NOT CONFIGURED
              </div>
            ) : (
              <a
                href={installationUrl}
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
        
        {isAuthError && onSignOut && (
          <button
            className="px-4 py-1 text-sm rounded-md transition-all duration-200"
            style={{ 
              backgroundColor: 'var(--dark-slate)',
              // Using a darker blue for better contrast with backgrounds (WCAG AA 4.5:1 ratio)
              color: 'var(--electric-blue, #0066cc)', // Changed from #3b8eea to #0066cc
              border: '1px solid var(--electric-blue, #0066cc)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--electric-blue, #0066cc)';
              e.currentTarget.style.color = 'var(--dark-slate)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--dark-slate)';
              e.currentTarget.style.color = 'var(--electric-blue, #0066cc)';
            }}
            onClick={() => onSignOut({ callbackUrl: '/' })}
          >
            REINITIALIZE SESSION
          </button>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import { Installation } from '@/types/dashboard';
import { getGitHubAppInstallUrl } from '@/lib/dashboard-utils';
import { getInstallationManagementUrl } from '@/lib/github/auth';

export interface AccountSelectionPanelProps {
  /**
   * List of available GitHub App installations
   */
  installations: readonly Installation[];
  
  /**
   * List of current active GitHub App installations
   */
  currentInstallations: readonly Installation[];
  
  /**
   * Function to handle switching between installations
   */
  onSwitchInstallations: (installIds: number[]) => void;
}

/**
 * Panel component for selecting and managing GitHub accounts/organizations
 */
export default function AccountSelectionPanel({
  installations,
  currentInstallations,
  onSwitchInstallations
}: AccountSelectionPanelProps) {
  return (
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
  );
}
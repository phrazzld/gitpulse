import React from 'react';
import AccountSelector from '@/components/AccountSelector';
import { Installation } from '@/types/github';
import { Session } from 'next-auth';

interface Props {
  authMethod: string | null;
  installations: Installation[];
  currentInstallations: Installation[];
  loading: boolean;
  getGitHubAppInstallUrl: () => string;
  getInstallationManagementUrl: (
    installationId: number, 
    login: string, 
    type: string
  ) => string;
  switchInstallations: (installationIds: number[]) => void;
  session: Session | null;
}

export default function AccountManagementPanel({
  authMethod,
  installations,
  currentInstallations,
  loading,
  getGitHubAppInstallUrl,
  getInstallationManagementUrl,
  switchInstallations,
  session
}: Props) {
  if (authMethod !== 'github_app' || installations.length === 0) {
    return null;
  }

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
          
          {currentInstallations.length > 0 && currentInstallations[0].account && (
            <a
              // Create the management URL with null-safe access 
              href={`https://github.com${currentInstallations[0].account.type === 'Organization' ? 
                `/organizations/${currentInstallations[0].account.login}` : 
                ''}/settings/installations/${currentInstallations[0].id}`}
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
          <AccountSelector
            accounts={installations
              .filter(installation => installation.account !== null)
              .map(installation => ({
                id: installation.id,
                login: installation.account!.login,
                type: installation.account!.type || 'User', // Default to 'User' if type is undefined
                avatarUrl: installation.account!.avatarUrl
              }))}
            selectedAccounts={currentInstallations
              .filter(inst => inst.account !== null)
              .map(inst => inst.account!.login)}
            onSelectionChange={(selected) => {
              if (selected.length > 0) {
                // Map selected login names to installation IDs
                const selectedInstallationIds = selected
                  .map(login => {
                    const inst = installations.find(i => i.account && i.account.login === login);
                    return inst ? inst.id : null;
                  })
                  .filter(id => id !== null) as number[];
                
                // Switch to the selected installations
                switchInstallations(selectedInstallationIds);
              } else {
                // Handle case when no accounts are selected
                switchInstallations([]);
              }
            }}
            isLoading={loading}
            multiSelect={true}
            showCurrentLabel={true}
            currentUsername={session?.user?.name || ""}
          />
          
          <div className="mt-2 text-xs" style={{ color: 'var(--foreground)' }}>
            Select one or more accounts to analyze. This determines which repositories you&apos;ll have access to for analysis.
          </div>
        </div>
      </div>
    </div>
  );
}
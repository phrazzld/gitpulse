import React from 'react';
import { FilterState } from '@/app/dashboard/page';

type Repository = {
  id: number;
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  private: boolean;
  language?: string | null;
};

interface Props {
  repositories: Repository[];
  showRepoList: boolean;
  loading: boolean;
  activeFilters: FilterState;
  setShowRepoList: (show: boolean) => void;
}

export default function RepositoryInfoPanel({
  repositories,
  showRepoList,
  loading,
  activeFilters,
  setShowRepoList
}: Props) {
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <label className="text-sm" style={{ color: 'var(--electric-blue)' }}>
            TARGET REPOSITORIES
          </label>
          <button
            type="button"
            onClick={() => setShowRepoList(!showRepoList)}
            className="ml-2 text-xs px-2 py-0.5 rounded transition-all duration-200"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              color: 'var(--electric-blue)',
              border: '1px solid var(--electric-blue)'
            }}
          >
            {showRepoList ? 'HIDE' : 'SHOW'} LIST
          </button>
        </div>
        <div className="text-xs px-2 py-1 rounded flex items-center" style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
          border: '1px solid var(--neon-green)',
          color: 'var(--neon-green)'
        }}>
          DETECTED: {repositories.length}
        </div>
      </div>
      
      {/* Repository info with cyber styling */}
      <div className="border rounded-md p-3" 
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          borderColor: 'var(--electric-blue)',
          boxShadow: 'inset 0 0 10px rgba(59, 142, 234, 0.1)'
        }}>
        {loading && repositories.length === 0 ? (
          <div className="flex items-center justify-center p-3" style={{ color: 'var(--foreground)' }}>
            <span className="inline-block w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" 
              style={{ borderColor: 'var(--neon-green)', borderTopColor: 'transparent' }}></span>
            <span>SCANNING REPOSITORIES...</span>
          </div>
        ) : (
          <div>
            <div className="p-3 mb-3 border-b" 
              style={{ color: 'var(--foreground)', borderColor: 'rgba(59, 142, 234, 0.2)' }}>
              <div className="flex items-center justify-center mb-2">
                <span className="inline-block w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: 'var(--neon-green)' }}></span>
                <span>ANALYZING ALL ACCESSIBLE REPOSITORIES</span>
              </div>
              
              {/* Display filter information if applied */}
              {(activeFilters.contributors.length > 0 || 
                activeFilters.organizations.length > 0 || 
                activeFilters.repositories.length > 0) && (
                <div className="mt-2 p-2 border rounded" style={{ 
                  borderColor: 'rgba(0, 255, 135, 0.2)',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
                }}>
                  <div className="text-xs" style={{ color: 'var(--neon-green)' }}>
                    ACTIVE FILTERS
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {activeFilters.contributors.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ 
                        backgroundColor: 'rgba(0, 255, 135, 0.1)',
                        color: 'var(--foreground)'
                      }}>
                        Contributors: {activeFilters.contributors.includes('me') ? 'Only Me' : activeFilters.contributors.join(', ')}
                      </span>
                    )}
                    {activeFilters.organizations.length > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded" style={{ 
                        backgroundColor: 'rgba(59, 142, 234, 0.1)',
                        color: 'var(--foreground)'
                      }}>
                        Orgs: {activeFilters.organizations.join(', ')}
                      </span>
                    )}
                    {/* Group by section removed, always using chronological view */}
                  </div>
                </div>
              )}
              
              {/* Repository stats summary */}
              {repositories.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div className="border rounded px-2 py-1 flex flex-col items-center justify-center"
                    style={{ borderColor: 'rgba(59, 142, 234, 0.3)' }}>
                    <div className="font-bold" style={{ color: 'var(--electric-blue)' }}>REPOS</div>
                    <div>{repositories.length}</div>
                  </div>
                  <div className="border rounded px-2 py-1 flex flex-col items-center justify-center"
                    style={{ borderColor: 'rgba(59, 142, 234, 0.3)' }}>
                    <div className="font-bold" style={{ color: 'var(--electric-blue)' }}>ORGS</div>
                    <div>{new Set(repositories.map(repo => repo.full_name.split('/')[0])).size}</div>
                  </div>
                  <div className="border rounded px-2 py-1 flex flex-col items-center justify-center"
                    style={{ borderColor: 'rgba(59, 142, 234, 0.3)' }}>
                    <div className="font-bold" style={{ color: 'var(--electric-blue)' }}>PRIVATE</div>
                    <div>{repositories.filter(repo => repo.private).length}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Repository list with organization grouping */}
            {showRepoList && (
              <div className="max-h-60 overflow-y-auto" style={{ color: 'var(--foreground)' }}>
                {repositories.length > 0 ? (
                  (() => {
                    // Group repositories by organization/owner
                    const reposByOrg = repositories.reduce((groups, repo) => {
                      const orgName = repo.full_name.split('/')[0];
                      if (!groups[orgName]) {
                        groups[orgName] = [];
                      }
                      groups[orgName].push(repo);
                      return groups;
                    }, {} as Record<string, Repository[]>);
                    
                    // Sort organizations by repo count (descending)
                    const sortedOrgs = Object.entries(reposByOrg)
                      .sort(([, reposA], [, reposB]) => reposB.length - reposA.length);
                    
                    return sortedOrgs.map(([org, repos]) => (
                      <div key={org} className="mb-3">
                        <div className="flex items-center px-2 py-1 mb-1" style={{ 
                          backgroundColor: 'rgba(59, 142, 234, 0.1)',
                          color: 'var(--electric-blue)'
                        }}>
                          <span className="font-bold">{org}</span>
                          <span className="ml-2 text-xs px-1 rounded" style={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.3)'
                          }}>
                            {repos.length}
                          </span>
                        </div>
                        
                        <ul className="pl-3">
                          {repos.map(repo => (
                            <li key={repo.id} className="text-xs py-1 flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="inline-block w-2 h-2 mr-2" style={{ 
                                  backgroundColor: repo.private ? 'var(--crimson-red)' : 'var(--neon-green)'
                                }}></span>
                                <span>{repo.name}</span>
                              </div>
                              <div className="flex items-center">
                                {repo.private && (
                                  <span className="ml-2 text-xs px-1 rounded" style={{ 
                                    color: 'var(--crimson-red)',
                                    backgroundColor: 'rgba(255, 59, 48, 0.1)'
                                  }}>
                                    PRIVATE
                                  </span>
                                )}
                                {repo.language && (
                                  <span className="ml-2 text-xs px-1 rounded" style={{ 
                                    color: 'var(--luminous-yellow)',
                                    backgroundColor: 'rgba(255, 200, 87, 0.1)'
                                  }}>
                                    {repo.language}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ));
                  })()
                ) : repositories.length === 0 && !loading ? (
                  <div className="p-3 text-center" style={{ color: 'var(--crimson-red)' }}>
                    NO REPOSITORIES DETECTED
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

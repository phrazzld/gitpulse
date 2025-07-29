import React, { useState } from 'react';
import { Repository, FilterState } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, BarChart, ArrowRight, Eye, EyeOff } from 'lucide-react';

export interface RepositorySectionProps {
  /**
   * List of repositories to display
   */
  repositories: readonly Repository[];
  
  /**
   * Whether repositories are being loaded
   */
  loading: boolean;
  
  /**
   * Active filters to display
   */
  activeFilters: FilterState;
  
  /**
   * Initial visibility state of the repository list
   */
  initialShowRepoList?: boolean;
  
  /**
   * Whether the component is within a form element
   * Controls whether the section has a submit button
   */
  isWithinForm?: boolean;
  
  /**
   * Optional callback for submit action
   * Only used when isWithinForm is true
   */
  onSubmit?: () => void;
}

/**
 * Repository Section component displaying repository information and list
 */
export default function RepositorySection({
  repositories,
  loading,
  activeFilters,
  initialShowRepoList = true,
  isWithinForm = true,
  onSubmit
}: RepositorySectionProps) {
  const [showRepoList, setShowRepoList] = useState(initialShowRepoList);
  
  /**
   * Group repositories by organization
   */
  const groupRepositoriesByOrg = (): [string, Repository[]][] => {
    const reposByOrg: Record<string, Repository[]> = {};
    
    repositories.forEach(repo => {
      const orgName = repo.full_name.split('/')[0];
      if (!reposByOrg[orgName]) {
        reposByOrg[orgName] = [];
      }
      reposByOrg[orgName].push(repo);
    });
    
    // Sort organizations by repo count (descending)
    return Object.entries(reposByOrg)
      .sort(([, reposA], [, reposB]) => reposB.length - reposA.length);
  };
  
  const renderRepositorySection = () => (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <label className="text-sm text-muted-foreground font-medium">
            TARGET REPOSITORIES
          </label>
          <Button
            type="button"
            onClick={() => setShowRepoList(!showRepoList)}
            variant="outline"
            size="sm"
            className="ml-2 h-6 text-xs"
          >
            {showRepoList ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
            {showRepoList ? 'HIDE' : 'SHOW'} LIST
          </Button>
        </div>
        <Badge variant="secondary" className="text-xs">
          DETECTED: {repositories.length}
        </Badge>
      </div>
      
      <Card className="p-3">
        {loading && repositories.length === 0 ? (
          <div className="flex items-center justify-center p-3 text-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>SCANNING REPOSITORIES...</span>
          </div>
        ) : (
          <div>
            <div className="p-3 mb-3 border-b text-foreground">
              <div className="flex items-center justify-center mb-2">
                <Loader2 className="h-3 w-3 mr-2" />
                <span>ANALYZING ALL ACCESSIBLE REPOSITORIES</span>
              </div>
              
              {/* Display filter information if applied */}
              {(activeFilters.contributors.length > 0 || 
                activeFilters.organizations.length > 0 || 
                activeFilters.repositories.length > 0) && (
                <div className="mt-2 p-2 border rounded">
                  <div className="text-xs text-muted-foreground">
                    ACTIVE FILTERS
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {activeFilters.contributors.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Contributors: {activeFilters.contributors.includes('me') ? 'Only Me' : activeFilters.contributors.join(', ')}
                      </Badge>
                    )}
                    {activeFilters.organizations.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        Orgs: {activeFilters.organizations.join(', ')}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Repository stats summary */}
              {repositories.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div className="border rounded px-2 py-1 flex flex-col items-center justify-center">
                    <div className="font-bold text-muted-foreground">REPOS</div>
                    <div>{repositories.length}</div>
                  </div>
                  <div className="border rounded px-2 py-1 flex flex-col items-center justify-center">
                    <div className="font-bold text-muted-foreground">ORGS</div>
                    <div>{new Set(repositories.map(repo => repo.full_name.split('/')[0])).size}</div>
                  </div>
                  <div className="border rounded px-2 py-1 flex flex-col items-center justify-center">
                    <div className="font-bold text-muted-foreground">PRIVATE</div>
                    <div>{repositories.filter(repo => repo.private).length}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Repository list with organization grouping */}
            {showRepoList && (
              <div className="max-h-60 overflow-y-auto text-foreground">
                {repositories.length > 0 ? (
                  groupRepositoriesByOrg().map(([org, repos]) => (
                    <div key={org} className="mb-3">
                      <div className="flex items-center px-2 py-1 mb-1 bg-muted/50">
                        <span className="font-bold">{org}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {repos.length}
                        </Badge>
                      </div>
                      
                      <ul className="pl-3">
                        {repos.map((repo) => (
                          <li key={repo.id} className="text-xs py-1 flex items-center justify-between">
                            <div className="flex items-center">
                              <span className={`inline-block w-2 h-2 mr-2 rounded-full ${repo.private ? 'bg-destructive' : 'bg-muted-foreground'}`}></span>
                              <span>{repo.name}</span>
                            </div>
                            <div className="flex items-center">
                              {repo.private && (
                                <Badge variant="destructive" className="ml-2 text-xs">
                                  PRIVATE
                                </Badge>
                              )}
                              {repo.language && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {repo.language}
                                </Badge>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : repositories.length === 0 && !loading ? (
                  <div className="p-3 text-center text-destructive">
                    NO REPOSITORIES DETECTED
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Card>
      
      {isWithinForm && (
        <div className="flex justify-end pt-4">
          <Button
            type={onSubmit ? "button" : "submit"}
            onClick={onSubmit}
            disabled={loading}
            title="Analyze your GitHub commits and generate activity summary with AI insights"
            variant="default"
            className="font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ANALYZING DATA...
              </>
            ) : (
              <>
                <BarChart className="h-4 w-4 mr-2" />
                ANALYZE COMMITS
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
  
  return renderRepositorySection();
}
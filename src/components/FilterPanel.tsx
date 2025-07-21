import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import AccountSelector, { Account } from './AccountSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, ChevronDown } from 'lucide-react';

type Contributor = {
  username: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  commitCount?: number;
};

type Installation = {
  id: number;
  account: {
    login: string;
    type: string;
    avatarUrl?: string;
  };
};

type FilterPanelProps = {
  onFilterChange: (filters: FilterState) => void;
  isLoading: boolean;
  installations: Installation[];
  currentUsername?: string;
};

export type FilterState = {
  contributors: string[];
  organizations: string[];
  repositories: string[];
  groupBy: 'contributor' | 'organization' | 'repository' | 'chronological';
  generateGroupSummaries: boolean;
};

export default function FilterPanel({ 
  onFilterChange, 
  isLoading, 
  installations,
  currentUsername
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loadingContributors, setLoadingContributors] = useState(false);

  // Filter state
  const [selectedContributors, setSelectedContributors] = useState<string[]>([]);
  const [selectOnlyMe, setSelectOnlyMe] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [selectedRepositories, setSelectedRepositories] = useState<string[]>([]);
  const [groupBy, setGroupBy] = useState<'contributor' | 'organization' | 'repository' | 'chronological'>('chronological');
  const [generateGroupSummaries, setGenerateGroupSummaries] = useState(false);

  // Fetch contributors from the API - wrapped in useCallback to avoid dependency issues
  const fetchContributors = useCallback(async () => {
    try {
      setLoadingContributors(true);
      // Convert installations to organization list
      const orgList = installations.map(inst => inst.account.login).join(',');
      
      // The API now handles adding a date range if none is provided
      const response = await fetch(`/api/contributors?organizations=${orgList}&include_commit_count=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch contributors');
      }
      
      const data = await response.json();
      setContributors(data.contributors || []);
      
      // Set a flag in localStorage to prevent excessive fetching
      if (typeof window !== 'undefined') {
        localStorage.setItem('contributorsFetchedAt', Date.now().toString());
      }
    } catch (error) {
      console.error('Error fetching contributors:', error);
    } finally {
      setLoadingContributors(false);
    }
  }, [installations, setContributors, setLoadingContributors]);
  
  // Check if we should fetch based on cache time
  const shouldFetchContributors = useCallback(() => {
    if (typeof window === 'undefined') return true;
    
    const lastFetchedAt = localStorage.getItem('contributorsFetchedAt');
    if (!lastFetchedAt) return true;
    
    // Only fetch if it's been more than 15 minutes since last fetch
    const fifteenMinutes = 15 * 60 * 1000;
    return Date.now() - parseInt(lastFetchedAt, 10) > fifteenMinutes;
  }, []);
  
  // Fetch contributors when the component loads
  useEffect(() => {
    if (expanded && !loadingContributors && (contributors.length === 0 || shouldFetchContributors())) {
      fetchContributors();
    }
  }, [expanded, contributors.length, loadingContributors, fetchContributors, shouldFetchContributors]);

  // Apply filters when any filter changes
  useEffect(() => {
    const newFilters: FilterState = {
      contributors: selectOnlyMe ? ['me'] : selectedContributors,
      organizations: selectedOrganizations,
      repositories: selectedRepositories,
      groupBy,
      generateGroupSummaries
    };
    
    onFilterChange(newFilters);
  }, [
    selectedContributors,
    selectOnlyMe,
    selectedOrganizations,
    selectedRepositories,
    groupBy,
    generateGroupSummaries,
    onFilterChange
  ]);

  // Handle "Only Me" checkbox
  const handleOnlyMeChange = (checked: boolean) => {
    setSelectOnlyMe(checked);
    if (checked) {
      // Clear other contributor selections when "Only Me" is selected
      setSelectedContributors([]);
    }
  };

  // Handle contributor selection
  const handleContributorChange = (contributorUsername: string, checked: boolean) => {
    if (checked) {
      setSelectedContributors(prev => [...prev, contributorUsername]);
      // Uncheck "Only Me" if a specific contributor is selected
      if (selectOnlyMe) {
        setSelectOnlyMe(false);
      }
    } else {
      setSelectedContributors(prev => prev.filter(c => c !== contributorUsername));
    }
  };

  // Handle organization selection
  const handleOrganizationChange = (orgName: string, checked: boolean) => {
    if (checked) {
      setSelectedOrganizations(prev => [...prev, orgName]);
    } else {
      setSelectedOrganizations(prev => prev.filter(o => o !== orgName));
    }
  };

  // Reset all filters
  const handleReset = () => {
    setSelectedContributors([]);
    setSelectOnlyMe(false);
    setSelectedOrganizations([]);
    setSelectedRepositories([]);
    setGroupBy('chronological');
    setGenerateGroupSummaries(false);
  };

  return (
    <Card className="p-3 mb-6 bg-slate-900/70 backdrop-blur-sm border-blue-500 shadow-lg shadow-blue-500/15">
      {/* Header with toggle */}
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
          <h3 className="text-sm uppercase text-blue-500">
            ANALYSIS FILTERS
          </h3>
        </div>
        <div className="flex items-center">
          {/* Show indicators for active filters */}
          {(selectedContributors.length > 0 || selectOnlyMe || selectedOrganizations.length > 0 || selectedRepositories.length > 0 || groupBy !== 'chronological') && (
            <Badge variant="outline" className="text-xs mr-2 text-green-500 border-green-500">
              FILTERS ACTIVE
            </Badge>
          )}
          
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 text-blue-500 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Expandable filter panel */}
      {expanded && (
        <div className="mt-4 space-y-6">
          {/* Contributors filter */}
          <div>
            <h4 className="text-xs mb-2 font-bold text-blue-500">CONTRIBUTOR FILTER</h4>
            <div className="space-y-2">
              {/* "Only My Commits" checkbox */}
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="only-me" 
                  checked={selectOnlyMe}
                  onChange={(e) => handleOnlyMeChange(e.target.checked)}
                  disabled={isLoading}
                  className="mr-2 accent-green-500"
                />
                <label 
                  htmlFor="only-me" 
                  className="text-sm text-foreground"
                >
                  ONLY MY COMMITS ({currentUsername || 'current user'})
                </label>
              </div>
              
              {/* Contributor selection (hidden when "Only Me" is selected) */}
              {!selectOnlyMe && (
                <div className="pl-5 pt-2">
                  <div className="text-xs mb-2 text-blue-500">
                    SELECT SPECIFIC CONTRIBUTORS:
                  </div>
                  
                  {loadingContributors ? (
                    <div className="flex items-center text-xs text-foreground">
                      <Loader2 className="h-3 w-3 animate-spin mr-2 text-green-500" />
                      <span>Loading contributors...</span>
                    </div>
                  ) : contributors.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto pr-2">
                      {contributors.map(contributor => (
                        <div key={contributor.username} className="flex items-center mb-2">
                          <input 
                            type="checkbox" 
                            id={`contributor-${contributor.username}`}
                            checked={selectedContributors.includes(contributor.username)}
                            onChange={(e) => handleContributorChange(contributor.username, e.target.checked)}
                            disabled={isLoading}
                            className="mr-2 accent-green-500"
                          />
                          <label 
                            htmlFor={`contributor-${contributor.username}`} 
                            className="text-sm flex items-center text-foreground"
                          >
                            {contributor.avatarUrl && (
                              <Image 
                                src={contributor.avatarUrl} 
                                alt={contributor.displayName}
                                width={20}
                                height={20}
                                className="w-5 h-5 rounded-full mr-2"
                              />
                            )}
                            <span>{contributor.displayName}</span>
                            {contributor.commitCount && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {contributor.commitCount}
                              </Badge>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-foreground">
                      No contributors found. Try expanding the date range.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Organizations filter */}
          <div>
            <h4 className="text-xs mb-2 font-bold text-blue-500">ACCOUNT/ORGANIZATION FILTER</h4>
            <div className="space-y-2">
              {installations.length > 0 ? (
                <>
                  <AccountSelector
                    accounts={installations.map(installation => ({
                      id: installation.id,
                      login: installation.account.login,
                      type: installation.account.type,
                      avatarUrl: installation.account.avatarUrl
                    }))}
                    selectedAccounts={selectedOrganizations}
                    onSelectionChange={setSelectedOrganizations}
                    isLoading={isLoading}
                    multiSelect={true}
                    showCurrentLabel={true}
                    currentUsername={currentUsername}
                  />
                  
                  {/* Note about selection */}
                  <div className="text-xs italic text-foreground">
                    {selectedOrganizations.length === 0 ? 
                      "No accounts selected. Select accounts to filter results or leave all unchecked to include all." :
                      `Selected ${selectedOrganizations.length} account(s).`}
                  </div>
                </>
              ) : (
                <div className="text-xs text-foreground">
                  No GitHub App installations found. Install the GitHub App to access more accounts.
                </div>
              )}
            </div>
          </div>
          
          {/* Group By options */}
          <div>
            <h4 className="text-xs mb-2 font-bold text-blue-500">GROUP RESULTS BY</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'chronological', label: 'NO GROUPING' },
                  { value: 'contributor', label: 'CONTRIBUTOR' },
                  { value: 'organization', label: 'ORGANIZATION' },
                  { value: 'repository', label: 'REPOSITORY' }
                ].map(option => (
                  <div key={option.value} className="flex items-center">
                    <input 
                      type="radio" 
                      id={`group-${option.value}`}
                      name="groupBy"
                      value={option.value}
                      checked={groupBy === option.value}
                      onChange={() => setGroupBy(option.value as any)}
                      disabled={isLoading}
                      className="mr-2 accent-green-500"
                    />
                    <label 
                      htmlFor={`group-${option.value}`} 
                      className="text-xs text-foreground"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Option to generate AI summaries for each group */}
              {groupBy !== 'chronological' && (
                <div className="flex items-center mt-2">
                  <input 
                    type="checkbox" 
                    id="generate-group-summaries"
                    checked={generateGroupSummaries}
                    onChange={(e) => setGenerateGroupSummaries(e.target.checked)}
                    disabled={isLoading}
                    className="mr-2 accent-green-500"
                  />
                  <label 
                    htmlFor="generate-group-summaries" 
                    className="text-xs text-foreground"
                  >
                    GENERATE AI SUMMARY FOR EACH GROUP
                  </label>
                </div>
              )}
            </div>
          </div>
          
          {/* Reset button */}
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              variant="destructive"
              size="sm"
            >
              RESET FILTERS
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
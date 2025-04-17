'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ActivityMode } from '@/types/common';
import DateRangePicker, { DateRange } from '@/components/DateRangePicker';
import AccountSelector from '@/components/AccountSelector';
import ActivityFeed from '@/components/ActivityFeed';
import DashboardLoadingState from '@/components/DashboardLoadingState';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import AuthenticationStatusBanner from '@/components/dashboard/AuthenticationStatusBanner';
import AccountManagementPanel from '@/components/dashboard/AccountManagementPanel';
import FilterControls from '@/components/dashboard/FilterControls';
import RepositoryInfoPanel from '@/components/dashboard/RepositoryInfoPanel';
import ActionButton from '@/components/dashboard/ActionButton';
import SummaryDisplay from '@/components/dashboard/SummaryDisplay';
import { getInstallationManagementUrl } from '@/lib/auth/githubAuth';
import { createActivityFetcher } from '@/lib/activity';
import { 
  setCacheItem, 
  getCacheItem,
  getStaleItem
} from '@/lib/localStorageCache';
import { CLIENT_CACHE_TTL, AUTH_METHODS, GITHUB_API, STORAGE_REFRESH } from '@/lib/constants';
import { CommitSummary } from '@/types/summary';
import { Repository, Installation } from '@/types/github';

// Preserve the FilterState type from the removed FilterPanel
export type FilterState = {
  contributors: string[];
  organizations: string[];
  repositories: string[];
  // Removed groupBy, standardized on chronological view
};

type ReposResponse = {
  repositories: Repository[];
  authMethod?: string;
  installationId?: RequestedInstallationId;
  installationIds?: InstallationId[];
  installations?: Installation[];
  currentInstallation?: Installation | null;
  currentInstallations?: Installation[];
  error?: string;
  code?: string;
  needsInstallation?: boolean;
};

// Helper functions for date formatting
function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getLastWeekDate() {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  return lastWeek.toISOString().split('T')[0];
}

// Helper function to get GitHub App installation URL
function getGitHubAppInstallUrl() {
  // Use the provided app name or a generic message if not configured
  const appName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME;
  
  if (!appName) {
    // If no app name is configured, we'll create a more informative error
    console.error("GitHub App name not configured. Please set NEXT_PUBLIC_GITHUB_APP_NAME environment variable.");
    return GITHUB_API.APP_INSTALLATION_URL_FRAGMENT;
  }
  
  // Use the standard GitHub App installation URL - our custom handler will intercept it
  return `https://github.com/apps/${appName}/installations/new`;
}

// Type definitions for Dashboard component state
type InstallationId = number;
type RequestedInstallationId = InstallationId | null;

// Type for date range state
interface DateRangeState {
  since: string;
  until: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<DateRangeState>({
    since: getLastWeekDate(),
    until: getTodayDate(),
  });
  const [summary, setSummary] = useState<CommitSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRepoList, setShowRepoList] = useState<boolean>(true);
  const [authMethod, setAuthMethod] = useState<string | null>(null);
  const [needsInstallation, setNeedsInstallation] = useState<boolean>(false);
  const [installationIds, setInstallationIds] = useState<InstallationId[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [currentInstallations, setCurrentInstallations] = useState<Installation[]>([]);
  
  // Activity mode is hardcoded to 'my-activity' as we no longer support team/org views
  const activityMode: ActivityMode = 'my-activity';
  
  // New state for filters (removed groupBy, standardized on chronological view)
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    contributors: [],
    organizations: [],
    repositories: []
  });
  
  // Handle repository fetch errors - set descriptive error message
  const handleAuthError = useCallback(() => {
    console.log('GitHub authentication issue detected.');
    setError('GitHub authentication issue detected. Your token may be invalid, expired, or missing required permissions. Please sign out and sign in again to grant all necessary permissions.');
  }, [setError]);
  
  const handleAppInstallationNeeded = useCallback(() => {
    console.log('GitHub App installation needed.');
    setNeedsInstallation(true);
    setError('GitHub App installation required. Please install the GitHub App to access all your repositories, including private ones.');
  }, [setError, setNeedsInstallation]);
  
  const fetchRepositories = useCallback(async (selectedInstallationId?: InstallationId) => {
    // Create a consistent cache key
    const cacheKey = `repos:${session?.user?.email || 'user'}`;
    let forceFetch = false;
    
    // If we already have repositories from a previous session, maintain them while fetching fresh data
    if (!forceFetch && !selectedInstallationId) {
      // Check for cached data using stale-while-revalidate approach
      const { data: cachedRepos, isStale } = getStaleItem<Repository[]>(cacheKey);
      
      // If we have cached data, use it immediately
      if (cachedRepos && cachedRepos.length > 0) {
        setRepositories(cachedRepos);
        console.log('Using cached repositories:', cachedRepos.length);
        
        // If data is fresh enough, don't fetch
        if (!isStale) {
          console.log('Cache is fresh, skipping fetch');
          return true;
        }
        
        // If data is stale, continue with fetch in background but don't show loading state
        console.log('Cache is stale, fetching in background');
        forceFetch = true;
      }
    }
    
    try {
      // Only show loading if we don't have cached data
      if (!forceFetch) {
        setLoading(true);
      }
      
      // Add installation_id query parameter if it was provided
      const url = selectedInstallationId 
        ? `/api/repos?installation_id=${selectedInstallationId}` 
        : '/api/repos';
      
      const response: Response = await fetch(url);
      
      if (!response.ok) {
        // Parse the error response
        const errorData: {
          error?: string;
          code?: string;
          needsInstallation?: boolean;
        } = await response.json();
        
        if (errorData.needsInstallation) {
          // GitHub App not installed
          handleAppInstallationNeeded();
          return false;
        }
        
        if (response.status === 401 || 
            response.status === 403 ||
            (errorData.code === 'GITHUB_AUTH_ERROR') ||
            (errorData.code === 'GITHUB_SCOPE_ERROR') ||
            (errorData.code === 'GITHUB_APP_CONFIG_ERROR') ||
            (errorData.error && (errorData.error.includes('authentication') || 
                               errorData.error.includes('scope') || 
                               errorData.error.includes('permissions')))) {
          // Auth error - token expired, invalid, or missing required scopes
          handleAuthError();
          return false;
        }
        
        throw new Error(errorData.error || 'Failed to fetch repositories');
      }
      
      const data: ReposResponse = await response.json();
      
      // Cache the repositories for future use with 1 hour TTL
      if (data.repositories && data.repositories.length > 0) {
        setCacheItem(cacheKey, data.repositories, CLIENT_CACHE_TTL.LONG);
      }
      
      setRepositories(data.repositories);
      
      // Update auth method and installation ID if available
      if (data.authMethod) {
        setAuthMethod(data.authMethod);
        console.log('Using auth method:', data.authMethod);
      }
      
      if (data.installationId) {
        // Add to the installation IDs array if not already included
        setInstallationIds(prev => prev.includes(data.installationId!) ? prev : [...prev, data.installationId!]);
        console.log('Using GitHub App installation ID:', data.installationId);
        setNeedsInstallation(false); // Clear the installation needed flag
      }
      
      // Update installations list
      if (data.installations && data.installations.length > 0) {
        setInstallations(data.installations);
        console.log('Available installations:', data.installations.length);
        
        // Cache installations with a longer TTL
        setCacheItem('installations', data.installations, CLIENT_CACHE_TTL.LONG);
      }
      
      // Update current installations
      if (data.currentInstallation) {
        setCurrentInstallations(prev => {
          // Check if this installation is already in the array
          const exists = prev.some(inst => inst.id === data.currentInstallation!.id);
          
          if (!exists) {
            return [...prev, data.currentInstallation!];
          }
          return prev;
        });
        console.log('Current installation:', data.currentInstallation?.account?.login || 'unknown');
        
        // Cache current installations
        setCacheItem('currentInstallations', data.currentInstallations || [data.currentInstallation], CLIENT_CACHE_TTL.LONG);
      }
      
      setError(null); // Clear any previous errors
      return true;
    } catch (error: unknown) {
      console.error('Error fetching repositories:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repositories. Please try again.';
      setError(errorMessage);
      return false;
    } finally {
      if (!forceFetch) {
        setLoading(false);
      }
    }
  }, [handleAuthError, handleAppInstallationNeeded, setRepositories, setError, setLoading, setAuthMethod, setInstallationIds, setInstallations, setCurrentInstallations, session]);
  
  // Function to handle switching installations
  const switchInstallations = useCallback((installationIds: InstallationId[]) => {
    // Check if the installation selection has changed
    const currentIds = currentInstallations.map(inst => inst.id);
    const hasSelectionChanged = 
      installationIds.length !== currentIds.length || 
      installationIds.some(id => !currentIds.includes(id));
    
    if (hasSelectionChanged) {
      console.log('Switching to installation IDs:', installationIds);
      
      // Get the selected installations' account logins
      const selectedInstallations = installations.filter(inst => installationIds.includes(inst.id));
      
      // If no installations are selected, don't fetch anything
      if (installationIds.length === 0) {
        return;
      }
      
      // For now, we'll use the first selected installation ID for fetching
      // This will need to be updated in the API to support multiple installation IDs
      const primaryInstallationId = installationIds[0];
      
      fetchRepositories(primaryInstallationId).then(success => {
        // If we successfully switched, update the cache timestamp and organization filter
        if (success) {
          // Update last refresh timestamp
          localStorage.setItem('lastRepositoryRefresh', Date.now().toString());
          
          // Update the organization filter to include all selected installations' accounts
          if (selectedInstallations.length > 0) {
            // Update the activeFilters to include all newly selected installations' accounts
            setActiveFilters(prev => {
              const newOrgs = [...prev.organizations];
              
              // Add all selected installations' accounts to the organizations filter
              selectedInstallations.forEach(installation => {
                if (installation.account?.login && !newOrgs.includes(installation.account.login)) {
                  newOrgs.push(installation.account.login);
                }
              });
              
              return {
                ...prev,
                organizations: newOrgs
              };
            });
          }
          
          // Update the current installations
          setCurrentInstallations(selectedInstallations);
          
          // Update the installation IDs state
          setInstallationIds(installationIds);
        }
      });
    }
  }, [currentInstallations, fetchRepositories, installations, setActiveFilters]);
  
  // Function to check whether repositories need to be refreshed
  const shouldRefreshRepositories = useCallback(() => {
    // Don't refresh if we have no session
    if (!session?.accessToken) return false;
    
    // Check if we have cached repository data
    const cacheKey = `repos:${session.user?.email || 'user'}`;
    
    // Get stale data if available - stale data is invalid but usable while we refresh
    const { data: cachedData, isStale } = getStaleItem<Repository[]>(cacheKey);
    
    // If we have cached data but it's stale, allow a refresh
    if (cachedData && isStale) {
      return true;
    }
    
    // If we have valid cached data, don't refresh
    if (cachedData) {
      return false;
    }
    
    // If we have no cached data but have repositories in state, use legacy check
    if (repositories.length > 0) {
      const lastRefreshTime = localStorage.getItem('lastRepositoryRefresh');
      if (lastRefreshTime) {
        // Use longer TTL for repository data
        const timeSinceLastRefresh = Date.now() - parseInt(lastRefreshTime, 10);
        return timeSinceLastRefresh > STORAGE_REFRESH.REPOSITORY_REFRESH_INTERVAL;
      }
    }
    
    // No cache, no repositories - must refresh
    return true;
  }, [session, repositories.length]);
  
  // Function to check for installation changes when focus returns to the window
  // This helps refresh the UI when a user uninstalls the app via the GitHub settings page
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if needed
      if (shouldRefreshRepositories()) {
        console.log('Window focused, refreshing repositories (due to cache expiration)');
        // Save current selections
        const currentOrgSelections = activeFilters.organizations;
        // After fetching, we'll sync the filter state with current selections
        fetchRepositories().then((success) => {
          // Update the last refresh time
          if (success) {
            localStorage.setItem('lastRepositoryRefresh', Date.now().toString());
            
            // If we had organizations selected in filters, preserve those selections
            if (currentOrgSelections.length > 0) {
              setActiveFilters(prev => ({
                ...prev,
                organizations: currentOrgSelections
              }));
            }
          }
        });
      } else {
        console.log('Window focused, skipping repository refresh (recently fetched)');
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [session, fetchRepositories, activeFilters.organizations, setActiveFilters, shouldRefreshRepositories]);
  
  // No need for redirect here - the layout handles authentication protection

  // Fetch repositories when session is available and check for installation cookie
  useEffect(() => {
    if (session) {
      // Check for GitHub installation cookie
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      const installCookie = getCookie('github_installation_id');
      
      if (installCookie) {
        console.log('Found GitHub installation cookie:', installCookie);
        // Parse the installation ID from cookie and use it
        const installationId: InstallationId = parseInt(installCookie, 10);
        if (!isNaN(installationId)) {
          fetchRepositories(installationId).then(success => {
            if (success) {
              localStorage.setItem('lastRepositoryRefresh', Date.now().toString());
            }
          });
          // Clear the cookie after using it
          document.cookie = 'github_installation_id=; path=/; max-age=0; samesite=lax';
          return;
        }
      }
      
      // No installation cookie found, proceed with normal fetch
      fetchRepositories().then(success => {
        if (success) {
          localStorage.setItem('lastRepositoryRefresh', Date.now().toString());
        }
      });
    }
  }, [session, fetchRepositories]);

  // Set contributors filter to current user only for 'my-activity' mode
  useEffect(() => {
    setActiveFilters(prev => ({
      ...prev,
      contributors: ['me'], // Set to current user only
      organizations: [] // Clear organization filter
    }));
  }, []);
  
  // Function to handle date range changes
  const handleDateRangeChange = useCallback((newDateRange: DateRange) => {
    setDateRange(newDateRange);
  }, []);
  
  // Organization selection handling removed as part of MVP focus
  
  // Function to handle legacy filter changes (for backward compatibility)
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setActiveFilters(newFilters);
    console.log('Filters updated:', newFilters);
  }, []);
  
  // Removed toggleGroupExpanded function - no longer needed with chronological view only

  async function generateSummary(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSummary(null);
      
      // Construct query parameters
      const params = new URLSearchParams({
        since: dateRange.since,
        until: dateRange.until,
      });
      
      // Add installation IDs if available
      if (installationIds.length > 0) {
        params.append('installation_ids', installationIds.join(','));
      }
      
      // Add filter parameters
      if (activeFilters.contributors.length > 0) {
        params.append('contributors', activeFilters.contributors.join(','));
      }
      
      if (activeFilters.organizations.length > 0) {
        params.append('organizations', activeFilters.organizations.join(','));
      }
      
      if (activeFilters.repositories.length > 0) {
        params.append('repositories', activeFilters.repositories.join(','));
      }
      
      // Always use chronological view
      params.append('groupBy', 'chronological');

      const response: Response = await fetch(`/api/summary?${params.toString()}`);
      if (!response.ok) {
        const errorData: { 
          error?: string; 
          code?: string; 
          needsInstallation?: boolean;
        } = await response.json();
        
        // Check for installation needed error
        if (errorData.needsInstallation) {
          handleAppInstallationNeeded();
          return;
        }
        
        // Check for auth errors
        if (response.status === 401 || 
            response.status === 403 ||
            errorData.code === 'GITHUB_AUTH_ERROR' ||
            errorData.code === 'GITHUB_APP_CONFIG_ERROR') {
          handleAuthError();
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data: CommitSummary & {
        authMethod?: string;
        installationIds?: InstallationId[];
        installations?: Installation[];
        currentInstallations?: Installation[];
      } = await response.json();
      setSummary(data);
      
      // Update auth method and installation IDs if available
      if (data.authMethod) {
        setAuthMethod(data.authMethod);
      }
      
      if (data.installationIds && data.installationIds.length > 0) {
        setInstallationIds(data.installationIds);
        setNeedsInstallation(false); // Clear the installation needed flag
      }
      
      // Update installations list
      if (data.installations && data.installations.length > 0) {
        setInstallations(data.installations);
      }
      
      // Update current installations
      if (data.currentInstallations && data.currentInstallations.length > 0) {
        setCurrentInstallations(data.currentInstallations);
      }
    } catch (error: unknown) {
      console.error('Error generating summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Update initialLoad status after first fetch completes
  useEffect(() => {
    if (!loading && repositories.length > 0 && initialLoad) {
      setInitialLoad(false);
    }
  }, [loading, repositories, initialLoad]);

  // Show loading state during initial session loading or first data fetch
  if (status === 'loading' || initialLoad) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--gradient-bg)' }}>
      <DashboardHeader session={session} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Operations Panel */}
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

            <AuthenticationStatusBanner
              error={error}
              authMethod={authMethod}
              needsInstallation={needsInstallation}
              getGitHubAppInstallUrl={getGitHubAppInstallUrl}
              handleAuthError={handleAuthError}
              signOutCallback={signOut}
            />
            
            {/* Consolidated Account Selection Panel */}
            {authMethod === AUTH_METHODS.GITHUB_APP && installations.length > 0 && (
              <AccountManagementPanel
                authMethod={authMethod}
                installations={installations}
                currentInstallations={currentInstallations}
                loading={loading}
                getGitHubAppInstallUrl={getGitHubAppInstallUrl}
                getInstallationManagementUrl={getInstallationManagementUrl}
                switchInstallations={switchInstallations}
                session={session}
              />
            )}
            
            {/* Improved Filters Container */}
            <FilterControls
              activityMode={activityMode}
              dateRange={dateRange}
              activeFilters={activeFilters}
              installations={installations}
              loading={loading}
              handleDateRangeChange={handleDateRangeChange}
              session={session}
            />

            {/* Wrap the entire content below in a form */}
            <form onSubmit={generateSummary} className="space-y-8">
              {/* Repository information panel with cyber styling */}
              <RepositoryInfoPanel
                repositories={repositories}
                showRepoList={showRepoList}
                loading={loading}
                activeFilters={activeFilters}
                setShowRepoList={setShowRepoList}
              />

              {/* Command buttons area */}
              <ActionButton loading={loading} />
            </form>
          </div>

          <SummaryDisplay 
            summary={summary}
            activityMode={activityMode}
            dateRange={dateRange}
            activeFilters={activeFilters}
            installationIds={installationIds}
          />
        </div>
      </main>
    </div>
  );
}
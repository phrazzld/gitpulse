/**
 * Custom hook for fetching and managing GitHub repositories
 */

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Repository } from '@/types/dashboard';
import { 
  setCacheItem, 
  getStaleItem,
  ClientCacheTTL
} from '@/lib/localStorageCache';

interface ReposResponse {
  readonly repositories: readonly Repository[];
  readonly authMethod?: string;
  readonly installationId?: number;
  readonly installationIds?: readonly number[];
  readonly installations?: readonly {
    readonly id: number;
    readonly account: {
      readonly login: string;
      readonly type?: string;
      readonly avatarUrl?: string;
    };
    readonly appSlug: string;
    readonly appId: number;
    readonly repositorySelection: string;
    readonly targetType: string;
  }[];
  readonly currentInstallation?: {
    readonly id: number;
    readonly account: {
      readonly login: string;
      readonly type?: string;
      readonly avatarUrl?: string;
    };
    readonly appSlug: string;
    readonly appId: number;
    readonly repositorySelection: string;
    readonly targetType: string;
  } | null;
  readonly currentInstallations?: readonly {
    readonly id: number;
    readonly account: {
      readonly login: string;
      readonly type?: string;
      readonly avatarUrl?: string;
    };
    readonly appSlug: string;
    readonly appId: number;
    readonly repositorySelection: string;
    readonly targetType: string;
  }[];
}

interface FetchOptions {
  readonly forceFetch?: boolean;
}

/**
 * Custom hook for fetching and managing GitHub repositories
 * 
 * @returns An object containing repositories, loading state, error state, 
 *          installation needed flag, and fetch function
 */
export function useRepositories() {
  const { data: session } = useSession();
  const [repositories, setRepositories] = useState<Repository[] | readonly Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsInstallation, setNeedsInstallation] = useState(false);

  /**
   * Handle GitHub authentication errors
   */
  const handleAuthError = useCallback(() => {
    console.log('GitHub authentication issue detected.');
    setError('GitHub authentication issue detected. Your token may be invalid, expired, or missing required permissions. Please sign out and sign in again to grant all necessary permissions.');
  }, []);

  /**
   * Handle GitHub App installation needed errors
   */
  const handleAppInstallationNeeded = useCallback(() => {
    console.log('GitHub App installation needed.');
    setNeedsInstallation(true);
    setError('GitHub App installation required. Please install the GitHub App to access all your repositories, including private ones.');
  }, []);

  /**
   * Fetch repositories from the API
   * 
   * @param selectedInstallationId - Optional installation ID to filter repositories
   * @param options - Additional fetch options
   * @returns Promise that resolves to true if fetch was successful, false otherwise
   */
  const fetchRepositories = useCallback(async (
    selectedInstallationId?: number,
    options: FetchOptions = {}
  ): Promise<boolean> => {
    // Create a consistent cache key
    const cacheKey = `repos:${session?.user?.email || 'user'}`;
    let forceFetch = options.forceFetch || false;
    
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
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Parse the error response
        const errorData = await response.json();
        
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
        setCacheItem(cacheKey, data.repositories, ClientCacheTTL.LONG);
      }
      
      setRepositories(data.repositories);
      
      // If we successfully fetched repositories, clear any previous errors and installation needed flag
      setError(null);
      setNeedsInstallation(false);
      
      return true;
    } catch (error) {
      console.error('Error fetching repositories:', error);
      setError('Failed to fetch repositories. Please try again.');
      return false;
    } finally {
      if (!forceFetch) {
        setLoading(false);
      }
    }
  }, [
    session, 
    handleAuthError, 
    handleAppInstallationNeeded
  ]);

  return {
    repositories,
    loading,
    error,
    needsInstallation,
    fetchRepositories
  };
}
import { useState, useEffect, useCallback } from "react";
import { CommitSummary } from "@/types/summary";
import { Repository, Installation } from "@/types/github";
import { DashboardFilterState } from "@/types/dashboard";
import { CLIENT_CACHE_TTL, STORAGE_REFRESH } from "@/lib/constants";
import { setCacheItem, getStaleItem } from "@/lib/localStorageCache";

// Type definitions for Dashboard component state
type InstallationId = number;

// Type for date range state
interface DateRangeState {
  since: string;
  until: string;
}

// Type for API response
type ReposResponse = {
  repositories: Repository[];
  authMethod?: string;
  installationId?: InstallationId | null;
  installationIds?: InstallationId[];
  installations?: Installation[];
  currentInstallation?: Installation | null;
  currentInstallations?: Installation[];
  error?: string;
  code?: string;
  needsInstallation?: boolean;
};

/**
 * Hook to initialize and manage dashboard state
 */
export function useDashboardState(
  getLastWeekDate: () => string,
  getTodayDate: () => string,
) {
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
  const [currentInstallations, setCurrentInstallations] = useState<
    Installation[]
  >([]);

  // UI state for panels
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);

  // State for filters - simplified for individual focus
  const [activeFilters, setActiveFilters] = useState<DashboardFilterState>({
    repositories: [],
  });

  return {
    repositories,
    setRepositories,
    loading,
    setLoading,
    initialLoad,
    setInitialLoad,
    dateRange,
    setDateRange,
    summary,
    setSummary,
    error,
    setError,
    showRepoList,
    setShowRepoList,
    authMethod,
    setAuthMethod,
    needsInstallation,
    setNeedsInstallation,
    installationIds,
    setInstallationIds,
    installations,
    setInstallations,
    currentInstallations,
    setCurrentInstallations,
    expandedPanels,
    setExpandedPanels,
    activeFilters,
    setActiveFilters,
  };
}

/**
 * Hook to handle repository fetching logic
 */
export function useRepositoryFetching(
  session: {
    user?: { email?: string };
    accessToken?: string;
  } | null,
  repositories: Repository[],
  setRepositories: (repos: Repository[]) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setAuthMethod: (method: string | null) => void,
  setInstallationIds: (ids: InstallationId[]) => void,
  setInstallations: (installations: Installation[]) => void,
  setCurrentInstallations: (installations: Installation[]) => void,
  setNeedsInstallation: (needsInstallation: boolean) => void,
  handleAuthError: () => void,
  handleAppInstallationNeeded: () => void,
) {
  // Function to fetch repositories
  const fetchRepositories = useCallback(
    async (selectedInstallationId?: InstallationId) => {
      // Create a consistent cache key
      const cacheKey = `repos:${session?.user?.email || "user"}`;
      let forceFetch = false;

      // If we already have repositories from a previous session, maintain them while fetching fresh data
      if (!forceFetch && !selectedInstallationId) {
        // Check for cached data using stale-while-revalidate approach
        const { data: cachedRepos, isStale } =
          getStaleItem<Repository[]>(cacheKey);

        // If we have cached data, use it immediately
        if (cachedRepos && cachedRepos.length > 0) {
          setRepositories(cachedRepos);
          console.log("Using cached repositories:", cachedRepos.length);

          // If data is fresh enough, don't fetch
          if (!isStale) {
            console.log("Cache is fresh, skipping fetch");
            return true;
          }

          // If data is stale, continue with fetch in background but don't show loading state
          console.log("Cache is stale, fetching in background");
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
          : "/api/repos";

        const response: Response = await fetch(url);

        if (!response.ok) {
          return await handleRepositoryFetchError(
            response,
            handleAuthError,
            handleAppInstallationNeeded,
          );
        }

        const data: ReposResponse = await response.json();

        // Handle successful fetch
        return handleRepositoryFetchSuccess(
          data,
          cacheKey,
          setRepositories,
          setAuthMethod,
          setInstallationIds,
          setNeedsInstallation,
          setInstallations,
          setCurrentInstallations,
          setError,
        );
      } catch (error: unknown) {
        console.error("Error fetching repositories:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch repositories. Please try again.";
        setError(errorMessage);
        return false;
      } finally {
        if (!forceFetch) {
          setLoading(false);
        }
      }
    },
    [
      session,
      setRepositories,
      setLoading,
      setError,
      setAuthMethod,
      setInstallationIds,
      setInstallations,
      setCurrentInstallations,
      setNeedsInstallation,
      handleAuthError,
      handleAppInstallationNeeded,
    ],
  );

  // Function to check whether repositories need to be refreshed
  const shouldRefreshRepositories = useCallback(() => {
    // Don't refresh if we have no session
    if (!session?.accessToken) return false;

    // Check if we have cached repository data
    const cacheKey = `repos:${session.user?.email || "user"}`;

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
      const lastRefreshTime = localStorage.getItem("lastRepositoryRefresh");
      if (lastRefreshTime) {
        // Use longer TTL for repository data
        const timeSinceLastRefresh = Date.now() - parseInt(lastRefreshTime, 10);
        return (
          timeSinceLastRefresh > STORAGE_REFRESH.REPOSITORY_REFRESH_INTERVAL
        );
      }
    }

    // No cache, no repositories - must refresh
    return true;
  }, [session, repositories.length]);

  return { fetchRepositories, shouldRefreshRepositories };
}

/**
 * Hook for refreshing data when window gets focus
 */
export function useWindowFocusRefresh(
  session: {
    accessToken?: string;
  } | null,
  fetchRepositories: () => Promise<boolean>,
  shouldRefreshRepositories: () => boolean,
) {
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if needed
      if (shouldRefreshRepositories()) {
        console.log(
          "Window focused, refreshing repositories (due to cache expiration)",
        );
        fetchRepositories().then((success) => {
          // Update the last refresh time
          if (success) {
            localStorage.setItem(
              "lastRepositoryRefresh",
              Date.now().toString(),
            );
          }
        });
      } else {
        console.log(
          "Window focused, skipping repository refresh (recently fetched)",
        );
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [session, fetchRepositories, shouldRefreshRepositories]);
}

/**
 * Hook for generating activity summary
 */
export function useSummaryGeneration(
  dateRange: DateRangeState,
  installationIds: InstallationId[],
  activeFilters: DashboardFilterState,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setSummary: (summary: CommitSummary | null) => void,
  setAuthMethod: (method: string | null) => void,
  setInstallationIds: (ids: InstallationId[]) => void,
  setInstallations: (installations: Installation[]) => void,
  setCurrentInstallations: (installations: Installation[]) => void,
  setNeedsInstallation: (needsInstallation: boolean) => void,
  handleAuthError: () => void,
  handleAppInstallationNeeded: () => void,
) {
  const generateSummary = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setLoading(true);
        setError(null);
        setSummary(null);

        const params = buildSummaryQueryParams(
          dateRange,
          installationIds,
          activeFilters,
        );
        const response: Response = await fetch(
          `/api/summary?${params.toString()}`,
        );

        if (!response.ok) {
          const errorData = await response.json();

          // Check for installation needed error
          if (errorData.needsInstallation) {
            handleAppInstallationNeeded();
            return;
          }

          // Check for auth errors
          if (
            response.status === 401 ||
            response.status === 403 ||
            errorData.code === "GITHUB_AUTH_ERROR" ||
            errorData.code === "GITHUB_APP_CONFIG_ERROR"
          ) {
            handleAuthError();
            return;
          }

          throw new Error(errorData.error || "Failed to generate summary");
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
        console.error("Error generating summary:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to generate summary. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [
      dateRange,
      installationIds,
      activeFilters,
      setLoading,
      setError,
      setSummary,
      setAuthMethod,
      setInstallationIds,
      setInstallations,
      setCurrentInstallations,
      setNeedsInstallation,
      handleAuthError,
      handleAppInstallationNeeded,
    ],
  );

  return { generateSummary };
}

// Helper function to build query parameters for summary API
function buildSummaryQueryParams(
  dateRange: DateRangeState,
  installationIds: InstallationId[],
  activeFilters: DashboardFilterState,
): URLSearchParams {
  // Construct query parameters
  const params = new URLSearchParams({
    since: dateRange.since,
    until: dateRange.until,
  });

  // Add installation IDs if available
  if (installationIds.length > 0) {
    params.append("installation_ids", installationIds.join(","));
  }

  // Add filter parameters
  if (activeFilters.repositories.length > 0) {
    params.append("repositories", activeFilters.repositories.join(","));
  }

  // Always use chronological view
  params.append("groupBy", "chronological");

  return params;
}

/**
 * Hook for calculating activity metrics
 */
export function useActivityMetrics(
  summary: CommitSummary | null,
  repositories: Repository[],
) {
  return {
    commits: getCommitCount(summary),
    repositories: getRepositoryCount(summary, repositories),
    activeDays: getActiveDaysCount(summary),
  };
}

// Helper functions for activity metrics calculation
function getCommitCount(summary: CommitSummary | null): number {
  if (!summary || !summary.commits) {
    return 0;
  }
  return summary.commits.length;
}

function getRepositoryCount(
  summary: CommitSummary | null,
  repositories: Repository[],
): number {
  if (!summary || !summary.commits) {
    return repositories.length;
  }

  const repositoriesWithActivity = new Set();
  summary.commits.forEach((commit) => {
    // Cast to check for repository property (handle different commit types)
    const commitWithRepo = commit as { repository?: { id: string } };
    if (commitWithRepo.repository) {
      repositoriesWithActivity.add(commitWithRepo.repository.id);
    }
  });

  return repositoriesWithActivity.size || repositories.length;
}

function getActiveDaysCount(summary: CommitSummary | null): number {
  if (!summary || !summary.stats || !summary.stats.dates) {
    return 0;
  }

  // Get unique active days from the stats
  const uniqueDays = new Set();
  summary.stats.dates.forEach((day) => {
    uniqueDays.add(day);
  });

  return uniqueDays.size;
}

// Helper functions for repository fetch
async function handleRepositoryFetchError(
  response: Response,
  handleAuthError: () => void,
  handleAppInstallationNeeded: () => void,
): Promise<boolean> {
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

  if (
    response.status === 401 ||
    response.status === 403 ||
    errorData.code === "GITHUB_AUTH_ERROR" ||
    errorData.code === "GITHUB_SCOPE_ERROR" ||
    errorData.code === "GITHUB_APP_CONFIG_ERROR" ||
    (errorData.error &&
      (errorData.error.includes("authentication") ||
        errorData.error.includes("scope") ||
        errorData.error.includes("permissions")))
  ) {
    // Auth error - token expired, invalid, or missing required scopes
    handleAuthError();
    return false;
  }

  throw new Error(errorData.error || "Failed to fetch repositories");
}

function handleRepositoryFetchSuccess(
  data: ReposResponse,
  cacheKey: string,
  setRepositories: (repos: Repository[]) => void,
  setAuthMethod: (method: string | null) => void,
  setInstallationIds: (ids: InstallationId[]) => void,
  setNeedsInstallation: (needsInstallation: boolean) => void,
  setInstallations: (installations: Installation[]) => void,
  setCurrentInstallations: (installations: Installation[]) => void,
  setError: (error: string | null) => void,
): boolean {
  // Cache the repositories for future use with 1 hour TTL
  if (data.repositories && data.repositories.length > 0) {
    setCacheItem(cacheKey, data.repositories, CLIENT_CACHE_TTL.LONG);
  }

  setRepositories(data.repositories);

  // Update auth method and installation ID if available
  if (data.authMethod) {
    setAuthMethod(data.authMethod);
    console.log("Using auth method:", data.authMethod);
  }

  if (data.installationId) {
    // Add to the installation IDs array if not already included
    const idToAdd = data.installationId;
    // Update installation IDs directly
    if (data.installationIds) {
      setInstallationIds(data.installationIds);
    } else if (data.installationId) {
      // Create a new array with the single installation ID
      setInstallationIds([data.installationId]);
    }
    console.log("Using GitHub App installation ID:", data.installationId);
    setNeedsInstallation(false); // Clear the installation needed flag
  }

  // Update installations list
  if (data.installations && data.installations.length > 0) {
    setInstallations(data.installations);
    console.log("Available installations:", data.installations.length);

    // Cache installations with a longer TTL
    setCacheItem("installations", data.installations, CLIENT_CACHE_TTL.LONG);
  }

  // Update current installations
  if (data.currentInstallation) {
    // Update current installations directly
    if (data.currentInstallations && data.currentInstallations.length > 0) {
      // If we have a full list, use it directly
      setCurrentInstallations(data.currentInstallations);
    } else if (data.currentInstallation) {
      // Otherwise, set a single installation
      setCurrentInstallations([data.currentInstallation]);
    }

    console.log(
      "Current installation:",
      data.currentInstallation?.account?.login || "unknown",
    );

    // Cache current installations
    setCacheItem(
      "currentInstallations",
      data.currentInstallations || [data.currentInstallation],
      CLIENT_CACHE_TTL.LONG,
    );
  }

  setError(null); // Clear any previous errors
  return true;
}

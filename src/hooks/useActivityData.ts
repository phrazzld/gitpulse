import { useCallback, useEffect } from "react";
import { useProgressiveLoading } from "@/hooks/useProgressiveLoading";
import { createActivityFetcher } from "@/lib/activity";
import {
  ActivityMode,
  ActivityDateRange,
  ActivityCommit,
} from "@/types/activity";
import { DashboardFilterState } from "@/types/dashboard";

interface UseActivityDataOptions {
  initialLimit?: number;
  additionalItemsPerPage?: number;
  infiniteScroll?: boolean;
  maxItems?: number;
}

interface UseActivityDataProps {
  dateRange: ActivityDateRange;
  filters?: DashboardFilterState;
  installationIds?: number[];
  mode?: ActivityMode;
}

/**
 * Custom hook for loading and managing activity data
 *
 * Provides a clean interface for fetching, paging, and managing GitHub activity data
 * while encapsulating the implementation details of API requests and state management
 *
 * @param props - Props needed for data fetching (dateRange, filters, etc.)
 * @param options - Configuration options for data loading behavior
 * @returns Data, loading state, and methods for managing activity data
 */
export function useActivityData(
  {
    dateRange,
    filters = { repositories: [] },
    installationIds = [],
    mode = "my-activity",
  }: UseActivityDataProps,
  options: UseActivityDataOptions = {},
) {
  const {
    initialLimit = 25,
    additionalItemsPerPage = 20,
    infiniteScroll = true,
    maxItems,
  } = options;

  // Create the activity data loader function
  const loadCommits = useCallback(
    (cursor: string | null, limit: number) => {
      // Build parameters for API request
      const params: Record<string, string> = {
        since: dateRange.since,
        until: dateRange.until,
      };

      // Add repository filters if selected
      if (filters.repositories.length > 0) {
        params.repositories = filters.repositories.join(",");
      }

      // Add installation IDs if available
      if (installationIds.length > 0) {
        params.installation_ids = installationIds.join(",");
      }

      // Set API endpoint based on activity mode
      const apiEndpoint = `/api/${mode === "my-activity" ? "my-activity" : "repos"}`;

      // Create and return the fetcher
      return createActivityFetcher(apiEndpoint, params)(cursor, limit);
    },
    [dateRange, filters, installationIds, mode],
  );

  // Set up progressive loading with the useProgressiveLoading hook
  const {
    items: commits,
    loading,
    initialLoading,
    incrementalLoading,
    hasMore,
    error,
    loadInitialData,
    loadMore,
    reset,
  } = useProgressiveLoading<ActivityCommit>(loadCommits, {
    initialLimit: maxItems || initialLimit,
    additionalItemsPerPage,
    infiniteScroll,
  });

  // Load initial data when dependencies change
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, filters, installationIds, mode]);

  // Reset effect - runs on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    commits,
    loading,
    initialLoading,
    incrementalLoading,
    hasMore,
    error,
    errorDetails: null, // We don't have access to the internal state of useProgressiveLoading
    loadInitialData,
    loadMore,
    reset,
  };
}

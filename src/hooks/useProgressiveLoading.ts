import { useState, useCallback, useRef } from "react";

export type ProgressiveLoadingOptions = {
  initialLimit?: number;
  additionalItemsPerPage?: number;
  infiniteScroll?: boolean;
};

export type ProgressiveLoadingState<T> = {
  items: T[];
  loading: boolean;
  initialLoading: boolean;
  incrementalLoading: boolean;
  hasMore: boolean;
  error: string | null;
};

type FetchFunction<T> = (
  cursor: string | null,
  limit: number,
) => Promise<{
  data: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}>;

/**
 * Custom hook for progressive data loading with pagination
 *
 * @param fetchFn - Function that fetches paginated data
 * @param options - Configuration options
 * @returns - State and methods for progressive loading
 */
export function useProgressiveLoading<T>(
  fetchFn: FetchFunction<T>,
  options: ProgressiveLoadingOptions = {},
) {
  const {
    initialLimit = 25,
    additionalItemsPerPage = 25,
    infiniteScroll = false,
  } = options;

  // State for loading data
  const [state, setState] = useState<ProgressiveLoadingState<T>>({
    items: [],
    loading: false,
    initialLoading: false,
    incrementalLoading: false,
    hasMore: true,
    error: null,
  });

  // Refs to track cursors and prevent duplicate requests
  const nextCursorRef = useRef<string | null>(null);
  const loadingRef = useRef<boolean>(false);

  // Initial data loading
  const loadInitialData = useCallback(async () => {
    if (loadingRef.current) return;

    // Update loading state
    setLoadingState(setState, true, true, false);
    loadingRef.current = true;

    try {
      const result = await fetchInitialData(fetchFn, initialLimit);
      updateStateWithData(setState, result);
      nextCursorRef.current = result.nextCursor || null;
    } catch (error) {
      handleLoadError(setState, error);
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFn, initialLimit]);

  // Load more data
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.hasMore) return;

    setLoadingState(setState, true, false, true);
    loadingRef.current = true;

    try {
      const result = await fetchMoreData(
        fetchFn,
        nextCursorRef.current,
        additionalItemsPerPage,
      );
      appendDataToState(setState, result);
      nextCursorRef.current = result.nextCursor || null;
    } catch (error) {
      handleLoadError(setState, error);
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFn, additionalItemsPerPage, state.hasMore]);

  // Reset all state
  const reset = useCallback(() => {
    resetState(setState);
    nextCursorRef.current = null;
    loadingRef.current = false;
  }, []);

  return {
    ...state,
    loadInitialData,
    loadMore,
    reset,
  };
}

// Helper functions for loading state management
function setLoadingState<T>(
  setState: React.Dispatch<React.SetStateAction<ProgressiveLoadingState<T>>>,
  loading: boolean,
  initialLoading: boolean,
  incrementalLoading: boolean,
) {
  setState((prev) => ({
    ...prev,
    loading,
    initialLoading,
    incrementalLoading,
    error: null,
  }));
}

// Helper function for initial data fetch
async function fetchInitialData<T>(
  fetchFn: FetchFunction<T>,
  initialLimit: number,
) {
  return await fetchFn(null, initialLimit);
}

// Helper function for fetching more data
async function fetchMoreData<T>(
  fetchFn: FetchFunction<T>,
  cursor: string | null,
  itemsPerPage: number,
) {
  return await fetchFn(cursor, itemsPerPage);
}

// Helper function to update state with fetched data
function updateStateWithData<T>(
  setState: React.Dispatch<React.SetStateAction<ProgressiveLoadingState<T>>>,
  result: { data: T[]; nextCursor?: string | null; hasMore: boolean },
) {
  setState({
    items: result.data,
    loading: false,
    initialLoading: false,
    incrementalLoading: false,
    hasMore: result.hasMore,
    error: null,
  });
}

// Helper function to append more data to existing state
function appendDataToState<T>(
  setState: React.Dispatch<React.SetStateAction<ProgressiveLoadingState<T>>>,
  result: { data: T[]; nextCursor?: string | null; hasMore: boolean },
) {
  setState((prev) => ({
    items: [...prev.items, ...result.data],
    loading: false,
    initialLoading: false,
    incrementalLoading: false,
    hasMore: result.hasMore,
    error: null,
  }));
}

// Helper function for handling load errors
function handleLoadError<T>(
  setState: React.Dispatch<React.SetStateAction<ProgressiveLoadingState<T>>>,
  error: unknown,
) {
  setState((prev) => ({
    ...prev,
    loading: false,
    initialLoading: false,
    incrementalLoading: false,
    error: error instanceof Error ? error.message : "An error occurred",
  }));
}

// Helper function to reset state
function resetState<T>(
  setState: React.Dispatch<React.SetStateAction<ProgressiveLoadingState<T>>>,
) {
  setState({
    items: [],
    loading: false,
    initialLoading: false,
    incrementalLoading: false,
    hasMore: true,
    error: null,
  });
}

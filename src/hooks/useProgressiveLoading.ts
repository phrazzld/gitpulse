import { useState, useCallback, useRef, useEffect } from 'react';

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
  limit: number
) => Promise<{
  data: T[];
  nextCursor?: string | null;
  hasMore: boolean;
}>;

/**
 * Helper function to safely extract error messages from various error types
 */
function getErrorMessage(error: unknown): string {
  // Default error message if we can't extract a specific one
  let errorMessage = 'An error occurred while loading data';
  
  if (error instanceof Error) {
    // Standard Error objects
    errorMessage = error.message || errorMessage;
  } else if (error && typeof error === 'object' && 'message' in error) {
    // Objects with a message property
    const errObj = error as { message?: string };
    if (errObj.message && typeof errObj.message === 'string') {
      errorMessage = errObj.message;
    }
  } else if (typeof error === 'string') {
    // String errors
    errorMessage = error;
  }
  
  return errorMessage;
}

/**
 * Custom hook for progressive data loading with pagination
 * 
 * @param fetchFn - Function that fetches paginated data
 * @param options - Configuration options
 * @returns - State and methods for progressive loading
 */
export function useProgressiveLoading<T>(
  fetchFn: FetchFunction<T>,
  options: ProgressiveLoadingOptions = {}
) {
  const {
    initialLimit = 25,
    additionalItemsPerPage = 25,
    infiniteScroll = false
  } = options;

  // State for loading data
  const [state, setState] = useState<ProgressiveLoadingState<T>>({
    items: [],
    loading: false,
    initialLoading: false,
    incrementalLoading: false,
    hasMore: true,
    error: null
  });

  // Refs to track cursors and prevent duplicate requests
  const nextCursorRef = useRef<string | null>(null);
  const loadingRef = useRef<boolean>(false);

  // Initial data loading
  const loadInitialData = useCallback(async () => {
    if (loadingRef.current) return;
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      initialLoading: true, 
      incrementalLoading: false, 
      error: null 
    }));
    loadingRef.current = true;
    
    try {
      const { data, nextCursor, hasMore } = await fetchFn(null, initialLimit);
      
      setState({
        items: data,
        loading: false,
        initialLoading: false,
        incrementalLoading: false,
        hasMore,
        error: null
      });
      
      nextCursorRef.current = nextCursor || null;
    } catch (error) {
      // Enhanced error handling with proper message extraction
      const errorMessage = getErrorMessage(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        initialLoading: false,
        incrementalLoading: false,
        error: errorMessage
      }));
      
      // Log the error for debugging
      console.error('Error in loadInitialData:', error);
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFn, initialLimit]);

  // Load more data
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.hasMore) return;
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      initialLoading: false,
      incrementalLoading: true,
      error: null 
    }));
    loadingRef.current = true;
    
    try {
      const { data, nextCursor, hasMore } = await fetchFn(
        nextCursorRef.current,
        additionalItemsPerPage
      );
      
      setState(prev => ({
        items: [...prev.items, ...data],
        loading: false,
        initialLoading: false,
        incrementalLoading: false,
        hasMore,
        error: null
      }));
      
      nextCursorRef.current = nextCursor || null;
    } catch (error) {
      // Enhanced error handling with proper message extraction
      const errorMessage = getErrorMessage(error);
      
      setState(prev => ({
        ...prev,
        loading: false,
        initialLoading: false,
        incrementalLoading: false,
        error: errorMessage
      }));
      
      // Log the error for debugging
      console.error('Error in loadMore:', error);
    } finally {
      loadingRef.current = false;
    }
  }, [fetchFn, additionalItemsPerPage, state.hasMore]);

  // Reset all state
  const reset = useCallback(() => {
    setState({
      items: [],
      loading: false,
      initialLoading: false,
      incrementalLoading: false,
      hasMore: true,
      error: null
    });
    nextCursorRef.current = null;
    loadingRef.current = false;
  }, []);

  return {
    ...state,
    loadInitialData,
    loadMore,
    reset
  };
}
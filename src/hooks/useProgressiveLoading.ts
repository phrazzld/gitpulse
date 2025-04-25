import { useState, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'

const MODULE_NAME = 'hooks:useProgressiveLoading'

export type ProgressiveLoadingOptions = {
  initialLimit?: number
  additionalItemsPerPage?: number
  infiniteScroll?: boolean
}

export type ProgressiveLoadingState<T> = {
  items: T[]
  loading: boolean
  initialLoading: boolean
  incrementalLoading: boolean
  hasMore: boolean
  error: string | null
}

type FetchFunction<T> = (
  cursor: string | null,
  limit: number
) => Promise<{
  data: T[]
  nextCursor?: string | null
  hasMore: boolean
}>

/**
 * Helper function to safely extract error messages from various error types
 *
 * This function is designed to handle all possible error formats and always return
 * a safe, user-friendly string message without ever throwing an exception itself.
 *
 * @param error - Any error object or value that might be thrown
 * @param fallback - Optional custom fallback message
 * @returns - A safe string error message
 */
function getErrorMessage(
  error: unknown,
  fallback: string = 'An error occurred while loading data'
): string {
  // Handle null and undefined
  if (error === null || error === undefined) {
    return fallback
  }

  try {
    // Standard Error objects
    if (error instanceof Error) {
      return error.message || fallback
    }

    // String errors
    if (typeof error === 'string') {
      return error.trim() || fallback
    }

    // Objects with a message property
    if (error && typeof error === 'object') {
      // Try to extract message property
      if ('message' in error) {
        const errObj = error as { message?: unknown }
        if (errObj.message && typeof errObj.message === 'string') {
          return errObj.message.trim() || fallback
        }
      }

      // Try to extract error property (which might contain the actual error)
      if ('error' in error) {
        const errObj = error as { error?: unknown }
        if (errObj.error) {
          // If error is a string, use it
          if (typeof errObj.error === 'string') {
            return errObj.error.trim() || fallback
          }

          // If error is an object with a message, use that
          if (typeof errObj.error === 'object' && errObj.error && 'message' in errObj.error) {
            const nestedErr = errObj.error as { message?: unknown }
            if (nestedErr.message && typeof nestedErr.message === 'string') {
              return nestedErr.message.trim() || fallback
            }
          }
        }
      }

      // Try to serialize the object as a last resort
      try {
        const serialized = JSON.stringify(error)
        if (serialized && serialized !== '{}' && serialized !== '[]') {
          // Only use serialized if it's not an empty object/array
          if (serialized.length > 100) {
            // Truncate if too long
            return `Error: ${serialized.substring(0, 100)}...`
          }
          return `Error: ${serialized}`
        }
      } catch (jsonError) {
        // Cannot stringify (might be due to circular references)
        logger.warn(MODULE_NAME, 'Failed to stringify error object', { jsonError })
      }

      // If object has toString() method that's been customized, use it
      if (typeof error.toString === 'function') {
        const errorString = error.toString()
        if (errorString && errorString !== '[object Object]') {
          return errorString
        }
      }
    }

    // If we get here, we couldn't extract a meaningful message
    return fallback
  } catch (extractionError) {
    // If anything goes wrong in our error extraction, log it and return the fallback
    logger.error(MODULE_NAME, 'Error while extracting error message', { extractionError })
    return fallback
  }
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
  const { initialLimit = 25, additionalItemsPerPage = 25, infiniteScroll = false } = options

  // State for loading data
  const [state, setState] = useState<ProgressiveLoadingState<T>>({
    items: [],
    loading: false,
    initialLoading: false,
    incrementalLoading: false,
    hasMore: true,
    error: null,
  })

  // Refs to track cursors and prevent duplicate requests
  const nextCursorRef = useRef<string | null>(null)
  const loadingRef = useRef<boolean>(false)

  // Initial data loading
  const loadInitialData = useCallback(async () => {
    if (loadingRef.current) return

    setState(prev => ({
      ...prev,
      loading: true,
      initialLoading: true,
      incrementalLoading: false,
      error: null,
    }))
    loadingRef.current = true

    try {
      logger.debug(MODULE_NAME, 'Starting initial data load', { initialLimit })

      const { data, nextCursor, hasMore } = await fetchFn(null, initialLimit)

      logger.debug(MODULE_NAME, 'Initial data loaded successfully', {
        itemCount: data.length,
        hasMore,
        hasNextCursor: !!nextCursor,
      })

      setState({
        items: data,
        loading: false,
        initialLoading: false,
        incrementalLoading: false,
        hasMore,
        error: null,
      })

      nextCursorRef.current = nextCursor || null
    } catch (error) {
      // Enhanced error handling with proper message extraction
      const errorMessage = getErrorMessage(error)

      // Log the error with full context
      logger.error(MODULE_NAME, 'Failed to load initial data', {
        error,
        errorMessage,
        errorType: error instanceof Error ? 'Error' : typeof error,
        initialLimit,
      })

      setState(prev => ({
        ...prev,
        loading: false,
        initialLoading: false,
        incrementalLoading: false,
        error: errorMessage,
      }))
    } finally {
      loadingRef.current = false
    }
  }, [fetchFn, initialLimit])

  // Load more data
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !state.hasMore) return

    setState(prev => ({
      ...prev,
      loading: true,
      initialLoading: false,
      incrementalLoading: true,
      error: null,
    }))
    loadingRef.current = true

    try {
      logger.debug(MODULE_NAME, 'Loading more data', {
        cursor: nextCursorRef.current,
        limit: additionalItemsPerPage,
        currentItemCount: state.items.length,
      })

      const { data, nextCursor, hasMore } = await fetchFn(
        nextCursorRef.current,
        additionalItemsPerPage
      )

      logger.debug(MODULE_NAME, 'Additional data loaded successfully', {
        newItemCount: data.length,
        totalItemCount: state.items.length + data.length,
        hasMore,
        hasNextCursor: !!nextCursor,
      })

      setState(prev => ({
        items: [...prev.items, ...data],
        loading: false,
        initialLoading: false,
        incrementalLoading: false,
        hasMore,
        error: null,
      }))

      nextCursorRef.current = nextCursor || null
    } catch (error) {
      // Enhanced error handling with proper message extraction
      const errorMessage = getErrorMessage(error)

      // Log the error with full context
      logger.error(MODULE_NAME, 'Failed to load more data', {
        error,
        errorMessage,
        errorType: error instanceof Error ? 'Error' : typeof error,
        cursor: nextCursorRef.current,
        additionalItemsPerPage,
        currentItemCount: state.items.length,
      })

      setState(prev => ({
        ...prev,
        loading: false,
        initialLoading: false,
        incrementalLoading: false,
        error: errorMessage,
      }))
    } finally {
      loadingRef.current = false
    }
  }, [fetchFn, additionalItemsPerPage, state.hasMore, state.items.length])

  // Reset all state
  const reset = useCallback(() => {
    logger.debug(MODULE_NAME, 'Resetting progressive loading state', {
      currentItemCount: state.items.length,
      hadError: !!state.error,
    })

    setState({
      items: [],
      loading: false,
      initialLoading: false,
      incrementalLoading: false,
      hasMore: true,
      error: null,
    })
    nextCursorRef.current = null
    loadingRef.current = false
  }, [state.items.length, state.error])

  return {
    ...state,
    loadInitialData,
    loadMore,
    reset,
  }
}

/**
 * Custom hook for handling initial data loading with proper dependency handling
 * to avoid ESLint react-hooks/exhaustive-deps warnings
 */

import { useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

type LoadFunctionType = () => Promise<void>;

interface UseLoadInitialDataOptions {
  initialLoad?: boolean;
  logModule?: string;
  additionalDependencies?: any[];
}

/**
 * Custom hook to properly handle initial data loading with correct dependencies
 * 
 * @param loadInitialData Function to load initial data
 * @param options Configuration options
 * @returns void
 */
export function useLoadInitialData(
  loadInitialData: LoadFunctionType, 
  options: UseLoadInitialDataOptions = {}
): void {
  const { 
    initialLoad = true, 
    logModule = 'useLoadInitialData',
    additionalDependencies = []
  } = options;

  // Use useCallback to properly memoize the load function with all its dependencies
  const handleInitialLoad = useCallback(() => {
    if (initialLoad) {
      logger.debug(logModule, 'Initial load triggered');
      
      loadInitialData()
        .catch(initialError => {
          logger.error(logModule, 'Error during initial data load', { initialError });
        });
    }
  }, [initialLoad, loadInitialData, logModule]);

  // Effect with proper dependencies
  // Key the effect on handleInitialLoad which already includes the necessary dependencies
  useEffect(() => {
    handleInitialLoad();
  }, [handleInitialLoad]); // handleInitialLoad already has the right dependencies
}
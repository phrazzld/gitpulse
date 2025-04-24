import { useState, useCallback } from 'react';
import { ActivityMode, FilterState } from '@/types/dashboard';
import { logger } from '@/lib/logger';

const MODULE_NAME = 'hooks:useFilters';

interface UseFiltersProps {
  /**
   * Initial filter state
   */
  initialFilters?: Partial<FilterState>;
  
  /**
   * Initial activity mode
   */
  initialMode?: ActivityMode;
}

interface UseFiltersResult {
  /**
   * Current filter state
   */
  filters: FilterState;
  
  /**
   * Current activity mode
   */
  activityMode: ActivityMode;
  
  /**
   * Update contributors filter
   */
  setContributors: (contributors: readonly string[]) => void;
  
  /**
   * Update organizations filter
   */
  setOrganizations: (organizations: readonly string[]) => void;
  
  /**
   * Update repositories filter
   */
  setRepositories: (repositories: readonly string[]) => void;
  
  /**
   * Update all filters at once
   */
  setAllFilters: (newFilters: FilterState) => void;
  
  /**
   * Update activity mode and adjust filters accordingly
   */
  setActivityMode: (mode: ActivityMode) => void;
  
  /**
   * Reset filters to initial state
   */
  resetFilters: () => void;
}

/**
 * Custom hook for managing dashboard filters
 * 
 * @param props - Configuration options
 * @returns Filters state and updater functions
 */
export function useFilters({
  initialFilters = {
    contributors: [],
    organizations: [],
    repositories: []
  },
  initialMode = 'my-activity'
}: UseFiltersProps = {}): UseFiltersResult {
  // Initialize state with defaults or provided values
  const [filters, setFilters] = useState<FilterState>({
    contributors: initialFilters.contributors || [],
    organizations: initialFilters.organizations || [],
    repositories: initialFilters.repositories || []
  });
  
  const [activityMode, setMode] = useState<ActivityMode>(initialMode);
  
  // Update contributors filter
  const setContributors = useCallback((contributors: readonly string[]) => {
    logger.debug(MODULE_NAME, 'Updating contributors filter', { contributors });
    setFilters(prev => ({
      ...prev,
      contributors: [...contributors]
    }));
  }, []);
  
  // Update organizations filter
  const setOrganizations = useCallback((organizations: readonly string[]) => {
    logger.debug(MODULE_NAME, 'Updating organizations filter', { organizations });
    setFilters(prev => ({
      ...prev,
      organizations: [...organizations]
    }));
  }, []);
  
  // Update repositories filter
  const setRepositories = useCallback((repositories: readonly string[]) => {
    logger.debug(MODULE_NAME, 'Updating repositories filter', { repositories });
    setFilters(prev => ({
      ...prev,
      repositories: [...repositories]
    }));
  }, []);
  
  // Update all filters at once
  const setAllFilters = useCallback((newFilters: FilterState) => {
    logger.debug(MODULE_NAME, 'Updating all filters', { newFilters });
    setFilters({
      contributors: [...newFilters.contributors],
      organizations: [...newFilters.organizations],
      repositories: [...newFilters.repositories]
    });
  }, []);
  
  // Change activity mode and update filters accordingly
  const setActivityMode = useCallback((mode: ActivityMode) => {
    logger.debug(MODULE_NAME, 'Changing activity mode', { from: activityMode, to: mode });
    setMode(mode);
    
    // Update filters based on the selected mode
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (mode === 'my-activity') {
        // My personal activity - focus on current user only, clear org filter
        newFilters.contributors = ['me'];
        newFilters.organizations = [];
      } else if (mode === 'my-work-activity') {
        // My work activity - focus on current user, keep org filter
        newFilters.contributors = ['me'];
      } else if (mode === 'team-activity') {
        // Team activity - show all team members
        newFilters.contributors = [];
      }
      
      return newFilters;
    });
  }, [activityMode]);
  
  // Reset filters to initial state
  const resetFilters = useCallback(() => {
    logger.debug(MODULE_NAME, 'Resetting filters to initial state');
    setFilters({
      contributors: initialFilters.contributors || [],
      organizations: initialFilters.organizations || [],
      repositories: initialFilters.repositories || []
    });
    setMode(initialMode);
  }, [initialFilters, initialMode]);
  
  return {
    filters,
    activityMode,
    setContributors,
    setOrganizations,
    setRepositories,
    setAllFilters,
    setActivityMode,
    resetFilters
  };
}
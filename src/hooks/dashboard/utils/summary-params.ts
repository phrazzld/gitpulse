/**
 * Pure functions for constructing summary request parameters
 * Extracted from useSummary hook to enable functional architecture
 */

import type { SummaryRequest } from '../../../core/types/index';
import type { ActivityMode, DateRange } from '../../../types/dashboard';

/**
 * Configuration for summary request construction
 */
export interface SummaryRequestConfig {
  dateRange: DateRange;
  activityMode: ActivityMode;
  organizations: readonly string[];
  repositories: readonly string[];
  contributors: readonly string[];
}

/**
 * Transform hook parameters to SummaryRequest format
 * Pure function with no side effects
 */
export const createSummaryRequest = (config: SummaryRequestConfig): SummaryRequest => {
  const { dateRange, organizations, repositories, contributors } = config;

  // Transform repositories - if organizations are specified but no specific repos,
  // we'll let the data provider handle the filtering
  const repositoriesToAnalyze = repositories.length > 0 
    ? repositories 
    : organizations.length > 0 
      ? [] // Will be populated by repository provider
      : [];

  // Transform contributors - handle 'me' special case at the provider level
  const usersFilter = contributors.length > 0 && !contributors.includes('me')
    ? contributors
    : undefined;

  return {
    repositories: repositoriesToAnalyze,
    dateRange: {
      start: new Date(dateRange.since),
      end: new Date(dateRange.until)
    },
    users: usersFilter,
    includePrivate: true, // Dashboard always includes private repos if accessible
    branch: undefined // Dashboard doesn't support branch filtering yet
  };
};

/**
 * Validate summary request configuration
 * Returns validation errors if any
 */
export const validateSummaryRequestConfig = (config: SummaryRequestConfig): string[] => {
  const errors: string[] = [];

  // Validate date range
  const startDate = new Date(config.dateRange.since);
  const endDate = new Date(config.dateRange.until);
  
  if (isNaN(startDate.getTime())) {
    errors.push('Invalid start date');
  }
  
  if (isNaN(endDate.getTime())) {
    errors.push('Invalid end date');
  }
  
  if (startDate > endDate) {
    errors.push('Start date must be before end date');
  }

  // Validate that we have some scope for analysis
  if (config.repositories.length === 0 && config.organizations.length === 0) {
    errors.push('At least one repository or organization must be specified');
  }

  return errors;
};

/**
 * Transform summary request for repository filtering
 * Used when organizations are specified but no specific repositories
 */
export const shouldFilterByOrganizations = (config: SummaryRequestConfig): boolean => {
  return config.organizations.length > 0 && config.repositories.length === 0;
};

/**
 * Get organization filters for repository provider
 */
export const getOrganizationFilters = (config: SummaryRequestConfig): readonly string[] => {
  return shouldFilterByOrganizations(config) ? config.organizations : [];
};

/**
 * Check if current user filter is active
 * Used to determine if 'me' contributor filter should be applied
 */
export const isCurrentUserFilterActive = (config: SummaryRequestConfig): boolean => {
  return config.contributors.includes('me');
};

/**
 * Transform activity mode to user context
 * Determines how to apply user filtering based on activity mode
 */
export const getUserContextFromActivityMode = (
  activityMode: ActivityMode, 
  currentUser?: string
): {
  shouldFilterByCurrentUser: boolean;
  userFilter?: string;
} => {
  switch (activityMode) {
    case 'my-activity':
      return {
        shouldFilterByCurrentUser: true,
        userFilter: currentUser
      };
    case 'my-work-activity':
      return {
        shouldFilterByCurrentUser: true,
        userFilter: currentUser
      };
    case 'team-activity':
      return {
        shouldFilterByCurrentUser: false
      };
    default:
      return {
        shouldFilterByCurrentUser: false
      };
  }
};

/**
 * Apply user context to request configuration
 * Transforms 'me' contributor and applies activity mode filtering
 */
export const applyUserContextToRequest = (
  config: SummaryRequestConfig,
  currentUser?: string
): SummaryRequestConfig => {
  const userContext = getUserContextFromActivityMode(config.activityMode, currentUser);
  
  // If 'me' is in contributors or activity mode requires current user filtering
  const shouldFilterByMe = isCurrentUserFilterActive(config) || 
                           userContext.shouldFilterByCurrentUser;

  if (shouldFilterByMe && userContext.userFilter) {
    // Replace 'me' with actual username and ensure current user is included
    const contributors = config.contributors
      .filter(c => c !== 'me')
      .concat(userContext.userFilter);
    
    // Remove duplicates
    const uniqueContributors = [...new Set(contributors)];
    
    return {
      ...config,
      contributors: uniqueContributors
    };
  }

  return config;
};
/**
 * Enhanced validation functions for GitPulse summary requests
 * Pure functions with i18n-ready error messages and configurable limits
 */

import { Result, success, failure } from '../../lib/result/index';
import type { SummaryRequest, DateRange, ValidationError, Config } from '../types/index';

/**
 * Validation configuration with default limits
 */
export interface ValidationConfig {
  maxRepositories?: number;
  maxDateRangeDays?: number;
  maxUsers?: number;
  allowFutureDates?: boolean;
  minDateRangeDays?: number;
}

const DEFAULT_CONFIG: Required<ValidationConfig> = {
  maxRepositories: 100,
  maxDateRangeDays: 365,
  maxUsers: 50,
  allowFutureDates: false,
  minDateRangeDays: 1
};

/**
 * I18n-ready error message generator
 */
export const createErrorMessage = (
  key: string,
  params?: Record<string, string | number>
): string => {
  // In a real application, this would integrate with an i18n library
  // For now, we'll use template-based messages
  const messages: Record<string, string> = {
    'validation.dateRange.invalidStartDate': 'Start date is not a valid date',
    'validation.dateRange.invalidEndDate': 'End date is not a valid date',
    'validation.dateRange.startAfterEnd': 'Start date must be before end date',
    'validation.dateRange.futureDate': 'Dates cannot be in the future',
    'validation.dateRange.tooLong': 'Date range cannot exceed {maxDays} days (selected: {selectedDays} days)',
    'validation.dateRange.tooShort': 'Date range must be at least {minDays} day(s)',
    'validation.repositories.notArray': 'Repositories must be provided as an array',
    'validation.repositories.empty': 'At least one repository must be selected',
    'validation.repositories.tooMany': 'Cannot process more than {maxRepos} repositories (selected: {count})',
    'validation.repositories.invalidFormat': 'Invalid repository format: {repos}. Expected format: owner/repo',
    'validation.repositories.duplicates': 'Duplicate repositories are not allowed: {duplicates}',
    'validation.users.notArray': 'Users must be provided as an array',
    'validation.users.tooMany': 'Cannot filter by more than {maxUsers} users (selected: {count})',
    'validation.users.invalidUsername': 'Invalid GitHub username(s): {users}',
    'validation.users.duplicates': 'Duplicate users are not allowed: {duplicates}',
    'validation.branch.notString': 'Branch name must be a string',
    'validation.branch.empty': 'Branch name cannot be empty',
    'validation.branch.tooLong': 'Branch name is too long (max {maxLength} characters, provided: {length})',
    'validation.branch.invalidCharacters': 'Branch name contains invalid characters. Only alphanumeric, /, -, _, and . are allowed',
    'validation.request.notObject': 'Request must be a valid object',
    'validation.request.missingDateRange': 'Date range is required',
    'validation.request.missingRepositories': 'Repositories list is required'
  };

  let message = messages[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, String(value));
    });
  }
  
  return message;
};

/**
 * Validate a date range with enhanced error messages
 */
export const validateDateRange = (
  start: Date,
  end: Date,
  config: ValidationConfig = {}
): Result<DateRange, string[]> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];

  // Validate start date
  if (!(start instanceof Date) || isNaN(start.getTime())) {
    errors.push(createErrorMessage('validation.dateRange.invalidStartDate'));
  }
  
  // Validate end date
  if (!(end instanceof Date) || isNaN(end.getTime())) {
    errors.push(createErrorMessage('validation.dateRange.invalidEndDate'));
  }
  
  // If dates are invalid, return early
  if (errors.length > 0) {
    return failure(errors);
  }
  
  // Check date order
  if (start > end) {
    errors.push(createErrorMessage('validation.dateRange.startAfterEnd'));
  }
  
  // Check future dates
  if (!cfg.allowFutureDates) {
    const now = new Date();
    if (end > now) {
      errors.push(createErrorMessage('validation.dateRange.futureDate'));
    }
  }
  
  // Check date range length
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > cfg.maxDateRangeDays) {
    errors.push(createErrorMessage('validation.dateRange.tooLong', {
      maxDays: cfg.maxDateRangeDays,
      selectedDays: daysDiff
    }));
  }
  
  if (daysDiff < cfg.minDateRangeDays) {
    errors.push(createErrorMessage('validation.dateRange.tooShort', {
      minDays: cfg.minDateRangeDays
    }));
  }
  
  if (errors.length > 0) {
    return failure(errors);
  }
  
  return success({ start, end });
};

/**
 * Validate repository list with enhanced error messages
 */
export const validateRepositories = (
  repos: readonly string[],
  config: ValidationConfig = {}
): Result<readonly string[], string[]> => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];

  // Check if array
  if (!Array.isArray(repos)) {
    return failure([createErrorMessage('validation.repositories.notArray')]);
  }
  
  // Check if empty
  if (repos.length === 0) {
    errors.push(createErrorMessage('validation.repositories.empty'));
    return failure(errors);
  }
  
  // Check count limit
  if (repos.length > cfg.maxRepositories) {
    errors.push(createErrorMessage('validation.repositories.tooMany', {
      maxRepos: cfg.maxRepositories,
      count: repos.length
    }));
  }
  
  // Check repository format
  const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  const invalidRepos = repos.filter(repo => !repoPattern.test(repo));
  
  if (invalidRepos.length > 0) {
    errors.push(createErrorMessage('validation.repositories.invalidFormat', {
      repos: invalidRepos.slice(0, 3).join(', ') + (invalidRepos.length > 3 ? '...' : '')
    }));
  }
  
  // Check for duplicates
  const seen = new Set<string>();
  const duplicates: string[] = [];
  
  repos.forEach(repo => {
    if (seen.has(repo)) {
      duplicates.push(repo);
    }
    seen.add(repo);
  });
  
  if (duplicates.length > 0) {
    errors.push(createErrorMessage('validation.repositories.duplicates', {
      duplicates: [...new Set(duplicates)].join(', ')
    }));
  }
  
  if (errors.length > 0) {
    return failure(errors);
  }
  
  return success(repos);
};

/**
 * Validate user list with enhanced error messages
 */
export const validateUsers = (
  users: readonly string[] | undefined,
  config: ValidationConfig = {}
): Result<readonly string[] | undefined, string[]> => {
  if (users === undefined) {
    return success(undefined);
  }

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const errors: string[] = [];

  // Check if array
  if (!Array.isArray(users)) {
    return failure([createErrorMessage('validation.users.notArray')]);
  }
  
  // Check count limit
  if (users.length > cfg.maxUsers) {
    errors.push(createErrorMessage('validation.users.tooMany', {
      maxUsers: cfg.maxUsers,
      count: users.length
    }));
  }
  
  // Validate GitHub username format (alphanumeric, hyphens, underscores)
  const usernamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9_-])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  const invalidUsers = users.filter(user => 
    !usernamePattern.test(user) || user.length > 39 || user.length === 0
  );
  
  if (invalidUsers.length > 0) {
    errors.push(createErrorMessage('validation.users.invalidUsername', {
      users: invalidUsers.slice(0, 3).join(', ') + (invalidUsers.length > 3 ? '...' : '')
    }));
  }
  
  // Check for duplicates
  const seen = new Set<string>();
  const duplicates: string[] = [];
  
  users.forEach(user => {
    const normalized = user.toLowerCase();
    if (seen.has(normalized)) {
      duplicates.push(user);
    }
    seen.add(normalized);
  });
  
  if (duplicates.length > 0) {
    errors.push(createErrorMessage('validation.users.duplicates', {
      duplicates: [...new Set(duplicates)].join(', ')
    }));
  }
  
  if (errors.length > 0) {
    return failure(errors);
  }
  
  return success(users);
};

/**
 * Validate branch name with enhanced error messages
 */
export const validateBranch = (
  branch: string | undefined
): Result<string | undefined, string[]> => {
  if (branch === undefined) {
    return success(undefined);
  }

  const errors: string[] = [];

  // Check type
  if (typeof branch !== 'string') {
    return failure([createErrorMessage('validation.branch.notString')]);
  }
  
  // Check if empty
  if (branch.trim().length === 0) {
    errors.push(createErrorMessage('validation.branch.empty'));
    return failure(errors);
  }
  
  // Check length
  const maxLength = 250;
  if (branch.length > maxLength) {
    errors.push(createErrorMessage('validation.branch.tooLong', {
      maxLength,
      length: branch.length
    }));
  }
  
  // Check characters
  const branchPattern = /^[a-zA-Z0-9/_.-]+$/;
  if (!branchPattern.test(branch)) {
    errors.push(createErrorMessage('validation.branch.invalidCharacters'));
  }
  
  if (errors.length > 0) {
    return failure(errors);
  }
  
  return success(branch);
};

/**
 * Validate complete summary request with enhanced error collection
 */
export const validateSummaryRequest = (
  request: unknown,
  config: ValidationConfig = {}
): Result<SummaryRequest, ValidationError[]> => {
  // Check if request is an object
  if (typeof request !== 'object' || request === null) {
    return failure([{
      field: 'request',
      message: createErrorMessage('validation.request.notObject'),
      code: 'INVALID_TYPE'
    }]);
  }
  
  const req = request as any;
  const errors: ValidationError[] = [];
  let validatedDateRange: DateRange | null = null;
  let validatedRepositories: readonly string[] = [];
  let validatedUsers: readonly string[] | undefined;
  let validatedBranch: string | undefined;

  // Validate date range
  if (!req.dateRange || typeof req.dateRange !== 'object') {
    errors.push({
      field: 'dateRange',
      message: createErrorMessage('validation.request.missingDateRange'),
      code: 'MISSING_FIELD'
    });
  } else {
    const startDate = new Date(req.dateRange.start);
    const endDate = new Date(req.dateRange.end);
    
    const dateRangeResult = validateDateRange(startDate, endDate, config);
    if (!dateRangeResult.success) {
      dateRangeResult.error.forEach(message => {
        errors.push({
          field: 'dateRange',
          message,
          code: 'INVALID_DATE_RANGE'
        });
      });
    } else {
      validatedDateRange = dateRangeResult.data;
    }
  }
  
  // Validate repositories
  if (!req.repositories) {
    errors.push({
      field: 'repositories',
      message: createErrorMessage('validation.request.missingRepositories'),
      code: 'MISSING_FIELD'
    });
  } else {
    const reposResult = validateRepositories(req.repositories, config);
    if (!reposResult.success) {
      reposResult.error.forEach(message => {
        errors.push({
          field: 'repositories',
          message,
          code: 'INVALID_REPOSITORIES'
        });
      });
    } else {
      validatedRepositories = reposResult.data;
    }
  }
  
  // Validate users (optional)
  if (req.users !== undefined) {
    const usersResult = validateUsers(req.users, config);
    if (!usersResult.success) {
      usersResult.error.forEach(message => {
        errors.push({
          field: 'users',
          message,
          code: 'INVALID_USERS'
        });
      });
    } else {
      validatedUsers = usersResult.data;
    }
  }
  
  // Validate branch (optional)
  if (req.branch !== undefined) {
    const branchResult = validateBranch(req.branch);
    if (!branchResult.success) {
      branchResult.error.forEach(message => {
        errors.push({
          field: 'branch',
          message,
          code: 'INVALID_BRANCH'
        });
      });
    } else {
      validatedBranch = branchResult.data;
    }
  }
  
  // Return errors if any
  if (errors.length > 0 || !validatedDateRange) {
    return failure(errors);
  }
  
  // Construct validated request
  const validatedRequest: SummaryRequest = {
    repositories: validatedRepositories,
    dateRange: validatedDateRange,
    users: validatedUsers,
    includePrivate: Boolean(req.includePrivate),
    branch: validatedBranch
  };
  
  return success(validatedRequest);
};

/**
 * Create a validation config from application config
 */
export const createValidationConfig = (appConfig?: Partial<Config>): ValidationConfig => {
  if (!appConfig?.limits) {
    return DEFAULT_CONFIG;
  }
  
  return {
    maxRepositories: appConfig.limits.maxRepositories || DEFAULT_CONFIG.maxRepositories,
    maxDateRangeDays: appConfig.limits.maxDateRangeDays || DEFAULT_CONFIG.maxDateRangeDays,
    maxUsers: appConfig.limits.maxUsers || DEFAULT_CONFIG.maxUsers,
    allowFutureDates: false,
    minDateRangeDays: 1
  };
};
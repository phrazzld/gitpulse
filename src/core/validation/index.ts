/**
 * Pure validation functions for GitPulse
 * All validation logic is pure - no side effects, no external dependencies
 */

import { Result, success, failure } from '../../lib/result/index';
import type { SummaryRequest, DateRange, ValidationError } from '../types/index';

/**
 * Validate a date range
 */
export const validateDateRange = (start: Date, end: Date): Result<DateRange, string> => {
  if (!(start instanceof Date) || isNaN(start.getTime())) {
    return failure('Start date is invalid');
  }
  
  if (!(end instanceof Date) || isNaN(end.getTime())) {
    return failure('End date is invalid');
  }
  
  if (start > end) {
    return failure('Start date must be before end date');
  }
  
  const now = new Date();
  if (end > now) {
    return failure('End date cannot be in the future');
  }
  
  const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    return failure('Date range cannot exceed 365 days');
  }
  
  if (daysDiff < 1) {
    return failure('Date range must be at least 1 day');
  }
  
  return success({ start, end });
};

/**
 * Validate repository names
 */
export const validateRepositories = (repos: readonly string[]): Result<readonly string[], string> => {
  if (!Array.isArray(repos)) {
    return failure('Repositories must be an array');
  }
  
  if (repos.length === 0) {
    return failure('At least one repository is required');
  }
  
  if (repos.length > 100) {
    return failure('Cannot process more than 100 repositories');
  }
  
  // Check for valid GitHub repository format (owner/repo)
  const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  const invalidRepos = repos.filter(repo => !repoPattern.test(repo));
  
  if (invalidRepos.length > 0) {
    return failure(`Invalid repository format: ${invalidRepos.join(', ')}. Expected format: owner/repo`);
  }
  
  // Check for duplicates
  const uniqueRepos = [...new Set(repos)];
  if (uniqueRepos.length !== repos.length) {
    return failure('Duplicate repositories are not allowed');
  }
  
  return success(repos);
};

/**
 * Validate user list
 */
export const validateUsers = (users?: readonly string[]): Result<readonly string[] | undefined, string> => {
  if (users === undefined) {
    return success(undefined);
  }
  
  if (!Array.isArray(users)) {
    return failure('Users must be an array');
  }
  
  if (users.length > 50) {
    return failure('Cannot filter by more than 50 users');
  }
  
  // Check for valid GitHub username format (alphanumeric, hyphens, underscores)
  const usernamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9_-])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  const invalidUsers = users.filter(user => !usernamePattern.test(user) || user.length > 39);
  
  if (invalidUsers.length > 0) {
    return failure(`Invalid GitHub usernames: ${invalidUsers.join(', ')}`);
  }
  
  // Check for duplicates
  const uniqueUsers = [...new Set(users)];
  if (uniqueUsers.length !== users.length) {
    return failure('Duplicate users are not allowed');
  }
  
  return success(users);
};

/**
 * Validate branch name
 */
export const validateBranch = (branch?: string): Result<string | undefined, string> => {
  if (branch === undefined) {
    return success(undefined);
  }
  
  if (typeof branch !== 'string') {
    return failure('Branch must be a string');
  }
  
  if (branch.trim().length === 0) {
    return failure('Branch name cannot be empty');
  }
  
  if (branch.length > 250) {
    return failure('Branch name is too long (max 250 characters)');
  }
  
  // Basic branch name validation (no spaces, no special chars except /-_.)
  const branchPattern = /^[a-zA-Z0-9/_.-]+$/;
  if (!branchPattern.test(branch)) {
    return failure('Branch name contains invalid characters');
  }
  
  return success(branch);
};

/**
 * Validate complete summary request
 */
export const validateSummaryRequest = (request: unknown): Result<SummaryRequest, ValidationError[]> => {
  if (typeof request !== 'object' || request === null) {
    return failure([{
      field: 'request',
      message: 'Request must be an object',
      code: 'INVALID_TYPE'
    }]);
  }
  
  const req = request as any;
  const errors: ValidationError[] = [];
  
  // Validate date range
  if (!req.dateRange || typeof req.dateRange !== 'object') {
    errors.push({
      field: 'dateRange',
      message: 'Date range is required and must be an object',
      code: 'MISSING_FIELD'
    });
  } else {
    const startDate = new Date(req.dateRange.start);
    const endDate = new Date(req.dateRange.end);
    
    const dateRangeResult = validateDateRange(startDate, endDate);
    if (!dateRangeResult.success) {
      errors.push({
        field: 'dateRange',
        message: dateRangeResult.error,
        code: 'INVALID_DATE_RANGE'
      });
    }
  }
  
  // Validate repositories
  const reposResult = validateRepositories(req.repositories || []);
  if (!reposResult.success) {
    errors.push({
      field: 'repositories',
      message: reposResult.error,
      code: 'INVALID_REPOSITORIES'
    });
  }
  
  // Validate users (optional)
  const usersResult = validateUsers(req.users);
  if (!usersResult.success) {
    errors.push({
      field: 'users',
      message: usersResult.error,
      code: 'INVALID_USERS'
    });
  }
  
  // Validate branch (optional)
  const branchResult = validateBranch(req.branch);
  if (!branchResult.success) {
    errors.push({
      field: 'branch',
      message: branchResult.error,
      code: 'INVALID_BRANCH'
    });
  }
  
  // Return errors if any
  if (errors.length > 0) {
    return failure(errors);
  }
  
  // Construct validated request (all validations passed, so we can safely access data)
  const validatedRequest: SummaryRequest = {
    repositories: reposResult.success ? reposResult.data : [],
    dateRange: {
      start: new Date(req.dateRange.start),
      end: new Date(req.dateRange.end)
    },
    users: usersResult.success ? usersResult.data : undefined,
    includePrivate: Boolean(req.includePrivate),
    branch: branchResult.success ? branchResult.data : undefined
  };
  
  return success(validatedRequest);
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): Result<string, string> => {
  if (typeof email !== 'string') {
    return failure('Email must be a string');
  }
  
  if (email.trim().length === 0) {
    return failure('Email cannot be empty');
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return failure('Email format is invalid');
  }
  
  return success(email.trim().toLowerCase());
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): Result<string, string> => {
  if (typeof url !== 'string') {
    return failure('URL must be a string');
  }
  
  try {
    new URL(url);
    return success(url);
  } catch {
    return failure('URL format is invalid');
  }
};

/**
 * Validate that a string is not empty
 */
export const validateNonEmptyString = (value: string, fieldName: string): Result<string, string> => {
  if (typeof value !== 'string') {
    return failure(`${fieldName} must be a string`);
  }
  
  if (value.trim().length === 0) {
    return failure(`${fieldName} cannot be empty`);
  }
  
  return success(value.trim());
};

/**
 * Validate that a number is within a range
 */
export const validateNumberRange = (
  value: number, 
  min: number, 
  max: number, 
  fieldName: string
): Result<number, string> => {
  if (typeof value !== 'number' || isNaN(value)) {
    return failure(`${fieldName} must be a valid number`);
  }
  
  if (value < min || value > max) {
    return failure(`${fieldName} must be between ${min} and ${max}`);
  }
  
  return success(value);
};
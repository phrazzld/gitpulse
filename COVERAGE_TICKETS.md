# Test Coverage Improvement Tickets

This document outlines the areas in the GitPulse codebase that require additional test coverage to meet the established thresholds:

- Global coverage threshold: 85% for statements, branches, functions, and lines
- Core logic files threshold: 95% for statements, branches, functions, and lines

## Critical Files Failing to Meet 95% Coverage Threshold

### 1. GitHub API Modules

#### TC-001: Improve test coverage for `src/lib/github/commits.ts`

- **Current Coverage:**
  - Statements: 51.21%
  - Branches: 63.41%
  - Functions: 41.66%
  - Lines: 55.40%
- **Target:** 95% for all metrics
- **Missing Coverage:** Lines 131-135, 222-310
- **Suggested Improvements:**
  - Add tests for error handling and edge cases
  - Test pagination functionality
  - Test different parameter combinations
- **Priority:** High (Critical core functionality)

#### TC-002: Improve test coverage for `src/lib/github/repositories.ts`

- **Current Coverage:**
  - Statements: 70.73%
  - Branches: 42.85%
  - Functions: 42.85%
  - Lines: 71.60%
- **Target:** 95% for all metrics
- **Missing Coverage:** Lines 40-46, 70-74, 80-88, 117, 121-147, 164-165, 194, 212-213, 218-221
- **Suggested Improvements:**
  - Add tests for error conditions
  - Test repository filtering functionality
  - Test pagination and response handling
- **Priority:** High (Critical core functionality)

#### TC-003: Improve test coverage for `src/lib/github/utils.ts`

- **Current Coverage:**
  - Statements: 92.30%
  - Branches: 76.92%
  - Functions: 100%
  - Lines: 91.93%
- **Target:** 95% for all metrics
- **Missing Coverage:** Lines 210-219
- **Suggested Improvements:**
  - Focus on branch coverage with additional test cases
  - Test edge cases for utility functions
- **Priority:** Medium (Close to threshold)

#### TC-004: Improve test coverage for `src/lib/github/auth.ts`

- **Current Coverage:**
  - Statements: 0%
  - Branches: 0%
  - Functions: 0%
  - Lines: 0%
- **Target:** 95% for all metrics (if marked as critical) or 85% (if part of global threshold)
- **Missing Coverage:** All lines (9-263)
- **Suggested Improvements:**
  - Create comprehensive test suite
  - Mock external dependencies
  - Test both success and failure paths
- **Priority:** High (Authentication is critical functionality)

### 2. Core API Logic

#### TC-005: Add tests for `src/app/api/summary/handlers.ts`

- **Current Coverage:** Not shown in report (may be untested)
- **Target:** 95% for all metrics
- **Suggested Improvements:**
  - Test all handler functions
  - Cover error handling cases
  - Test data transformation logic
- **Priority:** High (Core business logic)

### 3. Dashboard Hooks

#### TC-006: Improve test coverage for `src/hooks/dashboard/useInstallations.ts`

- **Current Coverage:**
  - Statements: 12.72%
  - Branches: 0%
  - Functions: 7.69%
  - Lines: 14.28%
- **Target:** 85% for all metrics (global threshold)
- **Missing Coverage:** Lines 30-154
- **Suggested Improvements:**
  - Test hook initialization
  - Test state updates
  - Test error handling
- **Priority:** High (Dashboard functionality)

#### TC-007: Improve test coverage for `src/hooks/dashboard/useRepositories.ts`

- **Current Coverage:**
  - Statements: 10.71%
  - Branches: 0%
  - Functions: 25%
  - Lines: 10.71%
- **Target:** 85% for all metrics (global threshold)
- **Missing Coverage:** Lines 66-195
- **Suggested Improvements:**
  - Add tests for data fetching
  - Test state management
  - Test error handling
- **Priority:** High (Dashboard functionality)

## Additional Critical Areas Needing Tests

### 4. Utility Modules

#### TC-008: Add tests for `src/lib/gemini.ts`

- **Current Coverage:** 0% (completely untested)
- **Target:** 85% for all metrics (global threshold)
- **Missing Coverage:** All lines (1-191)
- **Suggested Improvements:**
  - Mock AI service responses
  - Test response parsing
  - Test error handling
- **Priority:** High (Core AI functionality)

#### TC-009: Add tests for `src/lib/activity.ts`

- **Current Coverage:** 0% (completely untested)
- **Target:** 85% for all metrics (global threshold)
- **Missing Coverage:** All lines (2-450)
- **Suggested Improvements:**
  - Test activity data processing
  - Test filtering and grouping logic
  - Test edge cases with empty data
- **Priority:** High (Core functionality)

### 5. Authentication and Authorization

#### TC-010: Add tests for authentication modules

- **Affected Files:**
  - `src/lib/auth/apiAuth.ts` (0% coverage)
  - `src/lib/auth/clientAuth.ts` (0% coverage)
  - `src/lib/auth/tokenValidator.ts` (0% coverage)
- **Target:** 85% for all metrics (global threshold)
- **Suggested Improvements:**
  - Mock external auth services
  - Test token validation
  - Test error handling for invalid credentials
- **Priority:** High (Security-critical functionality)

### 6. React Components

#### TC-011: Add tests for key React components

- **Affected Components:** Various components with low or no coverage
- **Target:** 85% for all metrics (global threshold)
- **Suggested Improvements:**
  - Focus on testing core functionality
  - Test component rendering
  - Test user interactions
  - Test error states
- **Priority:** Medium

## General Testing Improvements

#### TC-012: Add tests for utility hooks

- **Affected Files:**
  - `src/hooks/useDebounce.ts` (0% coverage)
  - `src/hooks/useProgressiveLoading.ts` (0% coverage)
  - `src/hooks/useProtectedRoute.ts` (0% coverage)
- **Target:** 85% for all metrics (global threshold)
- **Suggested Improvements:**
  - Test hook initialization
  - Test state updates
  - Test callback execution
- **Priority:** Medium

## Implementation Plan

1. Start with high-priority tickets (TC-001, TC-002, TC-004, TC-005)
2. Create dedicated test files for each module
3. Implement tests to cover missing functionality
4. Focus on meeting the required thresholds for critical files first (95%)
5. Then work on improving global coverage to meet the 85% threshold

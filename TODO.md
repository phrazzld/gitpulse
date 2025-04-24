# GitPulse Refactoring Tasks

This document outlines the detailed task breakdown for refactoring the GitPulse codebase to improve maintainability, focusing on breaking down large files into smaller, more focused modules.

## Global Requirements

- All code must follow TypeScript best practices outlined in `DEVELOPMENT_PHILOSOPHY_APPENDIX_TYPESCRIPT.md`
- No files should exceed 1000 lines (error threshold) or 500 lines (warning threshold)
- All refactored code must pass existing tests and linting
- No `any` types allowed
- Proper error handling must be implemented
- Code should be immutable where possible (use readonly modifiers)
- All new components and utility functions must have unit tests

## Task Breakdown

### Phase 1: Types and Utilities Extraction

**T001 - Create Dashboard Types Module**
- Create `src/types/dashboard.ts` file
- Extract all type definitions from `src/app/dashboard/page.tsx`
- Apply proper readonly modifiers and strict typing
- Ensure no use of `any`
- Status: Completed
- Estimate: Small

**T002 - Create Dashboard Utilities Module**
- Create `src/lib/dashboard-utils.ts` file
- Extract date formatting functions from `src/app/dashboard/page.tsx`
- Extract GitHub App URL generation functions
- Write unit tests for utility functions
- Status: Completed
- Estimate: Small

**T003 - Create API Types Module**
- Create `src/types/api.ts` file
- Extract API-related type definitions from `src/app/api/summary/route.ts`
- Apply proper readonly modifiers and strict typing
- Status: Completed
- Estimate: Small
- Depends On: None

**T004 - Create API Utilities Module**
- Create `src/lib/api-utils.ts` file
- Extract `generateBasicStats` and other helper functions
- Write unit tests for utility functions
- Status: Completed
- Estimate: Small
- Depends On: T003

**T005 - Create GitHub Types Module**
- Create `src/lib/github/types.ts` file
- Extract all type definitions from `src/lib/github.ts`
- Apply proper readonly modifiers and strict typing
- Status: Completed
- Estimate: Small
- Depends On: None

**T006 - Update Dashboard Imports**
- Update imports in `src/app/dashboard/page.tsx` to use the new type and utility modules
- Verify there are no TypeScript errors
- Status: Completed
- Estimate: Small
- Depends On: T001, T002

### Phase 2: Custom Hooks Extraction

**T007 - Create Repository Hook**
- Create `src/hooks/dashboard/useRepositories.ts` hook
- Extract repository fetching logic from `src/app/dashboard/page.tsx`
- Implement proper error handling
- Write unit tests for the hook
- Status: Completed
- Estimate: Medium
- Depends On: T001, T002

**T008 - Create Installations Hook**
- Create `src/hooks/dashboard/useInstallations.ts` hook
- Extract installation management logic from `src/app/dashboard/page.tsx`
- Handle loading states and errors
- Write unit tests for the hook
- Status: Completed
- Estimate: Medium
- Depends On: T001, T007

**T009 - Create Commits Hook**
- Create `src/hooks/dashboard/useCommits.ts` hook
- Extract commit fetching and handling logic
- Implement loading and error states
- Write unit tests for the hook
- Status: Completed [x]
- Estimate: Medium
- Depends On: T001

**T010 - Create Filters Hook**
- Create `src/hooks/dashboard/useFilters.ts` hook
- Extract filter state management logic
- Write unit tests for the hook
- Status: Completed [x]
- Estimate: Small
- Depends On: T001

**T011 - Create Summary Hook**
- Create `src/hooks/dashboard/useSummary.ts` hook
- Extract summary generation logic
- Handle loading states and errors
- Write unit tests for the hook
- Status: Completed [x]
- Estimate: Medium
- Depends On: T001, T009

### Phase 3: UI Components Extraction

**T012 - Create Dashboard Header Component**
- Create `src/components/dashboard/Header.tsx`
- Extract header UI with user info and sign out
- Write unit tests for the component
- Status: Completed [x]
- Estimate: Small
- Depends On: T001, T002

**T013 - Create Operations Panel Component**
- Create `src/components/dashboard/OperationsPanel.tsx`
- Extract operations panel with filters
- Write unit tests for the component
- Status: Completed [x]
- Estimate: Medium
- Depends On: T010

**T014 - Create Analysis Parameters Component**
- Create `src/components/dashboard/AnalysisParameters.tsx`
- Extract analysis parameters display
- Write unit tests for the component
- Status: Completed [x]
- Estimate: Small
- Depends On: None

**T015 - Create Repository Section Component**
- Create `src/components/dashboard/RepositorySection.tsx`
- Extract repository list and info
- Write unit tests for the component
- Status: Completed [x]
- Estimate: Medium
- Depends On: T007

**T016 - Create Summary View Component**
- Create `src/components/dashboard/SummaryView.tsx`
- Extract summary display logic
- Write unit tests for the component
- Status: Completed [x]
- Estimate: Medium
- Depends On: T011

**T017 - Create Summary Stats Component**
- Create `src/components/dashboard/SummaryStats.tsx`
- Extract stats dashboard
- Write unit tests for the component
- Status: Completed [x]
- Estimate: Small
- Depends On: T011

**T018 - Create Summary Details Component**
- Create `src/components/dashboard/SummaryDetails.tsx`
- Extract AI summary details display
- Write unit tests for the component
- Status: Completed [x]
- Estimate: Medium
- Depends On: T011

### Phase 4: Main Dashboard Refactoring

**T019 - Refactor Main Dashboard Component**
- Update `src/app/dashboard/page.tsx` to use new hooks and components
- Ensure proper prop passing and state management
- Verify page functionality remains unchanged
- Status: Not Started
- Estimate: Large
- Depends On: T006, T007, T008, T009, T010, T011, T012, T013, T014, T015, T016, T017, T018

### Phase 5: GitHub Module Refactoring

**T020 - Create GitHub Auth Module**
- Create `src/lib/github/auth.ts`
- Extract authentication-related functions
- Write unit tests
- Status: Completed [x]
- Estimate: Medium
- Depends On: T005

**T021 - Create GitHub Repositories Module**
- Create `src/lib/github/repositories.ts`
- Extract repository-related functions
- Write unit tests
- Status: Completed [x]
- Estimate: Medium
- Depends On: T005

**T022 - Create GitHub Commits Module**
- Create `src/lib/github/commits.ts`
- Extract commit-related functions
- Write unit tests
- Status: Not Started
- Estimate: Medium
- Depends On: T005

**T023 - Create GitHub Utilities Module**
- Create `src/lib/github/utils.ts`
- Extract GitHub utility functions
- Write unit tests
- Status: Not Started
- Estimate: Small
- Depends On: T005

**T024 - Create GitHub Index Module**
- Create `src/lib/github/index.ts`
- Re-export all functions and types for backward compatibility
- Status: Not Started
- Estimate: Small
- Depends On: T020, T021, T022, T023

**T025 - Update GitHub Imports**
- Update imports across the codebase to use the new GitHub modules
- Status: Not Started
- Estimate: Medium
- Depends On: T024

### Phase 6: API Summary Route Refactoring

**T026 - Create API Summary Handler Module**
- Create `src/app/api/summary/handlers.ts`
- Extract repository filtering logic
- Extract commit fetching logic
- Extract summary generation logic
- Write unit tests
- Status: Not Started
- Estimate: Large
- Depends On: T003, T004

**T027 - Refactor Summary Route**
- Update `src/app/api/summary/route.ts` to use the new handlers
- Focus on request/response handling and error management
- Write integration tests
- Status: Not Started
- Estimate: Medium
- Depends On: T026

### Phase 7: Documentation & Cleanup

**T028 - Update Documentation**
- Update README.md with new file structure
- Add architectural documentation if needed
- Status: Not Started
- Estimate: Small
- Depends On: T019, T025, T027

**T029 - Verify Code Quality**
- Run linting and type checking
- Ensure no warnings or errors
- Status: Not Started
- Estimate: Small
- Depends On: T028

**T030 - Final Testing**
- Run all tests to verify functionality
- Verify no regressions
- Status: Not Started
- Estimate: Medium
- Depends On: T029
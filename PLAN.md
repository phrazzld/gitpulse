# GitPulse Refactoring Plan

## High-Level Issues

We have identified several large files in the codebase that need refactoring to improve maintainability:

1. `src/app/dashboard/page.tsx` (1663 lines) - Significantly over our 1000-line limit
2. `src/lib/github.ts` (853 lines) - Over the 500-line warning threshold
3. `src/app/api/summary/route.ts` (570 lines) - Over the 500-line warning threshold

This document outlines a comprehensive refactoring strategy focusing primarily on the largest file: `dashboard/page.tsx`.

## Refactoring `dashboard/page.tsx`

### Current Structure Analysis

`dashboard/page.tsx` currently contains:

1. Type definitions (lines 22-105)
2. Utility functions for date formatting (lines 107-117)
3. Helper function for GitHub App installation URLs (lines 120-132)
4. Main Dashboard component (lines 134-1664)
   - State declarations (lines 135-162)
   - Multiple handler functions (lines 165-516)
   - Data fetching logic (lines 174-471)
   - Effect hooks (lines 400-472, 519-610)
   - Large JSX rendering with many nested components (lines 617-1659)

### Proposed Modularization

Break `dashboard/page.tsx` into the following components and modules:

#### 1. Type Definitions (`src/types/dashboard.ts`)
- Move all type definitions to a dedicated types file
- Include interfaces for Repository, Commit, Installation, etc.

#### 2. Utility Functions (`src/lib/dashboard-utils.ts`)
- Extract date formatting functions
- Extract URL generation functions
- Export any other reusable utility functions

#### 3. Custom Hooks (`src/hooks/dashboard/`)
- `useRepositories.ts` - Repository fetching logic
- `useInstallations.ts` - Installation management
- `useCommits.ts` - Commit fetching and handling
- `useFilters.ts` - Filter state management
- `useSummary.ts` - Summary generation logic

#### 4. UI Components (`src/components/dashboard/`)
- `Header.tsx` - Dashboard header with user info and sign out
- `OperationsPanel.tsx` - Main operations panel containing filters
- `AnalysisParameters.tsx` - Analysis parameters display
- `RepositorySection.tsx` - Repository list and info
- `SummaryView.tsx` - Display for summary data
- `SummaryStats.tsx` - Stats dashboard
- `SummaryDetails.tsx` - AI summary details (themes, achievements, etc.)

#### 5. Main Dashboard (`src/app/dashboard/page.tsx`)
- Simplified main component that composes the above components
- Uses custom hooks for data fetching and state management
- Clean, focused render function

### Implementation Strategy

#### Phase 1: Extract Types & Utilities
1. Create types file and move all interfaces
2. Create utility file and move helper functions
3. Update imports in the dashboard file

#### Phase 2: Create Custom Hooks
1. Extract repository fetching logic to `useRepositories.ts`
2. Extract installation management to `useInstallations.ts`
3. Extract commit and summary logic to separate hooks
4. Test each hook individually

#### Phase 3: Create UI Components
1. Extract Header component
2. Extract Operations Panel components
3. Extract Repository Section
4. Extract Summary components
5. Test each component in isolation

#### Phase 4: Refactor Main Dashboard
1. Refactor main component to use new hooks and components
2. Ensure proper prop passing and state management
3. Test the complete dashboard functionality

## Refactoring `github.ts`

### Current Structure Analysis
The `github.ts` file contains:
1. Type definitions (lines 9-69)
2. Utility functions (lines 78-90)
3. Multiple API helper functions (lines 93-853)

### Proposed Modularization

Split into multiple files under `src/lib/github/`:

#### 1. Types (`src/lib/github/types.ts`)
- Move all GitHub-related interfaces

#### 2. Auth Functions (`src/lib/github/auth.ts`)
- `checkAppInstallation`
- `getAllAppInstallations`
- `getInstallationOctokit`

#### 3. Repository Functions (`src/lib/github/repositories.ts`)
- `fetchAllRepositoriesOAuth`
- `fetchAllRepositoriesApp`
- `fetchAllRepositories`

#### 4. Commit Functions (`src/lib/github/commits.ts`)
- `fetchRepositoryCommitsOAuth`
- `fetchRepositoryCommitsApp`
- `fetchRepositoryCommits`
- `fetchCommitsForRepositories`

#### 5. Utilities (`src/lib/github/utils.ts`)
- `getInstallationManagementUrl`
- Other utility functions

#### 6. Main Export File (`src/lib/github/index.ts`)
- Re-export all functions and types for backward compatibility

## Refactoring `summary/route.ts`

### Current Structure Analysis
The API route contains:
1. Type definitions (lines 18-30)
2. Main GET handler function (lines 32-552)
3. Stats utility function (lines 554-571)

### Proposed Modularization

#### 1. Types (`src/types/api.ts`)
- Move API-specific type definitions

#### 2. Utilities (`src/lib/api-utils.ts`)
- Extract `generateBasicStats` function
- Add other helper functions

#### 3. Handler Logic (`src/app/api/summary/handlers.ts`)
- Extract repository filtering logic
- Extract commit fetching logic
- Extract summary generation

#### 4. Main Route (`src/app/api/summary/route.ts`)
- Keep main GET function but delegate to imported handlers
- Focus on request/response handling and error management

## Benefits of This Refactoring

1. **Maintainability**: Smaller, focused files that are easier to understand and maintain
2. **Testability**: Isolated components and hooks are easier to test
3. **Reusability**: Shared logic can be reused across the application
4. **Performance**: Potential performance improvements through better code organization
5. **Collaboration**: Easier for multiple developers to work on different parts of the codebase
6. **Readability**: Clearer separation of concerns makes the code more readable
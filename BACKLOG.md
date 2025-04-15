# BACKLOG

## Refactoring Plan

### Phase 1: Dashboard Component Decomposition
* Extract UI sections into separate components (`OperationsPanel`, `FilterControls`, etc.)
* Extract data fetching logic into custom hooks (`useRepositories`, `useActivitySummary`, etc.)
* Move helper functions to utility files (date utilities, GitHub URL helpers)
* Simplify error handling logic for consistency

### Phase 2: GitHub Library Restructuring
* Separate GitHub App Authentication from data fetching logic
* Create central type definitions in `src/types/github.ts`
* Split repository and commit fetching into separate modules
* Simplify the retry logic in `fetchCommitsForRepositories`

### Phase 3: Type Safety & Consistency Improvements
* Eliminate `any` and overly broad types throughout the codebase
* Ensure consistent error handling across API routes
* Standardize caching implementation in API endpoints
* Extract `CommitItem` from `ActivityFeed.tsx`
* Implement comprehensive testing strategy

## Original Backlog Items

* Add GitHub Actions and pre-commit hooks for strict typing and linting
* Redesign to something more modern and clean and professional
  * Raw Tailwind, or shadcn
* Add proper landing page as unauthenticated home page
* Strip this application down to the barebones MVP requirements
  * Just for individuals looking at their own activity
  * No org stuff, no "all contributors in this repo" stuff

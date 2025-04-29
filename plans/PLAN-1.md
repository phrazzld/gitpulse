# Plan 1/7: Decompose `src/lib/github.ts` - Foundation (Types & Utils)

## Introduction & Goal

This is the first sub-plan in the decomposition of the monolithic `src/lib/github.ts`.

**Goal:** Establish the new directory structure (`src/lib/github/`) and extract shared TypeScript types (`types.ts`) and pure utility functions (`utils.ts`) from the original `src/lib/github.ts`. This plan focuses on creating the foundational, non-API-interacting modules while maintaining backward compatibility by refactoring the original file to use these new modules internally.

## Context

The overall objective is to systematically decompose the monolithic `src/lib/github.ts` into discrete, domain-focused modules under `src/lib/github/`, enforcing strict separation of concerns and improving maintainability, testability, and reviewability. This sub-plan tackles the most basic, dependency-free parts first.

## Dependency Notes

*   **Depends on:** None (This is the starting point).
*   **Blocks:** Plan 2 (Auth), Plan 3 (Repositories), Plan 4 (Commits) all depend on the types and utils created here.

## Chosen Approach

1.  Create the target directory `src/lib/github/`.
2.  Extract all relevant GitHub-related `interface` and `type` definitions into `src/lib/github/types.ts`.
3.  Extract pure utility functions (e.g., rate limit parsing, error formatting, deduplication, batch helpers, string manipulation) into `src/lib/github/utils.ts`.
4.  Update the original `src/lib/github.ts` to import and utilize types and functions from the new `types.ts` and `utils.ts` files, ensuring its external API remains unchanged.
5.  Write comprehensive unit tests specifically for the extracted utilities in `utils.ts`.
6.  Validate the changes by running type checks, linting, new unit tests, and the *existing* integration test suite to catch any regressions caused by the internal refactoring of `src/lib/github.ts`.

## Architecture Blueprint (Focus: Types & Utils)

-   **Modules / Packages**
    -   `src/lib/github/` (New directory created in this step)
        -   `types.ts`: **Responsibility:** Define all shared TypeScript interfaces and type aliases for GitHub API entities (e.g., `Repository`, `Commit`, `AppInstallation`, `GitHubUser`, `RateLimitInfo`). *Strictly types, no runtime code.* (Created and populated in this step)
        -   `utils.ts`: **Responsibility:** Provide pure, reusable utility functions specific to GitHub interactions (e.g., rate limit parsing, token scope validation, error formatting, deduplication, batch processing helpers, repo name splitting). *May use types from `types.ts`. No API calls, no side effects, no direct auth/repo/commit logic.* (Created and populated in this step)
    -   `src/lib/github.ts` (Original file - **Temporarily Refactored**): Continues to export the full original API but now imports and uses types/functions from `@/lib/github/types` and `@/lib/github/utils` internally.

-   **Public Interfaces / Contracts** (Relevant Sketches)
    -   `types.ts`:
        ```ts
        export interface Repository { /* ... */ }
        export interface Commit { /* ... */ }
        export interface AppInstallation { /* ... */ }
        export interface RateLimitInfo { /* ... */ }
        export type GitHubAuthMethod = 'github_app' | 'oauth';
        // ... other relevant types extracted from original github.ts
        ```
    -   `utils.ts`:
        ```ts
        import { Octokit } from '@octokit/core'; // Or appropriate type
        import * as GitHubTypes from './types'; // Example import

        export async function checkRateLimit(octokit: Octokit, authMethod?: string): Promise<GitHubTypes.RateLimitInfo | null>;
        export function parseTokenScopes(scopesHeader?: string): string[];
        export function validateTokenScopes(scopes: string[], requiredScopes?: string[]): { isValid: boolean; missingScopes: string[]; };
        export function formatGitHubError(error: unknown): string;
        export function deduplicateBy<T>(items: T[], keyFn: (item: T) => string | number): T[];
        export function splitRepoFullName(fullName: string): { owner: string; repo: string };
        export async function processBatches<T, R>(items: T[], batchSize: number, processBatch: (batch: T[]) => Promise<R[]>): Promise<R[]>;
        // ... other relevant pure functions extracted from original github.ts
        ```

-   **Data Flow Diagram** (State *after* this plan)
    ```mermaid
    graph TD
        subgraph Consumers ["API Routes, Hooks, etc."]
            ConsumerCode["import { ... } from '@/lib/github'"]
        end

        subgraph GitHub Library ["src/lib/"]
            OrigGithub["github.ts (Temporary Facade)"]
        end

        subgraph New GitHub Modules ["src/lib/github/"]
            T[types.ts]
            U[utils.ts]
            AU["auth.ts (Future)"]
            R["repositories.ts (Future)"]
            C["commits.ts (Future)"]
            Idx["index.ts (Future)"]

            U -- uses types --> T
            %% Future modules will use T and U
        end

        ConsumerCode --> OrigGithub
        OrigGithub -- imports from --> T
        OrigGithub -- imports from --> U
    ```

## Error & Edge-Case Strategy (Relevant Aspects)
-   **Consistency:** The `utils.formatGitHubError` function is extracted here, establishing the foundation for consistent error formatting.
-   **Graceful Handling:** Ensure utility functions maintain existing behavior (e.g., returning `[]` or `null` appropriately).
-   **Input Validation:** Preserve any basic validation within the extracted utility functions.

## Detailed Build Steps

1.  **Setup:** Create the new directory `src/lib/github/`.
2.  **Extract Types:**
    *   Create `src/lib/github/types.ts`.
    *   Identify and move all GitHub-related `interface` and `type` definitions from `src/lib/github.ts` to `src/lib/github/types.ts`. Export all necessary types.
3.  **Extract Utilities:**
    *   Create `src/lib/github/utils.ts`.
    *   Identify and move pure utility functions (rate limit parsing, error formatting, deduplication, batch helpers, string manipulation, etc.) from `src/lib/github.ts` to `src/lib/github/utils.ts`.
    *   Update internal imports within `utils.ts` to use `../types` if needed (e.g., `import * as GitHubTypes from './types';`). Export public utilities.
4.  **Refactor Original File:** Modify the *original* `src/lib/github.ts` file:
    *   Remove the type definitions and utility functions that were just moved.
    *   Add imports for the moved types and utils (e.g., `import * as GitHubTypes from './github/types';`, `import * as GitHubUtils from './github/utils';`). Adjust import paths based on your project setup (`@/lib/...` or relative).
    *   Update the remaining code within `src/lib/github.ts` to use these imported types and functions (e.g., replace `RateLimitInfo` with `GitHubTypes.RateLimitInfo`, replace `formatGitHubError` with `GitHubUtils.formatGitHubError`).
    *   **Crucially:** Ensure the *exported API* of `src/lib/github.ts` remains unchanged for external consumers.
5.  **Write Utility Unit Tests:** Create `src/lib/github/utils.test.ts`. Write comprehensive unit tests covering the logic, branches, and edge cases of the functions exported from `utils.ts`. Mock external dependencies only if absolutely necessary (ideally none for utils). Aim for high coverage (e.g., ≥ 90%).
6.  **Static Analysis:** Run `npm run lint` and `npm run typecheck`. Fix all reported issues, paying close attention to import paths and type compatibility in the refactored `src/lib/github.ts`.
7.  **Test Execution (Units):** Run the new unit tests for `utils.ts` (`npm test -- src/lib/github/utils.test.ts` or similar command). Debug and fix failures.
8.  **Test Execution (Integration):** Run the *entire existing* integration test suite (`npm test`). These tests still target the original `src/lib/github.ts`, but they will now exercise the code paths that use the extracted types and utils. Debug and fix any regressions. Update mocking slightly *only* if import paths within the *tested* files broke existing mocks, but prefer leaving integration test mocks targeting `src/lib/github` for now.

## Testing Strategy

-   **New Unit Tests:** Focus on `src/lib/github/utils.ts`. Test function logic, edge cases (e.g., empty inputs, specific formats), and ensure purity where applicable. Mock only true external dependencies if necessary (ideally none for utils).
-   **Existing Integration Tests:** Run the full suite against the refactored `src/lib/github.ts` facade. These tests ensure that extracting types and utils did not break the overall functionality offered by the original module. Do *not* refactor integration tests extensively in this step; they serve as a regression check.

## Logging & Observability

-   Utility functions in `utils.ts` should generally avoid logging unless specifically designed for it (like `formatGitHubError`).
-   If logging is added to utils (e.g., debug logs), use a consistent method, potentially accepting a logger instance or using a dedicated `github:utils` context if a logging framework is in place.
-   The refactored `src/lib/github.ts` should retain its existing logging behavior.

## Security & Config

-   Review extracted utility functions (e.g., `splitRepoFullName`, `parseTokenScopes`) for any potential security implications related to input handling, although these are less likely in pure utils compared to auth/API modules.
-   Ensure no secrets are handled or logged within `types.ts` or `utils.ts`.

## Documentation

-   Add TSDoc blocks (`/** ... */`) to all exported interfaces, types in `types.ts`, and functions in `utils.ts`. Document parameters (`@param`), return values (`@returns`), and purpose.
-   Add file-level comments in `types.ts` and `utils.ts` explaining their specific responsibilities.
-   Use clear, descriptive names.

## Risk Matrix (Focus for this Plan)

| Risk                                                     | Severity | Mitigation                                                                                                                          |
| :------------------------------------------------------- | :------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Functionality Regression (Logic Error/Omission)**      | Medium   | Comprehensive unit tests for `utils.ts`. Run full existing integration test suite against the refactored `src/lib/github.ts` facade. |
| **Incomplete Refactoring (Code Left in Original File)**  | Low      | Systematic extraction process based on clear responsibilities (types vs. utils). Code review.                                       |
| **Build/Type Errors**                                    | Medium   | Run `typecheck` and `lint` frequently during refactoring. Careful updates to imports in `src/lib/github.ts`.                        |
| **Test Suite Brittleness / Update Complexity**           | Low      | Minimize changes to existing integration tests in this phase; focus on ensuring they pass.                                            |

## Open Questions (From Original Plan)
-   Are there any implicit dependencies or side effects in the current `github.ts` initialization that consumers rely on? (Requires careful code review of the original file and its usage - relevant throughout refactoring).
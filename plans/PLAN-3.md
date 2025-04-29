# Plan 3/7: Decompose `src/lib/github.ts` - Repositories Module

## Introduction & Goal

This is the third sub-plan in the decomposition of `src/lib/github.ts`, building upon Plans 1 and 2.

**Goal:** Isolate all logic related to fetching repository data from the GitHub API into a dedicated `src/lib/github/repositories.ts` module. This involves moving the relevant functions (e.g., `fetchAllRepositories*`) from the *remaining* code in `src/lib/github.ts` and refactoring the original file to delegate repository fetching tasks to the new module, while maintaining backward compatibility.

## Context

With types, utils, and authentication modularized, this plan focuses on the "Repositories" domain. Extracting this logic further clarifies the responsibilities within the GitHub library, making the code easier to understand, test, and maintain. This module will depend on `auth.ts` to obtain authenticated clients.

## Dependency Notes

*   **Depends on:**
    *   Plan 1 (Foundation: Types & Utils): Requires `types.ts` (for `Repository` interface, etc.) and potentially `utils.ts`.
    *   Plan 2 (Authentication Module): Requires `auth.ts` to obtain authenticated Octokit instances needed for API calls.
*   **Blocks:** Plan 5 (Barrel File) requires this module for re-exporting. Plan 6 (Consumer Updates) will eventually update consumers to import directly from this module. Potentially Plan 4 (Commits) if commit fetching needs repository details not passed in directly (though the current design seems self-contained).

## Chosen Approach

1.  Create the new repository module file `src/lib/github/repositories.ts`.
2.  Identify and move all repository-fetching logic (e.g., `fetchAllRepositories*`) from the *current* `src/lib/github.ts` into `repositories.ts`.
3.  Refactor the code *within* `repositories.ts` to correctly import and use types from `../types`, utilities from `../utils`, and critically, authentication functions (like `getInstallationOctokit`, `createOAuthOctokit`) from `../auth`.
4.  Refactor the remaining code in `src/lib/github.ts` (which should now primarily contain commit logic and exports) to import functions from the new `repositories.ts` module and delegate repository fetching tasks to it. The external API of `src/lib/github.ts` must remain unchanged.
5.  Write comprehensive unit tests specifically for the logic within `repositories.ts`, mocking the Octokit methods used for fetching repositories.
6.  Validate the changes through static analysis, new unit tests, and the existing integration test suite (run against the `src/lib/github.ts` facade).

## Architecture Blueprint (Focus: Repositories)

-   **Modules / Packages**
    -   `src/lib/github/types.ts` (From Plan 1)
    -   `src/lib/github/utils.ts` (From Plan 1)
    -   `src/lib/github/auth.ts` (From Plan 2)
    -   `src/lib/github/repositories.ts`: **Responsibility:** Fetch repository data via GitHub API using authenticated Octokit clients provided by `auth.ts`. Includes logic for fetching all repos (OAuth/App) and potentially specific repo details if needed later. *No commit logic, no direct auth credential handling.* (Created and populated in this step)
    -   `src/lib/github.ts` (Original file - **Further Refactored**): Continues to export the full original API but now delegates repository fetching logic to `@/lib/github/repositories`. Mainly contains commit logic at this stage.

-   **Public Interfaces / Contracts** (Relevant Sketches)
    -   `repositories.ts`:
        ```ts
        import * as GitHubTypes from './types';
        import * as GitHubAuth from './auth';
        // Potentially import utils too

        export async function fetchAllRepositories(params: { accessToken?: string; installationId?: number }): Promise<GitHubTypes.Repository[]>;
        // Potentially separate OAuth/App versions if needed, but combined is simpler
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
            AU[auth.ts]
            R[repositories.ts]
            C["commits.ts (Future)"]
            Idx["index.ts (Future)"]

            R -- uses types --> T
            R -- uses utils --> U
            R -- uses auth --> AU

            AU -- creates --> Octo{Octokit Instance}
            R -- uses --> Octo
            Octo -- interacts --> ExtAPI([GitHub API])

            %% Future modules will use AU, T, U, and possibly R
            C -- uses --> AU
            C -- uses --> T
            C -- uses --> U
            C -- may use repo info --> R(Potentially)
        end

        ConsumerCode --> OrigGithub
        OrigGithub -- imports from --> T
        OrigGithub -- imports from --> U
        OrigGithub -- imports from --> AU
        OrigGithub -- imports from --> R
    ```

## Error & Edge-Case Strategy (Relevant Aspects)
-   **Consistency:** `repositories.ts` should use `utils.formatGitHubError` for standardizing API errors.
-   **Graceful Handling:** Return empty arrays (`[]`) for expected "not found" scenarios (e.g., no repositories accessible).
-   **Input Validation:** Perform basic validation of required parameters (e.g., `accessToken` or `installationId` must be provided).
-   **Rate Limits:** Implement defensive rate limit checks (`utils.checkRateLimit`) before potentially expensive operations like fetching all repositories via pagination. Log warnings on low limits.

## Detailed Build Steps

1.  **Create Repositories Module:** Create the file `src/lib/github/repositories.ts`.
2.  **Extract Repository Logic:** Identify and move all repository fetching functions (`fetchAllRepositories*`, potentially others if they exist) from the *current version* of `src/lib/github.ts` to `src/lib/github/repositories.ts`.
3.  **Refactor Internal Imports (repositories.ts):** Update the code *within* `repositories.ts` to use imports from sibling modules:
    *   `import * as GitHubTypes from './types';`
    *   `import * as GitHubUtils from './utils';`
    *   `import * as GitHubAuth from './auth';`
    *   Ensure imports for external libraries like `@octokit/core` are consistent with the project structure.
    *   Export all repository-related functions that were part of the original public API.
4.  **Refactor Original File (github.ts):** Modify the *original* `src/lib/github.ts` file:
    *   Remove the repository fetching logic that was just moved.
    *   Add imports for the necessary functions from the new repositories module (e.g., `import * as GitHubRepos from './github/repositories';`).
    *   Ensure the *exported API* of `src/lib/github.ts` remains unchanged for external consumers. If repository functions were directly exported before, `src/lib/github.ts` should now re-export them from `GitHubRepos` (e.g., `export const fetchAllRepositories = GitHubRepos.fetchAllRepositories;`).
5.  **Write Repository Unit Tests:** Create `src/lib/github/repositories.test.ts`.
    *   Mock the Octokit methods used within repository fetching functions.
    *   Test different repository fetching paths (OAuth, App Installation), input handling (params validation), response parsing, error handling, and pagination. 
    *   Do *not* mock the `auth.ts` module; instead, pass in mock Octokit instances directly if the testing structure allows.
    *   Aim for high coverage (e.g., ≥ 90%).
6.  **Static Analysis:** Run `npm run lint` and `npm run typecheck`. Fix all reported issues.
7.  **Test Execution (Units):** Run unit tests for `utils` (from Plan 1), `auth` (from Plan 2), and the new `repositories` module. Debug and fix failures.
8.  **Test Execution (Integration):** Run the *entire existing* integration test suite. Verify that code paths using repository fetching (which now flows through `src/lib/github.ts` -> `repositories.ts`) still work correctly. Debug and fix any regressions.

## Testing Strategy

-   **New Unit Tests:** Focus on `src/lib/github/repositories.ts`. Mock Octokit methods but use real instances of sibling modules like `auth.ts` where possible. Test all fetching scenarios (different auth methods, response formats, pagination), error handling, and edge cases like empty responses.
-   **Existing Integration Tests:** Continue to run the full suite against the `src/lib/github.ts` facade to verify that repository-fetching functions still work correctly through the delegation.

## Logging & Observability

-   Implement logging within `repositories.ts` using the same consistent approach as in other modules.
    -   Log entry/exit points of public functions (debug level).
    -   Log significant actions like "Fetching all repositories for installation X".
    -   Log repository counts, types (public/private), and other relevant metadata.
    -   Log warnings for potential issues (e.g., missing permissions, low rate limits).
    -   Log errors with appropriate context.
-   If the application uses correlation IDs, ensure they're propagated through calls to Octokit methods if possible.

## Security & Config

-   **Secure Inputs:** Validate all inputs to public functions, especially those coming from user input that might affect API calls.
-   **User-Data Exposure:** The repository module deals with potentially sensitive data (private repositories). Ensure proper access control based on the user's GitHub permissions.
-   **Rate Limiting:** Implement defensive checks to avoid rate limit exhaustion. Consider adding circuit breakers for large repository collections.

## Documentation

-   Add TSDoc blocks (`/** ... */`) to all exported functions in `repositories.ts`. Document parameters, return values, and potential errors (`@throws`).
-   Add a file-level comment in `repositories.ts` explaining its responsibility for fetching GitHub repository data.
-   Document any performance considerations related to pagination or batching.

## Risk Matrix (Focus for this Plan)

| Risk                                                     | Severity | Mitigation                                                                                                                              |
| :------------------------------------------------------- | :------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| **Functionality Regression (API Integration)**           | High     | Comprehensive unit tests for `repositories.ts`. Run integration tests that depend on repo fetching. Manual verification of repos listing. |
| **Rate Limit Handling**                                  | Medium   | Explicit testing of rate limit handling logic. Documentation of potential edge cases for heavy usage.                                    |
| **Pagination Errors**                                    | Medium   | Test with mock data simulating multi-page responses. Test error cases during pagination.                                                 |
| **Performance (Large Organizations)**                    | Medium   | Consider potential optimizations for repositories with hundreds/thousands of repos (e.g., caching, pagination).                           |
| **Circular Dependencies**                                | Low      | Ensure the dependency graph remains acyclic: `repositories.ts` depends on `auth.ts` but not vice versa.                                   |

## Open Questions (From Original Plan)
-   Does this module need to handle repository caching, or is this managed at a higher level?
-   Should repository type definitions in `types.ts` be extended to include additional metadata that might be useful for the application?
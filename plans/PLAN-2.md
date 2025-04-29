# Plan 2/7: Decompose `src/lib/github.ts` - Authentication Module

## Introduction & Goal

This is the second sub-plan in the decomposition of the monolithic `src/lib/github.ts`, building upon Plan 1.

**Goal:** Isolate all authentication-related concerns (Octokit client instantiation for OAuth & GitHub App, App installation logic, token validation, management URL generation) into a dedicated `src/lib/github/auth.ts` module. This plan involves moving the relevant logic from the *remaining* code in `src/lib/github.ts` and refactoring the original file to delegate auth tasks to the new module, maintaining backward compatibility.

## Context

Following the extraction of types and utilities in Plan 1, this step focuses on modularizing the critical authentication layer. This improves separation of concerns, confines sensitive credential handling, and simplifies testing of authentication logic. The `auth.ts` module will become the single source for obtaining authenticated GitHub API clients.

## Dependency Notes

*   **Depends on:** Plan 1 (Foundation: Types & Utils) - Requires `src/lib/github/types.ts` and `src/lib/github/utils.ts` to exist and be functional.
*   **Blocks:** Plan 3 (Repositories) and Plan 4 (Commits) depend on this `auth.ts` module to obtain authenticated Octokit instances. Plan 5 (Barrel File) requires this module to exist for re-exporting.

## Chosen Approach

1.  Create the new authentication module file `src/lib/github/auth.ts`.
2.  Identify and move all authentication-specific code (Octokit creation, App logic, token validation, etc.) from the *current* `src/lib/github.ts` into `auth.ts`.
3.  Refactor the code *within* `auth.ts` to correctly import and use types from `../types` and utilities from `../utils`.
4.  Refactor the remaining code in `src/lib/github.ts` to import functions/classes from the new `auth.ts` module and delegate all authentication tasks to it. The external API of `src/lib/github.ts` must remain unchanged.
5.  Write comprehensive unit tests specifically for the logic within `auth.ts`, mocking external dependencies like Octokit methods and App auth libraries.
6.  Validate the changes through static analysis, new unit tests, and the existing integration test suite (run against the `src/lib/github.ts` facade).

## Architecture Blueprint (Focus: Auth)

-   **Modules / Packages**
    -   `src/lib/github/types.ts` (From Plan 1)
    -   `src/lib/github/utils.ts` (From Plan 1)
    -   `src/lib/github/auth.ts`: **Responsibility:** Handle all authentication and Octokit client instantiation logic (OAuth & GitHub App), installation checking/fetching, token validation, and management URL generation. *Uses `types.ts` and `utils.ts`. No business logic related to repositories or commits. Contains secrets handling.* (Created and populated in this step)
    -   `src/lib/github.ts` (Original file - **Further Refactored**): Continues to export the full original API but now delegates authentication logic to `@/lib/github/auth`. Still contains repository and commit logic at this stage.

-   **Public Interfaces / Contracts** (Relevant Sketches)
    -   `auth.ts`:
        ```ts
        import { Octokit } from '@octokit/core'; // Or appropriate type
        import * as GitHubTypes from './types';
        import * as GitHubUtils from './utils';

        export function createOAuthOctokit(accessToken: string): Octokit;
        export function getInstallationOctokit(installationId: number): Promise<Octokit>;
        export function getAllAppInstallations(accessToken: string): Promise<GitHubTypes.AppInstallation[]>;
        export function checkAppInstallation(accessToken: string): Promise<number | null>;
        export function getInstallationManagementUrl(/* ... */): string;
        export function validateOAuthToken(accessToken: string): Promise<{ isValid: boolean; login?: string; scopes: string[]; /* ... */ }>;
        // ... other relevant auth functions extracted from original github.ts
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
            R["repositories.ts (Future)"]
            C["commits.ts (Future)"]
            Idx["index.ts (Future)"]

            AU -- uses types --> T
            AU -- uses utils --> U

            AU -- creates --> Octo{Octokit Instance}
            Octo -- interacts --> ExtAPI([GitHub API])

            %% Future modules will use AU
            R -- uses --> AU
            C -- uses --> AU
            U -- uses --> Octo(for rate limit check) %% utils might use Octokit instance provided to it
        end

        ConsumerCode --> OrigGithub
        OrigGithub -- imports from --> T
        OrigGithub -- imports from --> U
        OrigGithub -- imports from --> AU
    ```

## Error & Edge-Case Strategy (Relevant Aspects)
-   **Consistency:** `auth.ts` should use `utils.formatGitHubError` (from Plan 1) to normalize errors from Octokit/GitHub API calls related to authentication.
-   **Clarity:** Functions in `auth.ts` should throw specific, meaningful errors for configuration issues (e.g., missing credentials) or unrecoverable API errors (e.g., invalid token).
-   **Input Validation:** Perform basic validation on critical inputs (e.g., non-empty tokens, valid IDs) at the entry points of public functions in `auth.ts`.

## Detailed Build Steps

1.  **Create Auth Module:** Create the file `src/lib/github/auth.ts`.
2.  **Extract Auth Logic:** Identify and move all authentication-related code (e.g., functions dealing with `Octokit` creation, GitHub App credentials/JWTs, installation IDs, token validation API calls, `GITHUB_APP_*` env vars) from the *current version* of `src/lib/github.ts` to `auth.ts`.
3.  **Refactor Internal Imports (auth.ts):** Update the code *within* `auth.ts` to use imports from sibling modules:
    *   `import * as GitHubTypes from './types';`
    *   `import * as GitHubUtils from './utils';`
    *   Ensure imports for external libraries like `@octokit/core`, `@octokit/auth-app` are correct.
    *   Export all functions/classes that need to be used by other modules (like `repositories.ts`, `commits.ts` later) or were part of the original public API.
4.  **Refactor Original File (github.ts):** Modify the *original* `src/lib/github.ts` file:
    *   Remove the authentication logic that was just moved.
    *   Add imports for the necessary functions/classes from the new auth module (e.g., `import * as GitHubAuth from './github/auth';`). Adjust path as needed.
    *   Update the remaining code within `src/lib/github.ts` (specifically, parts that previously handled auth directly, like repository/commit fetchers needing an Octokit instance) to call functions from the imported `GitHubAuth` module instead (e.g., replace internal Octokit creation with calls to `GitHubAuth.getInstallationOctokit(...)` or `GitHubAuth.createOAuthOctokit(...)`).
    *   Ensure the *exported API* of `src/lib/github.ts` remains unchanged for external consumers. If an auth function was directly exported before, ensure `src/lib/github.ts` now re-exports it from `GitHubAuth` (or handles the delegation internally).
5.  **Write Auth Unit Tests:** Create `src/lib/github/auth.test.ts`. Write comprehensive unit tests covering the logic within `auth.ts`.
    *   Mock external dependencies heavily: `Octokit` methods, `@octokit/auth-app`, environment variables (`process.env`), file system access (if reading keys).
    *   Test different auth flows (OAuth, App Installation), token validation logic, error handling (e.g., invalid credentials, API errors), installation checking logic.
    *   Aim for high coverage (e.g., ≥ 90%).
6.  **Static Analysis:** Run `npm run lint` and `npm run typecheck`. Fix all reported issues.
7.  **Test Execution (Units):** Run unit tests for `utils` (from Plan 1) and the new `auth` module (`npm test -- src/lib/github/utils.test.ts src/lib/github/auth.test.ts` or similar). Debug and fix failures.
8.  **Test Execution (Integration):** Run the *entire existing* integration test suite (`npm test`). Verify that features relying on authentication (which now flows through `src/lib/github.ts` -> `auth.ts`) still work correctly. Debug and fix any regressions. Avoid major integration test refactoring here.

## Testing Strategy

-   **New Unit Tests:** Focus on `src/lib/github/auth.ts`. Mock external dependencies (Octokit, auth libraries, env vars). Test core logic: Octokit instantiation for different methods, installation fetching/checking, token validation, error handling for credential issues.
-   **Existing Integration Tests:** Run the full suite against the `src/lib/github.ts` facade. Ensure authentication-dependent features function correctly through the delegation to `auth.ts`.

## Logging & Observability

-   Implement logging within `auth.ts` using a consistent approach (e.g., `github:auth` context).
    -   Log entry/exit points of public functions (debug level).
    *   Log significant actions like "Creating installation Octokit for ID X", "Validating OAuth token".
    *   Log errors related to authentication failures, missing credentials, invalid tokens, with context.
    *   **Crucially, ensure no secrets (tokens, private keys) are logged.**
-   If the application uses correlation IDs, ensure `auth.ts` functions can accept and use a logger instance or context passed from the caller.

## Security & Config

-   **Secrets Handling:** This module is the **only** place where `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY_PKCS8` should be accessed. Ensure the private key is handled securely (e.g., read from env var, not committed). **Strictly avoid logging secrets.**
-   **Input Validation:** Implement critical validation for incoming tokens (`accessToken`, `installationId`) and App credentials read from environment variables within `auth.ts`.
-   **Least Privilege:** Continue creating Octokit instances with appropriate scopes. `validateOAuthToken` should verify required scopes if applicable, using `utils.validateTokenScopes` if needed.

## Documentation

-   Add TSDoc blocks (`/** ... */`) to all exported functions and potentially classes in `auth.ts`. Document parameters, return values, and potential errors (`@throws`), especially regarding authentication failures.
-   Add a file-level comment in `auth.ts` explaining its responsibility and security considerations (secrets handling).

## Risk Matrix (Focus for this Plan)

| Risk                                                     | Severity | Mitigation                                                                                                                                 |
| :------------------------------------------------------- | :------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| **Security Regression (Secret Leakage)**                 | High     | Confine secret access strictly to `auth.ts`. Rigorous code review focused on logging. Automated secret scanning in CI. Unit tests for masking. |
| **Functionality Regression (Auth Failure)**              | High     | Comprehensive unit tests for `auth.ts` covering all auth paths. Run full integration test suite. Manual testing of login/auth flows.         |
| **Configuration Errors (Env Vars)**                      | Medium   | Clear error messages in `auth.ts` if required env vars are missing/invalid. Unit tests covering config validation.                           |
| **Circular Dependencies**                                | Medium   | Ensure `auth.ts` only depends on `types.ts` and `utils.ts`. Code review and potentially static analysis (`madge`).                            |
| **Incomplete Refactoring**                               | Low      | Systematic extraction of all auth code. Code review. Verify `src/lib/github.ts` no longer handles auth logic directly.                    |

## Open Questions (From Original Plan)
-   Are there any implicit dependencies or side effects in the current `github.ts` initialization that consumers rely on? (Still relevant).
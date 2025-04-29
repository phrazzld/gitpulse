```markdown
# Plan: Decompose `src/lib/github.ts` into Focused Service Modules

## Chosen Approach (One-liner)
Systematically decompose the monolithic `src/lib/github.ts` into discrete, domain-focused modules under `src/lib/github/` (types, auth, repositories, commits, utils, index), enforcing strict separation of concerns and maintaining backward compatibility via a barrel file.

## Architecture Blueprint

-   **Modules / Packages**
    -   `src/lib/github/` (New directory)
        -   `types.ts`: **Responsibility:** Define all shared TypeScript interfaces and type aliases for GitHub API entities (e.g., `Repository`, `Commit`, `AppInstallation`, `GitHubUser`, `RateLimitInfo`). *Strictly types, no runtime code.*
        -   `auth.ts`: **Responsibility:** Handle all authentication and Octokit client instantiation logic (OAuth & GitHub App), installation checking/fetching, token validation, and management URL generation. *No business logic related to repositories or commits.*
        -   `repositories.ts`: **Responsibility:** Fetch repository data via GitHub API using authenticated Octokit clients provided by `auth.ts`. Includes logic for fetching all repos (OAuth/App) and potentially specific repo details if needed later. *No commit logic, no direct auth credential handling.*
        -   `commits.ts`: **Responsibility:** Fetch commit data via GitHub API using authenticated Octokit clients provided by `auth.ts`. Includes logic for fetching commits for single/multiple repositories, filtering, and batch processing. *No repository listing logic, no direct auth credential handling.*
        -   `utils.ts`: **Responsibility:** Provide pure, reusable utility functions specific to GitHub interactions (e.g., rate limit parsing, token scope validation, error formatting, deduplication, batch processing helpers, repo name splitting). *No API calls, no side effects, no direct auth/repo/commit logic.*
        -   `index.ts`: **Responsibility:** Act as a barrel file, re-exporting the public interfaces from all other modules (`types`, `auth`, `repositories`, `commits`, `utils`) to ensure backward compatibility for existing imports of `src/lib/github`. *Long-term, consumers should import directly from specific modules.*

-   **Public Interfaces / Contracts** (Signature Sketches)
    -   `types.ts`:
        ```ts
        export interface Repository { /* ... */ }
        export interface Commit { /* ... */ }
        export interface AppInstallation { /* ... */ }
        export interface RateLimitInfo { /* ... */ }
        export type GitHubAuthMethod = 'github_app' | 'oauth';
        // ... other relevant types
        ```
    -   `auth.ts`:
        ```ts
        export function createOAuthOctokit(accessToken: string): Octokit;
        export function getInstallationOctokit(installationId: number): Promise<Octokit>;
        export function getAllAppInstallations(accessToken: string): Promise<AppInstallation[]>;
        export function checkAppInstallation(accessToken: string): Promise<number | null>;
        export function getInstallationManagementUrl(/* ... */): string;
        export function validateOAuthToken(accessToken: string): Promise<{ isValid: boolean; login?: string; scopes: string[]; /* ... */ }>;
        ```
    -   `repositories.ts`:
        ```ts
        export async function fetchAllRepositories(params: { accessToken?: string; installationId?: number }): Promise<Repository[]>;
        // Potentially separate OAuth/App versions if needed, but combined is simpler
        ```
    -   `commits.ts`:
        ```ts
        interface FetchCommitsParams {
          accessToken?: string;
          installationId?: number;
          owner: string;
          repo: string;
          since: string;
          until: string;
          author?: string;
        }
        export async function fetchRepositoryCommits(params: FetchCommitsParams): Promise<Commit[]>;

        interface FetchCommitsForReposParams {
          accessToken?: string;
          installationId?: number;
          repositories: { owner: string; repo: string }[];
          since: string;
          until: string;
          author?: string;
          batchSize?: number; // Added for clarity
        }
        export async function fetchCommitsForRepositories(params: FetchCommitsForReposParams): Promise<Map<string, Commit[]>>; // Map repoFullName -> commits
        ```
    -   `utils.ts`:
        ```ts
        export async function checkRateLimit(octokit: Octokit, authMethod?: string): Promise<RateLimitInfo | null>;
        export function parseTokenScopes(scopesHeader?: string): string[];
        export function validateTokenScopes(scopes: string[], requiredScopes?: string[]): { isValid: boolean; missingScopes: string[]; };
        export function formatGitHubError(error: unknown): string;
        export function deduplicateBy<T>(items: T[], keyFn: (item: T) => string | number): T[];
        export function splitRepoFullName(fullName: string): { owner: string; repo: string };
        export async function processBatches<T, R>(items: T[], batchSize: number, processBatch: (batch: T[]) => Promise<R[]>): Promise<R[]>;
        ```
    -   `index.ts`:
        ```ts
        export * from './types';
        export * from './auth';
        export * from './repositories';
        export * from './commits';
        export * from './utils';
        export const MODULE_NAME = "github"; // Preserve for logging if needed
        ```

-   **Data Flow Diagram** (Mermaid)

    ```mermaid
    graph TD
        subgraph Consumers ["API Routes, Hooks, etc."]
            ConsumerCode["import { ... } from '@/lib/github'"]
            ConsumerCodeSpecific["import { fetchCommitsForRepositories } from '@/lib/github/commits'"]
        end

        subgraph GitHub Library ["src/lib/github/"]
            Idx["index.ts (Barrel File)"] -- re-exports --> T[types.ts]
            Idx -- re-exports --> AU[auth.ts]
            Idx -- re-exports --> R[repositories.ts]
            Idx -- re-exports --> C[commits.ts]
            Idx -- re-exports --> U[utils.ts]

            AU -- uses types --> T
            R -- uses types --> T
            C -- uses types --> T
            U -- uses types --> T

            R -- uses auth --> AU
            C -- uses auth --> AU

            AU -- uses utils --> U
            R -- uses utils --> U
            C -- uses utils --> U

            C -- may use repo info --> R(Potentially, if fetching commits needs repo details not passed in)

            AU -- creates --> Octo{Octokit Instance}
            Octo -- interacts --> ExtAPI([GitHub API])
            R -- uses --> Octo
            C -- uses --> Octo
            U -- uses --> Octo(for rate limit check)
        end

        ConsumerCode --> Idx
        ConsumerCodeSpecific --> C
        %% Direct imports are preferred long-term
        %% ConsumerCodeSpecific --> R
        %% ConsumerCodeSpecific --> AU
        %% ConsumerCodeSpecific --> U
    ```

-   **Error & Edge-Case Strategy**
    -   **Consistency:** Use `utils.formatGitHubError` to normalize errors originating from Octokit/GitHub API calls before propagating them.
    -   **Clarity:** Functions throw specific, meaningful errors for configuration issues (e.g., missing credentials handled in `auth.ts`) or unrecoverable API errors (e.g., invalid token). Avoid throwing raw Octokit errors directly.
    -   **Graceful Handling:** Return empty arrays (`[]`) or `null` for expected "not found" scenarios (e.g., no commits in range, 404s during pagination) rather than throwing.
    -   **Input Validation:** Public functions perform basic validation on critical inputs (e.g., non-empty tokens, valid IDs) at their entry points.
    -   **Rate Limits:** Implement defensive rate limit checks (`utils.checkRateLimit`) before potentially expensive operations (like pagination). Log warnings on low limits; treat critical limit errors as API errors.
    -   **Batching:** `commits.ts` batch processing must handle partial failures within a batch gracefully (log failed items, continue processing others, return partial results clearly marked or aggregated).

## Detailed Build Steps

1.  **Setup:** Create the new directory `src/lib/github/`.
2.  **Extract Types:** Identify and move all GitHub-related `interface` and `type` definitions from `src/lib/github.ts` to `src/lib/github/types.ts`. Export all necessary types.
3.  **Extract Utilities:** Identify and move pure utility functions (rate limit parsing, error formatting, deduplication, batch helpers, string manipulation) to `src/lib/github/utils.ts`. Update internal imports within these functions to use `../types` if needed. Export public utilities.
4.  **Extract Auth Logic:** Move all authentication-related code (Octokit creation, App installation logic, token validation, management URL) to `src/lib/github/auth.ts`. Update imports to use `../types` and `../utils`. Export public auth functions.
5.  **Extract Repository Logic:** Move repository fetching functions (`fetchAllRepositories*`) to `src/lib/github/repositories.ts`. Update imports to use `../types`, `../utils`, and crucially, `../auth` for obtaining Octokit instances. Export public repository functions.
6.  **Extract Commit Logic:** Move commit fetching functions (`fetchRepositoryCommits*`, `fetchCommitsForRepositories`) to `src/lib/github/commits.ts`. Update imports to use `../types`, `../utils`, and `../auth`. Export public commit functions.
7.  **Create Barrel File:** Create `src/lib/github/index.ts` and add `export * from './module';` statements for `types`, `auth`, `repositories`, `commits`, and `utils`. Add `export const MODULE_NAME = "github";` if needed for logging consistency.
8.  **Refactor Internal Dependencies:** Review each new module (`auth`, `repositories`, `commits`, `utils`) and ensure all internal calls now correctly reference functions imported from their sibling modules (e.g., `repositories.ts` must import `getInstallationOctokit` from `auth.ts`). **Critically check for and eliminate circular dependencies.**
9.  **Update Consumers (Gradual):**
    *   Identify all files importing from the original `src/lib/github`.
    *   **Recommended:** Update imports to point directly to the new specific modules (e.g., `import { fetchCommitsForRepositories } from '@/lib/github/commits';`). This improves clarity and tree-shaking.
    *   **Alternative (for initial compatibility):** Leave imports pointing to `src/lib/github` which now uses the barrel file `index.ts`. Add comments encouraging future updates to specific modules.
10. **Update Tests:**
    *   Modify existing unit/integration tests that mocked the monolithic `src/lib/github` to mock the new granular modules (`@/lib/github/repositories`, `@/lib/github/commits`, etc.) at the boundary where they are consumed (e.g., in API route tests).
    *   Write *new* unit tests for the logic within each new module (`auth.test.ts`, `repositories.test.ts`, etc.), mocking only true external dependencies like Octokit methods.
11. **Static Analysis:** Run `npm run lint` and `npm run typecheck`. Fix all reported issues. Pay close attention to import errors and type mismatches.
12. **Testing Execution:** Run the full test suite (`npm test`). Debug and fix any failures caused by the refactoring or test updates.
13. **Manual Verification:** Manually test application features heavily reliant on GitHub integration (dashboard loading, repo selection, commit fetching, summary generation) to confirm no regressions.
14. **Cleanup:** Once confident, delete the contents of the original `src/lib/github.ts` (or the file itself), leaving only the `index.ts` barrel file if retaining backward compatibility entry point.

## Testing Strategy

-   **Test Layers:**
    -   **Unit Tests:** Each new module (`auth.ts`, `repositories.ts`, `commits.ts`, `utils.ts`) will have dedicated unit tests (`*.test.ts`). These tests focus on the internal logic of the module.
    -   **Integration Tests:** Existing integration tests (e.g., API route tests in `src/app/api/**/__tests__/*`, potentially hook tests) will be updated. These tests verify the interaction *between* the consuming code (API route, hook) and the public interface of the new GitHub modules.
-   **What to Mock:**
    -   **Unit Tests:** Mock ONLY true external dependencies: primarily `Octokit` client methods (`octokit.rest.*`, `octokit.paginate`) and potentially `@octokit/auth-app`. Do *not* mock calls between the new internal modules (e.g., `repositories.ts` calling `auth.ts`).
    -   **Integration Tests:** Mock the *entire* imported GitHub service module at the boundary of the code under test (e.g., in an API route test, `jest.mock('@/lib/github/repositories')`). This isolates the API route logic from the GitHub library's implementation details.
-   **Coverage Targets & Edge-Case Notes:**
    -   Aim for ≥ 90% statement coverage for new unit tests (`auth.ts`, `repositories.ts`, `commits.ts`, `utils.ts`).
    -   Focus unit tests on logic branches, error handling (API errors, invalid inputs, rate limits), edge cases (empty results, pagination termination), and batch processing behavior (partial failures).
    -   Ensure integration tests cover scenarios where different GitHub modules interact (e.g., fetching repos then commits).

## Logging & Observability

-   **Log Events + Structured Fields:**
    -   Each module should use a specific logger instance or context (e.g., using `MODULE_NAME` like `github:auth`, `github:repositories`).
    -   Log entry/exit points of public functions (debug level).
    -   Log significant actions (e.g., "Fetching commits for X repos", "Creating installation Octokit").
    -   Log all errors with context (function name, relevant IDs like installationId/repo, error details).
    -   Log rate limit status checks, especially warnings for low remaining calls.
-   **Correlation ID Propagation:** This refactor does not introduce correlation IDs, but modules should accept an optional logger instance or context object if the calling layer (e.g., API routes) provides one, allowing context propagation.

## Security & Config

-   **Input Validation Hotspots:**
    -   `auth.ts`: Critical validation of incoming tokens and environment variables for App credentials.
    -   `repositories.ts`, `commits.ts`: Basic validation of required parameters like `owner`, `repo`, `since`, `until`. Ensure user-provided inputs like `author` are handled safely if used in API queries.
-   **Secrets Handling:**
    -   GitHub App credentials (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY_PKCS8`) MUST only be accessed within `auth.ts`.
    -   Ensure no secrets (App key, OAuth tokens) are ever logged, even in debug or error logs. Mask sensitive data in logs if necessary.
-   **Least-Privilege Notes:** The refactor doesn't change required permissions. `auth.ts` should continue creating Octokit instances with the narrowest necessary scope (installation token preferred over user OAuth where possible). Token scope validation (`utils.validateTokenScopes`) should be used where appropriate.

## Documentation

-   **Code Self-Doc Patterns:**
    -   Add TSDoc blocks (`/** ... */`) to all exported functions, interfaces, and types in the new modules (`types.ts`, `auth.ts`, `repositories.ts`, `commits.ts`, `utils.ts`). Document parameters (`@param`), return values (`@returns`), and potential errors (`@throws`).
    -   Use clear, descriptive names for modules, functions, variables, and types.
    -   Add file-level comments in each module explaining its specific responsibility.
-   **Required Readme or OpenAPI Updates:**
    -   Update any relevant section in `DEVELOPMENT_PHILOSOPHY.md` or a technical `README.md` describing the `src/lib/` structure to reflect the new `src/lib/github/` modules.
    -   No OpenAPI spec changes are required as this is an internal refactor preserving the external API contract.

## Risk Matrix

| Risk                                                     | Severity | Mitigation                                                                                                                                                                |
| :------------------------------------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Breaking Changes for Consumers**                       | High     | Provide `index.ts` barrel file for backward compatibility. Update integration tests thoroughly. Prioritize updating consumers to use direct imports. Communicate change. |
| **Functionality Regression (Logic Error/Omission)**      | High     | Implement comprehensive unit tests for each new module. Update and run all integration tests. Perform thorough manual QA on affected features. Use atomic commits.      |
| **Circular Dependencies Between Modules**                | Medium   | Strict adherence to dependency flow (Types -> Utils -> Auth -> Repos/Commits). Use static analysis tools (`madge`, ESLint rules) to detect cycles early. Code review. |
| **Inconsistent Error Handling Across Modules**           | Medium   | Standardize error formatting (`utils.formatGitHubError`). Define clear error handling strategy (throw vs. return null/empty). Enforce via code review and unit tests.    |
| **Test Suite Brittleness / Update Complexity**           | Medium   | Update mocks to target new module boundaries in integration tests. Write focused unit tests for module internals. This improves test isolation long-term.             |
| **Incomplete Refactoring (Code Left in Original File)**  | Low      | Systematic extraction process. Verify original file is empty/deleted at the end. Code review.                                                                           |
| **Security Regression (Secret Leakage)**                 | High     | Strict audit of logging within all new modules, especially error paths. Ensure secrets are confined to `auth.ts` and never logged. Automated secret scanning in CI.     |

## Open Questions

-   Are there any implicit dependencies or side effects in the current `github.ts` initialization that consumers rely on? (Requires careful code review of the original file and its usage).
-   Should the `index.ts` barrel file be considered temporary, with a plan to enforce direct imports across the codebase later?
-   Does the `fetchCommitsForRepositories` batch processing need more sophisticated error handling (e.g., returning partial success with errors)? Current plan assumes Map return.
-   Are there performance-critical paths that might be affected by the extra function calls between modules? (Unlikely significant, but worth noting if performance is already marginal).
```
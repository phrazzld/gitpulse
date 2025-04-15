# TODO

## Authentication Module (`src/lib/auth/githubAuth.ts`)
- [x] **Create Authentication Module File:**
    - **Action:** Create the new file `src/lib/auth/githubAuth.ts`.
    - **Depends On:** None
    - **AC Ref:** PLAN.md Step 1
- [x] **Define GitHubCredentials Type:**
    - **Action:** Define the `GitHubCredentials` discriminated union type in `githubAuth.ts`:
      ```typescript
      type GitHubCredentials =
        | { type: 'oauth'; token: string }
        | { type: 'app'; installationId: number };
      ```
    - **Depends On:** Create Authentication Module File
    - **AC Ref:** PLAN.md Step 1
- [x] **Implement `createAuthenticatedOctokit` Factory Function:**
    - **Action:** Implement `async function createAuthenticatedOctokit(credentials: GitHubCredentials): Promise<Octokit>` that handles both OAuth and App authentication methods. Include necessary imports and error handling.
    - **Depends On:** Define GitHubCredentials Type
    - **AC Ref:** PLAN.md Step 1
- [x] **Move and Integrate `getInstallationOctokit` Logic:**
    - **Action:** Move the logic from `getInstallationOctokit` in `src/lib/github.ts` into the 'app' branch of `createAuthenticatedOctokit`. The function should retrieve App credentials from environment variables, use `createAppAuth` to generate an installation token, and return an authenticated Octokit instance.
    - **Depends On:** Implement `createAuthenticatedOctokit` Factory Function
    - **AC Ref:** PLAN.md Step 1
- [x] **Move `checkAppInstallation` Function:**
    - **Action:** Move the `checkAppInstallation` function from `src/lib/github.ts` to `src/lib/auth/githubAuth.ts`. Update imports where this function is used.
    - **Depends On:** Create Authentication Module File
    - **AC Ref:** PLAN.md Step 1
- [x] **Move `getAllAppInstallations` Function:**
    - **Action:** Move the `getAllAppInstallations` function from `src/lib/github.ts` to `src/lib/auth/githubAuth.ts`. Update imports where this function is used.
    - **Depends On:** Create Authentication Module File
    - **AC Ref:** PLAN.md Step 1
- [x] **Add Error Handling and Logging to Auth Module:**
    - **Action:** Implement comprehensive error handling using custom error types (like `GitHubAuthError`, `GitHubConfigError`) and structured logging within all functions in `githubAuth.ts`.
    - **Depends On:** Implement `createAuthenticatedOctokit` Factory Function, Move `checkAppInstallation` Function, Move `getAllAppInstallations` Function
    - **AC Ref:** PLAN.md Step 1, Justification (Coding Conventions)

## Data Fetching Module (`src/lib/githubData.ts`)
- [x] **Create Data Fetching Module File:**
    - **Action:** Create the new file `src/lib/githubData.ts`.
    - **Depends On:** None
    - **AC Ref:** PLAN.md Step 2
- [x] **Move `fetchAllRepositories` Function:**
    - **Action:** Move the `fetchAllRepositories` function (and its variants like `fetchAllRepositoriesOAuth`, `fetchAllRepositoriesApp` if they exist) from `src/lib/github.ts` to `src/lib/githubData.ts`.
    - **Depends On:** Create Data Fetching Module File
    - **AC Ref:** PLAN.md Step 2
- [x] **Refactor `fetchAllRepositories` Signature:**
    - **Action:** Modify the signature of the moved `fetchAllRepositories` function to accept `octokit: Octokit` as a parameter instead of handling authentication internally. Remove internal Octokit instance creation.
    - **Depends On:** Move `fetchAllRepositories` Function
    - **AC Ref:** PLAN.md Step 2
- [x] **Move `fetchRepositoryCommits` Function:**
    - **Action:** Move the `fetchRepositoryCommits` function (and its variants) from `src/lib/github.ts` to `src/lib/githubData.ts`.
    - **Depends On:** Create Data Fetching Module File
    - **AC Ref:** PLAN.md Step 2
- [x] **Refactor `fetchRepositoryCommits` Signature:**
    - **Action:** Modify the signature of the moved `fetchRepositoryCommits` function to accept `octokit: Octokit` as a parameter. Remove internal Octokit instance creation.
    - **Depends On:** Move `fetchRepositoryCommits` Function
    - **AC Ref:** PLAN.md Step 2
- [x] **Move `fetchCommitsForRepositories` Function:**
    - **Action:** Move the `fetchCommitsForRepositories` function from `src/lib/github.ts` to `src/lib/githubData.ts`.
    - **Depends On:** Create Data Fetching Module File
    - **AC Ref:** PLAN.md Step 2
- [x] **Refactor `fetchCommitsForRepositories` Signature:**
    - **Action:** Modify the signature of the moved `fetchCommitsForRepositories` function to accept `octokit: Octokit` as a parameter. Remove internal Octokit instance creation.
    - **Depends On:** Move `fetchCommitsForRepositories` Function
    - **AC Ref:** PLAN.md Step 2
- [x] **Verify Data Fetching Auth Independence:**
    - **Action:** Review all functions within `githubData.ts` to ensure they rely solely on the provided `Octokit` instance for authentication and make no assumptions about the underlying auth mechanism.
    - **Depends On:** Refactor `fetchAllRepositories` Signature, Refactor `fetchRepositoryCommits` Signature, Refactor `fetchCommitsForRepositories` Signature
    - **AC Ref:** PLAN.md Step 2
- [x] **Verify Error Handling in Data Fetching Module:**
    - **Action:** Ensure that the existing error handling patterns and type definitions from the original functions in `github.ts` have been preserved or appropriately adapted in `githubData.ts`.
    - **Depends On:** Verify Data Fetching Auth Independence
    - **AC Ref:** PLAN.md Step 2

## API Route Updates
- [x] **Refactor `/api/repos` Route Handler:**
    - **Action:** Update the `/api/repos/route.ts` handler to: 1) Get auth details from session, 2) Determine `GitHubCredentials`, 3) Call `createAuthenticatedOctokit` from `githubAuth.ts`, 4) Pass the resulting `octokit` client to the refactored `fetchAllRepositories` in `githubData.ts`, 5) Maintain existing response format and error handling.
    - **Depends On:** Add Error Handling and Logging to Auth Module, Refactor `fetchAllRepositories` Signature
    - **AC Ref:** PLAN.md Step 3
- [x] **Refactor `/api/my-activity` Route Handler:**
    - **Action:** Update the `/api/my-activity/route.ts` handler: Get auth details from session, create client via `createAuthenticatedOctokit`, pass client to `fetchCommitsForRepositories` in `githubData.ts`. Maintain response format and error handling.
    - **Depends On:** Add Error Handling and Logging to Auth Module, Refactor `fetchCommitsForRepositories` Signature
    - **AC Ref:** PLAN.md Step 3
- [x] **Refactor `/api/summary` Route Handler:**
    - **Action:** Update the `/api/summary/route.ts` handler: Get auth details from session, create client via `createAuthenticatedOctokit`, pass client to appropriate data fetching functions. Maintain response format and error handling.
    - **Depends On:** Add Error Handling and Logging to Auth Module, Refactor `fetchAllRepositories` Signature, Refactor `fetchCommitsForRepositories` Signature
    - **AC Ref:** PLAN.md Step 3
- [x] **Refactor `/api/contributors` Route Handler:**
    - **Action:** Update the `/api/contributors/route.ts` handler: Get auth details from session, create client via `createAuthenticatedOctokit`, pass client to appropriate data fetching functions. Maintain response format and error handling.
    - **Depends On:** Add Error Handling and Logging to Auth Module, Refactor `fetchAllRepositories` Signature, Refactor `fetchCommitsForRepositories` Signature
    - **AC Ref:** PLAN.md Step 3
- [x] **Refactor `/api/my-org-activity` Route Handler:**
    - **Action:** Update the `/api/my-org-activity/route.ts` handler: Get auth details from session, create client via `createAuthenticatedOctokit`, pass client to appropriate data fetching functions. Maintain response format and error handling.
    - **Depends On:** Add Error Handling and Logging to Auth Module, Refactor `fetchAllRepositories` Signature, Refactor `fetchCommitsForRepositories` Signature
    - **AC Ref:** PLAN.md Step 3
- [ ] **Refactor `/api/team-activity` Route Handler:**
    - **Action:** Update the `/api/team-activity/route.ts` handler: Get auth details from session, create client via `createAuthenticatedOctokit`, pass client to appropriate data fetching functions. Maintain response format and error handling.
    - **Depends On:** Add Error Handling and Logging to Auth Module, Refactor `fetchAllRepositories` Signature, Refactor `fetchCommitsForRepositories` Signature
    - **AC Ref:** PLAN.md Step 3
- [ ] **Verify API Route Error Handling:**
    - **Action:** Review all updated API route handlers to ensure error handling (including errors from the auth and data modules) is consistent and results in appropriate HTTP responses.
    - **Depends On:** Refactor all Route Handlers
    - **AC Ref:** PLAN.md Step 3

## Testing Updates
- [ ] **Write Unit Tests for `createAuthenticatedOctokit`:**
    - **Action:** Create `src/lib/auth/githubAuth.test.ts` and write unit tests covering both OAuth and App authentication paths, including success and error cases. Mock environment variables and `createAppAuth` as needed.
    - **Depends On:** Add Error Handling and Logging to Auth Module
    - **AC Ref:** PLAN.md Step 4
- [ ] **Update Tests for `fetchAllRepositories`:**
    - **Action:** Update existing unit/integration tests for `fetchAllRepositories` to pass a mocked `Octokit` instance instead of mocking internal auth logic. Verify the correct Octokit methods are called.
    - **Depends On:** Refactor `fetchAllRepositories` Signature
    - **AC Ref:** PLAN.md Step 4
- [ ] **Update Tests for `fetchRepositoryCommits`:**
    - **Action:** Update existing unit/integration tests for `fetchRepositoryCommits` to use a mocked `Octokit` instance.
    - **Depends On:** Refactor `fetchRepositoryCommits` Signature
    - **AC Ref:** PLAN.md Step 4
- [ ] **Update Tests for `fetchCommitsForRepositories`:**
    - **Action:** Update existing unit/integration tests for `fetchCommitsForRepositories` to use a mocked `Octokit` instance.
    - **Depends On:** Refactor `fetchCommitsForRepositories` Signature
    - **AC Ref:** PLAN.md Step 4
- [ ] **Update API Route Tests:**
    - **Action:** Update integration tests for all API routes. Mock the `createAuthenticatedOctokit` factory and/or the data fetching functions as appropriate for each test. Verify correct credential handling and client passing.
    - **Depends On:** Refactor all Route Handlers
    - **AC Ref:** PLAN.md Step 4

## Types and Documentation
- [ ] **Review and Update GitHub Types:**
    - **Action:** Review `src/types/github.ts` and update any type definitions affected by the refactoring, or add new ones if necessary.
    - **Depends On:** Define GitHubCredentials Type, Verify Data Fetching Auth Independence
    - **AC Ref:** PLAN.md Step 5
- [ ] **Add TSDoc to Auth Module:**
    - **Action:** Add comprehensive TSDoc comments to exported functions, types, and interfaces in `src/lib/auth/githubAuth.ts`.
    - **Depends On:** Add Error Handling and Logging to Auth Module
    - **AC Ref:** PLAN.md Step 5
- [ ] **Add TSDoc to Data Fetching Module:**
    - **Action:** Add comprehensive TSDoc comments to exported functions in `src/lib/githubData.ts`.
    - **Depends On:** Verify Error Handling in Data Fetching Module
    - **AC Ref:** PLAN.md Step 5
- [ ] **Update Project Documentation:**
    - **Action:** Review project README or other relevant documentation and update sections describing the GitHub interaction or authentication flow if necessary.
    - **Depends On:** Add TSDoc to Auth Module, Add TSDoc to Data Fetching Module
    - **AC Ref:** PLAN.md Step 5

## Finalization
- [ ] **Remove Original Functions from `github.ts`:**
    - **Action:** Once all usages are updated and tests pass, remove the original implementations of the moved functions from `src/lib/github.ts`. If all functions are moved, consider removing the file entirely or leaving a clear comment explaining that functionality has been moved.
    - **Depends On:** Update API Route Tests
    - **AC Ref:** PLAN.md Steps 1 & 2

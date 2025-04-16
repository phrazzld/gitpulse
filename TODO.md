# TODO

## 1. Standardize API Error Handling
- [x] **T001:** Wrap `contributors/route.ts` handler with `withErrorHandling` HOF
    - **Action:** Import `withErrorHandling` from `src/lib/auth/apiErrorHandler.ts` and wrap the main `GET` function in `src/app/api/contributors/route.ts`. Ensure the module name is passed correctly for logging context.
    - **Depends On:** None
    - **AC Ref:** Standardize API Error Handling Plan, Success Criteria 1
- [x] **T002:** Wrap `my-activity/route.ts` handler with `withErrorHandling` HOF
    - **Action:** Import `withErrorHandling` from `src/lib/auth/apiErrorHandler.ts` and wrap the main `GET` function in `src/app/api/my-activity/route.ts`. Ensure the module name is passed correctly for logging context.
    - **Depends On:** None
    - **AC Ref:** Standardize API Error Handling Plan, Success Criteria 1
- [x] **T003:** Wrap `my-org-activity/route.ts` handler with `withErrorHandling` HOF
    - **Action:** Import `withErrorHandling` from `src/lib/auth/apiErrorHandler.ts` and wrap the main `GET` function in `src/app/api/my-org-activity/route.ts`. Ensure the module name is passed correctly for logging context.
    - **Depends On:** None
    - **AC Ref:** Standardize API Error Handling Plan, Success Criteria 1
- [x] **T004:** Wrap `summary/route.ts` handler with `withErrorHandling` HOF
    - **Action:** Import `withErrorHandling` from `src/lib/auth/apiErrorHandler.ts` and wrap the main `GET` function in `src/app/api/summary/route.ts`. Ensure the module name is passed correctly for logging context.
    - **Depends On:** None
    - **AC Ref:** Standardize API Error Handling Plan, Success Criteria 1
- [x] **T005:** Wrap `team-activity/route.ts` handler with `withErrorHandling` HOF
    - **Action:** Import `withErrorHandling` from `src/lib/auth/apiErrorHandler.ts` and wrap the main `GET` function in `src/app/api/team-activity/route.ts`. Ensure the module name is passed correctly for logging context.
    - **Depends On:** None
    - **AC Ref:** Standardize API Error Handling Plan, Success Criteria 1
- [x] **T006:** Add tests for consistent API error handling
    - **Action:** Create or update tests for each API route (`contributors`, `my-activity`, `my-org-activity`, `summary`, `team-activity`) to specifically verify that common errors (e.g., authentication failure, rate limiting, resource not found) result in consistent, standardized error responses as defined by `apiErrorHandler.ts`.
    - **Depends On:** [T001, T002, T003, T004, T005]
    - **AC Ref:** Standardize API Error Handling Plan, Success Criteria 1, Success Criteria 5

## 2. Remove Usage of Deprecated Wrapper Functions
- [x] **T007:** Replace `fetchAllRepositories` calls in API routes
    - **Action:** In `src/app/api/contributors/route.ts:108`, `src/app/api/my-activity/route.ts:115`, `src/app/api/my-org-activity/route.ts:151`, and `src/app/api/team-activity/route.ts:150`, replace calls to the deprecated `fetchAllRepositories` wrapper with direct calls to either `fetchAppRepositories(octokit)` or `fetchRepositories(octokit)` using the already authenticated `octokit` instance.
    - **Depends On:** [T001, T002, T003, T005]
    - **AC Ref:** Remove Usage of Deprecated Wrapper Functions Plan, Success Criteria 2
- [ ] **T008:** Replace `fetchCommitsForRepositories` calls in `contributors/route.ts`
    - **Action:** In `src/app/api/contributors/route.ts` (lines 122 and 170), replace calls to the deprecated `fetchCommitsForRepositories` wrapper with direct calls to `fetchCommitsForRepositoriesWithOctokit(octokit, ...)` using the already authenticated `octokit` instance.
    - **Depends On:** [T001]
    - **AC Ref:** Remove Usage of Deprecated Wrapper Functions Plan, Success Criteria 2
- [ ] **T009:** Update tests to reflect deprecated wrapper removal
    - **Action:** Review and update unit/integration tests for the API routes modified in T007 and T008. Ensure tests now mock the new direct function calls (`fetchAppRepositories`, `fetchRepositories`, `fetchCommitsForRepositoriesWithOctokit`) instead of the deprecated wrappers. Verify test coverage remains adequate.
    - **Depends On:** [T007, T008]
    - **AC Ref:** Remove Usage of Deprecated Wrapper Functions Plan, Success Criteria 2, Success Criteria 5

## 3. Improve Authentication Documentation
- [ ] **T010:** Update `.env.local.example` with GitHub App variable details
    - **Action:** Edit `.env.local.example`. Add descriptive comments for `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY_PKCS8`, and `NEXT_PUBLIC_GITHUB_APP_NAME`. Clarify which variables are mandatory for OAuth vs. GitHub App authentication.
    - **Depends On:** None
    - **AC Ref:** Improve Authentication Documentation Plan, Success Criteria 3
- [ ] **T011:** Expand README "Authentication" section
    - **Action:** Edit `README.md`. Enhance the "Authentication" or "Troubleshooting Authentication" section to clearly explain both the OAuth and GitHub App authentication methods, how they are configured, and their use cases.
    - **Depends On:** None
    - **AC Ref:** Improve Authentication Documentation Plan, Success Criteria 3
- [ ] **T012:** Add authentication flow diagram to README
    - **Action:** Create a simple flow diagram (e.g., using MermaidJS) illustrating the authentication process (session check, credential selection, Octokit creation). Embed this diagram in the `README.md` authentication section.
    - **Depends On:** [T011]
    - **AC Ref:** Improve Authentication Documentation Plan, Success Criteria 3
- [ ] **T013:** Add troubleshooting steps to README auth section
    - **Action:** Edit `README.md`. Add a subsection within the "Authentication" or "Troubleshooting" section detailing common authentication issues (e.g., invalid token, missing scopes, App not installed, incorrect env vars) and their resolution steps for both OAuth and GitHub App methods.
    - **Depends On:** [T011]
    - **AC Ref:** Improve Authentication Documentation Plan, Success Criteria 3
- [ ] **T014:** Update BACKLOG.md
    - **Action:** Edit `BACKLOG.md`. Remove references to the now-completed "GitHub Library Restructuring". Review other tasks mentioned in the backlog and update their statuses if they were addressed by the refactoring or these improvement tasks.
    - **Depends On:** [T006, T009]
    - **AC Ref:** Improve Authentication Documentation Plan, Success Criteria 3

## 4. Expand Test Coverage for Error Cases
- [ ] **T015:** Add API route tests for specific GitHub error types
    - **Action:** In the API route tests (`src/__tests__/api/*.test.ts`), add specific test cases that mock the data fetching layer (`githubData.ts` functions) to throw `GitHubRateLimitError`, `GitHubNotFoundError`, and `GitHubAuthenticationError`.
    - **Depends On:** [T006]
    - **AC Ref:** Expand Test Coverage for Error Cases Plan, Success Criteria 4, Success Criteria 5
- [ ] **T016:** Verify error type mapping to HTTP status/response in tests
    - **Action:** Within the tests created in T015, assert that when specific `GitHubError` types are thrown, the `withErrorHandling` HOF correctly maps them to the appropriate HTTP status code (e.g., 429 for RateLimit, 404 for NotFound, 403 for Auth) and the standardized JSON error response format.
    - **Depends On:** [T015]
    - **AC Ref:** Expand Test Coverage for Error Cases Plan, Success Criteria 4, Success Criteria 5
- [ ] **T017:** Add integration tests validating the complete error handling flow
    - **Action:** Create integration tests (if not already present, or enhance existing ones) that simulate API requests triggering specific error conditions (e.g., invalid token, rate limit exceeded by mocking underlying Octokit calls). Verify the end-to-end flow produces the correct HTTP response.
    - **Depends On:** [T016]
    - **AC Ref:** Expand Test Coverage for Error Cases Plan, Success Criteria 4, Success Criteria 5

## 5. Development Environment Improvements
- [ ] **T018:** Fix Jest TypeScript type definitions
    - **Action:** Install Jest type definitions for TypeScript by running `npm install --save-dev @types/jest`. Update `tsconfig.json` if needed to include these types. This will resolve the numerous "Cannot find name 'jest'", "Cannot find name 'describe'", etc. TypeScript errors when running `npm run typecheck`.
    - **Depends On:** None
    - **AC Ref:** Maintainability (DEVELOPMENT_PHILOSOPHY.md, Core Principles #4)
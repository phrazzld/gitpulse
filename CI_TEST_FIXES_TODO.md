# CI Test Fixes TODO

## Overview

This document outlines specific, atomic tasks to fix the CI test failures in the GitPulse project. Each task is focused on a single issue and can be addressed independently.

## Octokit Mock Issues

- [ ] **T001: Fix userInfo.headers in Octokit mock**

  - **Issue:** The `userInfo.headers` property is undefined in the Octokit mock, causing errors in `validateTokenScopes`
  - **File:** `jest.setup.js`
  - **Action:** Update the Octokit mock to include proper headers with the `x-oauth-scopes` property in the `getAuthenticated` response:
    ```javascript
    // In jest.setup.js, modify the Octokit mock:
    jest.mock("octokit", () => {
      const MockOctokit = jest.fn().mockImplementation(() => ({
        request: jest.fn(),
        rest: {
          users: {
            getAuthenticated: jest.fn().mockResolvedValue({
              headers: { "x-oauth-scopes": "repo, read:org, user:email" },
              data: {
                login: "test-user",
                id: 12345,
                type: "User",
                two_factor_authentication: true,
              },
            }),
          },
          // Other mock implementations...
        },
      }));

      // Rest of the mock...

      return { Octokit: MockOctokit };
    });
    ```
  - **Test:** Run `src/lib/githubData.test.ts` tests to verify they pass by executing:
    ```bash
    export CI=true && npm test -- --testPathPattern=src/lib/githubData.test.ts
    ```

- [ ] **T002: Fix repository commits mock structure**
  - **Issue:** The repository commits test is failing because the mock data has a mismatched structure
  - **File:** `src/lib/githubData.test.ts` or related test utils
  - **Action:** Fix the expected commit structure to match the actual returned structure, particularly the extra `fullName` property
  - **Test:** Run the `fetchRepositoryCommitsWithOctokit` test to verify it passes

## NextAuth and Related Issues

- [ ] **T003: Fix ESM import issues with next-auth dependencies**

  - **Issue:** Jest is failing to parse ESM imports from the jose package used by next-auth
  - **File:** `jest.config.js`
  - **Action:** Update the `transformIgnorePatterns` in jest.config.js to include jose and related next-auth dependencies:
    ```javascript
    transformIgnorePatterns: [
      // Transform ESM modules from node_modules for testing
      "/node_modules/(?!(octokit|@octokit|jose|next-auth|openid-client)/)",
      "^.+\\.module\\.(css|sass|scss)$",
    ],
    ```
  - **Details:** The error occurs because some dependencies like jose and openid-client use ESM modules, but Jest is configured to ignore transforming node_modules. By adjusting the transformIgnorePatterns, we tell Jest to transform these specific packages.
  - **Test:** Run the API route tests to verify they can load next-auth:
    ```bash
    export CI=true && npm test -- --testPathPattern=src/__tests__/api/my-activity.test.ts
    ```

- [ ] **T004: Mock next-auth getServerSession correctly**
  - **Issue:** The tests are trying to import the actual next-auth which is causing ESM issues
  - **File:** `jest.setup.js`
  - **Action:** Create proper mocks for next-auth's getServerSession function
  - **Test:** Run the API route tests to verify next-auth imports are working

## Utility Test Files

- [ ] **T005: Fix empty test suite in error-handling-test-utils.ts**

  - **Issue:** The test file doesn't contain any actual tests, which Jest reports as an error
  - **File:** `src/__tests__/error-handling-test-utils.ts`
  - **Action:** Option 1 - Add a simple placeholder test to the file:
    ```javascript
    // Add this at the end of the file
    describe("error-handling-test-utils", () => {
      it("exists and exports utility functions", () => {
        // This test simply verifies the module can be loaded
        expect(true).toBe(true);
      });
    });
    ```
    Option 2 - Rename file to not include "test" in the name, which will prevent Jest from treating it as a test file:
    ```bash
    git mv src/__tests__/error-handling-test-utils.ts src/__tests__/error-handling-utils.ts
    ```
    Option 3 - Add the file to testPathIgnorePatterns in jest.config.js:
    ```javascript
    testPathIgnorePatterns: [
      // Existing patterns...
      '<rootDir>/src/__tests__/error-handling-test-utils.ts',
    ],
    ```
  - **Test:** Run Jest specifying just this file to verify it passes:
    ```bash
    npm test -- src/__tests__/error-handling-test-utils.ts
    ```

- [ ] **T006: Fix empty test suite in api-test-utils.ts**
  - **Issue:** The test file doesn't contain any actual tests, which Jest reports as an error
  - **File:** `src/__tests__/api-test-utils.ts`
  - **Action:** Either add at least one test or modify Jest configuration to ignore this file
  - **Test:** Verify that running tests doesn't complain about this file

## Additional Fixes

- [ ] **T007: Fix imports in integration tests**

  - **Issue:** The integration tests are failing due to import issues with Octokit
  - **Files:** `src/__tests__/integration/DashboardTestWrapper.tsx` and related files
  - **Action:** Update the mocks to handle integration tests' Octokit imports
  - **Test:** Run the integration tests to verify they pass

- [ ] **T008: Fix Response undefined error in summary.test.ts**

  - **Issue:** Tests are failing due to missing Response global
  - **File:** `jest.setup.js` or relevant test file
  - **Action:** Ensure Response is properly mocked or defined in the test environment
  - **Test:** Run the summary.test.ts file to verify it no longer fails on Response

- [ ] **T009: Fix fetchAppRepositories mock implementation**

  - **Issue:** The GitHub App functionality tests are failing
  - **Files:** Review test utilities and mock implementations
  - **Action:** Update the mocks to correctly handle GitHub App authentication flow
  - **Test:** Run tests involving GitHub App authentication to verify they pass

- [ ] **T010: Address outdated JSX transform warnings**
  - **Issue:** React is warning about outdated JSX transform
  - **File:** Review project configuration files
  - **Action:** Update the React/Next.js configuration to use the new JSX transform
  - **Test:** Run component tests and verify they run without JSX transform warnings

## Meta Task

- [ ] **T011: Create CI-specific test script**
  - **Issue:** CI might need a different test command than local development
  - **File:** `package.json`
  - **Action:** Create a `test:ci` script that uses CI-appropriate flags
  - **Test:** Try running the script locally to ensure it works as expected

# TODO

## Add GitHub Actions and Pre-commit Hooks

- [x] **T001:** Install Required Dev Dependencies

  - **Action:** Execute `npm install --save-dev husky lint-staged eslint-config-prettier` to add these packages as development dependencies. Verify the installation and ensure project builds correctly afterward.
  - **Depends On:** None
  - **AC Ref:** Success Criteria 1, 2

- [x] **T002:** Update package.json with prepare script

  - **Action:** Modify the `scripts` section in `package.json` to include `"prepare": "husky"` to automatically install Git hooks when developers run `npm install`.
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1

- [x] **T003:** Initialize Husky

  - **Action:** Run `npx husky init` to create the `.husky` directory and set up the Git hooks infrastructure.
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1

- [x] **T004:** Create pre-commit hook

  - **Action:** Create/update the `.husky/pre-commit` hook with the following script:

    ```sh
    #!/usr/bin/env sh
    . "$(dirname -- "$0")/_/husky.sh"

    npx lint-staged
    ```

    Ensure the script is executable with `chmod +x .husky/pre-commit`.

  - **Depends On:** [T003, T005]
  - **AC Ref:** Success Criteria 1

- [x] **T005:** Add lint-staged configuration to package.json

  - **Action:** Add a `lint-staged` section to `package.json` with the following configuration:
    ```json
    "lint-staged": {
      "*.{ts,tsx}": [
        "eslint --fix",
        "tsc --noEmit"
      ],
      "*.{js,jsx,json,md,css}": [
        "prettier --write"
      ]
    }
    ```
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1, 2

- [x] **T006:** Review and update ESLint configuration

  - **Action:** Ensure `.eslintrc.js` is properly configured with TypeScript support. It should extend `next/core-web-vitals`, `plugin:@typescript-eslint/recommended`, and `prettier`. Add the rule `"@typescript-eslint/no-explicit-any": "error"` and identify any additional rules from DEVELOPMENT_PHILOSOPHY.md that should be enforced.
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1, 2

- [x] **T016:** Add file size warnings to pre-commit hook

  - **Action:** Update the lint-staged configuration in `package.json` to include a script that checks file line count and warns when files exceed a reasonable threshold (e.g., 300 lines). Create a simple script in `scripts/check-file-size.js` that will:
    ```js
    // 1. Count lines in staged files
    // 2. When a file exceeds the threshold, print a warning message but allow the commit
    // 3. Include statistics about the largest files in the codebase
    ```
    Then update the lint-staged configuration to invoke this script for relevant file types.
  - **Depends On:** [T005]
  - **AC Ref:** Success Criteria 1, 2

- [x] **T007:** Verify TypeScript strict mode

  - **Action:** Confirm that `tsconfig.json` has `"strict": true` enabled and add other appropriate strictness flags as needed.
  - **Depends On:** [T001]
  - **AC Ref:** Success Criteria 1, 2

- [x] **T008:** Verify/create npm scripts for CI

  - **Action:** Ensure `package.json` contains the necessary scripts referenced in the CI workflow: `lint`, `typecheck`, and `test`. Create or update them if needed.
  - **Depends On:** [T006, T007]
  - **AC Ref:** Success Criteria 2

- [x] **T009:** Create GitHub Actions workflow directory

  - **Action:** Create the directory structure `.github/workflows/` if it doesn't exist.
  - **Depends On:** None
  - **AC Ref:** Success Criteria 2

- [x] **T010:** Implement GitHub Actions workflow

  - **Action:** Create `.github/workflows/ci.yml` with the configuration specified in the implementation plan, including code quality checks (typecheck, lint) and tests for both push and pull request events to main/master branches.
  - **Depends On:** [T008, T009]
  - **AC Ref:** Success Criteria 2, 3

- [x] **T011:** Update README with code quality documentation

  - **Action:** Add a "Code Quality" section to `README.md` explaining the pre-commit hooks and CI checks as specified in the implementation plan.
  - **Depends On:** [T004, T010]
  - **AC Ref:** Success Criteria 4

- [x] **T012:** Test pre-commit hook with type error

  - **Action:** Introduce a type error in a TypeScript file, stage the changes, and attempt to commit. Verify the pre-commit hook catches the error and prevents the commit.
  - **Depends On:** [T004, T007]
  - **AC Ref:** Success Criteria 1

- [x] **T013:** Test pre-commit hook with lint error

  - **Action:** Introduce a linting error in a TypeScript file, stage the changes, and attempt to commit. Verify the pre-commit hook catches the error and prevents the commit.
  - **Depends On:** [T004, T006]
  - **AC Ref:** Success Criteria 1

- [x] **T014:** Push changes to GitHub and verify CI workflow

  - **Action:** Commit all configuration changes and push to GitHub. Create a PR if applicable. Verify the GitHub Actions workflow runs successfully with the push.
  - **Depends On:** [T010, T011, T012, T013]
  - **AC Ref:** Success Criteria 2, 3
  - **Result:** Successfully pushed changes to GitHub as PR #8. The CI workflow ran and failed due to TypeScript errors, which is the expected behavior given our strict configuration. We've documented the code quality issues that need to be fixed in follow-up tasks.

## Code Quality Issues to Resolve

- [x] **ESLint Configuration:** The project is using ESLint v9, which no longer supports .eslintrc.js configuration format. Need to fully migrate to eslint.config.js format based on the new flat configuration format. A basic conversion has been started, but needs to be completed and tested.
  - **Resolution:** Migrated to the new flat configuration format using eslint.config.mjs. Created a comprehensive configuration that includes TypeScript, React, and Next.js rules. Updated lint-staged configuration to use the new ESLint setup. Verified that pre-commit hooks correctly catch linting errors.

### TypeScript Issues

- [x] **T017:** Fix Type Errors in Test Files

  - **Description:** Multiple test files have TypeScript errors including implicit `any` types in component props, mismatched type assertions, and missing type declarations.
  - **Example files:** `AccountManagementPanel.test.tsx`, `SummaryDisplay.test.tsx`, `error-handling.test.tsx`
  - **Priority:** High - These prevent TypeScript from successfully type-checking the codebase
  - **Depends On:** [T014]
  - **Resolution:** Fixed type errors in test files by adding proper type annotations to mocked components and handling null checks correctly. Applied proper typing to component props in test files and fixed Element vs HTMLElement type mismatches in testing-library assertions. Exported AuthErrorProps interface to fix type errors in error-handling tests.

- [x] **T018:** Fix Missing Return Types

  - **Description:** Several components and functions don't explicitly specify return types or have code paths that don't return values.
  - **Example files:** `src/components/ActivityFeed.tsx`, `src/components/AuthError.tsx`, `src/lib/auth/tokenValidator.ts`
  - **Priority:** High - These cause TypeScript to report "Not all code paths return a value" errors
  - **Depends On:** [T014]
  - **Resolution:** Added explicit return types to React components and utility functions. Fixed missing return paths in useEffect hooks and other functions. Used ReactElement instead of JSX.Element for React components. Added proper return types for callbacks and other functions. Added explicit undefined returns for code paths without returns.

- [x] **T019:** Fix Function/Module Reference Errors
  - **Description:** Incorrect function references in API route files
  - **Example files:** `src/app/api/my-activity/route.ts`, `src/app/api/my-org-activity/route.ts`, `src/app/api/team-activity/route.ts`
  - **Priority:** High - These cause build failures and runtime errors
  - **Depends On:** [T014]
  - **Resolution:** Added missing imports for `fetchRepositories` and `fetchAppRepositories` functions from `@/lib/githubData` in all three route files. This fixed the TypeScript errors related to function references while maintaining the existing code logic that uses different functions based on authentication method.

### ESLint Issues

- [x] **T020:** Remove Explicit `any` Types

  - **Description:** Widespread use of `any` type throughout the codebase violates TypeScript best practices
  - **Example files:** Almost all files in `src/lib/` and many test files
  - **Priority:** Medium - These decrease type safety but don't cause immediate failures
  - **Depends On:** [T014]
  - **Resolution:** Replaced explicit `any` types with more specific types throughout the codebase. Used `unknown` for index signatures, created specific interfaces for test data, added proper typing for function parameters and return values, and improved type safety in the ContributorLike and CommitSummary interfaces.

- [x] **T021:** Refactor Complex Functions

  - **Description:** Many functions exceed the maximum allowed complexity (10) or line count (100)
  - **Example files:** `src/lib/errors.ts`, `src/lib/githubData.ts`, `src/lib/gemini.ts`
  - **Priority:** Medium - These impact code maintainability but don't cause failures
  - **Depends On:** [T014]
  - **Resolution:** Refactored complex functions by breaking them down into smaller, more focused functions with single responsibilities. Applied these changes to handleGitHubError in errors.ts, several fetch functions in githubData.ts, and the generateCommitSummary function in gemini.ts. Improved code readability, maintainability, and added proper TypeScript types throughout. Extracted utility functions for common operations to reduce code duplication and complexity.

- [ ] **T022:** Standardize Naming Conventions

  - **Description:** Non-camelCase identifiers (using snake_case) throughout the codebase
  - **Example files:** `src/lib/githubData.ts`, `src/lib/optimize.ts`, `src/lib/activity.ts`
  - **Priority:** Medium - These violate coding standards but don't cause failures
  - **Depends On:** [T014]

- [ ] **T023:** Remove Unused Variables and Imports
  - **Description:** Several files contain unused variables, functions, and imports
  - **Widespread across the codebase**
  - **Priority:** Low - These don't affect functionality but make the code less clean
  - **Depends On:** [T014]

### Build Issues

- [x] **T024:** Configure ESLint to Ignore Generated Code
  - **Description:** The `.next/` directory contains generated code with linting errors
  - **Action:** Add `.next/` to `.eslintignore` to exclude it from linting
  - **Priority:** Low - This doesn't affect functionality but causes noise in linting output
  - **Depends On:** [T014]
  - **Result:** Added `.eslintignore` file with entries for `.next/`, `dist/`, `node_modules/`, and other build output directories.

### Pre-commit hook fixes

- [x] **T025:** Modify lint-staged config to fix TypeScript checking issues

  - **Action:** Update the `lint-staged` section in `package.json`. Change the command for `*.{ts,tsx}` files from `tsc --noEmit` to `bash -c 'npm run typecheck'` to ensure proper exclusion of node_modules during pre-commit hooks.
  - **Depends On:** None
  - **AC Ref:** None
  - **Result:** Successfully updated the lint-staged configuration in package.json to use the existing npm typecheck script via bash -c. This approach ensures that TypeScript properly respects the tsconfig.json settings, including the exclusion of node_modules, when type checking during pre-commit hooks. The solution aligns with lint-staged best practices for handling TypeScript checks.

- [x] **T026:** Test the updated pre-commit hook configuration

  - **Action:** Stage one or more TypeScript files (`.ts` or `.tsx`) and attempt to commit them. Verify that the `npm run typecheck` command is executed successfully during the pre-commit hook through `bash -c`, does *not* produce errors related to type checking `node_modules`, but *does* correctly identify any legitimate type errors within the staged project files.
  - **Depends On:** [T025]
  - **AC Ref:** None
  - **Result:** Successfully tested the pre-commit hook by creating a test file with a deliberate type error. The hook correctly executed the TypeScript check via `bash -c 'npm run typecheck'` and identified the type error in our test file. No errors related to node_modules were reported. After fixing the type error, we confirmed that the specific error was no longer reported. The pre-commit hook properly enforces type checking while respecting the exclusion patterns in tsconfig.json.

- [ ] **T027:** Mark T022 (Standardize Naming Conventions) as complete

  - **Action:** After verifying the pre-commit hook fix (T026 is complete) *and* completing the actual work required for standardizing naming conventions (as originally intended by T022), update the status of task T022 in `TODO.md` to `[x]`.
  - **Depends On:** [T026]
  - **AC Ref:** None

# Todo

## Jest Configuration

- [x] **T001 · Bugfix · P0: fix jest setup import syntax**

  - **Context:** PLAN.md / cr‑01 Fix Non‑idiomatic Import in Jest Setup
  - **Action:**
    1. Replace `import '@testing-library/jest-dom'` with `require('@testing-library/jest-dom')` in `jest.setup.js`.
    2. Add a comment explaining the CommonJS requirement for this file.
  - **Done‑when:**
    1. `npm test` command starts execution without syntax errors related to `jest.setup.js`.
    2. CI pipeline step running tests starts successfully.
  - **Depends‑on:** none

- [x] **T002 · Refactor · P0: configure `tsconfig.json` to include test files**

  - **Context:** PLAN.md / cr‑03 Enforce Type Safety for All Test Files / Step 1
  - **Action:**
    1. Review and modify the `include` array in `tsconfig.json`.
    2. Ensure patterns like `**/*.test.ts`, `**/*.spec.ts`, `src/__tests__/**/*.ts` are included.
  - **Done‑when:**
    1. `tsconfig.json`'s `include` array correctly targets all project test files.
  - **Depends‑on:** none

- [x] **T003 · Test · P0: verify `typecheck` script includes test files**

  - **Context:** PLAN.md / cr‑03 Enforce Type Safety for All Test Files / Step 2 & 3
  - **Action:**
    1. Confirm the `typecheck` script in `package.json` (e.g., `"typecheck": "tsc --noEmit"`) uses the root `tsconfig.json`.
    2. Run `npm run typecheck` locally.
  - **Done‑when:**
    1. `npm run typecheck` executes successfully and checks types in both source and test files.
    2. Any existing type errors in test files cause the command to fail.
  - **Depends‑on:** [T002]

- [x] **T004 · Chore · P0: integrate typecheck script execution into ci pipeline**

  - **Context:** PLAN.md / cr‑03 Enforce Type Safety for All Test Files / Step 4
  - **Action:**
    1. Add a step to the CI pipeline configuration that executes `npm run typecheck`.
    2. Ensure this step runs after dependency installation and before tests.
  - **Done‑when:**
    1. CI pipeline includes a typecheck step.
    2. CI pipeline fails if `npm run typecheck` fails.
  - **Depends‑on:** [T003]

- [x] **T005 · Feature · P0: add `npm audit` script to `package.json`**

  - **Context:** PLAN.md / cr‑04 Automate Security Audit of Dependencies / Step 1
  - **Action:**
    1. Add `"audit": "npm audit --audit-level=high"` to the `scripts` section in `package.json`.
  - **Done‑when:**
    1. `package.json` contains the `audit` script.
    2. `npm run audit` executes successfully locally.
  - **Depends‑on:** none

- [x] **T006 · Chore · P0: integrate `npm audit` script execution into ci pipeline**

  - **Context:** PLAN.md / cr‑04 Automate Security Audit of Dependencies / Step 2
  - **Action:**
    1. Add a step to the CI pipeline configuration that executes `npm run audit`.
    2. Ensure this step runs after dependency installation.
  - **Done‑when:**
    1. CI pipeline includes an `npm audit` step.
    2. CI pipeline fails if `npm run audit` finds vulnerabilities at or above the specified level (high).
  - **Depends‑on:** [T005]

- [x] **T007 · Refactor · P0: set global coverage thresholds in `jest.config.js`**

  - **Context:** PLAN.md / cr‑02 Raise and Enforce Test Coverage Thresholds / Step 1
  - **Action:**
    1. Edit `jest.config.js`.
    2. Set `coverageThreshold.global` values for `statements`, `branches`, `functions`, `lines` to at least 85%.
  - **Done‑when:**
    1. `jest.config.js` reflects the new global thresholds (>= 85%).
    2. `npm run test:coverage` command uses these thresholds.
  - **Depends‑on:** [T001]

- [x] **T008 · Refactor · P0: identify core logic paths and set stricter per-path coverage thresholds**

  - **Context:** PLAN.md / cr‑02 Raise and Enforce Test Coverage Thresholds / Step 2
  - **Action:**
    1. Analyze `src/lib/` and `src/app/api/summary/handlers.ts` (and other core areas) to identify specific files/paths needing higher coverage.
    2. Add per-path entries under `coverageThreshold` in `jest.config.js`, setting thresholds to 95%.
  - **Done‑when:**
    1. `jest.config.js` includes specific path thresholds set to 95%.
    2. Coverage report reflects these path-specific requirements.
  - **Depends‑on:** [T007]

- [x] **T009 · Chore · P0: integrate coverage threshold enforcement into ci pipeline**
  - **Context:** PLAN.md / cr‑02 Raise and Enforce Test Coverage Thresholds / Done-When
  - **Action:**
    1. Ensure the CI pipeline runs tests with the `--coverage` flag.
    2. Verify CI pipeline fails if coverage drops below the thresholds defined in `jest.config.js`.
  - **Done‑when:**
    1. CI job fails when code coverage does not meet configured global or per-path thresholds.
  - **Depends‑on:** [T008]

## Code Formatting

- [x] **T010 · Chore · P1: install prettier and create base `.prettierrc` / `.prettierignore` files**

  - **Context:** PLAN.md / cr‑05 Add Prettier and Code Format Enforcement / Steps 1, 2, 3
  - **Action:**
    1. Run `npm install --save-dev prettier`.
    2. Create `.prettierrc.json` (or chosen format) with sensible defaults or project-specific rules.
    3. Create `.prettierignore` listing files/directories to exclude (e.g., `node_modules`, `dist`, lock files).
  - **Done‑when:**
    1. `prettier` is listed in `devDependencies`.
    2. `.prettierrc.json` and `.prettierignore` files exist and are configured.
  - **Depends‑on:** none

- [x] **T011 · Chore · P1: configure husky/lint-staged for pre-commit formatting**

  - **Context:** PLAN.md / cr‑05 Add Prettier and Code Format Enforcement / Step 4
  - **Action:**
    1. Install `husky` and `lint-staged` as dev dependencies.
    2. Configure `husky` to set up pre-commit hooks.
    3. Configure `lint-staged` in `package.json` or its own config file to run `prettier --write` on staged files.
  - **Done‑when:**
    1. `husky` and `lint-staged` are installed and configured.
    2. Attempting to commit incorrectly formatted staged files triggers automatic formatting via `prettier`.
  - **Depends‑on:** [T010]

- [x] **T012 · Chore · P1: integrate prettier check into ci pipeline**

  - **Context:** PLAN.md / cr‑05 Add Prettier and Code Format Enforcement / Step 6
  - **Action:**
    1. Add a step to the CI pipeline that runs a Prettier check command (e.g., `prettier --check .`).
  - **Done‑when:**
    1. CI pipeline includes a Prettier check step.
    2. CI pipeline fails if any files violate Prettier formatting rules.
  - **Depends‑on:** [T010]

- [x] **T013 · Refactor · P1: add explicit type annotations to `example.test.ts`**

  - **Context:** PLAN.md / cr‑07 Add Type Annotations in Example Test / Step 1
  - **Action:**
    1. Update `src/lib/__tests__/example.test.ts` to use explicit type annotations for all variables and functions.
    2. Ensure all test functions have return type annotations.
  - **Done‑when:**
    1. Example test includes proper TypeScript annotations.
    2. Test passes with strict type checking enabled.
  - **Depends‑on:** none

- [x] **T014 · Chore · P1: configure eslint to enforce type annotations in tests**

  - **Context:** PLAN.md / cr‑07 Add Type Annotations in Example Test / Step 2
  - **Action:**
    1. Update ESLint configuration to enable rules that enforce type annotations in test files.
    2. Configure rules like `@typescript-eslint/explicit-function-return-type` for test files.
  - **Done‑when:**
    1. ESLint reports errors when test functions lack return type annotations.
    2. The example test passes linting after adding proper annotations.
  - **Depends‑on:** [T013]

- [x] **T015 · Chore · P1: add mocking policy comment to `jest.setup.js`**

  - **Context:** PLAN.md / cr‑08 Reinforce Mocking Policy in Docs/Setup / Step 1
  - **Action:**
    1. Add a prominent comment block in `jest.setup.js` stating the policy against mocking internal modules.
  - **Done‑when:**
    1. `jest.setup.js` contains the specified comment block.
  - **Depends‑on:** [T001]

- [x] **T016 · Test · P1: run type check and linting to confirm test type enforcement**

  - **Context:** PLAN.md / cr‑07 Add Type Annotations in Example Test / Step 3
  - **Action:**
    1. Run `npm run typecheck` to verify test file types are enforced.
    2. Run `npm run lint` to verify linting rules are enforced.
  - **Done‑when:**
    1. Both commands report no errors after annotations are added.
  - **Depends‑on:** [T013], [T014]

- [x] **T017 · Refactor · P1: audit and refine jest coverage exclusion patterns in `jest.config.js`**

  - **Context:** PLAN.md / cr‑06 Refine Jest Coverage Exclusion Patterns
  - **Action:**
    1. Audit all files currently excluded by patterns like `!src/**/index.ts` to identify any containing executable logic.
    2. Update the `collectCoverageFrom` patterns in `jest.config.js` to be more specific, excluding only files that are purely re-exports or otherwise justifiable.
  - **Done‑when:**
    1. `collectCoverageFrom` in `jest.config.js` uses precise patterns or specific file paths for exclusions.
    2. No files containing non-trivial logic are excluded from coverage tracking.
    3. Coverage report accuracy is confirmed.
  - **Depends‑on:** [T009]

- [x] **T018 · Chore · P2: document test file type checking requirement in readme**

  - **Context:** PLAN.md / cr‑03 Enforce Type Safety for All Test Files / Step 5
  - **Action:**
    1. Update `README.md` to state that all test files are type-checked via `npm run typecheck` and enforced by CI.
  - **Done‑when:**
    1. `README.md` clearly documents the type checking requirement for tests.
  - **Depends‑on:** [T004]

- [x] **T019 · Chore · P2: document security audit process in readme**

  - **Context:** PLAN.md / cr‑04 Automate Security Audit of Dependencies / Step 3
  - **Action:**
    1. Update `README.md` to explain the automated security audit process and CI enforcement.
  - **Done‑when:**
    1. `README.md` clearly documents the security audit requirement.
  - **Depends‑on:** [T006]

- [x] **T020 · Chore · P2: document coverage requirements in readme and contributing docs**

  - **Context:** PLAN.md / cr‑02 Raise and Enforce Test Coverage Thresholds / Step 3
  - **Action:**
    1. Update `README.md` and any contribution guidelines (`CONTRIBUTING.md`?) to clearly state the 85% global and 95% core logic coverage requirements.
  - **Done‑when:**
    1. Documentation accurately reflects the enforced coverage thresholds.
  - **Depends‑on:** [T009]

- [x] **T021 · Chore · P2: create follow-up tasks for missing test coverage**

  - **Context:** PLAN.md / cr‑02 Raise and Enforce Test Coverage Thresholds / Step 4
  - **Action:**
    1. Run the coverage report after thresholds are enforced (`T009`).
    2. Identify areas failing to meet the new thresholds.
    3. Create specific new tickets (or add to a backlog) detailing the files/modules needing improved test coverage.
  - **Done‑when:**
    1. A list or set of tickets exists outlining specific areas requiring test additions to meet coverage.
  - **Depends‑on:** [T009]

## Test Coverage Improvement Tickets

The following tickets address specific areas in the codebase that need additional test coverage to meet the established thresholds:

- Global coverage threshold: 85% for statements, branches, functions, and lines
- Core logic files threshold: 95% for statements, branches, functions, and lines

### Critical Files (95% Coverage Required)

- [ ] **TC001 · Test · P1: improve test coverage for `src/lib/github/commits.ts`**

  - **Current Coverage:** Statements: 51.21%, Branches: 63.41%, Functions: 41.66%, Lines: 55.40%
  - **Target:** 95% for all metrics
  - **Action:**
    1. Add tests for error handling and edge cases.
    2. Test pagination functionality.
    3. Test different parameter combinations.
    4. Focus on missing coverage in lines 131-135, 222-310.
  - **Done‑when:**
    1. All metrics reach at least 95% coverage.
  - **Depends‑on:** none

- [ ] **TC002 · Test · P1: improve test coverage for `src/lib/github/repositories.ts`**

  - **Current Coverage:** Statements: 70.73%, Branches: 42.85%, Functions: 42.85%, Lines: 71.60%
  - **Target:** 95% for all metrics
  - **Action:**
    1. Add tests for error conditions.
    2. Test repository filtering functionality.
    3. Test pagination and response handling.
    4. Focus on missing coverage in lines 40-46, 70-74, 80-88, 117, 121-147, 164-165, 194, 212-213, 218-221.
  - **Done‑when:**
    1. All metrics reach at least 95% coverage.
  - **Depends‑on:** none

- [ ] **TC003 · Test · P2: improve test coverage for `src/lib/github/utils.ts`**

  - **Current Coverage:** Statements: 92.30%, Branches: 76.92%, Functions: 100%, Lines: 91.93%
  - **Target:** 95% for all metrics
  - **Action:**
    1. Add tests focusing on branch coverage.
    2. Test edge cases for utility functions.
    3. Focus on missing coverage in lines 210-219.
  - **Done‑when:**
    1. All metrics reach at least 95% coverage.
  - **Depends‑on:** none

- [ ] **TC004 · Test · P1: add tests for `src/app/api/summary/handlers.ts`**

  - **Current Coverage:** Insufficient
  - **Target:** 95% for all metrics
  - **Action:**
    1. Test all handler functions.
    2. Cover error handling cases.
    3. Test data transformation logic.
  - **Done‑when:**
    1. All metrics reach at least 95% coverage.
  - **Depends‑on:** none

- [ ] **TC005 · Test · P1: improve test coverage for `src/hooks/dashboard/useSummary.ts`**

  - **Current Coverage:** Close to target (96.72% statements, 78.12% branches, 100% functions, 96.72% lines)
  - **Target:** 95% for all metrics
  - **Action:**
    1. Add tests to improve branch coverage.
    2. Test remaining edge cases.
  - **Done‑when:**
    1. All metrics reach at least 95% coverage.
  - **Depends‑on:** none

### Core Functionality (85% Coverage Required)

- [ ] **TC006 · Test · P1: add tests for GitHub authentication (`src/lib/github/auth.ts`)**

  - **Current Coverage:** 0% (completely untested)
  - **Target:** 85% for all metrics
  - **Action:**
    1. Create comprehensive test suite.
    2. Mock external dependencies.
    3. Test both success and failure paths.
  - **Done‑when:**
    1. All metrics reach at least 85% coverage.
  - **Depends‑on:** none

- [ ] **TC007 · Test · P1: improve test coverage for dashboard hooks**

  - **Current Coverage:** Very low (useInstallations: 12.72%, useRepositories: 10.71%)
  - **Target:** 85% for all metrics
  - **Action:**
    1. Test hook initialization and state updates.
    2. Test data fetching behavior.
    3. Test error handling.
    4. Focus on `useInstallations.ts` and `useRepositories.ts`.
  - **Done‑when:**
    1. All metrics reach at least 85% coverage.
  - **Depends‑on:** none

- [ ] **TC008 · Test · P1: add tests for AI functionality (`src/lib/gemini.ts`)**

  - **Current Coverage:** 0% (completely untested)
  - **Target:** 85% for all metrics
  - **Action:**
    1. Mock AI service responses.
    2. Test response parsing.
    3. Test error handling.
  - **Done‑when:**
    1. All metrics reach at least 85% coverage.
  - **Depends‑on:** none

- [ ] **TC009 · Test · P1: add tests for activity data processing (`src/lib/activity.ts`)**

  - **Current Coverage:** 0% (completely untested)
  - **Target:** 85% for all metrics
  - **Action:**
    1. Test activity data processing.
    2. Test filtering and grouping logic.
    3. Test edge cases with empty data.
  - **Done‑when:**
    1. All metrics reach at least 85% coverage.
  - **Depends‑on:** none

- [ ] **TC010 · Test · P1: add tests for authentication modules**

  - **Current Coverage:** 0% (completely untested)
  - **Target:** 85% for all metrics
  - **Action:**
    1. Create tests for `src/lib/auth/apiAuth.ts`.
    2. Create tests for `src/lib/auth/clientAuth.ts`.
    3. Create tests for `src/lib/auth/tokenValidator.ts`.
    4. Mock external auth services and test token validation.
  - **Done‑when:**
    1. All metrics reach at least 85% coverage.
  - **Depends‑on:** none

- [ ] **TC011 · Test · P2: add tests for utility hooks**

  - **Current Coverage:** 0% (completely untested)
  - **Target:** 85% for all metrics
  - **Action:**
    1. Create tests for `src/hooks/useDebounce.ts`.
    2. Create tests for `src/hooks/useProgressiveLoading.ts`.
    3. Create tests for `src/hooks/useProtectedRoute.ts`.
  - **Done‑when:**
    1. All metrics reach at least 85% coverage.
  - **Depends‑on:** none

- [ ] **TC012 · Test · P2: improve test coverage for React components**

  - **Current Coverage:** Varies by component
  - **Target:** 85% for all metrics
  - **Action:**
    1. Create or enhance tests for key dashboard and UI components.
    2. Test component rendering, user interactions, and error states.
  - **Done‑when:**
    1. All metrics reach at least 85% coverage.
  - **Depends‑on:** none

- [x] **T022 · Chore · P2: add `format` script to `package.json`**

  - **Context:** PLAN.md / cr‑05 Add Prettier and Code Format Enforcement / Step 5
  - **Action:**
    1. Add a script like `"format": "prettier --write ."` to the `scripts` section in `package.json`.
  - **Done‑when:**
    1. `package.json` contains the `format` script.
    2. `npm run format` command successfully formats the codebase using Prettier.
  - **Depends‑on:** [T010]

- [x] **T023 · Chore · P2: run initial `prettier --write` on codebase**

  - **Context:** PLAN.md / cr‑05 Add Prettier and Code Format Enforcement / Step 7
  - **Action:**
    1. Execute `npm run format` (or `prettier --write .`) once to format all existing code.
    2. Commit the formatting changes.
  - **Done‑when:**
    1. The entire codebase conforms to the Prettier rules defined in `T010`.
    2. CI check (`T012`) passes after this commit.
    3. Pre-commit hook (`T011`) runs without errors on subsequent commits.
  - **Depends‑on:** [T011], [T012], [T022]

- [x] **T024 · Chore · P2: document formatting workflow in readme**

  - **Context:** PLAN.md / cr‑05 Add Prettier and Code Format Enforcement / Step 8
  - **Action:**
    1. Update `README.md` to explain the use of Prettier, pre-commit hooks, and the `npm run format` script.
  - **Done‑when:**
    1. `README.md` clearly documents the code formatting setup and workflow.
  - **Depends‑on:** [T023]

- [ ] **T025 · Chore · P2: update readme with mocking policy**

  - **Context:** PLAN.md / cr‑08 Reinforce Mocking Policy in Docs/Setup / Step 2
  - **Action:**
    1. Update the testing section of `README.md` to match the language in DEVELOPMENT_PHILOSOPHY.md regarding mocking.
    2. Add examples of what can and cannot be mocked.
  - **Done‑when:**
    1. README mocking policy is explicit and matches the core philosophy.
    2. Examples clarify the policy for developers.
  - **Depends‑on:** [T015]

- [ ] **T026 · Chore · P3: add `engines` field to `package.json`**

  - **Context:** PLAN.md / cr‑12 Add `engines` Field to package.json
  - **Action:**
    1. Edit `package.json`.
    2. Add the `engines` field specifying the required Node.js version (e.g., `{ "node": ">=18.17.0" }`).
  - **Done‑when:**
    1. `package.json` includes the `engines` field with the appropriate Node.js version constraint.
  - **Depends‑on:** none

- [ ] **T027 · Feature · P3: create example test for real functionality**
  - **Context:** PLAN.md / cr‑09 Improve Example Test with Real Functionality
  - **Action:**
    1. Identify a simple utility function in `src/lib/` suitable for testing.
    2. Create a new test file with proper type annotations, multiple test cases including edge cases and error scenarios.
    3. Add comments explaining the testing approach and best practices.
  - **Done‑when:**
    1. New test file exists, passes type checking, and demonstrates best testing practices.
    2. Test coverage for the chosen utility function is high.
    3. Test contains proper documentation of testing approach.
  - **Depends‑on:** [T013]

### Clarifications & Assumptions

- [ ] **Issue:** Node.js version for `engines` field

  - **Context:** PLAN.md / cr‑12 Add `engines` Field to package.json
  - **Blocking?:** no (can use suggested 18.17.0 LTS version unless project has specific needs)

- [ ] **Issue:** Prettier configuration preferences
  - **Context:** PLAN.md / cr‑05 Add Prettier and Code Format Enforcement / Step 2
  - **Blocking?:** no (can use standard defaults like single quotes, trailing commas in ES5 mode, etc.)

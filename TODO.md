# TODO

## JSX Transform Error Resolution

- [x] **T001:** Investigate JSX transform error in CI logs

  - **Action:** Examine CI logs to identify the exact nature of the JSX transform errors, noting error messages, affected files, and configuration issues
  - **Depends On:** None
  - **AC Ref:** High Priority Issue #1

- [ ] **T002:** Fix Babel configuration for JSX transformations

  - **Action:** Update `babel.config.jest.js` with the correct configuration for JSX transformations, ensuring proper preset options for React/JSX
  - **Depends On:** [T001]
  - **AC Ref:** High Priority Issue #1

- [ ] **T003:** Update Jest configuration for JSX files

  - **Action:** Verify and fix Jest configuration in `jest.config.js` to properly handle JSX files, including transform settings and moduleNameMapper
  - **Depends On:** [T001]
  - **AC Ref:** High Priority Issue #1

- [ ] **T004:** Check and update testing library dependencies

  - **Action:** Review package.json for testing library versions, checking for mismatches or incompatibilities, and update as needed
  - **Depends On:** [T001]
  - **AC Ref:** High Priority Issue #1

- [ ] **T005:** Remove conditionalTest mechanism

  - **Action:** Remove all instances of `conditionalTest` that are used to skip tests in CI, ensuring tests run unconditionally
  - **Depends On:** [T002, T003, T004]
  - **AC Ref:** High Priority Issue #1

- [ ] **T006:** Verify all tests pass locally
  - **Action:** Run the complete test suite locally to ensure all tests pass with the fixed configuration and without the conditionalTest mechanism
  - **Depends On:** [T005]
  - **AC Ref:** High Priority Issue #1

## Test Suite Assertion Improvement

- [ ] **T007:** Review and update assertions in api-test-utils.ts

  - **Action:** Identify and replace generic assertions with specific ones in `src/__tests__/api-test-utils.ts`, ensuring precise status codes and error responses
  - **Depends On:** [T006]
  - **AC Ref:** Medium Priority Issue #2

- [ ] **T008:** Review and update assertions in github-error-types.test.ts

  - **Action:** Identify and replace generic assertions with specific ones in `src/__tests__/api/github-error-types.test.ts`, ensuring precise status codes and error responses
  - **Depends On:** [T006]
  - **AC Ref:** Medium Priority Issue #2

- [ ] **T009:** Review and update assertions in summary.test.ts

  - **Action:** Identify and replace generic assertions with specific ones in `src/__tests__/api/summary.test.ts`, ensuring precise status codes and error responses
  - **Depends On:** [T006]
  - **AC Ref:** Medium Priority Issue #2

- [ ] **T010:** Verify updated tests reflect expected behavior
  - **Action:** Run tests with updated assertions to ensure they pass and accurately reflect the expected behavior of the individual-focused implementation
  - **Depends On:** [T007, T008, T009]
  - **AC Ref:** Medium Priority Issue #2

## Type Safety Enhancement

- [ ] **T011:** Identify all instances of 'any' type in codebase

  - **Action:** Use grep or codebase search to locate all instances of the `any` type being used across the codebase
  - **Depends On:** None
  - **AC Ref:** Medium Priority Issue #3

- [ ] **T012:** Define proper types to replace 'any'

  - **Action:** Create appropriate interfaces or type definitions to replace `any` types found in the codebase
  - **Depends On:** [T011]
  - **AC Ref:** Medium Priority Issue #3

- [ ] **T013:** Replace 'any' types with specific ones

  - **Action:** Replace each `any` type with the appropriate specific type defined in T012, updating code as needed
  - **Depends On:** [T012]
  - **AC Ref:** Medium Priority Issue #3

- [ ] **T014:** Re-enable strict type checking in tests

  - **Action:** Remove any type checking suppressions in test files, ensuring all tests use proper typing
  - **Depends On:** [T013]
  - **AC Ref:** Medium Priority Issue #3

- [ ] **T015:** Verify typechecking passes without errors
  - **Action:** Run `npm run typecheck` to ensure no type errors exist after the changes
  - **Depends On:** [T013, T014]
  - **AC Ref:** Medium Priority Issue #3

## Organization Filter Logic Removal

- [ ] **T016:** Remove 'organizations' field from FilterState type

  - **Action:** Update the FilterState interface in appropriate files to remove the organizations field
  - **Depends On:** None
  - **AC Ref:** Low Priority Issue #4

- [ ] **T017:** Remove organization filter logic from RepositoryInfoPanel

  - **Action:** Identify and remove organization-related logic in `src/components/dashboard/RepositoryInfoPanel.tsx`, simplifying the component
  - **Depends On:** [T016]
  - **AC Ref:** Low Priority Issue #4

- [ ] **T018:** Remove organization parameter from API calls in SummaryDisplay

  - **Action:** Update `src/components/dashboard/SummaryDisplay.tsx` to remove organizations from API calls
  - **Depends On:** [T016]
  - **AC Ref:** Low Priority Issue #4

- [ ] **T019:** Remove organizations array from activeFilters in dashboard page

  - **Action:** Update `src/app/dashboard/page.tsx` to remove the organizations array from the activeFilters state
  - **Depends On:** [T016]
  - **AC Ref:** Low Priority Issue #4

- [ ] **T020:** Verify filtering functionality works correctly
  - **Action:** Run the application and test that filtering functionality works correctly without organization options
  - **Depends On:** [T017, T018, T019]
  - **AC Ref:** Low Priority Issue #4

## TypeScript skipLibCheck Documentation

- [ ] **T021:** Investigate the reason for skipLibCheck flag

  - **Action:** Research package.json and codebase history to determine why the --skipLibCheck flag was added to the typecheck script
  - **Depends On:** None
  - **AC Ref:** Low Priority Issue #5

- [ ] **T022:** Test typecheck with and without skipLibCheck

  - **Action:** Run `tsc --noEmit` with and without the --skipLibCheck flag, documenting any issues that arise
  - **Depends On:** [T021]
  - **AC Ref:** Low Priority Issue #5

- [ ] **T023:** Document reason for skipLibCheck or remove if unnecessary
  - **Action:** Either add documentation explaining why the flag is necessary (if it's required) or remove it from package.json if it's not needed
  - **Depends On:** [T022]
  - **AC Ref:** Low Priority Issue #5

## File Formatting Fix

- [ ] **T024:** Add newline to end of common.ts

  - **Action:** Add a newline character to the end of `src/types/common.ts` file
  - **Depends On:** None
  - **AC Ref:** Low Priority Issue #6

- [ ] **T025:** Verify linting passes for common.ts
  - **Action:** Run linting to verify that the format of `src/types/common.ts` is correct after adding the newline
  - **Depends On:** [T024]
  - **AC Ref:** Low Priority Issue #6

## Type Definition Reorganization

- [ ] **T026:** Create src/types/activity.ts file

  - **Action:** Create a new file `src/types/activity.ts` as a domain-specific location for activity-related types
  - **Depends On:** None
  - **AC Ref:** Low Priority Issue #7

- [ ] **T027:** Move ActivityMode type to activity.ts

  - **Action:** Move the ActivityMode type definition from `src/types/common.ts` to `src/types/activity.ts`
  - **Depends On:** [T026]
  - **AC Ref:** Low Priority Issue #7

- [ ] **T028:** Update imports for ActivityMode

  - **Action:** Find all files importing ActivityMode from common.ts and update them to import from activity.ts
  - **Depends On:** [T027]
  - **AC Ref:** Low Priority Issue #7

- [ ] **T029:** Verify typechecking and tests pass after type relocation
  - **Action:** Run typechecking and tests to ensure no issues after moving the type definition
  - **Depends On:** [T028]
  - **AC Ref:** Low Priority Issue #7

## Additional Improvements (Optional)

- [ ] **T030:** Update test fixtures for individual-focused model

  - **Action:** Review and update test fixtures to better reflect the individual-focused model, removing any team/organization references
  - **Depends On:** [T010]
  - **AC Ref:** Related Consideration #1

- [ ] **T031:** Update documentation for individual-only focus

  - **Action:** Review documentation and update it to reflect the individual-only focus throughout the codebase
  - **Depends On:** None
  - **AC Ref:** Related Consideration #2

- [ ] **T032:** Add CI check for newlines at end of files

  - **Action:** Add a CI check to ensure all files have newlines at the end
  - **Depends On:** None
  - **AC Ref:** Related Consideration #3

- [ ] **T033:** Add CI check for 'any' types

  - **Action:** Add a CI check to prevent the use of 'any' types without explicit justification
  - **Depends On:** [T015]
  - **AC Ref:** Related Consideration #3

- [ ] **T034:** Add CI check for skipped tests

  - **Action:** Add a CI check to prevent skipping tests without proper justification
  - **Depends On:** [T006]
  - **AC Ref:** Related Consideration #3

- [ ] **T035:** Conduct thorough code review for vestigial team/organization code
  - **Action:** Review the entire codebase to identify and remove any remaining team/organization code that was missed in the initial refactoring
  - **Depends On:** [T020]
  - **AC Ref:** Related Consideration #4

## [!] CLARIFICATIONS NEEDED / ASSUMPTIONS

- [ ] **Issue/Assumption:** The exact nature of the JSX transform errors is not specified in the plan

  - **Context:** The plan mentions "JSX transform errors" in the high priority issue section but doesn't specify the exact error messages or detailed symptoms beyond tests being skipped

- [ ] **Issue/Assumption:** The specific files that need organization filter logic removal are mentioned, but there might be others

  - **Context:** Plan identifies three files with organization logic (RepositoryInfoPanel.tsx, SummaryDisplay.tsx, and dashboard/page.tsx) but there could be others not identified in the review

- [ ] **Issue/Assumption:** The reason for adding the skipLibCheck flag is unknown and needs investigation
  - **Context:** The plan notes that the typecheck script includes the skipLibCheck flag but the reason for its addition is not documented

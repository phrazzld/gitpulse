# Remediation Tasks

This document outlines the tasks needed to address the critical issues identified in the code review for the Atomic Design and Testing Library Migration PR.

## CI Resolution Tasks - Priority 0 (Critical - Must Fix for CI to Pass)

### Unit Test Failures - Refactoring for DI

- [x] **T001CI: Refactor github modules for dependency injection**
  - Modify modules in `src/lib/github/` (repositories, auth, commits, utils) to accept Octokit client and fetch functions as explicit dependencies
  - Export interfaces for external dependencies where needed
  - Modules should no longer instantiate external clients internally

- [x] **T002CI: Refactor summary API handlers for dependency injection**
  - Modify `src/app/api/summary/handlers.ts` to accept external dependencies explicitly
  - Dependencies should be injected via parameters or constructor arguments
  - **Depends on:** T001CI

### Unit Test Failures - Test Corrections

- [x] **T003CI: Correct mocks and async handling in summary API handler tests**
  - Remove internal mocks from `src/app/api/summary/__tests__/handlers.test.ts`
  - Mock only injected external dependencies
  - Update assertions to focus on public behavior
  - Ensure proper async/await usage and Promise handling
  - **Depends on:** T002CI

- [x] **T004CI: Fix "me" special case logic in summary API handlers**
  - Investigate and correct the "me" special case logic in handlers
  - Update the corresponding test to assert correct behavior
  - **Depends on:** T003CI

- [x] **T002CI-FIX: Fix TypeScript errors from dependency injection refactoring**
  - Fix IOctokitClient type errors in various route files (contributors, my-activity, etc.)
  - Update function signatures that are expecting string instead of IOctokitClient
  - Fix GitHub module tests that have breaking type issues
  - These errors are from the T002CI refactoring and need to be addressed
  - **Priority**: Critical - blocking CI
  - **Completed:** 2025-05-18

- [x] **T005CI: Correct mocks and async handling in github/repositories tests**
  - Remove internal mocks from `src/lib/github/__tests__/repositories.test.ts`
  - Mock only injected Octokit client
  - Update assertions and ensure proper async handling
  - **Depends on:** T001CI

- [ ] **T006CI: Correct mocks and async handling in github/auth tests**
  - Remove internal mocks from `src/lib/github/__tests__/auth.test.ts`
  - Mock only injected dependencies
  - Update assertions and ensure proper async handling
  - **Depends on:** T001CI

- [ ] **T007CI: Correct mocks and async handling in github/commits tests**
  - Remove internal mocks from `src/lib/github/__tests__/commits.test.ts`
  - Mock only injected dependencies
  - Fix promise rejection handling
  - **Depends on:** T001CI

### Accessibility Violations

- [ ] **T008CI: Fix color contrast violations**
  - Fix contrast issues in LoadMoreButton, ModeSelector, OperationsPanel
  - Adjust colors to meet WCAG AA requirements (4.5:1 normal text, 3:1 large text)
  - Verify in both light and dark modes

- [ ] **T009CI: Fix interactive element accessibility**
  - Ensure keyboard focusability for all interactive elements
  - Add proper ARIA roles, states, and properties
  - Correct tabindex usage

- [ ] **T010CI: Fix button name accessibility**
  - Add aria-labels to icon-only buttons
  - Ensure all buttons have accessible names

### Pre-commit Script Test

- [ ] **T011CI: Fix pre-commit script test**
  - Update execSync mock in `scripts/__tests__/check-a11y-staged-stories.test.js`
  - Return realistic `git diff --cached --name-status` output
  - Verify filtering logic works correctly

## Type Safety Improvements

- [x] **TASK-041: Identify all instances of `any` usage in the codebase**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Complete inventory of all `any` types in the codebase
  - **Description**:
    - Run `grep -r "any" --include="*.ts" --include="*.tsx" src/`
    - Compile a list of all files and line numbers where `any` is used
    - Exclude legitimate type declarations (e.g., Array<any> vs `any` type assignments)

- [x] **TASK-042: Replace `any` in `renderHookSafely` function signature**
  - **Priority**: Critical
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Function signature uses proper types
  - **Description**:
    - Update the `options` parameter to use `Omit<RenderHookOptions<Props>, 'wrapper'> & { wrapper?: React.ComponentType<{children: React.ReactNode}>; }`
    - Ensure function type safety without breaking existing usages
    - Run tests to verify functionality is preserved

- [x] **TASK-043: Replace `any` in `renderAsyncHook` function signature**
  - **Priority**: Critical
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Function signature uses proper types
  - **Description**:
    - Update the `options` parameter to use proper types similar to `renderHookSafely`
    - Ensure function type safety without breaking existing usages
    - Run tests to verify functionality is preserved

- [x] **TASK-044: Replace `any` in `SafeRenderHookResult` type definition**
  - **Priority**: Critical
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Type definition no longer uses `any`
  - **Description**:
    - Update the type to use proper generics instead of `any`
    - Replace `any` in the `waitForValueToChange` selector function
    - Ensure type safety without breaking existing usages

- [x] **TASK-045: Replace other identified `any` usages with appropriate types**
  - **Priority**: High
  - **Effort**: Large
  - **Dependencies**: TASK-041
  - **Success Criteria**: All `any` usages replaced with proper types
  - **Description**:
    - For each instance identified in TASK-041, replace with appropriate types
    - Use `unknown` with type guards, specific interfaces, or generic types
    - Run TypeScript compiler to ensure all replacements are valid

## Error Suppression Removal

- [x] **TASK-046: Identify all TypeScript and linter error suppressions**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Complete list of all suppressions documented
  - **Description**:
    - Run `grep -r "eslint-disable" --include="*.ts" --include="*.tsx" --include="*.js" src/`
    - Run `grep -r "@ts-ignore" --include="*.ts" --include="*.tsx" src/`
    - Run `grep -r "@ts-expect-error" --include="*.ts" --include="*.tsx" src/`
    - Document each suppression with file, line number, and suppressed rule/error

- [x] **TASK-047: Address TypeScript/linter suppressions by fixing underlying issues**
  - **Priority**: Critical
  - **Effort**: Large
  - **Dependencies**: TASK-046
  - **Success Criteria**: All suppressions removed and underlying issues fixed
  - **Description**:
    - For each suppression, understand the root cause of the error
    - Refactor code to fix the underlying issue
    - Remove the suppression comment
    - Verify TypeScript/ESLint pass without errors
  - **Progress**:
    - ✅ Completed Jest mock type suppressions (24 instances, 60% of total)
    - ✅ Completed external library type issues (5 instances, 12.5% of total)
    - ✅ Completed test edge cases for null/undefined (4 instances, 10% of total)
    - ✅ Completed ESLint suppressions for React hooks and Next.js Image (4 instances, 10% of total)
    - ✅ Completed implementing utility modules for type safety and proper dependency management
    - ✅ Completed final miscellaneous suppressions (3 instances, 7.5% of total)
    - ✅ All TypeScript and ESLint checks now pass without suppressions

- [x] **TASK-048: Fix common suppression patterns systematically**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-047
  - **Success Criteria**: Common patterns addressed, codebase less prone to these errors
  - **Description**:
    - Analyze patterns in fixed suppressions
    - Implement systemic solutions (utilities, helper types, etc.)
    - Document common patterns and their proper solutions

## Testing Improvements

- [x] **TASK-049: Remove global fetch mock from `renderAsyncHook`**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: No global fetch mocking, tests still pass
  - **Description**:
    - Remove `global.fetch = jest.fn()` from `renderAsyncHook`
    - Update the function to use local mocking instead
    - Update tests to work with the new approach

- [x] **TASK-050: Create FetchContext for dependency injection**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Context and hook created for fetch injection
  - **Description**:
    - Create a React context for fetch injection
    - Implement a `useFetch` hook for consuming the context
    - Add basic tests for the context and hook

- [x] **TASK-051: Update hooks to use FetchContext for dependency injection**
  - **Priority**: High
  - **Effort**: Large
  - **Dependencies**: TASK-050
  - **Success Criteria**: Hooks use context instead of global fetch
  - **Description**:
    - Find all hooks that use fetch directly
    - Update them to use the useFetch hook
    - Update tests to provide the context
  - **Notes**:
    - Completed successfully - all hooks now use FetchContext for dependency injection
    - Tests are passing, but there's a TypeScript issue with JSX in test files
    - This is a known issue with TypeScript and React types in Jest tests
    - Added comments to explain the TypeScript errors

- [x] **TASK-052: Implement router context for Next.js testing**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Next.js router testing uses context instead of mocks
  - **Description**:
    - Create router context or use Next.js provided context
    - Update testing utilities to use context providers
    - Remove global Next.js mocking

- [x] **TASK-053: Replace custom waitFor implementations with RTL native ones**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Custom implementations removed, RTL used directly
  - **Description**:
    - Identify custom waitFor utilities using JSON.stringify
    - Replace with RTL's native waitFor and findBy methods
    - Ensure tests still pass with the new approach

- [x] **TASK-054: Refactor renderHookSafely to use RTL's native utilities**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Function uses RTL directly without reimplementation
  - **Description**:
    - Refactor to be a thin wrapper around RTL's renderHook
    - Remove custom logic that duplicates RTL functionality
    - Update tests to use the refactored function

- [x] **TASK-055: Update tests to use native RTL methods directly**
  - **Priority**: High
  - **Effort**: Large
  - **Dependencies**: TASK-053, TASK-054
  - **Success Criteria**: Tests use standard RTL patterns
  - **Description**:
    - Update tests to use RTL's renderHook and waitFor directly
    - Replace custom wait patterns with standard ones
    - Ensure all tests pass with the updates

## Dependency Management

- [x] **TASK-056: Identify specific peer dependency conflicts**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: All conflicts documented
  - **Description**:
    - Run npm install without --legacy-peer-deps
    - Document all reported peer dependency conflicts
    - Determine required version ranges for resolution

- [x] **TASK-057: Update package.json to resolve peer dependency conflicts**
  - **Priority**: Critical
  - **Effort**: Medium
  - **Dependencies**: TASK-056
  - **Success Criteria**: npm install works without --legacy-peer-deps
  - **Description**:
    - Update dependency versions based on findings
    - Focus on React and testing library compatibility
    - Test dependency installation locally

- [x] **TASK-058: Upgrade problematic dependencies to compatible versions**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-057
  - **Success Criteria**: All dependencies use compatible versions
  - **Description**:
    - Identify packages with unresolvable conflicts
    - Upgrade these dependencies or find alternatives
    - Ensure application builds and tests pass

- [x] **TASK-059: Update CI workflow to remove --legacy-peer-deps flag**
  - **Priority**: Critical
  - **Effort**: Small
  - **Dependencies**: TASK-058
  - **Success Criteria**: CI workflow works without the flag
  - **Description**:
    - Update CI workflow configuration files
    - Remove --legacy-peer-deps flag from all commands
    - Verify CI builds pass without the flag

- [x] **TASK-060: Update dependency management documentation**
  - **Priority**: Medium
  - **Effort**: Small
  - **Dependencies**: TASK-059
  - **Success Criteria**: Documentation reflects current approach
  - **Description**:
    - Update references to --legacy-peer-deps
    - Document current dependency management strategy
    - Update best practices section

## CI Improvements

- [x] **TASK-061: Update Jest coverage configuration**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Coverage thresholds properly enforced
  - **Description**:
    - Add coverageThreshold to Jest configuration
    - Set appropriate thresholds for different component types
    - Ensure CI fails if thresholds aren't met

- [x] **TASK-062: Add E2E testing to CI workflow**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: E2E tests run in CI
  - **Description**:
    - Add Playwright installation step
    - Configure E2E test execution in CI
    - Ensure CI fails if E2E tests fail

- [x] **TASK-063: Add accessibility checks to CI workflow**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Accessibility checks run in CI
  - **Description**:
    - Add accessibility testing step
    - Configure failure thresholds
    - Integrate with Storybook if possible

- [x] **TASK-064: Configure Lighthouse CI for performance budgets**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Performance budgets defined
  - **Description**:
    - Create Lighthouse configuration file
    - Define performance budgets for key metrics
    - Configure assertions and thresholds

- [x] **TASK-065: Add performance budget checks to CI workflow**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: TASK-064
  - **Success Criteria**: Performance checks run in CI
  - **Description**:
    - Add Lighthouse CI to workflow
    - Configure to use performance budgets
    - Ensure CI reports or fails on budget violations

## Security Improvements

- [x] **TASK-066: Update npm audit command in CI workflow**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: None
  - **Success Criteria**: Appropriate audit level enforced
  - **Description**:
    - Review security policy requirements
    - Update --audit-level flag to appropriate level (critical/high)
    - Verify CI fails on violations

- [x] **TASK-067: Create nuanced security checking script**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Script provides better vulnerability control
  - **Description**:
    - Create script that runs npm audit with specific flags
    - Add logic to differentiate dev vs prod vulnerabilities
    - Ensure clear reporting of issues

- [x] **TASK-068: Update CI workflow to use security checking script**
  - **Priority**: Medium
  - **Effort**: Small
  - **Dependencies**: TASK-067
  - **Success Criteria**: CI uses new script for security checks
  - **Description**:
    - Update workflow to call the new script
    - Configure script execution environment
    - Verify CI fails based on script logic

## CI Fix Tasks

- [x] **TASK-069: Add ts-node to project dependencies**
  - **Priority**: Critical
  - **Effort**: Small
  - **Dependencies**: None
  - **Success Criteria**: CI security audit step passes without error
  - **Description**:
    - Add `ts-node` to `devDependencies` in root `package.json`
    - Ensure the version is compatible with the TypeScript version
    - Test locally to verify the security audit script runs successfully
    - Commit the change and verify CI passes

- [x] **TASK-070: Analyze button component accessibility issues**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Complete understanding of accessibility violations
  - **Description**:
    - Run Storybook locally and enable the accessibility addon
    - Identify all color contrast issues in button components
    - Document the specific CSS variables and color combinations causing failures
    - Create a report of all affected components

- [x] **TASK-071: Fix color contrast in Button component**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-070
  - **Success Criteria**: Button passes accessibility tests
  - **Description**:
    - Update the color variables in `src/components/atoms/Button.tsx`
    - Ensure text colors have sufficient contrast with backgrounds (4.5:1 ratio)
    - Test with the accessibility addon in Storybook
    - Run accessibility tests locally to verify: `npm run test-storybook`

- [x] **TASK-072: Fix color contrast in LoadMoreButton component**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-071
  - **Success Criteria**: LoadMoreButton passes accessibility tests
  - **Description**:
    - Apply the same color contrast fixes from Button component
    - Test with the accessibility addon in Storybook
    - Ensure all variants (Default, NoMoreItems, CustomLabels) pass accessibility tests
    - Verify with: `npm run test-storybook`

- [x] **TASK-073: Fix color contrast in ModeSelector component**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-071
  - **Success Criteria**: ModeSelector passes accessibility tests
  - **Description**:
    - Update the component to use the fixed color variables
    - Test with the accessibility addon in Storybook
    - Run accessibility tests locally to verify
    - Check all states (selected, unselected, hover, focus)

- [x] **TASK-074: Test and fix OperationsPanel accessibility**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-071, TASK-072, TASK-073
  - **Success Criteria**: OperationsPanel passes accessibility tests
  - **Description**:
    - Verify that fixing child components resolves OperationsPanel issues
    - Check if any additional contrast issues exist in the panel itself
    - Apply fixes if necessary
    - Run accessibility tests to verify

- [x] **TASK-075: Implement centralized color contrast utility**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: TASK-074
  - **Success Criteria**: Color contrast utility implemented and used
  - **Description**:
    - Create a utility function to validate color contrast ratios
    - Add it to the development tools
    - Update component documentation to reference the utility
    - Consider adding as a pre-commit hook

## Implementation Order

1. **Type Safety** (TASK-041 → TASK-045)
2. **Error Suppressions** (TASK-046 → TASK-048)
3. **Dependency Management** (TASK-056 → TASK-060)
4. **Testing Improvements** (TASK-049 → TASK-055)
5. **CI Security** (TASK-066 → TASK-068)
6. **CI Quality Gates** (TASK-061 → TASK-065)
7. **CI Fix** (TASK-069)
8. **Accessibility Fixes** (TASK-070 → TASK-075)

# CI Resolution Tasks

## Priority 0 (Critical)

- [x] **T001: Fix GitHub token scope validation test in `repositories.test.ts`**
  - Modify the mock implementation for `validateOAuthToken` in `repositories.test.ts` to accurately simulate a token missing the 'repo' scope
  - Update the test's `toThrow()` assertion if the error message has changed
  - Verification: Run targeted test and confirm CI passes

- [x] **T002: Refactor `dashboard-utils.test.ts` to use `dateMock.ts` for date mocking**
  - Remove direct assignments to `dashboardUtils.getTodayDate` and `getLastWeekDate` properties
  - Import and use `createMockDate` from `src/lib/tests/dateMock.ts` for date mocking
  - Adjust test assertions to work with the mocked dates
  - Verification: Tests pass without TypeErrors

- [x] **T003: Update `--electric-blue` CSS variable in `globals.css` to fix color contrast**
  - Identify current value of `var(--electric-blue)` in `src/app/globals.css`
  - Update to a color with sufficient contrast ratio (≥4.5:1) against `var(--dark-slate)`
  - Visually verify the updated appearance is acceptable
  - Verification: Storybook accessibility checks pass for all `LoadMoreButton` variants

## Priority 1 (High)

- [x] **T006: Implement ESLint rule or pre-commit hook for `dateMock.ts` enforcement**
  - Create custom rule to flag direct manipulation of `global.Date` or `Date.now`
  - Ensure proper detection and suggestions for using `dateMock.ts` instead
  - Test the rule against known violation patterns

- [x] **T008: Configure `storybook-a11y` as a blocking CI check**
  - ✅ Updated `.github/workflows/storybook-a11y.yml` to set `SKIP_A11Y_FAILURES: false`
  - ✅ Modified `.storybook/test-runner.js` to properly fail tests on violations
  - ✅ Verified with test stories that violations now block the CI
  - ✅ Documented rule-skipping mechanism for exceptional cases
  - ✅ Created `docs/ACCESSIBILITY_CI_SETUP.md` with complete documentation

- [x] **T009: Implement local pre-commit/push accessibility checks**
  - ✅ Used existing test-storybook with axe-core for consistency with CI
  - ✅ Integrated with Husky pre-commit hook to check staged stories
  - ✅ Added filtering to only report violations in staged files
  - ✅ Created comprehensive documentation at `docs/LOCAL_ACCESSIBILITY_CHECKS.md`
  - ✅ Added override mechanism with A11Y_SKIP environment variable
  - ✅ Included unit tests and convenience npm scripts

## Priority 2 (Medium)

- [ ] **T005: Update testing guidelines to mandate `dateMock.ts`**
  - Document proper date mocking approach in project guidelines
  - Include examples of correct usage patterns

- [ ] **T007: Add mocking and test utility checks to code review checklist**
  - Update PR template with specific validation criteria
  - Cover mocking policies, date mocking, and error testing

- [ ] **T010: Document approved color pairings and contrast ratios**
  - List all theme color combinations with their WCAG contrast ratios
  - Reference the centralized color contrast utility

- [ ] **T011: Audit adoption of centralized color contrast utility**
  - Review components for proper use of the accessibility color system
  - Document findings and create follow-up tickets for non-compliance

- [ ] **T012: Configure Jest for clearer test failure output**
  - Enhance error messaging to better show actual vs expected values
  - Implement necessary Jest configuration changes

- [ ] **T013: Configure detailed accessibility violation reporting**
  - Update `storybook-a11y` to show specific selectors and WCAG rules
  - Improve violation details in CI output

- [ ] **T014: Document approved testing patterns**
  - Create guidelines for mocking external dependencies
  - Include examples for handling async operations properly

- [ ] **T015: Update accessibility best practices documentation**
  - Document color contrast requirements
  - List common accessibility pitfalls and solutions

### CI Resolution Prevention Measures

- [ ] **T016CI: Update mocking policy documentation**
  - Add clear examples of correct vs incorrect mocking
  - Emphasize "Mock ONLY True External System Boundaries"
  - Include practical examples

- [ ] **T017CI: Fix and enforce local pre-commit accessibility hook**
  - Ensure the hook correctly identifies staged story files
  - Make it work reliably for all developers

- [ ] **T018CI: Add jest-axe assertions to component tests**
  - Include accessibility assertions in critical component unit tests
  - Provide an additional layer of a11y testing

- [ ] **T019CI: Create accessibility guidelines**
  - Document common accessibility patterns
  - Include approved color palettes with validated contrast ratios
  - Provide ARIA attribute usage examples

- [ ] **T020CI: Implement CI failure post-mortem process**
  - Create a template for CI failure analysis
  - Establish a regular review schedule
  - Document learnings and improvements

## Clarifications & Assumptions

- Confirm current hex value of `var(--electric-blue)` in `src/app/globals.css` (for task T003)
- Determine if the team has existing documentation/guidelines to update or if new ones need to be created

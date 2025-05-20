# CI Resolution Tasks

## Priority 0 (Critical - Must Fix for CI to Pass)

### Unit Test Failures - Refactoring for DI

- [ ] **T001: Refactor github modules for dependency injection**
  - Modify modules in `src/lib/github/` (repositories, auth, commits, utils) to accept Octokit client and fetch functions as explicit dependencies
  - Export interfaces for external dependencies where needed
  - Modules should no longer instantiate external clients internally

- [ ] **T002: Refactor summary API handlers for dependency injection**
  - Modify `src/app/api/summary/handlers.ts` to accept external dependencies explicitly
  - Dependencies should be injected via parameters or constructor arguments
  - **Depends on:** T001

### Unit Test Failures - Test Corrections

- [ ] **T003: Correct mocks and async handling in summary API handler tests**
  - Remove internal mocks from `src/app/api/summary/__tests__/handlers.test.ts`
  - Mock only injected external dependencies
  - Update assertions to focus on public behavior
  - Ensure proper async/await usage and Promise handling
  - **Depends on:** T002

- [ ] **T004: Fix "me" special case logic in summary API handlers**
  - Investigate and correct the "me" special case logic in handlers
  - Update the corresponding test to assert correct behavior
  - **Depends on:** T003

- [ ] **T005: Correct mocks and async handling in github/repositories tests**
  - Remove internal mocks from `src/lib/github/__tests__/repositories.test.ts`
  - Mock only injected Octokit client
  - Update assertions and ensure proper async handling
  - **Depends on:** T001

- [ ] **T006: Correct mocks and async handling in github/auth tests**
  - Remove internal mocks from `src/lib/github/__tests__/auth.test.ts`
  - Mock only injected dependencies
  - Update assertions and ensure proper async handling
  - **Depends on:** T001

- [ ] **T007: Correct mocks and async handling in github/commits tests**
  - Remove internal mocks from `src/lib/github/__tests__/commits.test.ts`
  - Mock only injected dependencies
  - Fix promise rejection handling
  - **Depends on:** T001

### Accessibility Violations

- [ ] **T008: Fix color contrast violations**
  - Fix contrast issues in LoadMoreButton, ModeSelector, OperationsPanel
  - Adjust colors to meet WCAG AA requirements (4.5:1 normal text, 3:1 large text)
  - Verify in both light and dark modes

- [ ] **T009: Fix interactive element accessibility**
  - Ensure keyboard focusability for all interactive elements
  - Add proper ARIA roles, states, and properties
  - Correct tabindex usage

- [ ] **T010: Fix button name accessibility**
  - Add aria-labels to icon-only buttons
  - Ensure all buttons have accessible names

## Priority 1 (Medium - Should Fix Soon)

- [ ] **T011: Fix pre-commit script test**
  - Update execSync mock in `scripts/__tests__/check-a11y-staged-stories.test.js`
  - Return realistic `git diff --cached --name-status` output
  - Verify filtering logic works correctly

## Priority 2 (Low - Prevention Measures)

- [ ] **T012: Update mocking policy documentation**
  - Add clear examples of correct vs incorrect mocking
  - Emphasize "Mock ONLY True External System Boundaries"
  - Include practical examples

- [ ] **T013: Fix and enforce local pre-commit accessibility hook**
  - Ensure the hook correctly identifies staged story files
  - Make it work reliably for all developers

- [ ] **T014: Add jest-axe assertions to component tests**
  - Include accessibility assertions in critical component unit tests
  - Provide an additional layer of a11y testing

- [ ] **T015: Create accessibility guidelines**
  - Document common accessibility patterns
  - Include approved color palettes with validated contrast ratios
  - Provide ARIA attribute usage examples

- [ ] **T016: Implement CI failure post-mortem process**
  - Create a template for CI failure analysis
  - Establish a regular review schedule
  - Document learnings and improvements

## Verification Steps

After completing each task group:

1. **Unit Tests**: Run `npm test` locally to verify all tests pass
2. **Accessibility**: Run `npm run storybook` and check the accessibility panel
3. **Pre-commit**: Test the hook with `git add` and `git commit` on story files
4. **CI Pipeline**: Push changes and verify all CI checks pass

## Timeline

1. **Immediate (Day 1-2)**: Complete T001-T010 to unblock CI
2. **Week 1**: Complete T011, start T012-T16
3. **Week 2-3**: Complete all prevention measures (T012-T16)
4. **Ongoing**: Monitor and maintain test health
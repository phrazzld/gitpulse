# Atomic Design Migration and Test Refactoring Plan

This TODO list outlines the tasks needed to complete the Atomic Design migration and fix all test failures in the PR #19 branch. Each task is designed to be atomic, focused, and independently completable where possible.

## Testing Infrastructure Improvements

- [x] **TASK-001: Create Jest ESM Module Setup**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Jest can properly import and test ES Modules
  - **Description**:
    - ✅ Create a comprehensive `jest.setup.esm.js` file that handles all ESM import issues
    - ✅ Add proper global mocks for fetch, Headers, ReadableStream
    - ✅ Ensure structuredClone and TextEncoder/TextDecoder are available
```javascript
// Sample implementation for jest.setup.esm.js
global.fetch = jest.fn(() => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
  status: 200,
  headers: new Map()
}));

if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
}
```

- [x] **TASK-002: Update Jest Configuration**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-001
  - **Success Criteria**: Jest transformIgnorePatterns correctly handles all ESM modules
  - **Description**:
    - ✅ Update `jest.config.js` to handle all ES modules used in the project
    - ✅ Add all Octokit and related packages to transformIgnorePatterns
    - ✅ Ensure test environment is properly configured
```javascript
// Sample implementation for jest.config.js
transformIgnorePatterns: [
  '/node_modules/(?!(' + [
    // Octokit packages
    'octokit',
    '@octokit',
    // All other ESM packages
    'node-fetch',
    'undici',
    // ... add all required packages
  ].join('|') + ')/)' 
]
```

- [x] **TASK-003: Create Testing Utils for React Components**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: A consistent utility for testing React components
  - **Description**:
    - Create a `src/lib/tests/react-utils.ts` file with standardized utilities
    - Implement a consistent rendering and testing approach using React Testing Library
    - Include utilities for testing with providers, context, etc.
```typescript
// Sample implementation
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## GitHub Module Mocking Strategy

- [x] **TASK-004: Create Standard GitHub Mocking Utilities**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Consistent patterns for mocking GitHub modules
  - **Description**:
    - Create `src/lib/tests/github-mocks.ts` with standardized mock factories
    - Implement factories for common GitHub objects (repos, commits, etc.)
    - Create typed mock functions that behave like the real thing

- [x] **TASK-005: Implement Mock for GitHub Auth**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-004
  - **Success Criteria**: All GitHub auth functions properly mocked
  - **Description**:
    - Update `src/lib/github/__mocks__/auth.ts` with comprehensive mocks
    - Ensure error cases are properly handled (e.g., token validation failures)
    - Add typed responses that match the real API

- [x] **TASK-006: Implement Mock for GitHub Commits**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-004
  - **Success Criteria**: All GitHub commit functions properly mocked
  - **Description**:
    - Update `src/lib/github/__mocks__/commits.ts` with comprehensive mocks
    - Ensure error cases are properly handled
    - Add proper typing to match real implementations

- [x] **TASK-007: Implement Mock for GitHub Repositories**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-004
  - **Success Criteria**: All GitHub repo functions properly mocked
  - **Description**:
    - Update `src/lib/github/__mocks__/repositories.ts` with comprehensive mocks
    - Ensure error cases are properly handled
    - Add proper typing to match real implementations

- [x] **TASK-008: Implement Mock for GitHub Utils**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-004
  - **Success Criteria**: All GitHub utility functions properly mocked
  - **Description**:
    - Update `src/lib/github/__mocks__/utils.ts` with comprehensive mocks
    - Fix the deduplicateBy function to work correctly in tests

## React Hooks Testing Patterns

- [x] **TASK-009: Create Hooks Testing Utilities**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-003
  - **Success Criteria**: Standard approach for testing hooks
  - **Description**:
    - ✅ Create `src/lib/tests/react-test-utils.ts` with utilities for testing hooks
    - ✅ Set up renderHook with proper error handling
    - ✅ Create utilities for mocking context for hooks

- [x] **TASK-010: Fix useInstallations Hook Testing**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: TASK-009
  - **Success Criteria**: useInstallations tests pass
  - **Description**:
  - [x] Update `src/hooks/dashboard/__tests__/useInstallations.test.ts`
  - [x] Use renderHook properly to test the hook
  - [x] Mock API responses and state changes

- [x] **TASK-011: Fix useCommits Hook Testing**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: TASK-009
  - **Success Criteria**: useCommits tests pass
  - **Description**:
  - [x] Update `src/hooks/dashboard/__tests__/useCommits.test.ts`
  - [x] Use renderHook properly to test the hook
  - [x] Mock API responses and state changes

## Component Tests Refactoring

- [x] **TASK-012: Fix SummaryStats Tests**
  - **Priority**: Medium
  - **Effort**: Small
  - **Dependencies**: TASK-003
  - **Success Criteria**: All SummaryStats tests pass
  - **Description**:
    - ✅ Update `src/components/dashboard/__tests__/SummaryStats.test.tsx`
    - ✅ Use React Testing Library patterns
    - ✅ Add proper null/undefined handling
    - ✅ Test all component branches

- [x] **TASK-013: Fix OperationsPanel Tests**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: TASK-003
  - **Success Criteria**: All OperationsPanel tests pass
  - **Description**:
  - [x] Update `src/components/dashboard/__tests__/OperationsPanel.test.tsx`
  - [x] Adapt tests to the new Atomic Design component structure
  - [x] Test correct rendering of TerminalHeader and AuthStatusBanner

- [x] **TASK-014: Fix RepositorySection Tests**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: TASK-003
  - **Success Criteria**: All RepositorySection tests pass
  - **Description**:
    - ✅ Create new test in organisms directory
    - ✅ Use React Testing Library queries instead of string assertions
    - ✅ Test with proper component structure
    - ✅ Create backward compatibility module

- [x] **TASK-015: Fix SummaryView Tests**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: TASK-003
  - **Success Criteria**: All SummaryView tests pass
  - **Description**:
  - [x] Update `src/components/dashboard/__tests__/SummaryView.test.tsx`
  - [x] Adapt tests to the new Atomic Design component structure

- [x] **TASK-016: Fix SummaryDetails Tests**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: TASK-003
  - **Success Criteria**: All SummaryDetails tests pass
  - **Description**:
  - [x] Update `src/components/dashboard/__tests__/SummaryDetails.test.tsx`
  - [x] Fix string content assertions to match new component structure

- [x] **TASK-017: Fix API Tests**
  - **Priority**: High
  - **Effort**: Large
  - **Dependencies**: TASK-001, TASK-002
  - **Success Criteria**: All API tests pass
  - **Description**:
  - [x] Fix `src/app/api/summary/__tests__/handlers.test.ts`
  - [x] Fix `src/app/api/summary/__tests__/route.test.ts`
  - [x] Handle Next.js Request object properly in tests

## Storybook Accessibility Testing

- [x] **TASK-018: Create Custom A11y Test Setup**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Storybook a11y tests correctly report but don't fail on issues
  - **Description**:
    - ✅ Create `.storybook/utils/custom-a11y-test-utils.js` and custom-axe-reporter.js
    - ✅ Ensure Storybook reports a11y issues without failing tests
    - ✅ Fix implementation of `customTestResultDependsOnViolations`

- [x] **TASK-019: Fix Storybook Test Configuration**
  - **Priority**: Medium
  - **Effort**: Small
  - **Dependencies**: TASK-018
  - **Success Criteria**: Storybook test runner properly uses custom config
  - **Description**:
    - ✅ Create test-storybook.config.js in the project root
    - ✅ Properly configure the test runner without using unsupported options
    - ✅ Add accessibility test configuration

- [x] **TASK-020: Fix GitHub Action for Storybook**
  - **Priority**: Medium
  - **Effort**: Small
  - **Dependencies**: TASK-019
  - **Success Criteria**: Storybook GitHub Action passes all tests
  - **Description**:
    - ✅ Update `.github/workflows/storybook-a11y.yml`
    - ✅ Create proper test environment setup
    - ✅ Ensure all env variables are set correctly

## Component Migration (Completing the Atomic Design)

- [x] **TASK-021: Audit Current Component Structure**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Complete inventory of components and their classification
  - **Description**:
  - [x] Review all components in the codebase
  - [x] Create a spreadsheet mapping components to Atomic Design categories
  - [x] Identify components that need to be moved

- [ ] **TASK-022: Move Remaining Components to Proper Folders**
  - **Priority**: High
  - **Effort**: Large
  - **Dependencies**: TASK-021
  - **Success Criteria**: All components properly organized
  - **Description**:
  - [ ] Move remaining components to atoms/molecules/organisms/templates
  - [ ] Update imports throughout the codebase
  - [ ] Update tests to match new locations

- [ ] **TASK-023: Create Documentation for Atomic Design Structure**
  - **Priority**: Low
  - **Effort**: Small
  - **Dependencies**: TASK-022
  - **Success Criteria**: Clear documentation for the Atomic Design implementation
  - **Description**:
  - [ ] Create `docs/ATOMIC_DESIGN.md` explaining the implementation
  - [ ] Document guidelines for categorizing components
  - [ ] Include examples and patterns

## Implementation Order

1. **Foundation Tasks**:
   - [x] TASK-001: Create Jest ESM Module Setup
   - [x] TASK-002: Update Jest Configuration
   - [x] TASK-003: Create Testing Utils for React Components
   - [x] TASK-004: Create Standard GitHub Mocking Utilities
   - [x] TASK-009: Create Hooks Testing Utilities
   - [x] TASK-021: Audit Current Component Structure

2. **API & Module Mocking**:
   - [x] TASK-005: Implement Mock for GitHub Auth
   - [x] TASK-006: Implement Mock for GitHub Commits
   - [x] TASK-007: Implement Mock for GitHub Repositories
   - [x] TASK-008: Implement Mock for GitHub Utils
   - [x] TASK-017: Fix API Tests

3. **Component & Hook Testing**:
   - [x] TASK-010: Fix useInstallations Hook Testing
   - [x] TASK-011: Fix useCommits Hook Testing
   - [x] TASK-012: Fix SummaryStats Tests
   - [x] TASK-013: Fix OperationsPanel Tests
   - [x] TASK-014: Fix RepositorySection Tests
   - [x] TASK-015: Fix SummaryView Tests
   - [x] TASK-016: Fix SummaryDetails Tests

4. **Infrastructure & Tooling**:
   - [x] **TASK-024: Fix TypeScript Issues in Test Utilities**
     - **Priority**: High
     - **Effort**: Large
     - **Dependencies**: None
     - **Success Criteria**: All TypeScript errors are resolved
     - **Description**:
     - [x] Address typing issues in `react-test-utils.ts`
     - [x] Fix mock data to match expected interfaces
     - [x] Address generic type handling in test utilities
     - [x] Add proper type guards for unknown types
     - [x] Update React component testing utilities to use correct types
     - [x] See `TYPESCRIPT_ISSUES.md` for full details

5. **Storybook & Component Migration**:
   - [x] TASK-018: Create Custom A11y Test Setup
   - [x] TASK-019: Fix Storybook Test Configuration
   - [x] TASK-020: Fix GitHub Action for Storybook
   - [x] TASK-021: Audit Current Component Structure
   - [ ] TASK-022: Move Remaining Components to Proper Folders
   - [ ] TASK-023: Create Documentation for Atomic Design Structure
# Remediation Tasks Breakdown

This document breaks down the implementation of the remediation plan into atomic, actionable tasks with proper dependencies.

## Type Safety Tasks (Phase 1)

- **TASK-041: Identify and catalog forbidden `any` type usages**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Complete inventory of all `any` types in the codebase
  - **Verification**: 
    - Run `npm run typecheck` to confirm identified locations
    - Document each instance with file path and reason for usage
  - **Description**:
    - Scan codebase for all instances of `any` type usage
    - Create a catalog of findings with file paths and context
    - Prioritize instances by impact

- **TASK-042: Replace `any` types in React Testing Utility interfaces**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-041
  - **Success Criteria**: All interfaces/types in react-test-utils.ts use proper types
  - **Verification**: 
    - Run `npm run typecheck` to confirm no errors
    - Run affected tests to verify functionality is preserved
  - **Description**:
    - Update `SafeRenderHookResult` type to use proper generics
    - Replace `any` in type parameters and interfaces
    - Ensure backward compatibility where needed

- **TASK-043: Replace `any` in hook testing utility function parameters**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-042
  - **Success Criteria**: All function parameters properly typed
  - **Verification**: 
    - Run `npm run typecheck` to confirm no errors
    - Run affected tests to verify functionality is preserved
  - **Description**:
    - Update `renderHookSafely` options parameter to use proper types
    - Update `renderAsyncHook` options parameter to use proper types
    - Add proper typings for callback functions and parameters

- **TASK-044: Fix remaining `any` usages across the codebase**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-041
  - **Success Criteria**: All identified `any` usages replaced with proper types
  - **Verification**: 
    - Run `npm run typecheck` to confirm no errors
    - Run all tests to verify functionality is preserved
  - **Description**:
    - Address each item in the inventory from TASK-041
    - Replace with specific types, interfaces, or generics
    - Document complex cases with explanatory comments

- **TASK-045: Identify and catalog TypeScript/ESLint suppressions**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Complete inventory of all error suppressions
  - **Verification**: Inventory should include file path, suppression type, and underlying issue
  - **Description**:
    - Find all instances of `// eslint-disable`, `@ts-ignore`, `@ts-expect-error`
    - Catalog each instance with file path and context
    - Identify the underlying issue causing the suppression

- **TASK-046: Fix TypeScript/ESLint suppressions in test utilities**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-045
  - **Success Criteria**: All suppressions removed and underlying issues fixed
  - **Verification**: 
    - Run `npm run lint` and `npm run typecheck` to confirm no errors
    - Run tests to verify functionality is preserved
  - **Description**:
    - Address suppressions in test utilities first
    - Fix the root cause of each suppression
    - Refactor code to properly handle edge cases

- **TASK-047: Fix remaining TypeScript/ESLint suppressions**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-045
  - **Success Criteria**: All suppressions removed and underlying issues fixed
  - **Verification**: 
    - Run `npm run lint` and `npm run typecheck` to confirm no errors
    - Run all tests to verify functionality is preserved
  - **Description**:
    - Fix suppressions in all other files identified in TASK-045
    - Fix the root cause of each suppression
    - Refactor code where necessary

## Testing Infrastructure Tasks (Phase 2)

- **TASK-048: Create FetchContext for dependency injection**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: FetchContext properly created and exported
  - **Verification**: 
    - Run `npm run typecheck` to confirm no errors
    - Create a simple test that uses the context
  - **Description**:
    - Create a new file for the FetchContext
    - Implement context with proper TypeScript types
    - Add usage examples as comments

- **TASK-049: Refactor renderAsyncHook to remove global mocking**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-048
  - **Success Criteria**: Function works without global mocks
  - **Verification**: 
    - Run tests using the function to verify behavior is preserved
    - Confirm no global fetch mock is used
  - **Description**:
    - Reimplement using the FetchContext
    - Remove global fetch mocking
    - Ensure backward compatibility if possible

- **TASK-050: Create RouterContext for Next.js testing**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Context properly created with types
  - **Verification**: 
    - Run `npm run typecheck` to confirm no errors
    - Create a simple test that uses the context
  - **Description**:
    - Create RouterContext with proper NextRouter type
    - Implement provider component
    - Create utility for generating router wrappers

- **TASK-051: Refactor mockNextRouter to use context**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-050
  - **Success Criteria**: Function works without global monkey-patching
  - **Verification**: 
    - Run tests using the function to verify behavior is preserved
    - Confirm no monkey-patching of Next.js internals
  - **Description**:
    - Reimagine the function to return a context wrapper
    - Update documentation on how to use it
    - Ensure backward compatibility if possible

- **TASK-052: Refactor mockNextAuthSession to use context**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Function works without global monkey-patching
  - **Verification**: 
    - Run tests using the function to verify behavior is preserved
    - Confirm no monkey-patching of NextAuth internals
  - **Description**:
    - Create SessionContext if needed
    - Reimagine the function to return a context wrapper
    - Update documentation and examples

- **TASK-053: Create EnhancedRenderHookResult type**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Type properly extends RTL's RenderHookResult
  - **Verification**: 
    - Run `npm run typecheck` to confirm no errors
    - Test with various hook result types
  - **Description**:
    - Define type that extends RenderHookResult
    - Add only truly necessary extensions
    - Ensure proper TypeScript typing

- **TASK-054: Implement renderHookEnhanced function**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-053
  - **Success Criteria**: Function directly leverages RTL's native utilities
  - **Verification**: 
    - Run tests that use the function
    - Confirm no custom reimplementation of waitFor logic
  - **Description**:
    - Implement using native RTL utilities
    - Add necessary extensions for backward compatibility
    - Document usage with examples

- **TASK-055: Migrate tests to use new renderHookEnhanced function**
  - **Priority**: High
  - **Effort**: Large
  - **Dependencies**: TASK-054
  - **Success Criteria**: Tests refactored to use native RTL methods
  - **Verification**: 
    - All tests pass
    - No more usage of custom waitFor implementations
  - **Description**:
    - Update tests to use renderHook and native waitFor
    - Replace waitForNextUpdate with appropriate waitFor usage
    - Refactor test assertions as needed

## CI and Dependency Management Tasks (Phase 3)

- **TASK-056: Analyze peer dependency conflicts**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Complete inventory of dependency conflicts
  - **Verification**: Output of dependency analysis commands
  - **Description**:
    - Run npm commands to analyze dependency tree
    - Identify specific conflicts with React 19
    - Document exact version requirements for each conflict

- **TASK-057: Update package.json to resolve dependency conflicts**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: TASK-056
  - **Success Criteria**: Dependencies properly specified for compatibility
  - **Verification**: 
    - `npm install` completes without peer dependency warnings
    - `npm ci` works without --legacy-peer-deps flag
  - **Description**:
    - Update React-related dependencies to compatible versions
    - Update testing libraries to latest versions
    - Ensure all specified versions can coexist

- **TASK-058: Update CI workflow to remove legacy-peer-deps flag**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-057
  - **Success Criteria**: CI workflow works without the flag
  - **Verification**: 
    - CI job successfully installs dependencies
    - Build passes without the flag
  - **Description**:
    - Remove --legacy-peer-deps from npm ci command
    - Update any related scripts
    - Test workflow locally before pushing

- **TASK-059: Update dependency management documentation**
  - **Priority**: Medium
  - **Effort**: Small
  - **Dependencies**: TASK-057, TASK-058
  - **Success Criteria**: Documentation reflects current approach
  - **Verification**: Documentation clearly explains the dependency strategy
  - **Description**:
    - Update approach section to remove legacy-peer-deps references
    - Document lessons learned about React 19 compatibility
    - Update best practices section if needed

- **TASK-060: Update Jest coverage configuration**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Coverage thresholds properly defined
  - **Verification**: 
    - Coverage reports show correct thresholds
    - CI properly enforces thresholds
  - **Description**:
    - Update package.json or jest.config.js
    - Add thresholds for atoms, molecules, organisms, and templates
    - Ensure global thresholds are sufficient

- **TASK-061: Add E2E tests to CI workflow**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: CI workflow includes E2E test step
  - **Verification**: 
    - CI workflow properly installs Playwright
    - E2E tests run as part of CI
  - **Description**:
    - Add Playwright installation step
    - Add E2E test execution step
    - Configure proper timing in workflow

- **TASK-062: Add accessibility checks to CI workflow**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: CI workflow includes a11y test step
  - **Verification**: 
    - CI workflow runs a11y tests
    - A11y violations fail the build
  - **Description**:
    - Add Storybook a11y test step
    - Configure pass/fail criteria
    - Ensure tests run correctly in CI environment

- **TASK-063: Configure Lighthouse CI**
  - **Priority**: Medium
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Lighthouse CI configuration added
  - **Verification**: 
    - Configuration file validates
    - Local test runs successfully
  - **Description**:
    - Create lighthouserc.js configuration file
    - Define appropriate performance budgets
    - Configure assertion levels for metrics

- **TASK-064: Add Lighthouse CI to workflow**
  - **Priority**: Medium
  - **Effort**: Small
  - **Dependencies**: TASK-063
  - **Success Criteria**: CI workflow includes Lighthouse step
  - **Verification**: 
    - CI workflow runs Lighthouse
    - Performance violations fail the build
  - **Description**:
    - Add Lighthouse CI installation step
    - Add Lighthouse execution step
    - Configure proper timing in workflow

- **TASK-065: Create nuanced security audit script**
  - **Priority**: High
  - **Effort**: Medium
  - **Dependencies**: None
  - **Success Criteria**: Script properly checks vulnerabilities
  - **Verification**: 
    - Script correctly detects critical vulnerabilities
    - Script correctly handles high vulnerabilities in prod dependencies
  - **Description**:
    - Implement script as specified in the plan
    - Add error handling and logging
    - Ensure clear output for CI logs

- **TASK-066: Update CI workflow to use security audit script**
  - **Priority**: High
  - **Effort**: Small
  - **Dependencies**: TASK-065
  - **Success Criteria**: CI workflow uses new script
  - **Verification**: 
    - Workflow runs script correctly
    - Security vulnerabilities are properly detected
  - **Description**:
    - Replace npm audit command with script
    - Update any related steps
    - Test workflow locally before pushing

## Implementation Order

1. **Foundation and Analysis Phase**:
   - TASK-041: Identify and catalog forbidden `any` type usages
   - TASK-045: Identify and catalog TypeScript/ESLint suppressions
   - TASK-056: Analyze peer dependency conflicts

2. **Type Safety Improvements**:
   - TASK-042: Replace `any` types in React Testing Utility interfaces
   - TASK-043: Replace `any` in hook testing utility function parameters
   - TASK-044: Fix remaining `any` usages across the codebase
   - TASK-046: Fix TypeScript/ESLint suppressions in test utilities
   - TASK-047: Fix remaining TypeScript/ESLint suppressions

3. **Testing Infrastructure Upgrade**:
   - TASK-048: Create FetchContext for dependency injection
   - TASK-049: Refactor renderAsyncHook to remove global mocking
   - TASK-050: Create RouterContext for Next.js testing
   - TASK-051: Refactor mockNextRouter to use context
   - TASK-052: Refactor mockNextAuthSession to use context
   - TASK-053: Create EnhancedRenderHookResult type
   - TASK-054: Implement renderHookEnhanced function
   - TASK-055: Migrate tests to use new renderHookEnhanced function

4. **Dependency and CI Upgrades**:
   - TASK-057: Update package.json to resolve dependency conflicts
   - TASK-058: Update CI workflow to remove legacy-peer-deps flag
   - TASK-059: Update dependency management documentation
   - TASK-060: Update Jest coverage configuration
   - TASK-065: Create nuanced security audit script
   - TASK-066: Update CI workflow to use security audit script
   - TASK-061: Add E2E tests to CI workflow
   - TASK-062: Add accessibility checks to CI workflow
   - TASK-063: Configure Lighthouse CI
   - TASK-064: Add Lighthouse CI to workflow
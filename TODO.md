# TODO

## Code Quality & Standards Compliance (High Priority)
- [x] **Standardize Error Handling in GitHub Utilities:** Choose a consistent approach for error handling across all GitHub utility functions.
  - **Action:** Review all error handling in `src/lib/github.ts`. Decide on a consistent approach (either re-throwing specific error types or returning structured error objects). Refactor functions like `getAllAppInstallations`, `fetchAllRepositoriesOAuth`, and `fetchCommitsForRepositories` to follow this standard. Update any calling code to handle errors appropriately.
  - **Depends On:** None
  - **AC Ref:** ARCHITECTURE_GUIDELINES.md (Consistent Error Handling)

- [x] **Extract Cache Key Generation Logic:** Create a central utility function for generating consistent cache keys.
  - **Action:** Implement a reusable function `generateCacheKey(params: Record<string, any>): string` in `src/lib/cache.ts` that takes relevant parameters (user ID, installation ID, filters, etc.) and produces a consistent cache key string. Refactor all API routes (e.g., `src/app/api/contributors/route.ts`, `src/app/api/repos/route.ts`) to use this new utility function.
  - **Depends On:** None
  - **AC Ref:** ARCHITECTURE_GUIDELINES.md (Embrace the Unix Philosophy, Separation of Concerns)

- [x] **Add Explicit Type Definitions in Dashboard Page:** Strengthen type safety in the Dashboard component.
  - **Action:** In `src/app/dashboard/page.tsx`, explicitly define TypeScript types for `requestedInstallationIds`, `installationIds`, and any other variables with implicit typing (around lines 68-70). Create interfaces or types as needed and apply them consistently.
  - **Depends On:** None
  - **AC Ref:** CODING_STANDARDS.md (Leverage Types Diligently)

## Code Quality & Standards Compliance (Medium Priority)
- [x] **Configure Jest Coverage Thresholds:** Enforce minimum test coverage standards.
  - **Action:** Update `jest.config.js` to include the `coverageThreshold` property. Set minimum acceptable coverage percentages (suggested 80%) for statements, branches, functions, and lines. Configure the CI pipeline to fail if these thresholds are not met.
  - **Depends On:** None
  - **AC Ref:** TESTING_STRATEGY.md (Automation, Guiding Principles)

- [x] **Replace Magic Values with Named Constants:** Eliminate hard-coded values for improved maintainability.
  - **Action:** Identify literal values throughout the codebase (e.g., `'oauth'` in `src/app/dashboard/page.tsx:72`, `batchSize` in `src/lib/github.ts:421`, cache TTLs). Create named constants with descriptive names (either in a central `constants.ts` file or within relevant modules). Replace all instances of these magic values with the new constants.
  - **Depends On:** None
  - **AC Ref:** CORE_PRINCIPLES.md (Explicit is Better than Implicit), CODING_STANDARDS.md (Meaningful Naming)

- [ ] **Ensure Consistent Variable Naming:** Standardize variable names across the codebase.
  - **Action:** Address the inconsistency between `installationId` and `installId` in `src/app/dashboard/page.tsx` and potentially elsewhere. Choose one naming convention and apply it consistently throughout the entire codebase. Use search tools to find all instances needing updates.
  - **Depends On:** None
  - **AC Ref:** CODING_STANDARDS.md (Meaningful Naming)

- [ ] **Improve Integration Test Mocking Strategy:** Enhance test reliability by focusing on real component interactions.
  - **Action:** Review integration tests in `src/__tests__/integration/dashboard.test.tsx`. Reduce mocking of internal components to test actual integration points. Focus on mocking only at external boundaries (e.g., API calls) using tools like MSW. Refactor tests to verify behavior rather than implementation details.
  - **Depends On:** None
  - **AC Ref:** TESTING_STRATEGY.md (Mocking Policy, Behavior Over Implementation)

## Code Quality & Standards Compliance (Low Priority)
- [ ] **Add JSDoc Comments to Libraries and Types:** Improve code documentation for better maintainability.
  - **Action:** Add comprehensive JSDoc comments to all exported types, interfaces, functions, and constants in `src/lib/optimize.ts`, `src/types/github.ts`, `src/types/summary.ts`, and other key utility files. Include purpose, parameters, return values, and usage examples.
  - **Depends On:** None
  - **AC Ref:** DOCUMENTATION_APPROACH.md (Prioritize Self-Documenting Code, Code Comments)

- [ ] **Refine CSS Mocking in Tests:** Explore more robust solutions for CSS handling in tests.
  - **Action:** Evaluate the current CSS variable mocking in `jest.setup.js`. Research and potentially implement more robust solutions like `jest-styled-components` or `identity-obj-proxy` if using styled-components or CSS modules extensively.
  - **Depends On:** None
  - **AC Ref:** TESTING_STRATEGY.md (Simplicity & Clarity)

- [ ] **Clarify Backlog Items:** Make backlog items more specific and actionable.
  - **Action:** Review `BACKLOG.md` and identify vague or too general items (like "Implement comprehensive testing strategy"). Add concrete details, specific steps, and measurable outcomes. For component extraction tasks, specify target file locations (e.g., for `CommitItem` extraction).
  - **Depends On:** None
  - **AC Ref:** DOCUMENTATION_APPROACH.md (Document Decisions, Not Mechanics)

## [!] CLARIFICATIONS NEEDED / ASSUMPTIONS
- [ ] **Issue/Assumption:** Error Handling Standardization Approach
  - **Context:** The task to standardize error handling requires an explicit decision on whether to adopt a re-throwing approach or a structured error return approach. This architectural decision should be made before implementation.

- [ ] **Issue/Assumption:** Cache Key Generation Scope
  - **Context:** The recommendation to extract cache key generation logic assumes this applies to server-side API routes. Clarification needed on whether client-side caching (e.g., `localStorageCache.ts`) should also use the same strategy.

- [ ] **Issue/Assumption:** Coverage Threshold Targets
  - **Context:** The task to add coverage thresholds suggests 80% as a starting point, but the appropriate threshold may vary by module. Input needed on whether different thresholds should apply to different areas of the codebase.
# Todo

## GitHub Library Foundation (Plan 1/7)
- [x] **T001 · Chore · P2: create github library subdirectory**
    - **Context:** PLAN.md - Detailed Build Steps #1
    - **Action:**
        1. Create the directory `src/lib/github/`.
    - **Done‑when:**
        1. Directory `src/lib/github/` exists in the main branch.
    - **Depends‑on:** none

- [x] **T002 · Refactor · P1: extract github types to types.ts**
    - **Context:** PLAN.md - Detailed Build Steps #2, Architecture Blueprint (types.ts)
    - **Action:**
        1. Create `src/lib/github/types.ts`.
        2. Identify and move all relevant GitHub-related `interface` and `type` definitions (e.g., `Repository`, `Commit`, `AppInstallation`, `RateLimitInfo`, `GitHubAuthMethod`) from `src/lib/github.ts` to `src/lib/github/types.ts`.
        3. Export all necessary types from `types.ts`.
    - **Done‑when:**
        1. `src/lib/github/types.ts` contains the extracted type definitions.
        2. Types are correctly exported.
        3. `src/lib/github.ts` temporarily still contains the types (removed in T004).
        4. Type checker (`tsc --noEmit` or equivalent) passes for `src/lib/github/types.ts`.
    - **Depends‑on:** [T001]

- [x] **T003 · Refactor · P1: extract github utility functions to utils.ts**
    - **Context:** PLAN.md - Detailed Build Steps #3, Architecture Blueprint (utils.ts)
    - **Action:**
        1. Create `src/lib/github/utils.ts`.
        2. Identify and move pure utility functions (e.g., `checkRateLimit`, `parseTokenScopes`, `validateTokenScopes`, `formatGitHubError`, `deduplicateBy`, `splitRepoFullName`, `processBatches`) from `src/lib/github.ts` to `src/lib/github/utils.ts`.
        3. Update internal imports within `utils.ts` to use `./types` if needed (e.g., `import * as GitHubTypes from './types';`) and export public utilities.
    - **Done‑when:**
        1. `src/lib/github/utils.ts` contains the extracted pure utility functions.
        2. Functions are correctly exported.
        3. `src/lib/github.ts` temporarily still contains the utilities (removed in T004).
        4. Type checker (`tsc --noEmit` or equivalent) passes for `src/lib/github/utils.ts`.
    - **Depends‑on:** [T001, T002]

- [x] **T004 · Refactor · P1: refactor src/lib/github.ts to use extracted modules**
    - **Context:** PLAN.md - Detailed Build Steps #4, Architecture Blueprint (OrigGithub)
    - **Action:**
        1. Remove the original type definitions and utility functions from `src/lib/github.ts` that were moved in T002 and T003.
        2. Add imports in `src/lib/github.ts` for types (e.g., `import * as GitHubTypes from './github/types';`) and utils (e.g., `import * as GitHubUtils from './github/utils';`), adjusting paths as needed (`@/lib/...` or relative).
        3. Update the remaining code in `src/lib/github.ts` to reference the imported types and functions (e.g., `GitHubTypes.RateLimitInfo`, `GitHubUtils.formatGitHubError`).
    - **Done‑when:**
        1. Moved types and utils are removed from `src/lib/github.ts`.
        2. `src/lib/github.ts` correctly imports and uses types from `types.ts` and functions from `utils.ts`.
        3. The *exported API* of `src/lib/github.ts` remains unchanged for external consumers.
        4. Type checker (`tsc --noEmit` or equivalent) passes for `src/lib/github.ts` and related files.
    - **Depends‑on:** [T002, T003]

- [x] **T005 · Test · P1: implement unit tests for github utils**
    - **Context:** PLAN.md - Detailed Build Steps #5, Testing Strategy (New Unit Tests)
    - **Action:**
        1. Create `src/lib/github/utils.test.ts`.
        2. Write unit tests covering logic, branches, and edge cases for all functions exported from `src/lib/github/utils.ts`.
        3. Ensure tests achieve high coverage (e.g., >= 90%) for `utils.ts`.
    - **Done‑when:**
        1. `src/lib/github/utils.test.ts` exists.
        2. Unit tests for `utils.ts` functions are implemented and cover logic/edges.
        3. Code coverage for `utils.ts` meets the defined threshold (>= 90%).
    - **Depends‑on:** [T003]

- [x] **T006 · Chore · P1: run static analysis and fix issues**
    - **Context:** PLAN.md - Detailed Build Steps #6, Risk Matrix (Build/Type Errors)
    - **Action:**
        1. Run the project's linting command (e.g., `npm run lint`).
        2. Run the project's type checking command (e.g., `npm run typecheck` or `tsc --noEmit`).
        3. Fix all reported linting and type errors introduced by the refactoring in T002, T003, T004.
    - **Done‑when:**
        1. Lint command passes without errors.
        2. Type check command passes without errors.
    - **Depends‑on:** [T004, T005]

- [x] **T007 · Test · P1: execute unit tests for utils.ts**
    - **Context:** PLAN.md - Detailed Build Steps #7, Testing Strategy (New Unit Tests)
    - **Action:**
        1. Run the unit tests specifically for `utils.ts` (e.g., `npm test -- src/lib/github/utils.test.ts`).
        2. Debug and fix any failures in the tests or the utility functions.
    - **Done‑when:**
        1. All unit tests in `src/lib/github/utils.test.ts` pass.
    - **Depends‑on:** [T005, T006]

- [x] **T008 · Test · P1: execute integration tests against refactored facade**
    - **Context:** PLAN.md - Detailed Build Steps #8, Testing Strategy (Existing Integration Tests), Risk Matrix (Functionality Regression)
    - **Action:**
        1. Execute the *entire existing* integration test suite (e.g., `npm test`).
        2. Debug and fix any regressions caused by the refactoring (T004) where `src/lib/github.ts` now uses the extracted modules.
        3. Update integration test mocks *minimally* only if broken by internal import path changes within `src/lib/github.ts`; prefer keeping tests targeting the facade.
    - **Done‑when:**
        1. The full existing integration test suite passes against the refactored `src/lib/github.ts`.
    - **Depends‑on:** [T004, T006]

- [x] **T009 · Docs · P2: add tsdoc comments to new modules**
    - **Context:** PLAN.md - Documentation
    - **Action:**
        1. Add TSDoc blocks (`/** ... */`) to all exported interfaces, types in `types.ts`.
        2. Add TSDoc blocks to all exported functions in `utils.ts`, documenting parameters (`@param`), return values (`@returns`), and purpose.
        3. Add file-level comments in `types.ts` and `utils.ts` explaining their specific responsibilities.
    - **Done‑when:**
        1. All exported types and functions in `src/lib/github/types.ts` and `src/lib/github/utils.ts` have TSDoc comments.
        2. File-level comments are present in both files.
    - **Depends‑on:** [T002, T003]

### Clarifications & Assumptions
- [x] **Issue:** Investigate potential implicit dependencies or side effects in `github.ts` initialization relied upon by consumers.
    - **Context:** PLAN.md - Open Questions
    - **Blocking?:** no *(potentially yes for future plans if complex issues found)*
    - **Action:**
        1. Review the original `src/lib/github.ts` for any module-level initialization logic or non-exported side effects.
        2. Analyze how consumers import and use `src/lib/github.ts` to identify reliance on implicit behavior.
        3. Document findings (e.g., in a comment on this task or a separate note) for consideration during subsequent refactoring plans.
    - **Done‑when:**
        1. Code review of `src/lib/github.ts` initialization completed.
        2. Analysis of consumer usage patterns completed.
        3. Findings documented.
    - **Depends‑on:** none
    - **Type:** Chore
    - **Priority:** P1
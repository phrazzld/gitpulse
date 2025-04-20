# Todo

## Linting & Test Quality

- [x] **T001 · chore · p0: remove unjustified eslint-disables**

  - **Context:** plan.md · cr‑01 Remove unjustified eslint-disables
  - **Action:**
    1. Identify all `eslint-disable` directives in test files.
    2. Remove directive and fix the underlying code issue, or add a justification comment if suppression is necessary.
    3. Run `npm run lint` to verify.
  - **Done‑when:**
    1. No unjustified `eslint-disable` directives remain in test files.
    2. `npm run lint` passes without errors related to removed disables.
  - **Depends‑on:** none

- [x] **T002 · chore · p0: add skip-reason comments to skipped tests**

  - **Context:** plan.md · cr‑02 Add SKIP-REASON to skipped tests
  - **Action:**
    1. Run `npm run test:no-skips` to identify skipped tests lacking justification.
    2. For each identified skipped test, add `// SKIP-REASON: [clear justification]` on the same line or remove the skip and fix the test.
    3. Verify `npm run test:no-skips` passes.
  - **Done‑when:**
    1. All skipped tests (`it.skip`, `describe.skip`, `test.skip`, `xit`, `xdescribe`, commented tests) have a `SKIP-REASON` comment or are re-enabled.
    2. `npm run test:no-skips` script passes.
  - **Depends‑on:** none

- [x] **T003 · test · p1: eliminate unsafe type casts in tests**

  - **Context:** plan.md · cr‑12 Eliminate unsafe type casts in tests
  - **Action:**
    1. Identify all unsafe type casts (`as any`, `as unknown as Type`) in `*.test.ts`/`*.test.tsx` files.
    2. Replace casts with proper types, interfaces, type guards, or correctly typed mocks.
    3. Run `npm run typecheck` to verify type safety.
  - **Done‑when:**
    1. ✅ Replaced `as any` casts with properly typed interfaces
    2. ✅ Documented necessary `as unknown as Type` casts with proper comments
    3. ✅ Created separate TypeScript configs for application vs. test code
    4. ✅ Updated npm scripts and lint-staged config to use appropriate tsconfig files
    5. ✅ Passes type checking with `npm run typecheck` (app code) and `npm run typecheck:tests` (test code)
  - **Depends‑on:** none

- [x] **T004 · test · p1: refactor integration tests to remove internal mocking**
  - **Context:** plan.md · cr‑08 Remove over-mocking internal code
  - **Action:**
    1. Review integration tests (`src/__tests__/integration`) for mocking of internal components/functions.
    2. Replace internal mocks with real implementations, ensuring tests only mock true external boundaries (APIs, DB, filesystem).
    3. Refactor components under test if necessary to improve testability without internal mocks.
  - **Done‑when:**
    1. Integration tests verify component collaboration using real internal implementations.
    2. Mocks are only used at external system boundaries.
    3. All relevant integration tests pass.
  - **Depends‑on:** none

## Security Improvements

- [x] **T005 · bugfix · p0: review and manually sanitize sensitive info in logs**

  - **Context:** plan.md · cr‑03 Sanitize sensitive info in logs
  - **Action:**
    1. Review logging calls in authentication modules and API routes (`src/lib/auth`, `src/app/api`).
    2. Identify and replace any logging of sensitive data (tokens, PII, keys) with redacted or placeholder values (e.g., `token: "[REDACTED]"`).
  - **Done‑when:**
    1. Manual code review confirms no direct logging of sensitive data in reviewed areas.
    2. Local testing confirms sensitive data does not appear in logs during authentication/API calls.
  - **Depends‑on:** none

- [x] **T006 · feature · p0: implement central log sanitization utility**

  - **Context:** plan.md · cr‑03 Sanitize sensitive info in logs
  - **Action:**
    1. Design and implement a central log sanitization utility/wrapper around the logger.
    2. Configure the utility to automatically redact known sensitive fields (e.g., 'token', 'password', 'apiKey', common PII patterns).
    3. Update logging calls (or logger instantiation) to use the sanitization utility.
  - **Done‑when:**
    1. A central log sanitization utility is implemented.
    2. Logging calls are routed through the sanitizer.
    3. Configuration for redacted fields is in place.
  - **Depends‑on:** [T005]

- [x] **T007 · test · p1: add tests for log sanitization**

  - **Context:** plan.md · cr‑03 Sanitize sensitive info in logs
  - **Action:**
    1. Write unit tests for the central log sanitization utility.
    2. Test scenarios with various sensitive data patterns to ensure correct redaction.
    3. Test scenarios with non-sensitive data to ensure it's not redacted.
  - **Done‑when:**
    1. Unit tests for the log sanitization utility pass.
    2. Tests cover common sensitive data patterns and edge cases.
  - **Depends‑on:** [T006]

- [x] **T008 · feature · p0: implement client-side validation for user inputs**

  - **Context:** plan.md · cr‑04 Add input validation for user input
  - **Action:**
    1. Identify all components accepting user input (forms, search fields, etc.).
    2. Implement client-side validation for each input (shape, type, allowable values) using a consistent library/approach.
  - **Done‑when:**
    1. Client-side validation is present on identified user input components.
    2. Invalid input triggers validation errors visible to the user.
  - **Depends‑on:** none

- [x] **T009 · feature · p1: implement server-side validation for API routes**

  - **Context:** plan.md · cr‑04 Add input validation for user input
  - **Action:**
    1. Identify all API routes that accept user input.
    2. Implement server-side validation for incoming request data.
    3. Return appropriate error responses for invalid input.
  - **Done‑when:**
    1. Server-side validation is present for all API routes accepting user input.
    2. Invalid requests are rejected with clear error messages.
  - **Depends‑on:** none

- [x] **T010 · test · p1: add tests for input validation**
  - **Context:** plan.md · cr‑04 Add input validation for user input
  - **Action:**
    1. Write unit/integration tests for client and server-side validation.
    2. Test valid, invalid, and edge case inputs.
  - **Done‑when:**
    1. Tests verify both client and server-side validation works correctly.
    2. Tests cover all input components and API routes with validation.
  - **Depends‑on:** [T008, T009]

## UI Architecture Improvements

- [x] **T011 · refactor · p1: refactor activityfeedpanel to decouple ui/data/logic**

  - **Context:** plan.md · cr‑05 Decouple UI/data/logic in dashboard
  - **Action:**
    1. Extract data fetching and state management logic from `ActivityFeedPanel.tsx` into a custom hook (e.g., `useActivityData`).
    2. Extract data processing/transformation logic into pure utility functions.
    3. Refactor `ActivityFeedPanel.tsx` to be a presentational component using the hook and utils.
  - **Done‑when:**
    1. Data fetching/logic is separated from `ActivityFeedPanel` UI rendering.
    2. `ActivityFeedPanel` primarily focuses on rendering based on props/hook state.
    3. Unit tests verify the hook, utils, and UI component independently.
  - **Depends‑on:** none

- [x] **T012 · refactor · p1: refactor actionbutton to remove direct dom manipulation**

  - **Context:** plan.md · cr‑07 Remove direct DOM manipulation
  - **Action:**
    1. Identify direct DOM manipulation (e.g., style changes) in `ActionButton.tsx` event handlers.
    2. Replace manipulation with React state updates and conditional CSS classes (Tailwind variants preferred).
    3. Update related tests to verify behavior via state/props rather than direct DOM inspection.
  - **Done‑when:**
    1. `ActionButton.tsx` uses declarative rendering and React state for all interactive states.
    2. No direct DOM manipulation methods are called in the component.
    3. Component tests pass.
  - **Depends‑on:** none

- [x] **T013 · refactor · p1: refactor authenticationstatusbanner to remove direct dom manipulation**

  - **Context:** plan.md · cr‑07 Remove direct DOM manipulation
  - **Action:**
    1. Identify direct DOM manipulation in `AuthenticationStatusBanner.tsx` event handlers.
    2. Replace with React state updates and conditional CSS classes.
    3. Update tests accordingly.
  - **Done‑when:**
    1. `AuthenticationStatusBanner.tsx` uses declarative rendering and React state for all visual states.
    2. No direct DOM manipulation remains in the component.
    3. Component tests pass.
  - **Depends‑on:** none

- [x] **T014 · refactor · p1: consolidate activityfeed components with immediate deprecation**
  - **Context:** plan.md · cr‑11 Consolidate duplicate ActivityFeed
  - **Action:**
    1. Identify all imports and usages of the old `ActivityFeed.tsx` component.
    2. Update all usage sites to use the new `ActivityFeedPanel.tsx` component, adjusting props as needed.
    3. Remove the old `ActivityFeed.tsx` file once all usages are migrated.
    4. Ensure proper export of types like `ActivityCommit` that are imported from the old component.
  - **Done‑when:**
    1. Only one ActivityFeed component implementation exists (`ActivityFeedPanel.tsx`).
    2. All usages of the old component have been replaced.
    3. The `ActivityFeed.tsx` file has been completely removed.
    4. Comprehensive tests for the unified component pass.
    5. No build or type errors occur from the migration.
  - **Depends‑on:** [T011]
  - **Clarification:** Immediate complete removal of the old component is preferred as there are no active users, minimizing complexity.

## Code Structure & Size

- [x] **T015 · refactor · p1: decompose activityfeedpanel.tsx into smaller files**

  - **Context:** plan.md · cr‑06 Break up oversized files/functions
  - **Action:**
    1. Analyze the `ActivityFeedPanel.tsx` file structure.
    2. Extract logical sub-components or helper functions into separate files/modules.
    3. Ensure the main component file is under 400 lines (excluding comments/blanks).
  - **Done‑when:**
    1. `ActivityFeedPanel.tsx` is under 400 lines.
    2. Extracted components/functions are organized logically.
    3. Component tests pass.
  - **Depends‑on:** none

- [x] **T016 · refactor · p1: decompose header.tsx into smaller files**

  - **Context:** plan.md · cr‑06 Break up oversized files/functions
  - **Action:**
    1. Analyze `Header.tsx` structure.
    2. Extract logical sub-components (e.g., `Logo`, `UserMenu`, `MobileMenuToggle`) into separate files.
    3. Ensure `Header.tsx` is under 400 lines (excluding comments/blanks).
  - **Done‑when:**
    1. `Header.tsx` is under 400 lines.
    2. Extracted components are organized logically within `src/components/layout`.
    3. Component tests pass.
  - **Depends‑on:** none

- [ ] **T017 · refactor · p1: decompose large functions into smaller functions**
  - **Context:** plan.md · cr‑06 Break up oversized files/functions
  - **Action:**
    1. Identify functions exceeding 100 lines across all components.
    2. Break down these functions into smaller, more focused functions.
    3. Update related tests and ensure proper function composition.
  - **Done‑when:**
    1. No function exceeds 100 lines.
    2. Functions have clear, single responsibilities.
    3. Tests pass for refactored code.
  - **Depends‑on:** none

## API Architecture Improvements

- [ ] **T018 · refactor · p1: define standard api error response format**

  - **Context:** plan.md · cr‑09 Standardize error handling
  - **Action:**
    1. Define and document a standard JSON format for API error responses (e.g., `{ error: string, code: string, details?: string }`).
    2. Create/refine backend error handling utilities in `src/lib/errors` or `src/lib/auth/apiErrorHandler.ts`.
    3. Ensure utilities generate standardized error responses including codes, messages, and context.
  - **Done‑when:**
    1. Standard API error format is documented.
    2. Backend error handling utilities are implemented or updated.
    3. Utilities produce responses conforming to the standard format.
  - **Depends‑on:** none

- [ ] **T019 · refactor · p1: refactor api routes to use standardized error handling**

  - **Context:** plan.md · cr‑09 Standardize error handling
  - **Action:**
    1. Identify all API routes (`src/app/api`).
    2. Wrap route handlers with the `withErrorHandling` utility (or similar).
    3. Ensure all errors thrown within handlers are caught and mapped to the standard error response format.
  - **Done‑when:**
    1. All API routes consistently use the centralized error handling utility/pattern.
    2. API routes return errors in the documented standard format.
  - **Depends‑on:** [T018]

- [ ] **T020 · refactor · p1: update client-side error handling to use standard format**

  - **Context:** plan.md · cr‑09 Standardize error handling
  - **Action:**
    1. Update fetch wrappers or error handling logic to consistently parse standardized API errors.
    2. Ensure error messages are properly displayed in the UI.
    3. Add tests for client-side error handling.
  - **Done‑when:**
    1. Client-side code properly handles standardized API error responses.
    2. Error messages are displayed correctly to users.
    3. Tests verify error handling works as expected.
  - **Depends‑on:** [T019]

- [ ] **T021 · refactor · p1: implement centralized installation id utility**

  - **Context:** plan.md · cr‑10 Centralize installation ID handling
  - **Action:**
    1. Create a utility function `src/lib/auth/installationHelper.ts` to resolve installation IDs from request context (query, session, cookies).
    2. Implement validation and error handling within the utility.
    3. Write unit tests for the utility function covering various scenarios.
  - **Done‑when:**
    1. Centralized utility function exists and handles ID resolution logic.
    2. Utility function includes validation and throws appropriate errors.
    3. Unit tests for the utility pass with sufficient coverage.
  - **Depends‑on:** none

- [ ] **T022 · refactor · p1: refactor api routes to use installation id utility**
  - **Context:** plan.md · cr‑10 Centralize installation ID handling
  - **Action:**
    1. Identify all API routes that handle installation IDs.
    2. Replace duplicated/inconsistent logic with calls to the centralized utility.
    3. Ensure consistent error handling for installation ID resolution failures.
  - **Done‑when:**
    1. All relevant API routes use the centralized installation ID utility.
    2. Duplicated installation ID logic is removed from API routes.
    3. API routes function correctly with the new utility.
  - **Depends‑on:** [T021]

### Clarifications & Assumptions (Resolved)

- [x] **Issue:** Should we implement client-side validation using a specific library or custom validation?

  - **Context:** T008 implementing client-side validation
  - **Blocking?:** no
  - **Resolution:** Use Zod for all validation, as it's already being used in both server-side validation (API routes) and the Form/Input components in the library. This provides consistency across client and server code.

- [x] **Issue:** Should we deprecate the old ActivityFeed immediately or phase it out gradually?

  - **Context:** T014 consolidating ActivityFeed components
  - **Blocking?:** no
  - **Resolution:** Deprecate and remove the old ActivityFeed component immediately. Since there are currently no users, we should eliminate deprecated code to minimize complexity.

- [x] **Issue:** Is the current error handling strategy adequate for distributed systems?
  - **Context:** T018-T020 standardizing error handling
  - **Blocking?:** no
  - **Resolution:** The current error handling approach is adequate. Continue with the planned standardization in T018-T020.

Okay, here is the synthesized set of detailed, atomic tasks (T018–T024) for implementing the recommended fix for the `AuthLoadingScreen` Storybook freeze issue, incorporating the best elements from the provided model outputs and adhering to the specified requirements.

```markdown
# TODO List - AuthLoadingScreen Storybook Fix Implementation (T017 Follow-up)

**Goal:** Implement the consultant-recommended approach to fix the AuthLoadingScreen freeze in Storybook by removing internal environment detection and controlling effects via an explicit prop, adhering to the project's Development Philosophy.

**Parent Task:** T017 - Investigate and Plan Fix for AuthLoadingScreen Freeze in Storybook

---

**T018: Analyze and Refactor `AuthLoadingScreen` to Remove Environment Detection**

*   **Context:** The `AuthLoadingScreen` component currently contains internal logic to detect its environment (e.g., Storybook vs. Application) and conditionally run side effects (like redirects or auth checks). This implicit behavior violates "Explicit is Better than Implicit" and causes freezes in isolated environments like Storybook. This task focuses on identifying these effects and removing the environment detection logic.
*   **Action Steps:**
    1.  Review the `AuthLoadingScreen` component source code (`src/components/AuthLoadingScreen/AuthLoadingScreen.tsx` or similar).
    2.  Identify all `useEffect` hooks or other logic performing side effects (e.g., navigation, API calls, global state access) that might be problematic in Storybook.
    3.  Identify and remove any code checking environment variables (`process.env.NODE_ENV`, `process.env.STORYBOOK`, `REACT_APP_ENV`, etc.) or global indicators (`window.__STORYBOOK__`, `typeof window`).
    4.  Remove any conditional branches in effects or render logic that rely on these removed environment checks.
    5.  Remove any unused imports resulting from the above changes (e.g., `import { isStorybook } ...`).
    6.  Run linters (`npm run lint` or equivalent) and fix any errors/warnings (e.g., unused variables).
    7.  Ensure the component still compiles (`tsc --noEmit` or build process) after the changes.
*   **Done-when Criteria:**
    *   All internal environment detection logic within `AuthLoadingScreen` is removed.
    *   Problematic side effects intended for conditional execution are identified.
    *   The component compiles without errors and passes linting checks.
    *   No references remain to environment variables or Storybook detection flags within this component file.
    *   Code review approved for the removal of environment detection logic.
*   **Dependencies:** None (starts the implementation sequence).

---

**T019: Implement `disableEffects` Prop for Explicit Control**

*   **Context:** To explicitly control the component's side effects from the outside (e.g., disable them in Storybook), we need a dedicated prop. This task introduces `disableEffects` and modifies the component's effect logic to respect it, aligning with "Explicit is Better than Implicit" and "Design for Testability".
*   **Action Steps:**
    1.  Define a new optional prop `disableEffects` of type `boolean` in the component's props interface/type (e.g., `interface AuthLoadingScreenProps { disableEffects?: boolean; }`). Ensure strict typing.
    2.  Add TSDoc comments explaining the purpose of `disableEffects`, its type (`boolean`), and its default behavior (effects run if omitted or `false`).
    3.  Update all relevant `useEffect` hooks (or other side-effect logic identified in T018) to include an early return based on the prop: `if (disableEffects) return;`.
    4.  Ensure the default behavior (prop not provided or explicitly `false`) allows the side effects to run as intended for the application context.
    5.  Update component default props or function signature defaults if applicable.
*   **Done-when Criteria:**
    *   `AuthLoadingScreen` accepts an optional `disableEffects: boolean` prop with clear TSDoc.
    *   All relevant side effects within the component are conditional and skipped if `disableEffects` is `true`.
    *   The default behavior (prop omitted or `false`) allows effects to run.
    *   Component passes strict type checks (`tsc --noEmit`) and linting.
    *   Code review approved for the prop implementation and effect control logic.
*   **Dependencies:** T018

---

**T020: Update `AuthLoadingScreen` Storybook Stories**

*   **Context:** The Storybook stories for `AuthLoadingScreen` were freezing due to uncontrolled side effects. Now that effects can be controlled via `disableEffects`, the stories must be updated to explicitly disable them, ensuring they render correctly in isolation.
*   **Action Steps:**
    1.  Locate the Storybook file(s) for `AuthLoadingScreen` (e.g., `AuthLoadingScreen.stories.tsx`).
    2.  For each story intended primarily for UI display/testing, update the component usage to pass `disableEffects={true}` via `args` or controls.
    3.  Remove any story-level decorators or parameters previously used to simulate environment detection if they exist.
    4.  Start the Storybook server (`npm run storybook` or equivalent).
    5.  Navigate to the `AuthLoadingScreen` stories in the browser and verify they load and render correctly without freezing or triggering unintended side effects (like navigation).
    6.  Update story snapshots (`npm test -- -u` or equivalent) if applicable.
*   **Done-when Criteria:**
    *   Relevant `AuthLoadingScreen` stories are updated to pass `disableEffects={true}`.
    *   Stories render correctly in Storybook without freezing or errors.
    *   Any outdated environment simulation logic in stories is removed.
    *   Story snapshots (if used) are updated.
    *   Code review approved for Storybook updates.
*   **Dependencies:** T019

---

**T021: Verify `AuthLoadingScreen` Usage in the Application**

*   **Context:** The refactoring requires verification that the component still functions correctly within the main application, where its side effects *are* generally required.
*   **Action Steps:**
    1.  Search the application codebase for all instances where `<AuthLoadingScreen ... />` is used.
    2.  Verify that the `disableEffects` prop is *not* being passed as `true` in these standard application contexts. It should typically be omitted (relying on the default `false` behavior) or explicitly set to `false`.
    3.  Build and run the application locally.
    4.  Manually test the primary application flows involving `AuthLoadingScreen` (e.g., initial load, navigating to protected areas when logged out/in) to confirm expected side effects (redirects, loading states) still occur correctly.
*   **Done-when Criteria:**
    *   All application usages of `AuthLoadingScreen` have been reviewed and confirmed correct.
    *   The application builds and runs without errors related to this component.
    *   Manual testing confirms the component functions as expected (effects trigger) in the live application context.
*   **Dependencies:** T019

---

**T022: Add/Update Unit/Integration Tests for `disableEffects` Behavior**

*   **Context:** To ensure the `disableEffects` logic is correct and prevent regressions, automated tests are needed. This aligns with "Design for Testability" and "Test Coverage Enforcement".
*   **Action Steps:**
    1.  Locate or create the test file(s) for `AuthLoadingScreen` (e.g., `AuthLoadingScreen.test.tsx`).
    2.  Review and update any existing tests to align with the refactored component structure (removal of env checks, presence of `disableEffects`).
    3.  Write new test cases specifically covering the `disableEffects` prop:
        *   Render the component with `disableEffects={true}`. Assert that mocked side-effect functions (e.g., mocked `useNavigate`, `setTimeout`) are *not* called.
        *   Render the component with `disableEffects={false}` or the prop omitted. Assert that mocked side-effect functions *are* called.
    4.  Use appropriate test doubles (mocks, spies) for external dependencies (like routing hooks) following the project's mocking policy.
    5.  Run the test suite (`npm test` or equivalent) and ensure all tests pass.
    6.  Check test coverage (`npm test -- --coverage`) and ensure it meets project standards for the modified logic.
*   **Done-when Criteria:**
    *   Tests cover both the `disableEffects={true}` and `disableEffects={false}`/default scenarios.
    *   Existing tests are updated and passing.
    *   New tests are added and passing.
    *   Test coverage for `AuthLoadingScreen` meets or exceeds project standards.
    *   Code review approved for test updates.
*   **Dependencies:** T019

---

**T023: Update Documentation (TSDoc, Storybook Docs, README)**

*   **Context:** The component's API and recommended usage (especially in Storybook) have changed. Documentation must be updated for clarity and maintainability, following "Document Decisions, Not Mechanics" and "API Documentation" guidelines.
*   **Action Steps:**
    1.  Update the TSDoc comments for the `AuthLoadingScreen` component props, ensuring `disableEffects` is clearly explained (purpose, type, default).
    2.  Update the Storybook documentation page (e.g., MDX file or Docs tab auto-generated content) for `AuthLoadingScreen`, explaining the `disableEffects` prop and noting its use (`true`) in stories.
    3.  Review the project's main README or component library documentation; update any sections describing `AuthLoadingScreen` if necessary.
    4.  Add an entry to `CHANGELOG.md` (or rely on Conventional Commits) describing the change (e.g., `feat(AuthLoadingScreen): Introduce disableEffects prop to control side effects externally`).
*   **Done-when Criteria:**
    *   TSDoc, Storybook Docs, and README accurately reflect the component's current API and usage.
    *   Documentation clearly explains the `disableEffects` prop.
    *   CHANGELOG entry is added or commit message follows conventional standards.
    *   Code review approved for documentation changes.
*   **Dependencies:** T019, T020, T021, T022 (Documentation reflects the final implemented state)

---

**T024: Mark Parent Task T017 as Completed**

*   **Context:** All sub-tasks for implementing the fix (refactoring, testing, verification, documentation) are complete. The original investigation and planning task T017 can now be formally closed.
*   **Action Steps:**
    1.  Confirm that tasks T018 through T023 have been completed, reviewed, and merged.
    2.  Open the project's task tracking file (`TODO.md` or similar system).
    3.  Locate the entry for T017.
    4.  Mark T017 as completed according to the project's convention (e.g., prefix with "✔", move to a "Done" section).
    5.  Commit the updated `TODO.md`.
*   **Done-when Criteria:**
    *   Tasks T018-T023 are confirmed complete and merged.
    *   Parent task T017 is marked as completed in `TODO.md`.
*   **Dependencies:** T018, T019, T020, T021, T022, T023

---
```
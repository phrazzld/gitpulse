Okay, here are the detailed, atomic tasks for implementing the fix for the `AuthLoadingScreen` freeze issue in Storybook, based on the consultant's plan and adhering to the provided Development Philosophy.

```markdown
# TODO List - AuthLoadingScreen Storybook Fix Implementation

(...)

---

## AuthLoadingScreen Storybook Freeze Fix (T017 Follow-up)

**Goal:** Implement the consultant-recommended approach to fix the AuthLoadingScreen freeze in Storybook by removing internal environment detection and controlling effects via an explicit prop.

**Parent Task:** T017 - Investigate and Plan Fix for AuthLoadingScreen Freeze in Storybook

---

**T018: Analyze and Refactor `AuthLoadingScreen` to Remove Environment Detection**

*   **Context:** The current `AuthLoadingScreen` likely contains internal logic (e.g., checking `process.env.NODE_ENV`, `window.location`, or similar) to decide whether to run side effects (like authentication checks or redirects). This implicit behavior causes issues in isolated environments like Storybook. This task focuses on removing this internal detection logic, aligning with the "Explicit is Better than Implicit" and "Simplicity First" principles.
*   **Action Steps:**
    1.  Locate the code within the `AuthLoadingScreen` component responsible for detecting the environment or context (e.g., Storybook vs. Application).
    2.  Carefully remove this environment detection logic.
    3.  Identify the side effects (e.g., `useEffect` hooks performing redirects, API calls, state updates based on auth status) that were previously conditional on the environment.
    4.  Ensure the component still compiles and passes basic linting/type checks after removal, even though its runtime behavior regarding effects will be modified in the next task.
*   **Done-when Criteria:**
    *   All internal environment detection logic within `AuthLoadingScreen` is removed.
    *   The component remains syntactically correct and type-safe (`tsc --noEmit` passes).
    *   Code adheres to formatting (Prettier) and linting (ESLint) standards.
    *   Code review approved for the removal of environment detection logic.
*   **Dependencies:** None (starts the implementation sequence).

---

**T019: Implement `disableEffects` Prop Control in `AuthLoadingScreen`**

*   **Context:** To explicitly control the component's side effects from the outside, we need a prop. This task introduces a `disableEffects` prop and modifies the component's effect logic to respect it, following the "Explicit is Better than Implicit" and "Design for Testability" principles.
*   **Action Steps:**
    1.  Define a new optional prop `disableEffects` of type `boolean` in the component's props interface/type. Ensure strict typing (no `any`). Mark as `readonly` if appropriate per immutability guidelines.
    2.  Update all relevant `useEffect` hooks (or other logic performing side effects identified in T018) to check the value of the `disableEffects` prop.
    3.  Ensure side effects are *only* executed if `disableEffects` is falsy (i.e., `false`, `undefined`, or `null`). Effects should be skipped if `disableEffects` is `true`.
    4.  Provide a default behavior if the prop is not provided (typically, effects should run by default in the application context, meaning the default effective value should allow effects).
    5.  Add TSDoc comments explaining the purpose and usage of the `disableEffects` prop, aligning with the "Document Decisions, Not Mechanics" principle.
*   **Done-when Criteria:**
    *   `AuthLoadingScreen` accepts an optional `disableEffects: boolean` prop.
    *   The prop is strictly typed and documented with TSDoc.
    *   All relevant side effects within the component are conditional on `!disableEffects`.
    *   The default behavior (prop not provided) allows effects to run.
    *   Component passes strict type checks (`tsc --noEmit`) and linting.
    *   Code review approved for the prop implementation and effect control logic.
*   **Dependencies:** T018

---

**T020: Update `AuthLoadingScreen` Storybook Stories**

*   **Context:** The existing Storybook stories for `AuthLoadingScreen` were likely freezing because the component's side effects were running unexpectedly. Now that effects are controllable, the stories need to be updated to explicitly disable them. This ensures Storybook renders the component visually without triggering problematic side effects.
*   **Action Steps:**
    1.  Review all existing `.stories.tsx` (or similar) files for `AuthLoadingScreen`.
    2.  For each story where side effects are not desired (typically most/all stories for UI display), pass the `disableEffects={true}` prop to the `AuthLoadingScreen` component.
    3.  Verify that all stories now render correctly in Storybook without freezing or attempting redirects/API calls.
    4.  Add a new story variation specifically demonstrating the component *with effects enabled* (`disableEffects={false}` or prop omitted), if feasible and meaningful within Storybook (e.g., mocking auth context appropriately), clearly documenting its purpose.
*   **Done-when Criteria:**
    *   Existing `AuthLoadingScreen` stories are updated to pass `disableEffects={true}` where appropriate.
    *   Stories render correctly in Storybook without freezing.
    *   Storybook interactions (if any) behave as expected with effects disabled.
    *   (Optional but recommended) A story demonstrating the effects-enabled state exists, if applicable.
    *   Code review approved for Storybook updates.
*   **Dependencies:** T019

---

**T021: Verify `AuthLoadingScreen` Usage in Application**

*   **Context:** The refactoring in T018/T019 changed how `AuthLoadingScreen` behaves. We must ensure it's still used correctly in the main application, allowing its side effects to run as intended in the live environment.
*   **Action Steps:**
    1.  Identify all places in the main application codebase where the `AuthLoadingScreen` component is used.
    2.  Verify that the `disableEffects` prop is *not* being passed as `true` in these application contexts. It should either be omitted (relying on the default behavior) or explicitly passed as `false` if needed for clarity.
    3.  Manually test the relevant application flows locally (e.g., navigating to a protected route while logged out) to confirm the `AuthLoadingScreen` still triggers its expected effects (redirects, loading states, etc.).
*   **Done-when Criteria:**
    *   All application usages of `AuthLoadingScreen` are reviewed.
    *   The component is invoked correctly in the application to allow side effects.
    *   Manual testing confirms the component functions as expected in the application context.
    *   Code review approved for any necessary adjustments in application usage.
*   **Dependencies:** T019

---

**T022: Add/Update Unit/Integration Tests for `AuthLoadingScreen`**

*   **Context:** To ensure the refactoring is correct and prevent regressions, unit or integration tests must cover the new behavior, specifically the `disableEffects` prop logic. This aligns with "Design for Testability" and "Test Coverage Enforcement".
*   **Action Steps:**
    1.  Review existing tests for `AuthLoadingScreen`. Update them to reflect the removal of environment checks and the addition of the `disableEffects` prop.
    2.  Write new test cases specifically verifying the behavior based on the `disableEffects` prop:
        *   Test case where `disableEffects={true}`: Assert that side-effecting functions/logic (or mocks thereof) are *not* called.
        *   Test case where `disableEffects={false}` or prop is omitted: Assert that side-effecting functions/logic (or mocks thereof) *are* called.
    3.  Ensure tests mock dependencies correctly (only true external boundaries, per policy) and focus on verifying the component's behavior contract.
    4.  Run the full test suite and ensure all tests pass, including coverage checks enforced by CI.
*   **Done-when Criteria:**
    *   Unit/integration tests cover the conditional execution of side effects based on the `disableEffects` prop.
    *   Existing tests are updated and passing.
    *   New tests are added and passing.
    *   Test coverage meets or exceeds project standards for this component.
    *   Code review approved for test updates.
*   **Dependencies:** T019

---

**T023: Update Component Documentation**

*   **Context:** The component's API and behavior have changed. Documentation needs to be updated to reflect the removal of implicit environment detection and the addition of the `disableEffects` prop, following the "Document Decisions, Not Mechanics" and "API Documentation" guidelines.
*   **Action Steps:**
    1.  Update TSDoc comments for the `AuthLoadingScreen` component and its props, especially clarifying the `disableEffects` prop's purpose and default behavior.
    2.  Update any associated Storybook documentation pages (e.g., MDX files) to explain the `disableEffects` prop and how it's used in stories.
    3.  Review any relevant READMEs or architecture documents that might mention this component's behavior and update if necessary.
*   **Done-when Criteria:**
    *   TSDoc comments accurately reflect the current component API and behavior.
    *   Storybook documentation explains the `disableEffects` prop.
    *   Other relevant documentation is updated or confirmed to be accurate.
    *   Code review approved for documentation changes.
*   **Dependencies:** T019, T020

---

**T024: Mark Parent Task T017 as Completed**

*   **Context:** All implementation, verification, testing, and documentation tasks for the `AuthLoadingScreen` Storybook fix are complete. This final task closes out the original investigation/planning task.
*   **Action Steps:**
    1.  Confirm that tasks T018 through T023 are completed and verified.
    2.  Update the status of the parent task T017 (e.g., in project management tool, `TODO.md`, etc.) to "Completed" or "Done".
    3.  Ensure the relevant Pull Request(s) containing these changes have been merged.
*   **Done-when Criteria:**
    *   Tasks T018-T023 are confirmed complete.
    *   Parent task T017 is marked as completed in the project tracking system.
*   **Dependencies:** T018, T019, T020, T021, T022, T023

---
```
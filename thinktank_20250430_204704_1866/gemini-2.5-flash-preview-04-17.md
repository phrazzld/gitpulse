```markdown
### T018: Analyze AuthLoadingScreen for environment checks and side effects

*   **Context:** The AuthLoadingScreen component is causing Storybook to freeze, likely due to internal environment checks or side effects that are incompatible with the Storybook environment. This task involves understanding the current implementation to identify the root cause.
*   **Action:**
    *   Review the source code of the `AuthLoadingScreen` component.
    *   Identify any explicit checks for environment variables (e.g., `process.env.NODE_ENV`, `process.env.STORYBOOK`) or environment-specific global objects (e.g., `typeof window`, `typeof navigator`).
    *   Identify any hooks or effects (e.g., `useEffect`, `useLayoutEffect`) that trigger side effects like navigation (`useNavigate`, `history.push`), access browser-specific APIs, or interact with application-specific context/state that might not be available or mocked correctly in Storybook.
    *   Document the specific lines of code or patterns identified as problematic.
*   **Done-when:**
    *   The `AuthLoadingScreen` source code has been thoroughly reviewed.
    *   Specific code patterns or lines causing environment-dependent behavior or problematic side effects in a limited environment have been identified and noted.
*   **Dependencies:** None

### T019: Refactor AuthLoadingScreen to remove internal environment checks

*   **Context:** As per the consultant's recommendation and the development philosophy (Explicit is Better than Implicit, Strict Separation of Concerns), environment-specific logic should not be hardcoded within the component. This task removes those internal checks.
*   **Action:**
    *   Modify the `AuthLoadingScreen` component code identified in T018.
    *   Remove or refactor out all explicit checks for environment variables or global environment indicators (`process.env`, `typeof window`, etc.).
    *   Ensure the component's structure remains intact, but the conditional logic based on the *detected environment* is gone. The component should now behave consistently regardless of where it's rendered, with control points introduced later.
*   **Done-when:**
    *   All explicit environment checks have been removed from the `AuthLoadingScreen` component's implementation.
    *   The component compiles without errors after removing the checks.
*   **Dependencies:** T018

### T020: Add `disableEffects` prop and conditional logic

*   **Context:** To provide external control over the component's behavior in different contexts (like Storybook vs. the full application), a dedicated prop is needed. This implements the core recommendation to control effects via props.
*   **Action:**
    *   Define a new optional boolean prop for the `AuthLoadingScreen` component, named `disableEffects`.
    *   Add type definition for this prop using TypeScript, ensuring it's clearly marked as a boolean (`disableEffects?: boolean`).
    *   Wrap the side effects or logic identified in T018 (e.g., navigation calls, hooks interacting with external systems/context) with conditional logic based on the `disableEffects` prop.
    *   When `disableEffects` is `true`, the problematic side effects should be skipped or disabled.
    *   Ensure that when `disableEffects` is `false` or not provided, the component behaves as intended in the full application context (i.e., the side effects *do* occur).
    *   Leverage ternary operators or `if` statements clearly tied to the prop for readability, avoiding complex nested conditionals.
*   **Done-when:**
    *   `AuthLoadingScreen` component accepts an optional boolean prop `disableEffects`.
    *   The type definition for `AuthLoadingScreen` props includes `disableEffects?: boolean`.
    *   Problematic side effects within the component are conditionally executed based on the value of `disableEffects`.
    *   The default behavior (when `disableEffects` is false or absent) remains the standard application behavior.
*   **Dependencies:** T019

### T021: Update AuthLoadingScreen Storybook stories

*   **Context:** The Storybook environment lacks the full application setup required for the component's side effects. By using the new `disableEffects` prop, we can render the component in isolation without triggering the freeze.
*   **Action:**
    *   Locate the Storybook definition file(s) for `AuthLoadingScreen` (e.g., `AuthLoadingScreen.stories.tsx`).
    *   For the default story and any other relevant stories, modify the component usage to pass the new prop: `<AuthLoadingScreen disableEffects={true} />`.
    *   Start the Storybook server locally.
    *   Navigate to the `AuthLoadingScreen` stories in the browser to confirm that they load successfully without freezing or errors related to missing environment features.
*   **Done-when:**
    *   All relevant `AuthLoadingScreen` Storybook stories are updated to use `disableEffects={true}`.
    *   The `AuthLoadingScreen` stories load and render correctly in Storybook in the browser.
*   **Dependencies:** T020

### T022: Verify AuthLoadingScreen usage in the application

*   **Context:** It's crucial to ensure that the changes made to accommodate Storybook haven't negatively impacted the component's functionality or usage within the actual application environment.
*   **Action:**
    *   Review all locations in the main application codebase where `AuthLoadingScreen` is rendered.
    *   Confirm that the `disableEffects` prop is *not* being explicitly passed at these locations (or is passed with a value appropriate for the application context, which is typically `false` or undefined to enable effects).
    *   Build the application locally.
    *   Run the application and manually navigate through the user flows that involve the `AuthLoadingScreen` (e.g., app startup, authentication redirects).
    *   Verify that the component correctly triggers its intended side effects (e.g., navigates the user, fetches data) and the overall application flow works as expected.
*   **Done-when:**
    *   All application usages of `AuthLoadingScreen` have been reviewed.
    *   The application builds successfully.
    *   Manual testing confirms `AuthLoadingScreen` functions correctly within the application, including triggering necessary side effects.
*   **Dependencies:** T020

### T023: Add/Update tests for AuthLoadingScreen

*   **Context:** Enhance the test suite to cover the new `disableEffects` prop and ensure the component's logic is robust and testable in isolation, adhering to the "Design for Testability" and "Mocking Policy" principles.
*   **Action:**
    *   Locate or create the test file(s) for `AuthLoadingScreen` (e.g., `AuthLoadingScreen.test.tsx`).
    *   Write new unit or integration tests specifically for the behavior controlled by the `disableEffects` prop.
    *   Test the component rendering and behavior when `disableEffects={true}` is passed, asserting that side effects (like navigation calls) are *not* triggered. Use test doubles (mocks, spies) *only* for true external boundaries (like a navigation hook provided by a routing library) if necessary, following the mocking policy.
    *   Test the component rendering and behavior when `disableEffects` is `false` or not passed, asserting that the intended side effects *are* triggered (again, using appropriate test doubles for external boundaries).
    *   Ensure existing tests (if any) still pass.
    *   Run the test suite (`npm test` or equivalent).
    *   Check the test coverage report to verify that the new logic controlled by `disableEffects` is adequately covered and that the overall coverage meets project standards.
*   **Done-when:**
    *   New tests have been added for `AuthLoadingScreen` covering the `disableEffects` prop.
    *   Tests for `AuthLoadingScreen` pass for both `disableEffects={true}` and `false`/default cases.
    *   Test coverage for the component meets or exceeds the project's minimum threshold.
*   **Dependencies:** T020

### T024: Update documentation and mark T017 complete

*   **Context:** The component's interface and Storybook usage have changed. Documentation needs to be updated to reflect these changes, ensuring other developers understand how to use the component and its new prop correctly. Finally, the original task can be marked as resolved.
*   **Action:**
    *   Update any internal component documentation (e.g., TSDoc comments on props, a dedicated component markdown file) to explain the purpose, type, and usage of the new `disableEffects` prop. Clearly state that this prop is primarily for rendering in isolated environments like Storybook.
    *   If there are specific Storybook documentation notes related to `AuthLoadingScreen`, update them to mention the requirement of setting `disableEffects={true}` in stories.
    *   Update the project's task tracking system (e.g., TODO.md, or close the issue) to mark the original task related to the AuthLoadingScreen freeze (T017) as completed.
*   **Done-when:**
    *   Documentation for the `AuthLoadingScreen` component, including the `disableEffects` prop, is updated and accurate.
    *   Storybook-specific documentation for `AuthLoadingScreen` is updated if necessary.
    *   The original task T017 is marked as completed in the task tracking system.
*   **Dependencies:** T021, T022, T023
```
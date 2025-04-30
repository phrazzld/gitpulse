```markdown
- [ ] **T017 · Bugfix · P1: Profile & Isolate AuthLoadingScreen Freeze in Storybook**
    - **Context:** Based on T009 and the consultant plan, the first step is to reliably reproduce and understand the performance bottleneck causing the `AuthLoadingScreen` component to freeze Storybook.
    - **Action:**
        1. Ensure Storybook is running locally (`npm run storybook` or equivalent).
        2. Navigate to the `AuthLoadingScreen` story. Confirm the freeze occurs.
        3. Use browser developer tools (Performance tab) to profile the component rendering within Storybook.
        4. Analyze the profile to identify long-running tasks, excessive re-renders, blocking synchronous code, or problematic `useEffect` patterns mentioned in the consultant plan.
        5. Attempt to isolate the freeze by temporarily commenting out sections of `AuthLoadingScreen` or its dependencies (like `checkAuthStatus` if applicable) within the Storybook environment.
        6. Document the specific code section(s) or pattern(s) confirmed to cause the freeze, referencing the consultant plan's findings.
    - **Done‑when:**
        1. The performance profile clearly shows the bottleneck (e.g., long script execution, layout thrashing).
        2. The specific code block or interaction pattern causing the freeze within Storybook is identified and documented.
        3. Steps to reliably reproduce the freeze in the local Storybook environment are confirmed.
    - **Depends‑on:** []

- [ ] **T018 · Refactor · P1: Extract Side Effects & Fix Logic in AuthLoadingScreen**
    - **Context:** Following the consultant's likely recommendation and T017's findings, refactor `AuthLoadingScreen` to separate side effects and fix problematic logic (e.g., incorrect `useEffect` dependencies, blocking operations).
    - **Action:**
        1. Identify all side effects within `AuthLoadingScreen` (e.g., API calls, authentication logic, context interactions, timers, direct DOM manipulation).
        2. Create a new custom React hook (e.g., `useAuthLoadingState`) or service to encapsulate this logic, following the consultant plan's architectural suggestions.
        3. Move the identified side effects and related state management into the new hook/service.
        4. Analyze any `useEffect` hooks identified in T017 or the plan. Ensure dependency arrays are correct and cleanup functions are implemented where necessary.
        5. Refactor any blocking synchronous code identified in T017 to be asynchronous or occur outside the main render path (e.g., within the hook's effects).
        6. Ensure the new hook/service exposes a clear API (e.g., `{ isLoading, isAuthenticated, error }`) for the component.
    - **Done‑when:**
        1. Side effects and complex logic are moved out of the `AuthLoadingScreen` component into a dedicated hook/service.
        2. Problematic `useEffect` patterns are corrected (correct dependencies, cleanup).
        3. Blocking synchronous operations are removed from the component's render path.
        4. The new hook/service is created and has a well-defined interface.
    - **Depends‑on:** [T017]

- [ ] **T019 · Refactor · P1: Update AuthLoadingScreen Component to Use Extracted Logic**
    - **Context:** Modify the `AuthLoadingScreen` component to be primarily presentational, consuming the state and actions provided by the hook/service created in T018.
    - **Action:**
        1. Remove the original side-effect logic and state management from `AuthLoadingScreen.tsx`.
        2. Import and call the new hook/service (e.g., `const { isLoading, ... } = useAuthLoadingState();`).
        3. Update the component's JSX to render different UI states based solely on the props and the state returned by the hook/service.
        4. Ensure the component itself remains simple, testable, and focused on presentation.
    - **Done‑when:**
        1. `AuthLoadingScreen` component no longer contains the extracted side effects or complex state logic.
        2. The component correctly uses the new hook/service to get its state.
        3. The component renders the correct UI based on the state provided by the hook/service.
    - **Depends‑on:** [T018]

- [ ] **T020 · Bugfix · P1: Implement Mocking & Update AuthLoadingScreen Story**
    - **Context:** Update the Storybook story for `AuthLoadingScreen` to work with the refactored component, using mocks to simulate different states and prevent the original freeze issue in the isolated Storybook environment.
    - **Action:**
        1. Open `AuthLoadingScreen.stories.tsx` (or equivalent).
        2. If the component now relies on context providers or the custom hook needs specific setup, add necessary Storybook Decorators to provide mocked versions (e.g., a mock `AuthProvider` or a wrapper that mocks the `useAuthLoadingState` hook).
        3. Define mock data and implementations for any dependencies required by the component or its hook (e.g., mock functions for API calls used within the hook).
        4. Configure Storybook Args/Controls to allow interactively setting the state provided by the mocked hook/context (e.g., toggling `isLoading`, `isAuthenticated`, `error`).
        5. Create separate stories for key states (Loading, Authenticated, Unauthenticated, Error) using the mocks.
        6. Verify that the Storybook story now renders all states correctly without freezing.
    - **Done‑when:**
        1. The `AuthLoadingScreen` story uses mocks for its dependencies (hook, context, API calls).
        2. Storybook controls allow simulating different states of the component.
        3. The story renders correctly for all key states without freezing the Storybook UI.
    - **Depends‑on:** [T019]

- [ ] **T021 · Test · P2: Add/Update Tests for AuthLoadingScreen & Extracted Logic**
    - **Context:** Ensure the refactored code is robust and maintainable by adding automated tests covering the new hook/service and the presentational component.
    - **Action:**
        1. Write unit tests for the extracted hook/service (e.g., `useAuthLoadingState.test.ts`). Mock its external dependencies (like API clients) and verify its state transitions and outputs based on different inputs/mocked responses.
        2. Write/update unit or integration tests for the `AuthLoadingScreen` component. Test that it renders the correct UI for different props/states provided by the (mocked) hook.
        3. Ensure tests cover the scenarios identified in T017 and the edge cases handled by the refactoring (e.g., cleanup, error handling).
        4. Run the full test suite (`npm test` or equivalent) and ensure all tests pass.
    - **Done‑when:**
        1. Unit tests exist for the new hook/service, covering its core logic and state transitions.
        2. Tests exist for the `AuthLoadingScreen` component, verifying its rendering based on input state.
        3. Test coverage for the refactored code meets project standards.
        4. All related automated tests pass.
    - **Depends‑on:** [T018, T019]

- [ ] **T022 · Bugfix · P2: Verify Fix in Storybook and Application**
    - **Context:** Confirm that the changes have resolved the Storybook freeze and have not introduced regressions in the actual application.
    - **Action:**
        1. Thoroughly test the `AuthLoadingScreen` story in Storybook again, using controls (T020) to switch between states. Confirm responsiveness and absence of freezes.
        2. Build and run the main application locally.
        3. Navigate through the application flow that uses `AuthLoadingScreen` (e.g., app startup, post-login).
        4. Verify that the component behaves correctly in the application context: shows loading state, transitions correctly based on authentication status, and navigates as expected.
        5. Test relevant edge cases in the application if possible (e.g., simulating network errors, slow responses).
    - **Done‑when:**
        1. The Storybook environment is stable and responsive when viewing `AuthLoadingScreen` stories.
        2. The `AuthLoadingScreen` component functions correctly in its intended role within the live application.
        3. No regressions related to this component or the authentication flow are observed in the application.
    - **Depends‑on:** [T020, T021]

- [ ] **T023 · Chore · P2: Document AuthLoadingScreen Refactor & Storybook Strategy**
    - **Context:** Update documentation to reflect the changes made, ensuring maintainability and knowledge sharing.
    - **Action:**
        1. Add or update comments in `AuthLoadingScreen.tsx` and the new hook/service file explaining the architecture and responsibilities.
        2. Update any relevant project documentation (e.g., `README.md`, architecture docs) mentioning `AuthLoadingScreen` or the authentication flow.
        3. Briefly document the Storybook mocking strategy used for this component in the story file or related documentation.
        4. Include a note about the resolved freezing issue and the approach taken.
    - **Done‑when:**
        1. Code comments clearly explain the refactored structure.
        2. Project documentation accurately reflects the current implementation.
        3. The Storybook strategy for this component is documented.
    - **Depends‑on:** [T018, T019, T020]

- [ ] **T024 · Chore · P3: Mark T009 as Completed**
    - **Context:** Final step to close off the original analysis and decomposition task T009 now that all implementation and verification steps derived from the consultant plan are defined.
    - **Action:**
        1. Ensure all preceding tasks (T017-T023) related to fixing the `AuthLoadingScreen` freeze are completed or appropriately tracked.
        2. Edit the `TODO.md` file.
        3. Change the status marker for task T009 from `[ ]` to `[x]`.
        4. Commit the change with a message like `chore: mark T009 done`.
    - **Done‑when:**
        1. Task T009 is marked as complete `[x]` in `TODO.md`.
    - **Depends‑on:** [T017, T018, T019, T020, T021, T022, T023]
```
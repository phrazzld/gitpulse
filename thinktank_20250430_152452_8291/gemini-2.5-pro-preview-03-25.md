```markdown
- [ ] **T017 · Bugfix · P1: Isolate AuthLoadingScreen Freeze in Storybook**
    - **Context:** The first step is to confirm and isolate the freezing issue within Storybook, separate from the main application, as suggested by the consultant plan.
    - **Action:**
        1. Create a new, minimal Storybook story specifically for the `AuthLoadingScreen` component if one doesn't exist, or simplify the existing one.
        2. Render the component with the most basic props possible within this story.
        3. Observe Storybook's behavior when viewing this story.
        4. Document the exact steps to reproduce the freeze within the story environment.
    - **Done‑when:**
        1. A minimal Storybook story for `AuthLoadingScreen` exists.
        2. The freezing behavior observed in the original issue (T009) is reliably reproduced within this minimal story.
        3. Steps to reproduce are documented (e.g., in a comment within the story file or linked issue).
    - **Depends‑on:** []

- [ ] **T018 · Refactor · P1: Identify AuthLoadingScreen External Dependencies**
    - **Context:** Based on the consultant's analysis, the `useEffect` likely interacts with external dependencies (like authentication context, API calls via `checkAuthStatus`). These need to be identified for mocking and potential refactoring.
    - **Action:**
        1. Analyze the `AuthLoadingScreen` component and the `checkAuthStatus` function it calls.
        2. List all external dependencies: context providers, hooks retrieving external state, direct API client usage, etc.
        3. Determine how these dependencies are currently accessed (e.g., `useContext`, direct import).
    - **Done‑when:**
        1. A clear list of external dependencies used by `AuthLoadingScreen` (directly or indirectly via `checkAuthStatus`) is documented (e.g., in task comments or component documentation).
        2. The access mechanism for each dependency is identified.
    - **Depends‑on:** [T017]

- [ ] **T019 · Refactor · P1: Refactor AuthLoadingScreen for Explicit Dependencies**
    - **Context:** To improve testability and fix the issue, dependencies should be passed explicitly, following the Dependency Inversion Principle and consultant recommendations.
    - **Action:**
        1. Modify `AuthLoadingScreen` to accept its key dependencies (e.g., the `checkAuthStatus` function or necessary auth state/dispatchers) as props.
        2. Update the internal logic of `AuthLoadingScreen` to use these props instead of accessing dependencies implicitly (e.g., via context hooks directly inside the component).
        3. Ensure the component's props interface is clearly defined using TypeScript.
        4. Update call sites within the main application to pass the required dependencies as props.
    - **Done‑when:**
        1. `AuthLoadingScreen` receives its primary external dependencies via props.
        2. Internal logic uses the passed props.
        3. Component signature and internal usage pass TypeScript checks and linting.
        4. Main application integration points are updated and functional.
    - **Depends‑on:** [T018]

- [ ] **T020 · Bugfix · P1: Refactor AuthLoadingScreen useEffect Hook Logic**
    - **Context:** The consultant identified the `useEffect` with an empty dependency array `[]` combined with async operations as the likely cause of the freeze. This needs correction.
    - **Action:**
        1. Review the `useEffect` hook in the refactored `AuthLoadingScreen`.
        2. Identify all props or state values the effect *actually* depends on (including the newly added dependency props from T019).
        3. Update the dependency array of the `useEffect` to include these identified values.
        4. Implement proper async handling within the effect:
            - Ensure component unmount is handled (e.g., using an `isMounted` flag or AbortController) to prevent state updates after unmount.
            - Add a cleanup function if necessary (e.g., to cancel pending operations).
    - **Done‑when:**
        1. The `useEffect` dependency array accurately reflects all external values it uses.
        2. Async operations within the effect handle component unmounting safely.
        3. Potential infinite loops caused by the previous empty dependency array are eliminated.
    - **Depends‑on:** [T019]

- [ ] **T021 · Bugfix · P1: Implement Mocking for AuthLoadingScreen Story**
    - **Context:** The Storybook story needs to provide mocked versions of the dependencies now passed as props to the refactored `AuthLoadingScreen`.
    - **Action:**
        1. Update the `AuthLoadingScreen.stories.tsx` file.
        2. Define mock implementations for the dependencies passed as props (e.g., a mock `checkAuthStatus` function that returns simulated success/error states).
        3. Use Storybook Args or Decorators to pass these mocks to the component within the story.
        4. Configure Storybook Controls (Args) to allow interactively switching between different mocked states (e.g., loading, authenticated, unauthenticated, error).
    - **Done‑when:**
        1. The Storybook story provides mock implementations for all required dependency props.
        2. The story renders the `AuthLoadingScreen` correctly using the mocks.
        3. Storybook Controls allow simulating different authentication states/outcomes.
        4. The freezing issue identified in T017 is no longer present in the story.
    - **Depends‑on:** [T018, T019, T020]

- [ ] **T022 · Bugfix · P1: Verify AuthLoadingScreen Fix and Functionality**
    - **Context:** Confirm that the refactoring and mocking have resolved the Storybook issue without introducing regressions in the main application.
    - **Action:**
        1. Thoroughly test the `AuthLoadingScreen` story in Storybook, using the controls configured in T021, ensuring it renders correctly in all states without freezing.
        2. Manually test the `AuthLoadingScreen` component within the running application in its primary use cases (e.g., initial app load).
        3. Verify that the authentication flow involving this component still works as expected.
        4. Run automated tests (unit, integration) related to `AuthLoadingScreen` and ensure they pass.
    - **Done‑when:**
        1. Storybook story for `AuthLoadingScreen` works reliably across different mocked states.
        2. `AuthLoadingScreen` functions correctly within the main application's authentication flow.
        3. No regressions related to this component are observed.
        4. Relevant automated tests pass.
    - **Depends‑on:** [T021]

- [ ] **T023 · Chore · P2: Complete Original Task T009**
    - **Context:** Mark the original analysis and decomposition task as completed now that the implementation tasks are defined.
    - **Action:**
        1. Locate task T009 in `TODO.md`.
        2. Change its status marker from `[ ]` to `[x]`.
    - **Done‑when:**
        1. Task T009 is marked as complete: `[x] **T009 · Analysis · P1: Analyze consultant plan and decompose into tasks**`
    - **Depends‑on:** [T017, T018, T019, T020, T021, T022]
```
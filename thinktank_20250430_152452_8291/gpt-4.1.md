```
- [ ] **T017 · Bugfix · P1: Profile Storybook Freezing with AuthLoadingScreen**
    - **Context:** The initial step to address the freezing issue involves gathering empirical data by profiling Storybook when rendering the AuthLoadingScreen component, in order to identify the root cause.
    - **Action:**
        1. Launch Storybook and navigate to the AuthLoadingScreen story.
        2. Use browser developer tools (Performance tab) to record a session while the story loads or freezes.
        3. Analyze the performance profile for signs of infinite loops, excessive re-renders, blocking synchronous code, or expensive async operations.
        4. Document findings and potential bottlenecks.
    - **Done‑when:**
        1. A clear profile or reproduction of the freeze is captured.
        2. At least one plausible root cause is identified and documented.
    - **Depends‑on:** 

- [ ] **T018 · Bugfix · P1: Isolate Problematic Logic in AuthLoadingScreen**
    - **Context:** To adhere to modularity and testability, the problematic parts of AuthLoadingScreen must be isolated for focused debugging and refactoring.
    - **Action:**
        1. Review the AuthLoadingScreen implementation for non-UI logic (side-effects, hooks, API calls, state management).
        2. Temporarily comment out or stub major logic branches (e.g., authentication listeners, effect hooks) to confirm which part is causing the freeze.
        3. Narrow the problematic code to the smallest reproducible unit.
        4. Document which logic is responsible.
    - **Done‑when:**
        1. The exact code section causing the freeze is identified and isolated.
        2. A minimal test case for the problematic logic is available.
    - **Depends‑on:** T017

- [ ] **T019 · Refactor · P1: Decouple Side Effects from AuthLoadingScreen Rendering**
    - **Context:** To prevent Storybook from freezing and improve maintainability, side effects (such as authentication state subscriptions or async calls) must be separated from the pure presentation logic of AuthLoadingScreen.
    - **Action:**
        1. Extract side-effectful code (e.g., API calls, subscriptions, navigation) into a custom hook or container component.
        2. Refactor AuthLoadingScreen to be a pure presentational component receiving props only.
        3. Ensure that no blocking, infinite, or Storybook-incompatible effects remain in the story-rendered component.
        4. Update imports/usages across the codebase to use the new separation.
    - **Done‑when:**
        1. AuthLoadingScreen is a pure presentational component.
        2. Side effects are fully encapsulated in a testable hook/container.
        3. Storybook renders AuthLoadingScreen without freezing.
    - **Depends‑on:** T018

- [ ] **T020 · Refactor · P2: Mock Side Effects in AuthLoadingScreen Stories**
    - **Context:** To ensure reliable Storybook rendering and maintain testability, any remaining dependencies or side effects should be mocked or stubbed in the Storybook stories.
    - **Action:**
        1. Update AuthLoadingScreen stories to use mock props and stub side-effectful functions.
        2. Remove any real API calls, navigation, or subscriptions from stories.
        3. Add stories for loading, success, and error states using controlled props.
        4. Document in the story file how to extend or adapt mocks.
    - **Done‑when:**
        1. All AuthLoadingScreen stories render without freeze or warnings.
        2. Stories demonstrate all relevant UI states using mocks.
    - **Depends‑on:** T019

- [ ] **T021 · Test · P1: Add Unit and Integration Tests for Refactored Logic**
    - **Context:** All extracted logic and new components/hooks must be verified with automated tests to ensure correctness and prevent regression.
    - **Action:**
        1. Write unit tests for the custom hook/container managing AuthLoadingScreen logic.
        2. Write integration tests for the AuthLoadingScreen presentational component covering all UI states.
        3. Validate that tests cover the previously problematic scenarios.
    - **Done‑when:**
        1. All new/refactored logic is covered by meaningful unit/integration tests.
        2. Test suite passes in CI and locally.
    - **Depends‑on:** T019

- [ ] **T022 · Chore · P2: Document Refactor and Storybook Strategy**
    - **Context:** To support maintainability, update relevant documentation to reflect the new structure and Storybook strategy.
    - **Action:**
        1. Update code comments to explain the separation between presentation and logic.
        2. Add or update developer docs (README, relevant MD files) explaining how to work with AuthLoadingScreen and its stories.
        3. Briefly document the root cause of the previous freeze and how it was resolved.
    - **Done‑when:**
        1. Documentation accurately reflects the new design.
        2. The root cause and solution are recorded for posterity.
    - **Depends‑on:** T020, T021

- [ ] **T023 · Chore · P1: Mark Consultant Plan Decomposition Task Complete**
    - **Context:** This is a meta-task to mark the original task T009 as complete after all sub-tasks are addressed.
    - **Action:**
        1. Review that all tasks T017–T022 are finished and their acceptance criteria are met.
        2. Mark T009 as completed [x] in the TODO.md.
    - **Done‑when:**
        1. T009 is marked complete.
        2. No remaining open sub-tasks from this plan.
    - **Depends‑on:** T017, T018, T019, T020, T021, T022
```
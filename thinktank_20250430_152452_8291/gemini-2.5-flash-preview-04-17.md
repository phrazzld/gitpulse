```
- [ ] **T017 · Chore · P2: Review Consultant Plan for AuthLoadingScreen Freeze**
    - **Context:** The Storybook environment freezes when rendering the AuthLoadingScreen component (T009). A consultant has provided an analysis and plan in CONSULTANT-PLAN.md. This task involves understanding that plan.
    - **Action:**
        1. Locate and read the CONSULTANT-PLAN.md file.
        2. Read through the analysis of the AuthLoadingScreen freezing issue.
        3. Understand the identified root cause(s) of the performance problem in Storybook.
        4. Identify the high-level proposed solution(s) outlined in the plan.
        5. Summarize the key findings and proposed approach.
    - **Done‑when:**
        1. CONSULTANT-PLAN.md has been read.
        2. The root cause of the freeze and the proposed solution approach are clearly understood.
        3. Key findings are documented or mentally noted for subsequent tasks.
    - **Depends‑on:** []

- [ ] **T018 · Bugfix · P1: Detail Specific Root Cause & Proposed Changes**
    - **Context:** Following the initial review of the consultant plan (T017), this task focuses on extracting the specific technical details of the root cause and the exact architectural/code changes proposed to fix the AuthLoadingScreen freeze.
    - **Action:**
        1. Re-read the relevant sections of CONSULTANT-PLAN.md focusing on the technical diagnosis.
        2. Pinpoint the exact function calls, state updates, or rendering patterns identified as problematic in the Storybook environment.
        3. Extract the specific technical solution steps or code refactoring recommendations detailed in the plan.
        4. Note any suggested architectural patterns (e.g., moving logic to hooks, services, using specific Storybook decorators) if mentioned.
    - **Done‑when:**
        1. The specific technical root cause (e.g., synchronous blocking code, excessive re-renders, large data mock) is clearly identified.
        2. The concrete, actionable steps for code changes or refactors proposed by the consultant are listed.
    - **Depends‑on:** [T017]

- [ ] **T019 · Refactor · P1: Extract AuthLoadingScreen Logic**
    - **Context:** Based on the consultant's findings (T018), the AuthLoadingScreen component likely contains logic (side effects, data fetching, complex state transitions) that performs poorly in Storybook's environment. This task involves refactoring the component to move this logic out, adhering to the "Separate Concerns" and "Pure Functions" principles from DEVELOPMENT_PHILOSOPHY.md.
    - **Action:**
        1. Identify the specific logic within `AuthLoadingScreen.tsx` that was flagged as problematic (as per T018).
        2. Create a new custom React hook (e.g., `useAuthLoader`) or service module responsible for handling this logic (e.g., authentication checks, data fetching, navigation determination).
        3. Move the identified logic into the new hook or service.
        4. Ensure the hook/service has a clear API (inputs, outputs, side effects are explicit).
        5. Remove the extracted logic from `AuthLoadingScreen.tsx`.
    - **Done‑when:**
        1. Problematic logic is successfully moved out of the `AuthLoadingScreen` component.
        2. A new hook or service is created containing the extracted logic.
        3. The `AuthLoadingScreen` component is simpler and primarily focused on rendering based on props/state provided by the future hook/service.
    - **Depends‑on:** [T018]

- [ ] **T020 · Bugfix · P1: Implement Optimized Logic in Hook/Service**
    - **Context:** The logic extracted in T019 needs to be implemented in the new hook/service, incorporating the specific optimizations or strategies proposed by the consultant (T018) to prevent the Storybook freeze.
    - **Action:**
        1. Implement the logic within the hook/service created in T019.
        2. Apply the specific optimizations recommended in the consultant plan (e.g., lazy evaluation, explicit state control, debouncing, conditional execution based on environment).
        3. Ensure the hook/service provides the necessary state and outcomes (e.g., `isLoading`, `isAuthenticated`, `error`, `nextRoute`) for the `AuthLoadingScreen` component to render.
        4. Write initial manual tests or simple console logs within the hook/service to verify its basic function and state transitions.
    - **Done‑when:**
        1. The core authentication/loading logic is implemented within the new hook/service.
        2. The consultant's recommended performance optimizations for Storybook are incorporated into the logic.
        3. The hook/service returns the necessary state for the component.
    - **Depends‑on:** [T019]

- [ ] **T021 · Refactor · P1: Update AuthLoadingScreen to Use New Logic**
    - **Context:** The `AuthLoadingScreen` component needs to be updated to consume the state and functionality provided by the new hook or service implemented in T020.
    - **Action:**
        1. Import and use the hook/service created in T019/T020 within the `AuthLoadingScreen.tsx` component.
        2. Update the component's rendering logic to display different states (loading, error, success) based on the output of the hook/service.
        3. Ensure the component no longer directly performs the side effects or complex calculations that were moved out.
    - **Done‑when:**
        1. `AuthLoadingScreen` correctly uses the new hook/service.
        2. The component's rendering logic is driven by the state provided by the hook/service.
        3. The component's code is simpler and focused on presentation.
    - **Depends‑on:** [T019, T020]

- [ ] **T022 · Bugfix · P1: Update Storybook Story for AuthLoadingScreen**
    - **Context:** The Storybook story for `AuthLoadingScreen` needs to be updated to correctly render the refactored component (T021) and potentially use the new hook/service's API or Storybook parameters/decorators to control the component's state for different storybook scenarios.
    - **Action:**
        1. Open `AuthLoadingScreen.stories.tsx`.
        2. Update the story definition(s) to render the refactored `AuthLoadingScreen` component.
        3. If the new hook/service provides a way to explicitly set states for testing/storybook purposes, use this mechanism.
        4. If necessary, add Storybook parameters or decorators to manage the state or dependencies of the component in the Storybook environment, ensuring mocks are performant and non-blocking.
        5. Verify that the story renders without errors in Storybook.
    - **Done‑when:**
        1. `AuthLoadingScreen.stories.tsx` is updated to render the latest version of the component.
        2. The story renders successfully in Storybook.
        3. Storybook setup for this component correctly handles dependencies or state via the new hook/service or Storybook features.
    - **Depends‑on:** [T021]

- [ ] **T023 · Bugfix · P1: Verify Storybook Freeze is Resolved**
    - **Context:** The primary goal is to fix the Storybook freezing issue. This task is the direct verification step in the Storybook environment.
    - **Action:**
        1. Start the Storybook server (`yarn storybook` or equivalent).
        2. Navigate to the `AuthLoadingScreen` story (and any relevant sub-stories).
        3. Observe the rendering process.
        4. Interact with the Storybook UI (addons panel, changing controls) to ensure the interface remains responsive and does not freeze.
        5. Test rendering different states of the component via Storybook controls/args if applicable.
    - **Done‑when:**
        1. Storybook loads and displays the `AuthLoadingScreen` story without freezing.
        2. The Storybook UI remains responsive while the story is rendered.
        3. Different states of the component can be viewed in Storybook without performance degradation leading to a freeze.
    - **Depends‑on:** [T022]

- [ ] **T024 · Bugfix · P1: Verify AuthLoadingScreen in Application**
    - **Context:** While the Storybook freeze is fixed, it's crucial to ensure the refactoring and optimizations haven't broken the `AuthLoadingScreen` component's functionality within the actual application build.
    - **Action:**
        1. Build the application (`yarn build` or equivalent).
        2. Run the application in a relevant environment (development build, staging build).
        3. Navigate to the application flow where `AuthLoadingScreen` is used (e.g., app startup after login/launch).
        4. Verify that the component loads correctly, performs its intended logic (authentication check, data loading), and navigates to the correct subsequent screen based on the application state.
        5. Test edge cases if possible (e.g., network error simulation, no auth token).
    - **Done‑when:**
        1. The application builds successfully.
        2. `AuthLoadingScreen` functions correctly within the application, performing its logic and navigating as expected.
        3. No new bugs or regressions are introduced in the application flow involving this component.
    - **Depends‑on:** [T021]

- [ ] **T025 · Test · P2: Add/Update Automated Tests**
    - **Context:** Ensure the refactored logic in the new hook/service (T019, T020) and the component's interaction with it (T021) are covered by automated tests, as per the "Design for Testability" principle.
    - **Action:**
        1. Write unit tests for the new hook or service, focusing on testing its logic in isolation (e.g., state transitions based on mocked dependencies or inputs).
        2. Write integration tests that verify the `AuthLoadingScreen` component correctly uses the hook/service and renders the appropriate UI for different states provided by the hook/service. Mock the hook/service's dependencies at the boundary as per the Mocking Policy.
        3. Ensure test coverage meets or exceeds the project's minimum thresholds, especially for the new logic.
        4. Run all tests (`yarn test` or equivalent) and ensure they pass.
    - **Done‑when:**
        1. Automated tests are written for the new hook/service.
        2. Automated tests are written/updated for the `AuthLoadingScreen` component's integration with the hook/service.
        3. Test coverage for the affected code is adequate.
        4. All automated tests pass.
    - **Depends‑on:** [T019, T020, T021, T023, T024]

- [ ] **T026 · Chore · P3: Final Code Review and Merge**
    - **Context:** All implementation, verification, and testing tasks are complete. This task involves a final review and merging the changes.
    - **Action:**
        1. Create a pull request with all changes from T019 through T025.
        2. Ensure the PR description clearly explains the problem (Storybook freeze), the consultant's recommended solution, and how the implemented changes address it.
        3. Request reviews from team members.
        4. Address any feedback from reviewers.
        5. Ensure CI pipeline passes (linting, tests, coverage, etc.).
        6. Merge the pull request into the main branch.
    - **Done‑when:**
        1. All code changes are reviewed and approved.
        2. The pull request is merged into the main branch.
    - **Depends‑on:** [T025]

- [x] **T009 · Bugfix · P1: Storybook Freezing Issue with AuthLoadingScreen**
    - **Context:** Storybook freezes when attempting to render the AuthLoadingScreen component. This task tracks the overall effort to resolve this issue based on consultant recommendations.
    - **Action:**
        1. Analyze the consultant plan (T017, T018).
        2. Refactor component logic (T019, T021).
        3. Implement optimized logic (T020).
        4. Update Storybook story (T022).
        5. Verify fix in Storybook (T023).
        6. Verify component in app (T024).
        7. Add/update tests (T025).
        8. Merge changes (T026).
    - **Done‑when:**
        1. All sub-tasks (T017-T026) are completed.
        2. The Storybook freezing issue with AuthLoadingScreen is resolved.
        3. The solution is verified in both Storybook and the application.
        4. Automated tests cover the changes.
    - **Depends‑on:** [T026]
```
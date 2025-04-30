- [ ] **T017 · Bugfix · P1: Audit AuthLoadingScreen for blocking operations**  
    - **Context:** Identify synchronous code in AuthLoadingScreen causing Storybook to freeze  
    - **Action:**  
        1. Reproduce the freeze locally by running `npm run storybook` and navigating to the AuthLoadingScreen story.  
        2. Open Chrome DevTools (or equivalent) Performance profiler and record the component mount.  
        3. Identify any functions or loops that block the main thread for >50 ms during initial render.  
        4. Document each blocking call, its file location, and approximate duration.  
    - **Done-when:**  
        1. A short report (in the issue tracker or docs) lists the root causes with timestamps and code locations.  
        2. Measured mount durations before and after audit are recorded.  
    - **Depends-on:** T009

- [ ] **T018 · Refactor · P1: Extract and async-ify heavy logic in AuthLoadingScreen**  
    - **Context:** Split UI render from side-effects so the component no longer blocks  
    - **Action:**  
        1. Move all blocking or CPU-intensive work out of render methods into a `useEffect` hook.  
        2. Wrap any loops or computations in async functions (e.g., using `Promise.resolve().then(...)` or `setTimeout`) to yield to the event loop.  
        3. Render a lightweight placeholder or spinner synchronously while the async work runs.  
        4. Ensure the component’s first paint occurs in under 16 ms.  
    - **Done-when:**  
        1. AuthLoadingScreen mounts without blocking the main thread (verified by profiler).  
        2. Automated test asserts that the placeholder renders immediately.  
    - **Depends-on:** T017

- [ ] **T019 · Chore · P2: Create a mock AuthProvider for Storybook**  
    - **Context:** Prevent real authentication calls from running in Storybook  
    - **Action:**  
        1. Implement `MockAuthProvider` that provides the same context API as the real one but simulates loading/completed states.  
        2. Add a Storybook decorator to wrap stories with `MockAuthProvider`.  
        3. Expose controls/knobs to toggle between loading and authenticated states.  
        4. Verify that `AuthLoadingScreen` stories use the mock provider instead of real services.  
    - **Done-when:**  
        1. Storybook renders AuthLoadingScreen without freezing.  
        2. Controls allow manual toggling of loading vs. loaded UI.  
    - **Depends-on:** T018

- [ ] **T020 · Chore · P2: Update Storybook configuration for async components**  
    - **Context:** Ensure Storybook handles components with async initialization gracefully  
    - **Action:**  
        1. In `.storybook/preview.js`, enable a global `delay` or suspense fallback for async components if needed.  
        2. Import and apply any required Storybook addons (e.g., `@storybook/addon-interactions`) to support asynchronous stories.  
        3. Adjust story definitions to use `play` functions for simulating loading completion.  
        4. Manually verify that all async states display correctly and no errors appear in the console.  
    - **Done-when:**  
        1. All AuthLoadingScreen stories render start→loading→done transitions without errors.  
        2. No console warnings or freezes during interaction.  
    - **Depends-on:** T019

- [ ] **T021 · Chore · P3: Mark T009 as completed**  
    - **Context:** Original analysis task  
    - **Action:**  
        1. Edit `TODO.md` and change T009’s checkbox to `[x]`.  
        2. Commit the change with a Conventional Commit message: `chore: mark T009 done`.  
    - **Done-when:**  
        1. T009 appears checked off in `TODO.md`.  
    - **Depends-on:** T020
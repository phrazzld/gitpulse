Here is a proposed sequence of atomic implementation tasks (T018–T024). Each task has a single focus, clear dependencies, and precise “done‐when” criteria. They implement the consultant’s recommendations in logical order:

T018 – Remove Internal Environment Detection from AuthLoadingScreen  
Context  
  The component currently inspects environment variables or Storybook globals to enable/disable effects. This implicit logic violates “explicit > implicit.” We must strip out all internal environment detection.  
Action Steps  
  1. In src/components/AuthLoadingScreen/AuthLoadingScreen.tsx (or .tsx):  
     a. Remove any code (imports, constants or functions) that checks NODE_ENV, REACT_APP_ENV, window.__STORYBOOK__, process.env.STORYBOOK, etc.  
     b. Delete any branches in useEffect or render logic that use those flags.  
     c. Remove dead imports (e.g. import { isStorybook } from '...').  
  2. Run `npm run lint` / `yarn lint` and fix any unused‐symbol errors.  
  3. Update Prop types: if there was a hidden internal flag prop, remove it.  
Done‐When  
  • AuthLoadingScreen builds without errors.  
  • No references remain to environment variables or Storybook detection in this file.  
  • Existing unit tests (if any) pass or are updated to reflect removal.  
Dependencies  
  – None  

T019 – Introduce and Honor the disableEffects Prop Exclusively  
Context  
  Side effects (timers, redirects, analytics) must now be controlled only via an explicit `disableEffects: boolean` prop.  
Action Steps  
  1. In AuthLoadingScreen component:  
     a. Add `disableEffects?: boolean` to the component’s props interface, defaulting to false.  
     b. At the top of each effect hook (`useEffect`), add:  
        if (disableEffects) return;  
     c. Remove any remaining inline guards.  
  2. Add TSDoc for `disableEffects` explaining its purpose.  
  3. Update PropTypes / defaultProps or function signature default value.  
Done‐When  
  • All effects in AuthLoadingScreen early‐exit when `disableEffects` is true.  
  • Component compiles and type‐checks (strict mode).  
  • No effect logic references implicit environment.  
Dependencies  
  – T018  

T020 – Update Storybook Stories to Use disableEffects Prop  
Context  
  Storybook stories previously relied on the component’s internal env detection; now they must explicitly opt into effects.  
Action Steps  
  1. In `src/components/AuthLoadingScreen/AuthLoadingScreen.stories.tsx`:  
     a. For each story, add `args: { disableEffects: true }` (or knob) to disable side‐effects while rendering in Storybook.  
     b. Remove any custom decorators or parameters that simulate env detection.  
     c. If you want a “WithEffects” variant, add a story with `disableEffects: false` and describe in the Storybook Docs tab.  
  2. Run `npm run storybook` and visually confirm no freezes.  
  3. Update snapshot tests (if you have them) via `npm run test -- -u`.  
Done‐When  
  • All AuthLoadingScreen stories render and behave (no infinite loops or unexpected redirects) with `disableEffects: true`.  
  • Stories compile, and any existing snapshots updated.  
Dependencies  
  – T019  

T021 – Verify and Update Application Usage of disableEffects Prop  
Context  
  In the real application, callers of AuthLoadingScreen must now explicitly pass `disableEffects` when they want to suppress effects (e.g., SSR, tests).  
Action Steps  
  1. Search the codebase for every usage of `<AuthLoadingScreen` (or import).  
  2. For each usage where side‐effects should be disabled (e.g., server‐side frameworks, test harnesses), add `disableEffects={true}`.  
  3. For standard app flows, leave `disableEffects` omitted or set to false.  
  4. Rebuild and smoke‐test the app: user should still be redirected to login/home as expected.  
Done‐When  
  • No runtime errors or missing‐prop warnings related to disableEffects.  
  • App behavior on auth‐loading path remains functionally identical to before, except where effects are intentionally disabled.  
Dependencies  
  – T019  

T022 – Add/Update Unit and Integration Tests for disableEffects Behavior  
Context  
  We need automated verification that disabling effects truly prevents side‐effects and that normal behavior still runs when enabled.  
Action Steps  
  1. In `src/components/AuthLoadingScreen/__tests__/AuthLoadingScreen.test.tsx` (create if missing):  
     a. Write a test that renders the component with `disableEffects={true}` and asserts that no navigation calls (mocked router) or timers are scheduled.  
     b. Write a test with `disableEffects={false}` that mocks the effect dependencies (e.g., `jest.useFakeTimers()`, mockRedirect) and asserts they are called.  
  2. Use the same mocking approach as the application (e.g., `react-router`’s `MemoryRouter`, or a spy on `window.location.assign`).  
  3. Ensure tests are isolated, fast, and self–validating.  
  4. Run `npm test -- --coverage` and confirm coverage thresholds.  
Done‐When  
  • Tests cover both branches of disableEffects.  
  • CI passes with coverage intact.  
Dependencies  
  – T019  

T023 – Update Documentation (README, TSDoc, CHANGELOG, Storybook DocsTab)  
Context  
  We must record that `disableEffects` is the explicit control for side‐effects and remove references to implicit env detection.  
Action Steps  
  1. In the root README.md under “Components → AuthLoadingScreen”:  
     a. Document the new `disableEffects` prop and its default behavior.  
  2. In the component’s TSDoc comments, update `@param` for disableEffects and remove old environment‐detection notes.  
  3. In CHANGELOG.md (or rely on Conventional Commits), add an entry:  
     - chore(AuthLoadingScreen): remove implicit env detection, add disableEffects prop  
  4. In Storybook’s DocsPage for AuthLoadingScreen, update the Props table and description to reflect explicit control.  
Done‐When  
  • Documentation accurately describes usage of disableEffects and no longer mentions implicit detection.  
  • PR reviewer confirms docs match implemented behavior.  
Dependencies  
  – T020, T021, T022  

T024 – Mark T017 as Completed in TODO.md  
Context  
  T017 tracked the overall “AuthLoadingScreen freeze” work. Now that we’ve implemented all subtasks, we can close T017.  
Action Steps  
  1. Open TODO.md.  
  2. Find entry T017 and prefix with “✔” or move it to the “Done” section per project style.  
  3. Commit the updated TODO.md.  
Done‐When  
  • TODO.md shows T017 completed.  
Dependencies  
  – T018, T019, T020, T021, T022, T023
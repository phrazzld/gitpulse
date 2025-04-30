# Todo

## Storybook Setup & Initial Components

- [x] **T001 · Chore · P1: audit components and select initial 3-5 candidates for storybook**
    - **Context:** PLAN.md Step 3.1
    - **Action:**
        1. Review components in `src/components/` and subdirectories (`dashboard`, `ui`, etc.).
        2. Identify 3-5 simple, reusable, presentational components meeting criteria (minimal external dependencies).
        3. Document the selected components (name, path) and rationale.
    - **Done‑when:**
        1. A list of 3-5 selected component names and their file paths is documented (e.g., in a comment on this ticket).
    - **Selected Components:**
        1. **LoadMoreButton** - `/src/components/LoadMoreButton.tsx`
           - Simple, pure functional component with no external dependencies
           - Takes clear props: `onClick`, `loading`, `hasMore`
           - Easy to showcase different states (default, loading, hidden)
           - Ideal first candidate due to its simplicity and well-defined behavior
        2. **AuthLoadingScreen** - `/src/components/AuthLoadingScreen.tsx`
           - Pure presentational component with no dependencies or hooks
           - Visual component that accepts simple message props
           - Good example of UI styling that can be easily showcased
        3. **ModeSelector** - `/src/components/ModeSelector.tsx`
           - Interactive selection component with minimal dependencies
           - Only external link is to onChange callback prop
           - Good candidate to demonstrate controls for enum/option selection
        4. **CommitItem** - `/src/components/dashboard/activityFeed/components/CommitItem.tsx`
           - Reusable item component with flexible display options
           - Only imports Next.js Image component and ActivityCommit type
           - Good showcase for complex UI with conditional rendering
    - **Depends‑on:** none

- [ ] **T002 · Chore · P2: decide on dedicated ui library directory structure**
    - **Context:** PLAN.md Step 3.2
    - **Action:**
        1. Evaluate creating a dedicated directory like `src/components/ui/` vs. current structure.
        2. Document the decision (Yes/No and chosen path if Yes).
    - **Done‑when:**
        1. Decision (Yes/No create dedicated dir) is recorded.
        2. If Yes, the chosen directory path (e.g., `src/components/ui/`) is specified.
    - **Depends‑on:** none

- [ ] **T003 · Refactor · P2: create dedicated ui library directory structure**
    - **Context:** PLAN.md Step 3.2, Action 1
    - **Action:**
        1. Create the directory path decided upon in T002 (e.g., `src/components/ui/`).
    - **Done‑when:**
        1. The specified directory exists in the codebase.
    - **Depends‑on:** [T002] *(Skip if T002 decision is No)*

- [ ] **T004 · Refactor · P2: move LoadMoreButton component to ui library directory**
    - **Context:** PLAN.md Step 3.2, Action 2 (Assumes `LoadMoreButton` selected in T001 and T002 decision was Yes)
    - **Action:**
        1. Move the `LoadMoreButton` component files to the directory created in T003.
        2. Update all import paths for `LoadMoreButton` across the codebase.
    - **Done‑when:**
        1. Component files are in the new directory.
        2. Application builds and runs correctly after path updates (`npm run dev`, `npm run build`).
    - **Depends‑on:** [T001, T003] *(Skip if T002 decision is No or component not selected in T001)*

- [ ] **T005 · Refactor · P2: refactor LoadMoreButton for improved isolation if necessary**
    - **Context:** PLAN.md Step 3.2, Action 3 (Assumes `LoadMoreButton` selected in T001)
    - **Action:**
        1. Review `LoadMoreButton` for dependencies on context, global state, or complex custom hooks.
        2. Refactor component to primarily receive data and callbacks via props if feasible for better Storybook integration.
    - **Done‑when:**
        1. Component is reviewed, and refactoring (if any) is complete and committed.
        2. Component behavior remains unchanged in the application.
    - **Depends‑on:** [T004] (or [T001] if T004 is skipped)

- [ ] **T006 · Feature · P1: create storybook stories for LoadMoreButton**
    - **Context:** PLAN.md Step 3.3 (Assumes `LoadMoreButton` selected in T001)
    - **Action:**
        1. Create `LoadMoreButton.stories.tsx` adjacent to the component, using CSF3.
        2. Implement `meta` object (title: `UI/Buttons/Load More Button`, component, `tags: ['autodocs']`, `argTypes` with controls/descriptions, default `args`).
        3. Export `Default`, `Loading`, and `NoMoreItems` stories using `args` for variations. Add TSDoc comments to component/props.
    - **Done‑when:**
        1. `LoadMoreButton.stories.tsx` exists, is well-formed, and includes stories for key states.
        2. TSDoc comments added/updated for the component and its props.
        3. Storybook runs (`npm run storybook`) and builds (`npm run build-storybook`) successfully.
        4. Docs tab is populated correctly from TSDoc and argTypes.
    - **Verification:**
        1. Run `npm run storybook`.
        2. Navigate to `UI/Buttons/Load More Button`.
        3. Check `Default`, `Loading`, `NoMoreItems` stories in Canvas view render correctly.
        4. Interact with `loading` and `hasMore` controls; verify component updates.
        5. Click the button (in Default story); verify `clicked` action logged in Actions panel.
        6. Review Docs tab for documentation.
        7. Check Accessibility tab for violations (address in T014).
    - **Depends‑on:** [T005] (or [T004] or [T001] depending on structure/refactor path)

- [ ] **T007 · Refactor · P2: move AuthLoadingScreen component to ui library directory**
    - **Context:** PLAN.md Step 3.2, Action 2 (Assumes `AuthLoadingScreen` selected in T001 and T002 decision was Yes)
    - **Action:**
        1. Move the `AuthLoadingScreen` component files to the directory created in T003.
        2. Update all import paths for `AuthLoadingScreen` across the codebase.
    - **Done‑when:**
        1. Component files are in the new directory.
        2. Application builds and runs correctly after path updates.
    - **Depends‑on:** [T001, T003] *(Skip if T002 decision is No or component not selected in T001)*

- [ ] **T008 · Refactor · P2: refactor AuthLoadingScreen for improved isolation if necessary**
    - **Context:** PLAN.md Step 3.2, Action 3 (Assumes `AuthLoadingScreen` selected in T001)
    - **Action:**
        1. Review `AuthLoadingScreen` for external dependencies.
        2. Refactor component to primarily receive data/callbacks via props if feasible.
    - **Done‑when:**
        1. Component is reviewed, and refactoring (if any) is complete and committed.
        2. Component behavior remains unchanged in the application.
    - **Depends‑on:** [T007] (or [T001] if T007 is skipped)

- [ ] **T009 · Feature · P1: create storybook stories for AuthLoadingScreen**
    - **Context:** PLAN.md Step 3.3 (Assumes `AuthLoadingScreen` selected in T001)
    - **Action:**
        1. Create `AuthLoadingScreen.stories.tsx` adjacent to the component, using CSF3.
        2. Implement `meta` object (title: `UI/Screens/Auth Loading`, component, `tags: ['autodocs']`, `argTypes`, default `args`).
        3. Export a `Default` story. Add TSDoc comments to component/props.
    - **Done‑when:**
        1. `AuthLoadingScreen.stories.tsx` exists, is well-formed, and includes a default story.
        2. TSDoc comments added/updated for the component and its props.
        3. Storybook runs and builds successfully.
        4. Docs tab is populated correctly.
    - **Verification:**
        1. Run `npm run storybook`.
        2. Navigate to `UI/Screens/Auth Loading`.
        3. Check default story in Canvas view renders correctly.
        4. Interact with any defined controls; verify component updates.
        5. Review Docs tab for documentation.
        6. Check Accessibility tab for violations (address in T014).
    - **Depends‑on:** [T008] (or [T007] or [T001] depending on structure/refactor path)

- [ ] **T010 · Refactor · P2: move ModeSelector component to ui library directory**
    - **Context:** PLAN.md Step 3.2, Action 2 (Assumes `ModeSelector` selected in T001 and T002 decision was Yes)
    - **Action:**
        1. Move the `ModeSelector` component files to the directory created in T003.
        2. Update all import paths for `ModeSelector` across the codebase.
    - **Done‑when:**
        1. Component files are in the new directory.
        2. Application builds and runs correctly after path updates.
    - **Depends‑on:** [T001, T003] *(Skip if T002 decision is No or component not selected in T001)*

- [ ] **T011 · Refactor · P2: refactor ModeSelector for improved isolation if necessary**
    - **Context:** PLAN.md Step 3.2, Action 3 (Assumes `ModeSelector` selected in T001)
    - **Action:**
        1. Review `ModeSelector` for external dependencies (e.g., theme context/hook).
        2. Refactor component to receive mode and setter via props if feasible.
    - **Done‑when:**
        1. Component is reviewed, and refactoring (if any) is complete and committed.
        2. Component behavior remains unchanged in the application.
    - **Depends‑on:** [T010] (or [T001] if T010 is skipped)

- [ ] **T012 · Feature · P1: create storybook stories for ModeSelector**
    - **Context:** PLAN.md Step 3.3 (Assumes `ModeSelector` selected in T001)
    - **Action:**
        1. Create `ModeSelector.stories.tsx` adjacent to the component, using CSF3.
        2. Implement `meta` object (title: `UI/Selectors/Mode Selector`, component, `tags: ['autodocs']`, `argTypes` with controls/actions, default `args`).
        3. Export stories for key states (e.g., `LightMode`, `DarkMode`). Add TSDoc comments to component/props.
    - **Done‑when:**
        1. `ModeSelector.stories.tsx` exists, is well-formed, and includes stories for key states.
        2. TSDoc comments added/updated for the component and its props.
        3. Storybook runs and builds successfully.
        4. Docs tab is populated correctly.
    - **Verification:**
        1. Run `npm run storybook`.
        2. Navigate to `UI/Selectors/Mode Selector`.
        3. Check stories for different modes in Canvas view render correctly.
        4. Interact with controls; verify component updates.
        5. Interact with component; verify actions logged in Actions panel.
        6. Review Docs tab for documentation.
        7. Check Accessibility tab for violations (address in T014).
    - **Depends‑on:** [T011] (or [T010] or [T001] depending on structure/refactor path)

- [ ] **T013 · Chore · P3: remove example stories generated by storybook init**
    - **Context:** PLAN.md Step 3.3, Action 1 (Cleanup)
    - **Action:**
        1. Identify and delete any placeholder/example story files (e.g., `src/stories/*.stories.*`) created by `storybook init`.
    - **Done‑when:**
        1. Example story files are removed from the codebase.
        2. Storybook builds successfully without errors related to missing example files.
    - **Depends‑on:** none *(Logically done after T006, T009, T012 are complete)*

- [ ] **T014 · Bugfix · P2: address accessibility violations found in initial stories**
    - **Context:** PLAN.md Step 3.3 Verification & Section 4 Testing Strategy
    - **Action:**
        1. Review Accessibility panel results for stories created in T006, T009, T012.
        2. Implement fixes within the respective components or stories for reported violations where feasible.
    - **Done‑when:**
        1. Accessibility violations in the initial component stories are reviewed and straightforward fixes implemented.
        2. Complex issues requiring larger changes are documented for separate tracking.
    - **Verification:**
        1. Run `npm run storybook`.
        2. Re-check Accessibility panel for the relevant stories to confirm fixes.
    - **Depends‑on:** [T006, T009, T012]

## Documentation & Standards

- [ ] **T015 · Chore · P2: define and document storybook usage standards**
    - **Context:** PLAN.md Step 3.4, Action 1
    - **Action:**
        1. Create or update `docs/COMPONENT_LIBRARY.md` (or `docs/STORYBOOK.md`).
        2. Document standards: CSF3, naming (files, exports), hierarchy (`UI/`, `Features/`), `tags: ['autodocs']`, `argTypes` requirements, TSDoc on components/props, story states, isolation philosophy.
    - **Done‑when:**
        1. Documentation file exists/is updated with the defined standards.
    - **Depends‑on:** [T006, T009, T012] *(Beneficial to reference concrete examples)*

- [ ] **T016 · Chore · P3: update development philosophy doc referencing storybook**
    - **Context:** PLAN.md Step 3.4, Action 2
    - **Action:**
        1. Edit `docs/DEVELOPMENT_PHILOSOPHY.md`.
        2. Add brief reference to Storybook for UI development/documentation/testing, linking to the standards doc (T015).
    - **Done‑when:**
        1. `docs/DEVELOPMENT_PHILOSOPHY.md` is updated with the Storybook reference and link.
    - **Depends‑on:** [T015]

---

### Clarifications & Assumptions
- [ ] **Issue:** Need confirmation of the 3-5 components selected in T001.
    - **Context:** PLAN.md Step 3.1 / Ticket T001
    - **Blocking?:** yes (for T004-T012, which assume specific components)
- [ ] **Issue:** Need confirmation of the directory structure decision from T002.
    - **Context:** PLAN.md Step 3.2 / Ticket T002
    - **Blocking?:** yes (for T003, T004, T007, T010)
- [ ] **Issue:** Need assessment if selected components require isolation refactoring (T005, T008, T011).
    - **Context:** PLAN.md Step 3.2, Action 3 / Tickets T005, T008, T011
    - **Blocking?:** no (Story creation can proceed using mocks/decorators if refactoring is skipped, but outcome of assessment needed before starting refactor tasks).
- [ ] **Issue:** How should components requiring complex mocking (if refactoring T005/T008/T011 is skipped) or significant refactoring be handled?
    - **Context:** PLAN.md Section 6 Pitfalls and Considerations
    - **Blocking?:** Potentially yes (for the specific component's story ticket if complexity is high). Decision needed whether to proceed with mocks, create larger refactor task, or defer the component.
- [ ] **Assumption:** PLAN-1 (Core Storybook Setup & Configuration) is complete and functional.
    - **Context:** PLAN.md Section 2 Prerequisites
    - **Blocking?:** yes (for T006, T009, T012, T013, T014)
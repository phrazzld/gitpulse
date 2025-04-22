# Todo Tasks for Dashboard Layout Restructuring

## State Management

- [x] **T001 · Refactor · P1: analyze and merge repositorySlice state into dashboardSlice**
  - **Context:** Detailed Build Steps #1, Risk Matrix (State management duplication)
  - **Action:**
    1. Identify state and actions in `repositorySlice.ts` relevant to the dashboard.
    2. Merge identified state/actions into `src/state/slices/dashboardSlice.ts`, ensuring no naming conflicts and preserving logic.
    3. Create a TypeScript-safe adapter for `repositorySlice.ts` that delegates to dashboardSlice to maintain compatibility.
    4. Mark `repositorySlice.ts` as deprecated for future removal.
  - **Done‑when:**
    1. `dashboardSlice.ts` contains the unified state and actions.
    2. `repositorySlice.ts` is refactored to act as a type-safe adapter to dashboardSlice.
    3. TypeScript typechecking passes completely without errors.
    4. No code using pre-commit hooks needs to be bypassed.
  - **Depends‑on:** none

## Core Layout Components

- [x] **T002 · Feature · P1: implement DashboardGridContainer component**
  - **Context:** Detailed Build Steps #2, Architecture Blueprint (Modules)
  - **Action:**
    1. Create `src/components/dashboard/layout/DashboardGridContainer.tsx`.
    2. Implement the component using Tailwind CSS grid utilities (`grid`, `grid-cols-*`, `gap-*`).
    3. Ensure it accepts and renders `children` and applies optional `className`.
  - **Done‑when:**
    1. Component renders children within a basic Tailwind grid structure.
    2. Component accepts `children` and `className` props as defined in `DashboardGridContainerProps`.
    3. Basic unit tests for rendering children pass.
  - **Depends‑on:** none

## Dashboard Page Refactoring

- [x] **T003 · Refactor · P1: update dashboard page to use consolidated state hooks**

  - **Context:** Detailed Build Steps #3 (Update imports)
  - **Action:**
    1. Update `src/app/dashboard/page.tsx` to import and use state selectors/actions via custom hooks (`src/state/hooks.ts`) connected to the consolidated `dashboardSlice`.
    2. Remove all imports and usage related to the old `repositorySlice`.
  - **Done‑when:**
    1. `page.tsx` successfully uses hooks interacting with the unified `dashboardSlice`.
    2. No references to the old `repositorySlice` remain in `page.tsx`.
    3. The page compiles and renders (layout structure not yet changed).
  - **Depends‑on:** [T001]

- [x] **T004 · Refactor · P2: replace dashboard page layout with DashboardGridContainer**

  - **Context:** Detailed Build Steps #3 (Replace layout structure)
  - **Action:**
    1. Import `DashboardGridContainer` into `src/app/dashboard/page.tsx`.
    2. Replace the existing top-level layout structure with `<DashboardGridContainer>`.
    3. Place existing dashboard panel components as direct children of `DashboardGridContainer`.
  - **Done‑when:**
    1. `page.tsx` uses `DashboardGridContainer` as the primary layout wrapper.
    2. Existing panels render as children of the grid container.
  - **Depends‑on:** [T002, T003]

- [x] **T005 · Refactor · P2: wrap dashboard panels in Card components**
  - **Context:** Detailed Build Steps #4
  - **Action:**
    1. Identify major dashboard panels (e.g., `FilterControls`, `RepositoryInfoPanel`) rendered in `page.tsx`.
    2. Wrap each panel instance with the `Card` component from `src/components/library/`.
    3. Apply consistent padding/margin using design tokens via Tailwind classes.
  - **Done‑when:**
    1. Major dashboard panels are visually contained within `Card` components.
    2. Consistent spacing is applied around cards.
  - **Depends‑on:** [T004]

## Child Component Refactoring

- [x] **T006 · Refactor · P2: refactor FilterControls internals to use library components**

  - **Context:** Detailed Build Steps #5
  - **Action:**
    1. Review internal implementation of `FilterControls` component.
    2. Replace custom styled elements (buttons, inputs, etc.) with corresponding components (`Button`, `Input`) from `src/components/library/`.
    3. Ensure consistent use of library component variants and sizing.
  - **Done‑when:**
    1. `FilterControls` primarily uses components from `src/components/library/` for its UI elements.
    2. Styling aligns with the Core Component Library standards.
    3. Component functionality remains unchanged.
  - **Depends‑on:** none

- [x] **T007 · Refactor · P2: refactor RepositoryInfoPanel internals to use library components**

  - **Context:** Detailed Build Steps #5
  - **Action:**
    1. Review internal implementation of `RepositoryInfoPanel` component.
    2. Replace custom styled elements with corresponding components from `src/components/library/` (e.g., `Text`, `Badge`).
    3. Ensure consistent use of library component variants and sizing.
  - **Done‑when:**
    1. `RepositoryInfoPanel` primarily uses components from `src/components/library/` for its UI elements.
    2. Styling aligns with the Core Component Library standards.
    3. Component functionality remains unchanged.
  - **Depends‑on:** none

- [x] **T008 · Refactor · P2: refactor DashboardSummaryPanel internals to use library components**

  - **Context:** Detailed Build Steps #5
  - **Action:**
    1. Review internal implementation of `DashboardSummaryPanel` component.
    2. Replace custom styled elements with corresponding components from `src/components/library/`.
    3. Ensure consistent use of library component variants and sizing.
  - **Done‑when:**
    1. `DashboardSummaryPanel` primarily uses components from `src/components/library/` for its UI elements.
    2. Styling aligns with the Core Component Library standards.
    3. Component functionality remains unchanged.
  - **Depends‑on:** none

- [x] **T009 · Refactor · P2: refactor ActivityOverviewPanel internals to use library components**

  - **Context:** Detailed Build Steps #5
  - **Action:**
    1. Review internal implementation of `ActivityOverviewPanel` component.
    2. Replace custom styled elements with corresponding components from `src/components/library/`.
    3. Ensure consistent use of library component variants and sizing.
  - **Done‑when:**
    1. `ActivityOverviewPanel` primarily uses components from `src/components/library/` for its UI elements.
    2. Styling aligns with the Core Component Library standards.
    3. Component functionality remains unchanged.
  - **Depends‑on:** none

- [x] **T010 · Refactor · P2: refactor ActivityFeedPanel internals to use library components**
  - **Context:** Detailed Build Steps #5
  - **Action:**
    1. Review internal implementation of `ActivityFeedPanel` component.
    2. Replace custom styled elements with corresponding components from `src/components/library/`.
    3. Ensure consistent use of library component variants and sizing.
  - **Done‑when:**
    1. `ActivityFeedPanel` primarily uses components from `src/components/library/` for its UI elements.
    2. Styling aligns with the Core Component Library standards.
    3. Component functionality remains unchanged.
  - **Depends‑on:** none

## Layout Implementation & Styling

- [x] **T011 · Feature · P1: configure responsive grid layout in DashboardGridContainer usage**

  - **Context:** Detailed Build Steps #6
  - **Action:**
    1. Apply responsive Tailwind grid column span classes (e.g., `col-span-12`, `md:col-span-6`, `lg:col-span-4`) to the panel components within `DashboardGridContainer` in `page.tsx`.
    2. Define layout adjustments based on breakpoints (mobile, tablet, desktop) according to clarified requirements.
  - **Done‑when:**
    1. Dashboard panels arrange correctly across specified breakpoints (mobile, tablet, desktop).
    2. Layout adheres to the specific responsive requirements (requires clarification).
  - **Depends‑on:** [T004]

- [ ] **T012 · Refactor · P2: audit and apply consistent spacing/alignment across dashboard**
  - **Context:** Detailed Build Steps #7
  - **Action:**
    1. Review the entire dashboard layout (`page.tsx` and child components) for spacing and alignment.
    2. Apply consistent margins, padding, and gaps using Tailwind utility classes based on `tokens.css`.
    3. Utilize flexbox/grid alignment utilities (`items-*`, `justify-*`, `gap-*`, `space-*`) for consistent alignment within and between components.
  - **Done‑when:**
    1. Spacing (margins, padding, gaps) is consistent and uses design tokens.
    2. Alignment of elements within panels and between panels is consistent.
  - **Depends‑on:** [T011]

## Structure & Data Flow

- [ ] **T013 · Refactor · P3: review and refactor prop drilling and component responsibilities**
  - **Context:** Detailed Build Steps #8
  - **Action:**
    1. Analyze the data flow from `page.tsx` down to child components.
    2. Identify and refactor instances of excessive prop drilling.
    3. Ensure components have clear, single responsibilities related to UI or state interaction.
  - **Done‑when:**
    1. Prop passing is minimized and follows clear paths.
    2. Component responsibilities are well-defined and separated.
  - **Depends‑on:** [T004]

## Documentation

- [ ] **T015 · Chore · P3: add code comments for complex dashboard layout decisions**
  - **Context:** Documentation section
  - **Action:**
    1. Review the responsive grid configuration (Tailwind classes) in `page.tsx` and `DashboardGridContainer`.
    2. Add comments explaining the rationale (`why`) for any non-obvious or complex layout choices (e.g., specific breakpoint adjustments, complex grid spans).
  - **Done‑when:**
    1. Code implementing complex layout logic includes explanatory comments.
  - **Depends‑on:** [T011]

## Testing & Verification

- [ ] **T016 · Test · P1: update unit tests for refactored dashboard components and state**

  - **Context:** Detailed Build Steps #10 (Unit Tests), Testing Strategy (Unit Tests)
  - **Action:**
    1. Update unit tests for `dashboardSlice` (T001).
    2. Add/update unit tests for `DashboardGridContainer` (T002).
    3. Update unit tests for wrapped panels (T005) and internally refactored components (`FilterControls`, `RepositoryInfoPanel`, etc.) (T006-T010).
    4. Ensure all tests pass and meet coverage targets (≥85% overall, ≥95% core layout/state logic).
  - **Done‑when:**
    1. All relevant unit tests pass.
    2. Code coverage meets or exceeds defined targets.
  - **Depends‑on:** [T001, T002, T005, T006, T007, T008, T009, T010]

- [ ] **T017 · Test · P0: update dashboard integration tests for new layout and state**
  - **Context:** Detailed Build Steps #10 (Integration Tests), Testing Strategy (Integration Tests)
  - **Action:**
    1. Update tests in `dashboard-integration.test.tsx` and `dashboard-layout.test.tsx` (or similar files).
    2. Modify selectors and assertions to match the new DOM structure (Grid, Cards, Library components).
    3. Verify full page rendering, state interactions (using consolidated slice), and responsive layout changes with simulated screen sizes.
  - **Done‑when:**
    1. All dashboard integration tests pass.
    2. Tests cover key user interactions and responsive states accurately.
  - **Depends‑on:** [T011, T012, T013]

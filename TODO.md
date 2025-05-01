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

- [x] **T002 · Chore · P2: decide on dedicated ui library directory structure**
    - **Context:** PLAN.md Step 3.2
    - **Action:**
        1. Evaluate creating a dedicated directory like `src/components/ui/` vs. current structure.
        2. Document the decision (Yes/No and chosen path if Yes).
    - **Done‑when:**
        1. Decision (Yes/No create dedicated dir) is recorded.
        2. If Yes, the chosen directory path (e.g., `src/components/ui/`) is specified.
    - **Decision:** Yes, use `src/components/ui/` as the dedicated directory for UI components
    - **Rationale:**
        1. The `src/components/ui/` directory already exists in the project structure but is empty
        2. Using a dedicated directory aligns with the plan's recommendation to promote "clear separation between application-specific composite components and reusable UI primitives" 
        3. Having a dedicated directory simplifies Storybook organization and makes the UI component library more discoverable
        4. The `ui` directory name is concise and clear about its purpose compared to alternatives
        5. This structure mirrors common practices in React applications and aligns with modularity principles
    - **Depends‑on:** none

- [x] **T003 · Refactor · P2: create dedicated ui library directory structure**
    - **Context:** PLAN.md Step 3.2, Action 1
    - **Action:**
        1. Create the directory path decided upon in T002 (e.g., `src/components/ui/`).
    - **Done‑when:**
        1. The specified directory exists in the codebase.
    - **Implementation:**
        1. Directory already existed at `src/components/ui/`
        2. Added README.md to document purpose and conventions for UI components in this directory
    - **Depends‑on:** [T002] *(Skip if T002 decision is No)*

- [x] **T004 · Refactor · P2: move LoadMoreButton component to ui library directory**
    - **Context:** PLAN.md Step 3.2, Action 2 (Assumes `LoadMoreButton` selected in T001 and T002 decision was Yes)
    - **Action:**
        1. Move the `LoadMoreButton` component files to the directory created in T003.
        2. Update all import paths for `LoadMoreButton` across the codebase.
    - **Done‑when:**
        1. Component files are in the new directory.
        2. Application builds and runs correctly after path updates (`npm run dev`, `npm run build`).
    - **Implementation:**
        1. Created LoadMoreButton.tsx in the src/components/ui/ directory
        2. Updated import in ActivityFeed.tsx to use the new location
        3. Verified application builds correctly with npm run dev, npm run typecheck, and npm run lint
        4. Removed the original LoadMoreButton.tsx file
    - **Depends‑on:** [T001, T003] *(Skip if T002 decision is No or component not selected in T001)*

- [x] **T005 · Refactor · P2: refactor LoadMoreButton for improved isolation if necessary**
    - **Context:** PLAN.md Step 3.2, Action 3 (Assumes `LoadMoreButton` selected in T001)
    - **Action:**
        1. Review `LoadMoreButton` for dependencies on context, global state, or complex custom hooks.
        2. Refactor component to primarily receive data and callbacks via props if feasible for better Storybook integration.
    - **Done‑when:**
        1. Component is reviewed, and refactoring (if any) is complete and committed.
        2. Component behavior remains unchanged in the application.
    - **Implementation:**
        1. Reviewed LoadMoreButton component and found it already well-isolated:
           - Only depends on React
           - Receives all data and callbacks via props (onClick, loading, hasMore, className)
           - No context, global state, or complex hooks
           - Contains only UI logic, no business logic
        2. No refactoring needed as the component is already suitable for Storybook
    - **Depends‑on:** [T004] (or [T001] if T004 is skipped)

- [x] **T006 · Feature · P1: create storybook stories for LoadMoreButton**
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
    - **Implementation:**
        1. Enhanced LoadMoreButton TSDoc comments for better documentation
        2. Created LoadMoreButton.stories.tsx with CSF3 format
        3. Implemented meta object with title 'UI/Buttons/Load More Button', tags, and argTypes
        4. Created three stories:
           - Default: Button in ready state
           - Loading: Button in loading state with spinner
           - NoMoreItems: Shows component not rendering when hasMore is false (with decorator)
        5. Set up actions for the onClick handler
        6. Verified Storybook builds successfully
    - **Verification:**
        1. Run `npm run storybook`.
        2. Navigate to `UI/Buttons/Load More Button`.
        3. Check `Default`, `Loading`, `NoMoreItems` stories in Canvas view render correctly.
        4. Interact with `loading` and `hasMore` controls; verify component updates.
        5. Click the button (in Default story); verify `clicked` action logged in Actions panel.
        6. Review Docs tab for documentation.
        7. Check Accessibility tab for violations (address in T014).
    - **Depends‑on:** [T005] (or [T004] or [T001] depending on structure/refactor path)

- [x] **T007 · Refactor · P2: move AuthLoadingScreen component to ui library directory**
    - **Context:** PLAN.md Step 3.2, Action 2 (Assumes `AuthLoadingScreen` selected in T001 and T002 decision was Yes)
    - **Action:**
        1. Move the `AuthLoadingScreen` component files to the directory created in T003.
        2. Update all import paths for `AuthLoadingScreen` across the codebase.
    - **Done‑when:**
        1. Component files are in the new directory.
        2. Application builds and runs correctly after path updates.
    - **Implementation:**
        1. Created AuthLoadingScreen.tsx in the src/components/ui/ directory
        2. Updated imports in page.tsx and dashboard/layout.tsx to use the new location
        3. Verified application builds correctly with npm run dev, npm run typecheck, and npm run lint
        4. Removed the original AuthLoadingScreen.tsx file
    - **Depends‑on:** [T001, T003] *(Skip if T002 decision is No or component not selected in T001)*

- [x] **T008 · Refactor · P2: refactor AuthLoadingScreen for improved isolation if necessary**
    - **Context:** PLAN.md Step 3.2, Action 3 (Assumes `AuthLoadingScreen` selected in T001)
    - **Action:**
        1. Review `AuthLoadingScreen` for external dependencies.
        2. Refactor component to primarily receive data/callbacks via props if feasible.
    - **Done‑when:**
        1. Component is reviewed, and refactoring (if any) is complete and committed.
        2. Component behavior remains unchanged in the application.
    - **Implementation:**
        1. Reviewed AuthLoadingScreen and identified areas for improvement:
           - Hardcoded CSS variables that may not be available in Storybook context
           - Fixed text content that should be configurable
           - Limited customization options for the component
        2. Refactored the component with enhanced props and configurability:
           - Added props for all text content (statusMessage, footerMessage)
           - Added color customization props (primaryColor, secondaryColor, textColor, etc.)
           - Added background and card styling customization
           - Added className prop for additional styling
           - Improved TSDoc comments for better documentation
        3. Verified application builds correctly with npm run dev, npm run typecheck, and npm run lint
    - **Depends‑on:** [T007] (or [T001] if T007 is skipped)

- [x] **T009 · Feature · P1: create storybook stories for AuthLoadingScreen** *(REVISED: Will not implement)*
    - **Context:** PLAN.md Step 3.3 (Assumes `AuthLoadingScreen` selected in T001)
    - **Action:**
        1. ~~Create `AuthLoadingScreen.stories.tsx` adjacent to the component, using CSF3.~~
        2. ~~Implement `meta` object (title: `UI/Screens/Auth Loading`, component, `tags: ['autodocs']`, `argTypes`, default `args`).~~
        3. ~~Export a `Default` story. Add TSDoc comments to component/props.~~
    - **Decision:** After initial attempts, determined that AuthLoadingScreen is too complex for early Storybook integration:
        1. Performance-intensive CSS effects cause Storybook to freeze
        2. Best practices recommend starting with atomic components first
        3. Will revisit after simpler components are implemented
    - **Outcome:**
        1. Improved TSDoc comments for the component
        2. Added disableEffects prop for future integration
        3. Decided to focus on atomic components first (buttons, selectors, etc.)
    - **Depends‑on:** [T008] (or [T007] or [T001] depending on structure/refactor path)

- [x] **T017 · Bugfix · P1: Profile & Isolate AuthLoadingScreen Freeze in Storybook** *(REVISED)*
    - **Context:** Based on T009 and initial investigation of the AuthLoadingScreen Storybook freeze.
    - **Action:**
        1. Assess Storybook freeze with AuthLoadingScreen component.
        2. Evaluate complexity and suitability for early Storybook integration.
    - **Decision:**
        1. Identified CSS backdrop filters, animations, and gradient backgrounds as cause of freeze. 
        2. Determined that complex components like AuthLoadingScreen should be deferred until atomic components are completed.
        3. Added disableEffects prop to component for future implementation.
    - **Conclusion:**
        1. Will prioritize atomic components for Storybook (LoadMoreButton, ModeSelector, etc.).
        2. Improved component with disableEffects prop for future Storybook integration.
        3. Created T017-findings.md documenting performance issues discovered.
    - **Depends‑on:** []

- [x] **T018 · Refactor · P1: AuthLoadingScreen Component Improvement**
    - **Context:** While we're deferring Storybook integration for this component, we should still improve it following best practices.
    - **Action:**
        1. Remove environment detection using window.location.href.
        2. Add explicit disableEffects prop with good documentation.
        3. Update TSDoc comments for better clarity.
    - **Implementation:**
        1. Removed internal window.location check for Storybook environment.
        2. Updated component to rely solely on disableEffects prop.
        3. Improved TSDoc comments for all props, explaining purpose and defaults.
        4. Verified component compiles and lints successfully.
    - **Note:** The addition of the disableEffects prop is considered a temporary solution. Task T025 has been added to properly refactor this component using better design principles.
    - **Depends‑on:** [T017]

- [ ] **T025 · Refactor · P1: Remove disableEffects prop from AuthLoadingScreen and improve architecture**
    - **Context:** The disableEffects prop is a design smell indicating deeper architectural issues in the component. The component is trying to handle too many responsibilities and exposing implementation details to consumers.
    - **Action:**
        1. Remove the disableEffects prop from AuthLoadingScreen component
        2. Refactor the component to use CSS custom properties for effects rather than prop-based toggling
        3. Consider breaking the component into smaller, focused components with clearer responsibilities
        4. Ensure animations use proper progressive enhancement approaches
    - **Done‑when:**
        1. The disableEffects prop is removed completely
        2. Component architecture better follows separation of concerns
        3. The component works reliably in all environments without special flags
        4. Documentation is updated to reflect the new design
    - **Depends‑on:** [T010, T011, T012] (Complete simpler components first)

- [x] **T010 · Refactor · P2: move ModeSelector component to ui library directory**
    - **Context:** PLAN.md Step 3.2, Action 2 (Assumes `ModeSelector` selected in T001 and T002 decision was Yes)
    - **Action:**
        1. Move the `ModeSelector` component files to the directory created in T003.
        2. Update all import paths for `ModeSelector` across the codebase.
    - **Done‑when:**
        1. Component files are in the new directory.
        2. Application builds and runs correctly after path updates.
    - **Implementation:**
        1. Created ModeSelector.tsx in the src/components/ui/ directory
        2. Updated imports in OperationsPanel.tsx, OperationsPanel.test.tsx, and OrganizationPicker.tsx to use the new location
        3. Verified application builds correctly with npm run typecheck and npm run lint
        4. Removed the original ModeSelector.tsx file
    - **Depends‑on:** [T001, T003] *(Skip if T002 decision is No or component not selected in T001)*

- [x] **T011 · Refactor · P2: refactor ModeSelector for improved isolation if necessary**
    - **Context:** PLAN.md Step 3.2, Action 3 (Assumes `ModeSelector` selected in T001)
    - **Action:**
        1. Review `ModeSelector` for external dependencies (e.g., theme context/hook).
        2. Refactor component to receive mode and setter via props if feasible.
    - **Done‑when:**
        1. Component is reviewed, and refactoring (if any) is complete and committed.
        2. Component behavior remains unchanged in the application.
    - **Implementation:**
        1. Reviewed ModeSelector and identified several areas for improvement:
           - Hardcoded modes array that should be configurable
           - Reliance on global CSS variables
           - Insufficient accessibility attributes for radio group pattern
           - Limited documentation
        2. Enhanced component with the following improvements:
           - Extracted modes to a separate exportable constant
           - Made modes configurable via props with defaults
           - Added theming props for colors with CSS variable defaults
           - Improved accessibility with proper ARIA attributes
           - Added comprehensive TSDoc documentation
           - Added className prop for additional styling options
        3. Verified that the component works with existing code through typecheck and lint
    - **Depends‑on:** [T010] (or [T001] if T010 is skipped)

- [x] **T012 · Feature · P1: create storybook stories for ModeSelector**
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
    - **Implementation:**
        1. Created ModeSelector.stories.tsx using CSF3 format
        2. Implemented meta object with title 'UI/Selectors/Mode Selector', tags, and argTypes
        3. Created seven stories:
           - Default: With my-activity mode selected
           - WorkModeSelected: With my-work-activity mode selected
           - TeamModeSelected: With team-activity mode selected
           - Disabled: Component in disabled state
           - CustomModes: With different labels and descriptions
           - CustomTheme: With custom colors
           - CustomLabel: With custom aria label and CSS class
        4. Added comprehensive JSDoc comments for each story
        5. Set up actions for the onChange handler
        6. Added parameters for layout and documentation
        7. Verified stories pass TypeScript checking and ESLint
    - **Verification:**
        1. Run `npm run storybook`.
        2. Navigate to `UI/Selectors/Mode Selector`.
        3. Check stories for different modes in Canvas view render correctly.
        4. Interact with controls; verify component updates.
        5. Interact with component; verify actions logged in Actions panel.
        6. Review Docs tab for documentation.
        7. Check Accessibility tab for violations (address in T014).
    - **Depends‑on:** [T011] (or [T010] or [T001] depending on structure/refactor path)

- [x] **T013 · Chore · P3: remove example stories generated by storybook init**
    - **Context:** PLAN.md Step 3.3, Action 1 (Cleanup)
    - **Action:**
        1. Identify and delete any placeholder/example story files (e.g., `src/stories/*.stories.*`) created by `storybook init`.
    - **Done‑when:**
        1. Example story files are removed from the codebase.
        2. Storybook builds successfully without errors related to missing example files.
    - **Implementation:**
        1. Identified example stories in src/stories/ directory: Button, Header, Page components
        2. Removed all files in src/stories/ directory including associated assets
        3. Verified Storybook builds successfully with `npm run build-storybook`
        4. Confirmed no negative impacts on existing component stories
    - **Depends‑on:** none *(Logically done after T006, T009, T012 are complete)*

- [x] **T014 · Bugfix · P2: address accessibility violations found in initial stories**
    - **Context:** PLAN.md Step 3.3 Verification & Section 4 Testing Strategy
    - **Action:**
        1. Review Accessibility panel results for stories created in T006, T009, T012.
        2. Implement fixes within the respective components or stories for reported violations where feasible.
    - **Done‑when:**
        1. Accessibility violations in the initial component stories are reviewed and straightforward fixes implemented.
        2. Complex issues requiring larger changes are documented for separate tracking.
    - **Implementation:**
        1. Enhanced LoadMoreButton component with:
           - Proper ARIA attributes (aria-busy, aria-hidden)
           - Keyboard focus styles with high contrast outlines
           - Fallback colors for CSS variables to ensure contrast
           - Added aria-label to SVG icon
           - Added loadText and loadingText props for better customization
        2. Improved ModeSelector component with:
           - Stable, unique IDs using React's useId() hook
           - Enhanced keyboard navigation with arrow keys
           - Proper focus management for better accessibility
           - Added aria-disabled and other ARIA attributes
           - Improved role semantics for the radio group pattern
        3. Added a11y configuration to story files to enable specific accessibility rule checking
        4. Added documentation about accessibility features and keyboard navigation
        5. Verified builds successfully and passes TypeScript type checking
    - **Verification:**
        1. Run `npm run storybook`.
        2. Re-check Accessibility panel for the relevant stories to confirm fixes.
    - **Depends‑on:** [T006, T009, T012]

## Documentation & Standards

- [x] **T015 · Chore · P2: define and document storybook usage standards**
    - **Context:** PLAN.md Step 3.4, Action 1
    - **Action:**
        1. Create or update `docs/COMPONENT_LIBRARY.md` (or `docs/STORYBOOK.md`).
        2. Document standards: CSF3, naming (files, exports), hierarchy (`UI/`, `Features/`), `tags: ['autodocs']`, `argTypes` requirements, TSDoc on components/props, story states, isolation philosophy.
    - **Done‑when:**
        1. Documentation file exists/is updated with the defined standards.
    - **Implementation:**
        1. Created `docs/STORYBOOK.md` for dedicated Storybook standards documentation
        2. Documented comprehensive standards covering:
           - File structure and naming conventions
           - Component Story Format 3 (CSF3) requirements
           - Story hierarchy and organization (`UI/`, `Features/`, etc.)
           - `argTypes` and controls configuration
           - Documentation requirements for components and stories
           - Component isolation principles
           - Accessibility (a11y) configuration and testing
           - Required story variants (Default, States, Customization, etc.)
        3. Included real examples from our codebase (LoadMoreButton, ModeSelector)
        4. Organized document with clear sections and table of contents
    - **Depends‑on:** [T006, T009, T012] *(Beneficial to reference concrete examples)*

- [x] **T016 · Chore · P3: update development philosophy doc referencing storybook**
    - **Context:** PLAN.md Step 3.4, Action 2
    - **Action:**
        1. Edit `docs/DEVELOPMENT_PHILOSOPHY.md`.
        2. Add brief reference to Storybook for UI development/documentation/testing, linking to the standards doc (T015).
    - **Done‑when:**
        1. `docs/DEVELOPMENT_PHILOSOPHY.md` is updated with the Storybook reference and link.
    - **Implementation:**
        1. Added Storybook reference to the Testing Strategy section under "Component Tests (UI)"
        2. Added new section in Documentation Approach specifically for "Component Documentation with Storybook"
        3. Updated section numbering to maintain consistency
        4. Added clear reference to the Storybook standards document created in T015
        5. Maintained the style and tone of the original document
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
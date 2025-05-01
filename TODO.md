# TODO

## Setup & Configuration
- [ ] **T001 · chore · P2**: create initial component audit document
    - **Context:** 2. Component Audit & Classification - Process 4. Documentation
    - **Action:**
        1. Create `docs/COMPONENT_AUDIT.md`.
        2. Add the table structure as defined in the plan.
    - **Done‑when:**
        1. `docs/COMPONENT_AUDIT.md` exists with the specified table structure.
    - **Verification:** none
    - **Depends‑on:** none
- [ ] **T002 · chore · P1**: configure storybook with vite builder and essential addons
    - **Context:** 4. Storybook Integration - Standards & Process 2. Configuration
    - **Action:**
        1. Ensure Storybook is installed with Vite builder.
        2. Configure `.storybook/main.ts` to use the Vite builder.
        3. Install and configure essential addons (`@storybook/addon-essentials`, `@storybook/addon-interactions`, `@storybook/addon-a11y`).
    - **Done‑when:**
        1. Storybook runs locally (`yarn storybook` or `npm run storybook`).
        2. Essential addons are listed in `.storybook/main.ts`.
        3. The a11y panel is visible in Storybook.
    - **Verification:**
        1. Run `yarn storybook` and verify it starts without errors.
        2. Open a story and check for the 'Accessibility' panel.
    - **Depends‑on:** none
- [ ] **T003 · chore · P1**: configure storybook for next.js mocks and global styles
    - **Context:** 4. Storybook Integration - Standards & Process 2. Configuration
    - **Action:**
        1. Configure `.storybook/preview.ts` to include global styles (e.g., `globals.css`).
        2. Implement mocks for Next.js features (`next/image`, `next/navigation`, etc.) in `.storybook/preview.ts` or a dedicated setup file.
        3. Add necessary decorators or parameters to `.storybook/preview.ts` for consistent rendering environment (e.g., Tailwind context, theme provider).
    - **Done‑when:**
        1. Global styles are applied correctly in Storybook stories.
        2. Components using Next.js features render without errors in Storybook.
    - **Verification:**
        1. View a component that relies on global styles (like typography) in Storybook.
        2. View a component that uses `next/image` or `next/navigation` in Storybook.
    - **Depends‑on:** [T002]
- [ ] **T004 · chore · P2**: create atomic design directory structure
    - **Context:** 7. Technical Decisions & Standards - Directory Structure
    - **Action:**
        1. Create `src/components/atoms/` directory.
        2. Create `src/components/molecules/` directory.
        3. Create `src/components/organisms/` directory.
        4. Create `src/components/templates/` directory.
    - **Done‑when:**
        1. The specified directories exist within `src/components/`.
    - **Verification:** none
    - **Depends‑on:** none
- [ ] **T005 · chore · P1**: configure ci pipeline for linting, types, and storybook build checks
    - **Context:** 5. Testing Strategy - Approach & Requirements (CI Enforced), 7. Technical Decisions & Standards - Configuration
    - **Action:**
        1. Update CI configuration (e.g., GitHub Actions, GitLab CI) to add jobs/steps for:
            - Running ESLint and Prettier checks (`eslint .`, `prettier --check .`).
            - Running TypeScript type checking (`tsc --noEmit`).
            - Building Storybook (`build-storybook`).
            - Running Storybook A11y checks (if possible via CI command, otherwise covered by local check T002).
        2. Configure these checks to fail the build on errors.
    - **Done‑when:**
        1. CI pipeline includes steps for linting, type checking, and Storybook build.
        2. These steps are mandatory and fail the build on violation.
    - **Verification:**
        1. Introduce a lint error, type error, and break the Storybook build to confirm CI failure.
    - **Depends‑on:** [T002, T003]
- [ ] **T006 · chore · P2**: document presentation/logic separation pattern
    - **Context:** 3. Component Refactoring Strategy - Approach 2. Separate Presentation and Logic, 7. Technical Decisions & Standards - Component API Best Practices
    - **Action:**
        1. Create a new documentation file (e.g., `docs/UI_PATTERNS.md` or an appendix).
        2. Document the standard pattern for separating UI rendering logic into pure presentation components and data/business logic into custom hooks.
        3. Include examples of how components receive data/callbacks via props and how hooks manage state/fetching.
    - **Done‑when:**
        1. Documentation explaining the presentation/logic separation pattern is created and committed.
    - **Verification:** none
    - **Depends‑on:** none

## Component Audit (M1)
- [ ] **T007 · chore · P1**: inventory all existing components
    - **Context:** 2. Component Audit & Classification - Process 1. Inventory
    - **Action:**
        1. List all files within `src/components/` (including subdirectories like `ui`, `dashboard`, `layout`, `library`).
        2. Add each component's path to the `COMPONENT_AUDIT.md` table.
    - **Done‑when:**
        1. `COMPONENT_AUDIT.md` contains a comprehensive list of all files found in `src/components/`.
    - **Verification:**
        1. Manually spot-check `src/components/` directories against the `COMPONENT_AUDIT.md` list.
    - **Depends‑on:** [T001]
- [x] **T008 · chore · P1**: analyze and classify ui and library components
    - **Context:** 2. Component Audit & Classification - Process 2. Analysis, 3. Classification Criteria, Initial Focus
    - **Action:**
        1. For each component identified in `src/components/ui/` and `src/components/library/` (from T007):
            - Analyze its purpose, dependencies, complexity, reusability.
            - Classify its proposed Atomic Level (likely Atom or Molecule).
            - Update the `COMPONENT_AUDIT.md` entry with analysis notes and proposed level.
    - **Done‑when:**
        1. All components in `src/components/ui/` and `src/components/library/` have their `Proposed Atomic Level` and `Notes` fields filled in `COMPONENT_AUDIT.md`.
    - **Verification:**
        1. Review `COMPONENT_AUDIT.md` entries for `ui` and `library` components.
    - **Depends‑on:** [T007]
- [ ] **T009 · chore · P1**: analyze and classify dashboard components
    - **Context:** 2. Component Audit & Classification - Process 2. Analysis, 3. Classification Criteria, Initial Focus
    - **Action:**
        1. For each component identified in `src/components/dashboard/` (from T007):
            - Analyze its purpose, dependencies, complexity, reusability.
            - Classify its proposed Atomic Level (likely Molecule or Organism).
            - Update the `COMPONENT_AUDIT.md` entry with analysis notes and proposed level. Pay special attention to `OperationsPanel`.
    - **Done‑when:**
        1. All components in `src/components/dashboard/` have their `Proposed Atomic Level` and `Notes` fields filled in `COMPONENT_AUDIT.md`.
    - **Verification:**
        1. Review `COMPONENT_AUDIT.md` entries for `dashboard` components.
    - **Depends‑on:** [T007]
- [ ] **T010 · chore · P2**: analyze and classify remaining components
    - **Context:** 2. Component Audit & Classification - Process 2. Analysis, 3. Classification Criteria
    - **Action:**
        1. For all remaining components identified in `src/components/` (from T007) not covered in T008 or T009:
            - Analyze its purpose, dependencies, complexity, reusability.
            - Classify its proposed Atomic Level (Molecule, Organism, Template, Page).
            - Update the `COMPONENT_AUDIT.md` entry with analysis notes and proposed level.
    - **Done‑when:**
        1. All components listed in `COMPONENT_AUDIT.md` have their `Proposed Atomic Level` and `Notes` fields filled.
    - **Verification:**
        1. Review `COMPONENT_AUDIT.md` and confirm no `Proposed Atomic Level` or `Notes` fields are empty.
    - **Depends‑on:** [T007]

## Refactor Atoms (M2 - Sample Tickets)
- [ ] **T011 · refactor · P2**: refactor button component for atomic design and storybook standards
    - **Context:** 2. Component Audit & Classification (Example: Button), 3. Component Refactoring Strategy, 4. Storybook Integration, 5. Testing Strategy
    - **Action:**
        1. Review existing `src/components/ui/Button.tsx`. Ensure it is a pure presentation component receiving all configuration via props.
        2. Add/update TSDoc comments for component and props.
        3. Ensure type interface is explicit and well-typed.
    - **Done‑when:**
        1. `Button.tsx` adheres to Atomic Design (Atom) principles and documentation standards.
        2. Component interface is clearly defined and typed.
    - **Verification:** none
    - **Depends‑on:** [T006]
- [ ] **T012 · refactor · P2**: move button component to atoms directory
    - **Context:** 7. Technical Decisions & Standards - Directory Structure
    - **Action:**
        1. Move `src/components/ui/Button.tsx` to `src/components/atoms/Button.tsx`.
        2. Update all internal imports referencing the Button component.
    - **Done‑when:**
        1. `Button.tsx` is located in `src/components/atoms/`.
        2. The application builds and runs without import errors related to Button.
    - **Verification:**
        1. Run `yarn build` or `npm run build`.
        2. Check application pages that use the Button component.
    - **Depends‑on:** [T004, T011]
- [ ] **T013 · feature · P2**: create comprehensive storybook stories for button component
    - **Context:** 4. Storybook Integration - Standards & Process 4. Story Content, 5. Documentation, 6. Accessibility (A11y), 9. Component Variants and States
    - **Action:**
        1. Create or update `src/components/atoms/Button.stories.tsx` using CSF3.
        2. Define `argTypes` with controls for all relevant props.
        3. Create stories covering default state, all variants (if applicable), disabled state, and a story with interaction (`@storybook/addon-interactions`).
        4. Add JSDoc comments to stories.
        5. Configure a11y checks for the stories.
    - **Done‑when:**
        1. `Button.stories.tsx` exists and follows Storybook standards.
        2. Stories for key states/variants and interactions are present.
        3. Stories pass automated a11y checks in Storybook.
    - **Verification:**
        1. Run Storybook and view the Button stories. Interact with the component and check the Actions panel. Check the Accessibility panel for violations.
    - **Depends‑on:** [T003, T012]
- [ ] **T014 · test · P2**: write unit tests for button component
    - **Context:** 5. Testing Strategy - Approach & Requirements 1. Unit/Component Tests, 2. Coverage Targets
    - **Action:**
        1. Write unit tests for `src/components/atoms/Button.tsx` using Jest and React Testing Library.
        2. Test rendering with different props (text, variant, disabled).
        3. Test `onClick` handler is called when the button is clicked (unless disabled).
        4. Ensure tests meet or exceed the 90% coverage target for Atoms.
    - **Done‑when:**
        1. Unit tests for Button are written and passing.
        2. Code coverage for Button meets the target.
    - **Verification:**
        1. Run `yarn test` or `npm test`.
        2. Check the coverage report for Button.
    - **Depends‑on:** [T012]

## Refactor Organisms (M4 - OperationsPanel Sample)
- [ ] **T015 · refactor · P1**: break down operations panel into smaller components
    - **Context:** 3. Component Refactoring Strategy - Approach 1. Break Down Large Components, Initial Focus (`OperationsPanel`)
    - **Action:**
        1. Analyze the functionality and UI sections within `src/components/dashboard/OperationsPanel.tsx`.
        2. Identify distinct, reusable UI units (e.g., filters, action buttons, status indicators).
        3. Create new component files (potentially Atoms or Molecules) for these units in appropriate directories (e.g., `atoms`, `molecules`).
        4. Extract the corresponding JSX and minimal presentation logic into the new components.
    - **Done‑when:**
        1. New component files are created for parts extracted from `OperationsPanel`.
        2. `OperationsPanel.tsx` is simplified by removing the extracted UI/logic sections.
    - **Verification:**
        1. Review the code changes in `OperationsPanel.tsx` and the new component files.
    - **Depends‑on:** [T004, T009]
- [ ] **T016 · refactor · P1**: extract logic from operations panel into a custom hook
    - **Context:** 3. Component Refactoring Strategy - Approach 2. Separate Presentation and Logic (Logic Abstraction), Initial Focus (`OperationsPanel`)
    - **Action:**
        1. Analyze `src/components/dashboard/OperationsPanel.tsx` for data fetching, state management (`useState`, `useReducer`, Zustand), API interactions, or complex business logic.
        2. Create a new custom hook file (e.g., `src/hooks/useOperationsPanelState.ts`).
        3. Move the identified logic into the new hook.
        4. Define the hook's return value (state, derived data, callbacks) and parameters (inputs, configuration).
    - **Done‑when:**
        1. A new custom hook file is created containing the business logic previously in `OperationsPanel`.
        2. `OperationsPanel.tsx` no longer contains the extracted logic.
    - **Verification:**
        1. Review the code changes in `OperationsPanel.tsx` and the new hook file.
    - **Depends‑on:** [T015]
- [ ] **T017 · refactor · P2**: update operations panel to be a presentation component
    - **Context:** 3. Component Refactoring Strategy - Approach 2. Separate Presentation and Logic (Refactoring Pattern), Initial Focus (`OperationsPanel`)
    - **Action:**
        1. Update `src/components/dashboard/OperationsPanel.tsx` to receive all necessary data, derived state, and callbacks via props.
        2. Ensure the component primarily focuses on composing its child components (including those created in T015) and rendering based on props.
        3. Add/update TSDoc comments for the component and its new prop interface.
    - **Done‑when:**
        1. `OperationsPanel.tsx` is refactored into a pure presentation component accepting props.
        2. Component documentation is updated.
    - **Verification:**
        1. Review the `OperationsPanel.tsx` code to ensure it follows the presentation component pattern.
    - **Depends‑on:** [T015, T016, T006]
- [ ] **T018 · refactor · P2**: move operations panel component to organisms directory
    - **Context:** 7. Technical Decisions & Standards - Directory Structure
    - **Action:**
        1. Move `src/components/dashboard/OperationsPanel.tsx` to `src/components/organisms/OperationsPanel.tsx`.
        2. Update all internal imports referencing the component.
    - **Done‑when:**
        1. `OperationsPanel.tsx` is located in `src/components/organisms/`.
        2. The application builds and runs without import errors related to OperationsPanel.
    - **Verification:**
        1. Run `yarn build` or `npm run build`.
        2. Check application pages that use the OperationsPanel component.
    - **Depends‑on:** [T004, T017]
- [ ] **T019 · feature · P2**: create comprehensive storybook stories for operations panel
    - **Context:** 4. Storybook Integration - Standards & Process 4. Story Content, 5. Documentation, Initial Focus (`OperationsPanel`)
    - **Action:**
        1. Create `src/components/organisms/OperationsPanel.stories.tsx` using CSF3.
        2. Define `argTypes` for the component's props.
        3. Create stories covering key states (loading, empty, data loaded, error) by providing mocked props.
        4. Add JSDoc comments to stories.
        5. Include notes on how the component receives data via props from a hook.
    - **Done‑when:**
        1. `OperationsPanel.stories.tsx` exists and follows Storybook standards.
        2. Stories for key states are present and documented.
    - **Verification:**
        1. Run Storybook and view the OperationsPanel stories, verifying different states render correctly.
    - **Depends‑on:** [T003, T018]
- [ ] **T020 · test · P2**: write integration tests for operations panel
    - **Context:** 5. Testing Strategy - Approach & Requirements 1. Integration Tests, 2. Coverage Targets, Initial Focus (`OperationsPanel`)
    - **Action:**
        1. Write integration tests for `src/components/organisms/OperationsPanel.tsx` using Jest and React Testing Library.
        2. Mock the custom hook (`useOperationsPanelState`) to control the data and state provided to the component.
        3. Test rendering based on different mocked hook return values (loading, error, data).
        4. Test interactions within the panel and verify callbacks received via props are triggered.
        5. Ensure tests meet or exceed the 80% coverage target for Organisms.
    - **Done‑when:**
        1. Integration tests for OperationsPanel are written and passing.
        2. Code coverage for OperationsPanel meets the target.
    - **Verification:**
        1. Run `yarn test` or `npm test`.
        2. Check the coverage report for OperationsPanel.
    - **Depends‑on:** [T018, T016]

## Testing & CI Enhancements (M5)
- [ ] **T021 · chore · P1**: configure ci to enforce test coverage thresholds
    - **Context:** 5. Testing Strategy - Approach & Requirements 2. Coverage Targets (CI Enforced), 7. Technical Decisions & Standards - Configuration
    - **Action:**
        1. Configure the test runner (Jest/Vitest) to collect coverage reports.
        2. Configure the CI pipeline to check coverage reports against the defined targets (Atoms ≥ 90%, Molecules ≥ 85%, Organisms ≥ 80%).
        3. Configure the CI step to fail the build if thresholds are not met or if coverage decreases significantly on a PR.
    - **Done‑when:**
        1. CI pipeline includes a test coverage check step.
        2. The check is configured with the specified thresholds and fails the build on violation.
    - **Verification:**
        1. Ensure test coverage is below a threshold and confirm CI failure. Add tests to pass the threshold and confirm CI success.
    - **Depends‑on:** none (Assumes Jest/Vitest and tests are already running in CI from T005, this is adding the coverage check)
- [ ] **T022 · chore · P2**: integrate visual regression testing into ci pipeline
    - **Context:** 4. Storybook Integration - Standards & Process 7. Visual Testing, 5. Testing Strategy - Approach & Requirements 1. Visual Regression Tests
    - **Action:**
        1. Research and select a visual regression testing tool (e.g., Chromatic, Storybook's own VRT, Percy). Chromatic is recommended.
        2. Integrate the chosen tool with Storybook and the CI pipeline.
        3. Configure the tool to run visual tests on Storybook stories upon code changes.
    - **Done‑when:**
        1. Visual regression testing tool is integrated.
        2. CI pipeline triggers visual tests and provides feedback on visual changes in PRs.
    - **Verification:**
        1. Make a small visual change to a component with a story and open a PR. Verify the VRT tool runs and reports the change.
    - **Depends‑on:** [T003, T005]

### Clarifications & Assumptions
- [ ] **Issue:** Standard testing framework (Jest/Vitest) and E2E framework (Cypress/Playwright) not explicitly chosen in PLAN.md, though mentioned as options.
    - **Context:** 5. Testing Strategy, 7. Technical Decisions & Standards
    - **Blocking?:** no (Assumed Jest+RTL and Cypress for ticket creation, but formal decision needed).
- [ ] **Issue:** Content of `storybook-integration-notes.md` is not provided.
    - **Context:** 4. Storybook Integration - Standards & Process 2. Configuration
    - **Blocking?:** no (Assumed standard Storybook/Next.js integration patterns are sufficient for initial setup).
- [ ] **Issue:** Decision on using Zustand for global state is optional.
    - **Context:** 7. Technical Decisions & Standards - Libraries
    - **Blocking?:** no (Will create setup tickets for Zustand only if/when a clear need arises during refactoring).
```

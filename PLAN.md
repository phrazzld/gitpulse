# GitPulse: Baseline Component Integration & Story Definition Plan (Part 2 of 4)

## 1. Overview

Following the core Storybook setup (PLAN-1), this plan focuses on **populating Storybook with initial content**. The goals are to establish a recommended structure for reusable UI components, select 3-5 existing components as initial candidates, create well-documented stories for them using Component Story Format (CSF) 3, and define conventions for future story creation.

## 2. Prerequisites

*   **Node.js:** v18.17 or later.
*   **Package Manager:** npm.
*   **Project Setup:** GitPulse repository cloned locally with dependencies installed.
*   **Completion of PLAN-1:** A functional Storybook environment (`npm run storybook` works, `npm run build-storybook` works, global styles are applied).
*   **Knowledge:**
    *   Proficiency in React, TypeScript, Next.js, TailwindCSS.
    *   Understanding of Storybook concepts (Stories, Args, Controls, Addons, CSF3, `meta`, `StoryObj`).
    *   Familiarity with GitPulse project structure and existing components.

## 3. Implementation Steps

**Step 3.1: Component Auditing & Selection**

1.  **Action:** Audit existing components in `src/components/` (and subdirectories like `dashboard`, `ui`, etc.) to identify 3-5 initial candidates for Storybook.
2.  **Criteria:** Prioritize simple, reusable, presentational ("dumb") components with minimal external dependencies (e.g., avoid components heavily reliant on complex custom hooks, global state, or direct data fetching initially).
    *   *Potential Candidates:* `LoadMoreButton`, `AuthLoadingScreen`, `ModeSelector`, `DateRangePicker`, a generic `Button` or `Card` if they exist or can be easily extracted/refactored.
3.  **Rationale:** Select suitable initial components to prove the story-writing process and ensure the Storybook environment handles real components before tackling more complex ones.

**Step 3.2: Establish Component Library Structure (Optional but Recommended)**

1.  **Action:** Consider creating a dedicated directory for shared, reusable UI components if one doesn't strictly exist, e.g., `src/components/ui/` or `src/components/library/`.
2.  **Action:** If a new structure is created, move the selected candidate components (from Step 3.1) into this directory.
3.  **Action:** Refactor the selected components *if necessary* to improve isolation. Ensure they primarily receive data and callbacks via props rather than relying on external context or hooks where feasible for better testability in Storybook.
4.  **Rationale:** Promotes a clear separation between application-specific composite components and reusable UI primitives, aligning with modularity principles and making components easier to manage in Storybook.

**Step 3.3: Create Initial Component Stories**

1.  **Action:** For each selected initial component (e.g., `LoadMoreButton`), create a corresponding story file next to it using the naming convention `ComponentName.stories.tsx` (e.g., `src/components/ui/LoadMoreButton.stories.tsx`). Remove any example stories created during `storybook init` if desired.
2.  **Action:** Write stories using Component Story Format (CSF) 3.
    *   Import the component and necessary types (`Meta`, `StoryObj` from `@storybook/react`).
    *   Define the `meta` object:
        *   `title`: Define a logical path for the Storybook sidebar (e.g., `UI/Buttons/Load More Button`). Use a consistent hierarchy.
        *   `component`: The component itself.
        *   `tags: ['autodocs']`: Enable the Docs tab auto-generation.
        *   `argTypes`: Define controls and documentation for component props. Specify control types (`boolean`, `text`, `select`, `color`, `date`) and add descriptions. Use `action()` for callbacks (e.g., `onClick: { action: 'clicked' }`).
        *   `args`: Provide default prop values for all stories of this component.
    *   Export individual named stories representing different states or variations of the component (e.g., `Default`, `Loading`, `Disabled`, `NoMoreItems`). Use the `args` property within each `StoryObj` to override default args for that specific state.
    *   Add TSDoc comments to the component itself and its props (`.tsx` file) - Storybook `autodocs` will use these.
    *   Add descriptions within the story file (`meta` description, individual story descriptions) for clarity in Storybook UI.
    *   **Example (`LoadMoreButton.stories.tsx`):**
        ```typescript
        import type { Meta, StoryObj } from '@storybook/react';
        import LoadMoreButton from './LoadMoreButton'; // Adjust import path

        /**
         * A button component used for loading more items in lists or feeds.
         * It typically shows a loading state and hides when no more items are available.
         */
        const meta: Meta<typeof LoadMoreButton> = {
          title: 'UI/Buttons/Load More Button', // Example path
          component: LoadMoreButton,
          tags: ['autodocs'],
          parameters: {
            layout: 'centered', // Center component in canvas
          },
          argTypes: {
            onClick: { action: 'clicked', description: 'Callback function when clicked' },
            loading: { control: 'boolean', description: 'Displays a loading indicator' },
            hasMore: { control: 'boolean', description: 'Determines if the button is visible' },
            className: { control: 'text', description: 'Optional additional CSS classes' },
          },
          args: { // Default args for all stories below
            loading: false,
            hasMore: true,
          },
        };

        export default meta;
        type Story = StoryObj<typeof LoadMoreButton>;

        /** The default state of the button, ready to load more. */
        export const Default: Story = {};

        /** The button when actively loading more items. */
        export const Loading: Story = {
          args: {
            loading: true,
          },
        };

        /** The state when there are no more items to load (button is hidden). */
        export const NoMoreItems: Story = {
          args: {
            hasMore: false,
          },
        };
        ```
3.  **Verification:** Run `npm run storybook`. Navigate to the newly created stories. Verify:
    *   Components render correctly in the "Canvas" tab for each story state.
    *   Controls in the "Controls" addon panel modify component props interactively as expected.
    *   Actions are logged in the "Actions" panel when interacting with elements linked via `argTypes` (e.g., clicking a button).
    *   The "Docs" tab displays well-formatted documentation generated from TSDoc comments, `argTypes`, and story descriptions.
    *   Review the "Accessibility" panel for any violations and address them if possible within the component or story.
4.  **Rationale:** Populates Storybook with the first set of real project components, validates the setup, and provides concrete examples for future story development.

**Step 3.4: Define Story Writing Standards & Documentation**

1.  **Action:** Create or update a documentation file (e.g., `docs/COMPONENT_LIBRARY.md` or `docs/STORYBOOK.md`) outlining standards and guidelines.
    *   Include naming conventions for stories (`ComponentName.stories.tsx`) and story exports (PascalCase).
    *   Specify the preferred sidebar hierarchy structure (`UI/...`, `Features/...`).
    *   Mandate the use of `tags: ['autodocs']`.
    *   Require meaningful `argTypes` definitions with controls and descriptions for all relevant props.
    *   Require TSDoc comments on components and props.
    *   Recommend creating stories for key states (default, loading, error, disabled, different variants).
    *   Outline the philosophy (component isolation, prop-driven).
2.  **Action:** Update `docs/DEVELOPMENT_PHILOSOPHY.md` to briefly reference Storybook as the standard for UI component development, documentation, and testing.
3.  **Rationale:** Establishes clear expectations and consistency for how developers should interact with and contribute to the component library via Storybook.

## 4. Testing Strategy

*   **Manual Verification:** Primarily relies on using `npm run storybook` locally.
    *   Visually inspect components in the Canvas tab for each story.
    *   Interact with controls in the Controls addon panel to test prop variations.
    *   Trigger actions (e.g., clicks) and verify logging in the Actions panel.
    *   Review the generated documentation in the Docs tab for clarity and completeness.
    *   Check the Accessibility tab for violations.
*   **Code Review:** Peer review of component refactoring (if any), new `*.stories.tsx` files, and adherence to defined standards.

## 5. Documentation

*   **Component Documentation (Code-Level):**
    *   TSDoc comments in component `.tsx` files.
    *   Descriptions and `argTypes` in `*.stories.tsx` files.
*   **Project Documentation:**
    *   **Create/Update `docs/COMPONENT_LIBRARY.md` (or `docs/STORYBOOK.md`):** Outline philosophy, goals, standards, and guidelines for creating components and stories.
    *   **Update `docs/DEVELOPMENT_PHILOSOPHY.md`:** Reference Storybook's role.

## 6. Pitfalls and Considerations

*   **Component Isolation:** Refactoring components to be more isolated (less dependent on context/hooks) might be more effort than initially anticipated. Decide on a case-by-case basis whether to refactor or use Storybook decorators/mocks for dependencies.
*   **Complex Props:** Components with complex object/array props might require more detailed `argTypes` configuration or custom controls.
*   **Mocking Dependencies:** If a chosen component *does* have unavoidable dependencies (e.g., a specific context), research and implement necessary mocks using Storybook Decorators in the `*.stories.tsx` file or globally in `.storybook/preview.ts` if applicable to many components.
*   **Maintaining Stories:** Emphasize that stories need to be updated alongside component changes as part of the development workflow.

## 7. Dependency Notes

*   **Prerequisites:** **PLAN-1** (Core Setup & Configuration) must be completed.
*   **Dependents:** **PLAN-3** (CI Validation & Quality Gates) relies on having buildable stories created in this plan. **PLAN-4** (VRT) also relies on these stories.

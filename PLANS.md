Okay, here are the four focused sub-plans, split from the original `PLAN.md` based on the scope analysis results. Each plan is designed to be independently implementable, includes a complete structure, preserves original content, maintains markdown formatting, and notes dependencies.

---

**PLAN-1.md**

```markdown
# GitPulse: Storybook Core Setup & Configuration Plan (Part 1 of 4)

## 1. Overview

This plan details the **initial setup and configuration** of Storybook within the GitPulse project. The goal is to initialize Storybook, configure it for the existing Next.js/TypeScript/TailwindCSS stack, ensure it runs correctly locally with global styles applied, and verify that the base Storybook instance can be built successfully. This establishes the foundational environment for subsequent component integration and CI validation.

## 2. Prerequisites

*   **Node.js:** v18.17 or later (matching project requirements).
*   **Package Manager:** npm (as indicated by `package.json`).
*   **Project Setup:** GitPulse repository cloned locally with dependencies installed (`npm install`).
*   **Knowledge:**
    *   Proficiency in React, TypeScript, Next.js (App Router specifics if applicable), and TailwindCSS.
    *   Basic understanding of Storybook concepts (Stories, Args, Controls, Addons, CSF).
    *   Familiarity with the GitPulse project structure (`src/components`, `src/app/globals.css`).
    *   Access to project repository.

## 3. Implementation Steps

**Step 3.1: Research & Preparation (Setup Focus)**

1.  **Action:** Review official Storybook documentation for integration with the specific Next.js version used by GitPulse, TypeScript, and TailwindCSS. Pay specific attention to builder options (Vite recommended), App Router compatibility notes, Tailwind setup, and potential needs for mocking Next.js features (`next/image`, `next/router`).
    *   *Reference:* [Storybook Docs](https://storybook.js.org/docs/), [Storybook for Next.js](https://storybook.js.org/docs/get-started/nextjs)
2.  **Rationale:** Ensure awareness of best practices and potential configuration hurdles specific to the GitPulse tech stack before initialization.

**Step 3.2: Initialize Storybook**

1.  **Action:** Run the Storybook CLI initializer in the project root directory. Use the Vite builder for better performance with React.
    ```bash
    npx storybook@latest init --builder vite
    ```
2.  **Action:** Follow prompts. The command will:
    *   Detect the project type (React/Next.js/TypeScript).
    *   Install necessary Storybook dependencies (`@storybook/react-vite`, `@storybook/addon-essentials`, etc.) and add them to `devDependencies` in `package.json`.
    *   Create a `.storybook` directory with configuration files (`main.ts`, `preview.ts`).
    *   Add `storybook` and `build-storybook` scripts to `package.json`.
    *   Potentially create example stories (e.g., in `src/stories/`) - these can be reviewed and removed later if desired (in Plan 2).
3.  **Files Modified:** `package.json`, `package-lock.json`.
4.  **Files Created:** `.storybook/main.ts`, `.storybook/preview.ts`, potentially example stories.
5.  **Verification:** Run `npm run storybook`. Ensure the Storybook UI loads in the browser (usually `http://localhost:6006`) without errors, displaying any example stories.

**Step 3.3: Configure Storybook for GitPulse Stack**

1.  **Action:** Configure `.storybook/main.ts` for the project structure and required addons.
    *   **File:** `.storybook/main.ts`
    *   **Details:**
        ```typescript
        import type { StorybookConfig } from '@storybook/react-vite';

        const config: StorybookConfig = {
          stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'], // Target stories within src
          addons: [
            '@storybook/addon-links',
            '@storybook/addon-essentials', // Includes Controls, Actions, Viewport, Backgrounds etc.
            '@storybook/addon-interactions', // For interaction testing
            '@storybook/addon-a11y', // Accessibility checks
             { // Ensure Tailwind/PostCSS setup is correct for Vite
               name: '@storybook/addon-styling-webpack', // Or '@storybook/addon-styling' if Vite requires it
               options: {
                 // Configure options for Tailwind/PostCSS if needed, e.g., postcss.config.js path
               },
             },
            // Consider '@storybook/nextjs' ONLY if basic mocking in preview.ts is insufficient for initial setup
            // '@storybook/nextjs'
          ],
          framework: {
            name: '@storybook/react-vite', // Verify correct framework
            options: {},
          },
          docs: {
            autodocs: 'tag', // Enable automatic documentation generation
          },
          // Optional: Add if components reference assets in /public
          // staticDirs: ['../public'],
        };
        export default config;
        ```
2.  **Action:** Configure `.storybook/preview.ts` for global styles, basic decorators, and essential Next.js mocks.
    *   **File:** `.storybook/preview.ts`
    *   **Details:**
        ```typescript
        import type { Preview } from '@storybook/react';
        import '../src/app/globals.css'; // CRUCIAL: Import global styles including Tailwind directives

        // Optional: Basic Mock for next/image if needed by initial example stories
        // import * as NextImage from 'next/image';
        // const OriginalNextImage = NextImage.default;
        // Object.defineProperty(NextImage, 'default', {
        //   configurable: true,
        //   value: (props) => <OriginalNextImage {...props} unoptimized />,
        // });

        const preview: Preview = {
          parameters: {
            controls: {
              matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
              },
            },
            // Optional: Define background colors based on globals.css
            backgrounds: {
              default: 'dark-slate',
              values: [
                { name: 'dark-slate', value: 'var(--dark-slate)' }, // Example using CSS var
                { name: 'light', value: '#ffffff' },
              ],
            },
            // Optional: Basic router mock if needed by example stories
            // nextjs: { // Requires '@storybook/nextjs' addon if used
            //   router: {
            //     pathname: '/',
            //     asPath: '/',
            //     query: {},
            //   },
            // },
          },
          // Optional: Add global decorators IF needed for basic setup (e.g., simple ThemeProvider)
          // decorators: [
          //   (Story) => (
          //     <YourMinimalThemeProvider>
          //       <Story />
          //     </YourMinimalThemeProvider>
          //   ),
          // ],
        };

        export default preview;
        ```
3.  **Rationale:** Ensures Storybook correctly finds future stories, loads necessary addons, applies global Tailwind styling, and handles potential basic conflicts with Next.js features.
4.  **Verification:** Restart Storybook (`npm run storybook`). Verify that Tailwind styles are correctly applied to any example stories. Check browser console for errors related to styles or mocks.

**Step 3.4: Verify Storybook Build**

1.  **Action:** Run the build command locally to ensure the configuration is valid for a static build.
    ```bash
    npm run build-storybook
    ```
2.  **Action:** Verify that the command completes without errors and creates a `storybook-static` directory.
3.  **Rationale:** Confirms that the setup is fundamentally buildable, which is a prerequisite for CI integration later. This is NOT full CI integration yet.

**Step 3.5: Initial Documentation Update**

1.  **Action:** Update `README.md` with a basic section on Storybook.
    *   Include instructions on how to run it locally (`npm run storybook`).
    *   Briefly state its purpose in the project (UI component development & documentation).
2.  **Rationale:** Makes the new tooling discoverable for other developers.

## 4. Testing Strategy

*   **Manual Verification:**
    *   Run `npm run storybook` locally.
    *   Verify the Storybook UI loads without errors.
    *   Inspect any example stories to ensure Tailwind styles are applied correctly.
    *   Check browser console for errors.
*   **Build Verification:**
    *   Run `npm run build-storybook` locally.
    *   Confirm the build completes successfully.

## 5. Documentation

*   **Project Documentation:**
    *   **Update `README.md`:** Add section explaining how to run Storybook (`npm run storybook`) and its basic purpose.

## 6. Pitfalls and Considerations

*   **Next.js Feature Compatibility:** Initial setup might reveal immediate conflicts with `next/image`, `next/link`, or `useRouter` even in example stories. Basic mocking in `preview.ts` or the `@storybook/nextjs` addon might be needed. Address critical errors preventing Storybook from running/building.
*   **Styling/Tailwind Setup:** Ensuring `globals.css` and `tailwind.config.js` / `postcss.config.js` are correctly picked up by Storybook's Vite builder is critical. May require specific configuration in `main.ts` under the styling addon options.
*   **Dependency Conflicts:** `npx storybook init` might install versions that conflict subtly with existing project dependencies. Check for warnings during install and runtime.

## 7. Dependency Notes

*   **Prerequisites:** None (this is the first step in the Storybook integration process).
*   **Dependents:** **PLAN-2** (Baseline Component Integration) requires this plan to be completed successfully. This plan is also a foundational prerequisite for **PLAN-3** (CI Validation) and **PLAN-4** (VRT).
```

---

**PLAN-2.md**

```markdown
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
```

---

**PLAN-3.md**

```markdown
# GitPulse: Storybook CI Validation & Quality Gates Plan (Part 3 of 4)

## 1. Overview

Building upon the established Storybook setup (PLAN-1) and initial component stories (PLAN-2), this plan focuses on **integrating Storybook validation into the Continuous Integration (CI) pipeline**. The goals are to ensure the Storybook build remains healthy and that component and story files adhere to project quality standards (linting, type-checking) automatically as mandatory checks.

## 2. Prerequisites

*   **Node.js:** v18.17 or later.
*   **Package Manager:** npm.
*   **Project Setup:** GitPulse repository cloned locally with dependencies installed.
*   **Completion of PLAN-1:** Functional Storybook environment, including `build-storybook` script.
*   **Completion of PLAN-2:** At least a few components with corresponding `*.stories.tsx` files exist and are buildable.
*   **Existing CI Setup:** Access to and familiarity with the project's CI/CD configuration (e.g., GitHub Actions workflow files).
*   **Existing Quality Tools:** Project already uses linters (ESLint) and type checkers (TypeScript/tsc) within CI.

## 3. Implementation Steps

**Step 3.1: Integrate Storybook Build into CI**

1.  **Action:** Add a dedicated job to the main CI workflow (e.g., `.github/workflows/ci.yml`) to build Storybook on relevant triggers (e.g., push to main, pull requests).
    ```yaml
    # Example GitHub Actions Job snippet within your existing workflow
    jobs:
      # ... other jobs like lint, test, build ...

      storybook_build:
        name: Build Storybook
        runs-on: ubuntu-latest
        steps:
          - name: Checkout Code
            uses: actions/checkout@v4

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '18.x' # Use project's Node version
              cache: 'npm'

          - name: Install Dependencies
            run: npm install

          - name: Build Storybook
            run: npm run build-storybook
            # Add environment variables if the Storybook build requires them
            # env:
            #   NEXT_PUBLIC_SOME_VAR: ${{ secrets.NEXT_PUBLIC_SOME_VAR }}
            #   NODE_ENV: production # Often helpful for builds

          # Optional but recommended: Upload build artifact for inspection/debugging
          # - name: Upload Storybook Artifact
          #   uses: actions/upload-artifact@v4
          #   with:
          #     name: storybook-static
          #     path: storybook-static # Default output directory
          #     if-no-files-found: error # Fail if build output is missing
    ```
2.  **Action:** Ensure this job is configured as a required status check for Pull Requests in the repository settings (branch protection rules).
3.  **Rationale:** Automates the verification that the Storybook setup and all component stories can be successfully built in a clean environment, catching configuration errors, missing dependencies, or build-breaking changes early.
4.  **Verification:** Trigger the CI pipeline (e.g., by creating or updating a Pull Request). Confirm the `storybook_build` job runs and completes successfully. Test a failure case (e.g., introduce a syntax error in a story) to ensure the job fails as expected and blocks the PR (if configured as required).

**Step 3.2: Integrate Quality Gates for Storybook Files**

1.  **Action:** Review existing CI jobs for linting (`npm run lint`) and type-checking (`npm run typecheck`).
2.  **Action:** Ensure these jobs are configured to scan the relevant Storybook files:
    *   Story files (`*.stories.tsx`, `*.stories.mdx`, etc.).
    *   Configuration files (`.storybook/**/*.ts`).
    *   Any newly structured component directories (`src/components/ui/**/*.tsx` if applicable).
3.  **Action:** Update ESLint configuration (`.eslintrc.js` or similar) and TypeScript configuration (`tsconfig.json`) if necessary to include these paths or specific rules for Storybook. Consider using `eslint-plugin-storybook` if not added already by `storybook init` (check `package.json`).
    ```javascript
    // Example .eslintrc.js adjustment (may vary based on config structure)
    module.exports = {
      // ... other config
      overrides: [
        // ... other overrides
        {
          files: ['*.stories.@(ts|tsx|js|jsx|mjs|cjs)'],
          extends: ['plugin:storybook/recommended'], // Ensure this is present if using the plugin
          // Add specific rules for stories if needed
        },
      ],
    };
    ```
    ```json
    // Example tsconfig.json adjustment (ensure relevant paths are included)
    {
      "include": [
        "next-env.d.ts",
        "**/*.ts",
        "**/*.tsx",
        ".storybook/**/*.ts" // Ensure Storybook config is checked
        // Add src/components/ui/**/*.tsx if applicable
      ],
      "exclude": ["node_modules"]
    }
    ```
4.  **Action:** Verify these linting and type-checking jobs are also configured as mandatory status checks for Pull Requests.
5.  **Rationale:** Maintains code quality and consistency within the Storybook configuration, component stories, and related UI components, preventing errors and enforcing project standards automatically.
6.  **Verification:** Trigger CI jobs. Ensure linting and type-checking pass. Introduce a deliberate lint or type error in a story file or component file covered by the configurations and verify the respective CI job fails and blocks the PR.

**Step 3.3: Update Documentation on Testing Strategy**

1.  **Action:** Update the project's testing documentation (potentially in `docs/TESTING.md` or the `docs/COMPONENT_LIBRARY.md` created in Plan 2) to reflect the new automated checks.
2.  **Details:** Clearly state that the Storybook build, linting, and type-checking are now part of the automated CI validation process for relevant files.
3.  **Rationale:** Keeps documentation aligned with the actual testing and quality assurance processes.

## 4. Testing Strategy

*   **Automated CI Checks:**
    *   The primary testing method for this plan is observing the CI pipeline execution on Pull Requests or pushes.
    *   Verify that the `storybook_build` job passes on valid code and fails when the build is broken.
    *   Verify that the `lint` and `typecheck` jobs pass on valid code and fail when quality issues are introduced in components or stories.
    *   Confirm that failures in these jobs correctly block PR merging (if configured as required checks).
*   **Manual Triggering:** Manually trigger CI runs or push test branches/PRs with intentional errors to confirm the workflow logic and failure reporting.

## 5. Documentation

*   **Project Documentation:**
    *   Update testing documentation (`docs/TESTING.md` or `docs/COMPONENT_LIBRARY.md`) to include the new CI checks related to Storybook.
*   **Code Comments:** Add comments in the CI workflow file explaining the purpose of the new Storybook-related jobs.

## 6. Pitfalls and Considerations

*   **CI Performance:** The `storybook_build` job can add significant time to the CI run. Monitor execution time. Consider optimizations like dependency caching (usually handled by `actions/setup-node` cache option).
*   **Environment Variables:** If components or stories rely on environment variables (`process.env.NEXT_PUBLIC_*`), ensure these are properly provided to the `build-storybook` command in the CI environment (e.g., using GitHub Secrets and the `env` key in the workflow step).
*   **Configuration Scope:** Ensure linting/typing configurations correctly target *all* relevant files without being overly broad or missing new directories/file types.

## 7. Dependency Notes

*   **Prerequisites:** **PLAN-1** (Core Setup & Configuration) and **PLAN-2** (Baseline Component Integration) must be completed.
*   **Dependents:** **PLAN-4** (Visual Regression Testing) will likely integrate into or run alongside the CI jobs established here.
```

---

**PLAN-4.md**

```markdown
# GitPulse: Visual Regression Testing Implementation Plan (Part 4 of 4 - Future Step)

## 1. Overview

This plan outlines the steps to implement **automated Visual Regression Testing (VRT)** for the GitPulse component library using Storybook. Building on the established Storybook setup, component stories, and CI validation (PLAN-1, PLAN-2, PLAN-3), the goal is to integrate a VRT tool to automatically capture screenshots of stories and detect unintended visual
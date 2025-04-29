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

# Todo

## Storybook Core Setup & Configuration
- [x] **T001 · Chore · P2: document storybook integration plan for nextjs/ts/tailwind**
    - **Context:** PLAN.md - Step 3.1: Research & Preparation
    - **Action:**
        1. Review official Storybook docs for Next.js (specific version if known), TypeScript, TailwindCSS, and Vite builder integration.
        2. Document key findings, potential config hurdles (e.g., styling addon, Next.js mocks), and decisions (e.g., confirming Vite builder) in a concise markdown file (e.g., `docs/storybook-integration-notes.md`).
    - **Done‑when:**
        1. Key integration points and potential issues for the GitPulse stack are documented.
    - **Verification:**
        1. Review the document for clarity and coverage of topics mentioned in PLAN.md Step 3.1.
    - **Depends‑on:** none

- [x] **T002 · Feature · P1: initialize storybook with vite builder**
    - **Context:** PLAN.md - Step 3.2: Initialize Storybook
    - **Action:**
        1. Run `npx storybook@latest init --builder vite` in the project root.
        2. Commit the generated `.storybook` directory and updates to `package.json`, `package-lock.json`.
    - **Done‑when:**
        1. `storybook init` command completes successfully.
        2. `.storybook/main.ts` and `.storybook/preview.ts` are created.
        3. Storybook dependencies are added to `devDependencies`.
        4. `storybook` and `build-storybook` scripts are added to `package.json`.
    - **Verification:**
        1. Run `npm run storybook`.
        2. Verify the Storybook UI loads at `http://localhost:6006` (or assigned port) without initial errors (example stories might have issues addressed later).
    - **Depends‑on:** T001

- [x] **T003 · Feature · P1: configure `.storybook/main.ts` for project structure and addons**
    - **Context:** PLAN.md - Step 3.3, Action 1
    - **Action:**
        1. Update `.storybook/main.ts` `stories` glob pattern to `['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)']`.
        2. Ensure essential addons (`@storybook/addon-links`, `@storybook/addon-essentials`, `@storybook/addon-interactions`, `@storybook/addon-a11y`) are listed.
        3. Add and configure the appropriate styling addon for Tailwind/PostCSS with Vite (confirm name/options - see Clarification #1). Set `docs: { autodocs: 'tag' }`.
    - **Done‑when:**
        1. `.storybook/main.ts` is updated with correct story paths, addons, framework, and docs settings.
        2. Storybook starts without errors related to `main.ts` configuration.
    - **Verification:**
        1. Run `npm run storybook` and check terminal/browser console for config errors.
    - **Depends‑on:** [T002]

- [x] **T004 · Feature · P1: configure `.storybook/preview.ts` for global styles and parameters**
    - **Context:** PLAN.md - Step 3.3, Action 2
    - **Action:**
        1. Import `../src/app/globals.css` in `.storybook/preview.ts`.
        2. Configure `preview.parameters.controls` and `preview.parameters.backgrounds` as suggested in the plan (adjust values based on actual `globals.css`).
    - **Done‑when:**
        1. `globals.css` is imported in `preview.ts`.
        2. Basic parameters (controls, backgrounds) are configured.
        3. Storybook restarts (`npm run storybook`) and applies global Tailwind styles to example stories.
    - **Verification:**
        1. Run `npm run storybook`.
        2. Inspect example stories (e.g., Button) to confirm Tailwind styles (colors, fonts, spacing) are applied correctly.
        3. Check browser console for errors related to style loading.
    - **Depends‑on:** [T002]

- [x] **T005 · Bugfix · P1: add basic next.js mocks to `preview.ts` if needed**
    - **Context:** PLAN.md - Step 3.3, Action 2; Pitfall 1
    - **Action:**
        1. If example stories fail to render correctly during T004 verification due to `next/image` or `next/router`, implement basic mocks in `.storybook/preview.ts` as shown in the plan.
        2. Start with the `next/image` unoptimized mock; add router mock only if necessary.
        3. *Avoid* adding `@storybook/nextjs` unless basic mocks prove insufficient for initial setup.
    - **Done‑when:**
        1. Necessary minimal mocks for `next/image` and/or `next/router` are added to `preview.ts`.
        2. `npm run storybook` runs without errors related to these Next.js features in the default/example stories.
    - **Verification:**
        1. Run `npm run storybook`.
        2. Verify example stories that previously failed due to Next.js features now render correctly.
        3. Check browser console for related errors.
    - **Depends‑on:** [T004]

- [x] **T006 · Test · P1: verify storybook static build completes successfully**
    - **Context:** PLAN.md - Step 3.4: Verify Storybook Build
    - **Action:**
        1. Run `npm run build-storybook` in the project root.
    - **Done‑when:**
        1. The `build-storybook` command completes without errors.
        2. A `storybook-static` directory is created.
    - **Depends‑on:** [T003, T004, T005] # Depends on all config and potential fixes being in place

- [x] **T007 · Chore · P2: update readme.md with storybook usage instructions**
    - **Context:** PLAN.md - Step 3.5: Initial Documentation Update; Section 5
    - **Action:**
        1. Add a new section to `README.md` explaining Storybook's purpose in the project (UI component dev & docs).
        2. Include the command `npm run storybook` to run it locally.
    - **Done‑when:**
        1. `README.md` contains a clear section on Storybook with purpose and run command.
    - **Verification:**
        1. Review the updated `README.md` file for accuracy and clarity.
    - **Depends‑on:** [T002] # Requires init to confirm script name

---

### Clarifications & Assumptions
- [x] **Issue:** Confirm the exact Storybook styling addon name/config needed for Vite + TailwindCSS/PostCSS (`@storybook/addon-styling` vs `@storybook/addon-styling-webpack` or other options).
    - **Context:** PLAN.md - Step 3.3, Action 1; Pitfall 2
    - **Blocking?:** no # Resolved: Using the Next.js framework provided by initialization which inherently supports TailwindCSS.
- [ ] **Issue:** Confirm if project components commonly reference assets directly from the `/public` directory.
    - **Context:** PLAN.md - Step 3.3, Action 1 (comment on `staticDirs`)
    - **Blocking?:** no # Can be added later to T003 if needed, doesn't block initial setup.
- [ ] **Issue:** Confirm if a minimal global ThemeProvider or similar decorator is absolutely necessary for *any* component styling/functionality during initial setup.
    - **Context:** PLAN.md - Step 3.3, Action 2 (comment on `decorators`)
    - **Blocking?:** no # Can be added later, assume not needed for base setup per plan.
- [ ] **Issue:** Define the exact Next.js version used by GitPulse.
    - **Context:** PLAN.md - Step 3.1
    - **Blocking?:** no # Affects specificity of research (T001) and potential mocks (T005), but defaults can be used initially.
- [ ] **Issue:** Establish procedure if `npm run storybook` or `npm run build-storybook` fails due to dependency conflicts after `init`.
    - **Context:** PLAN.md - Pitfall 3
    - **Blocking?:** no # Assumption is to investigate and resolve conflicts as part of T002 or T006 verification.
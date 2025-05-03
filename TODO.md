# TODO

## Setup & Configuration
- [x] **T001 · chore · P2**: create initial component audit document
    - **Context:** 2. Component Audit & Classification - Process 4. Documentation
    - **Action:**
        1. Create `docs/COMPONENT_AUDIT.md`.
        2. Add the table structure as defined in the plan.
    - **Done‑when:**
        1. `docs/COMPONENT_AUDIT.md` exists with the specified table structure.
    - **Verification:** none
    - **Depends‑on:** none
- [x] **T002 · chore · P1**: configure storybook with vite builder and essential addons
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
- [x] **T003 · chore · P1**: configure storybook for next.js mocks and global styles
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
- [x] **T004 · chore · P2**: create atomic design directory structure
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
- [x] **T005 · chore · P1**: configure ci pipeline for linting, types, and storybook build checks
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
- [x] **T006 · chore · P2**: document presentation/logic separation pattern
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
- [x] **T007 · chore · P1**: inventory all existing components
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
- [x] **T009 · chore · P1**: analyze and classify dashboard components
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
- [x] **T010 · chore · P2**: analyze and classify remaining components
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
- [x] **T011 · refactor · P2**: refactor button component for atomic design and storybook standards
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
- [x] **T012 · refactor · P2**: move button component to atoms directory
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
- [x] **T013 · feature · P2**: create comprehensive storybook stories for button component
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
- [x] **T014 · test · P2**: write unit tests for button component
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
- [x] **T015 · refactor · P1**: break down operations panel into smaller components
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
- [x] **T016 · refactor · P1**: extract logic from operations panel into a custom hook
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
- [x] **T017 · refactor · P2**: update operations panel to be a presentation component
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
- [x] **T018 · refactor · P2**: move operations panel component to organisms directory
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
- [x] **T019 · feature · P2**: create comprehensive storybook stories for operations panel
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
- [x] **T020 · test · P2**: write integration tests for operations panel
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
- [x] **T021 · chore · P1**: configure ci to enforce test coverage thresholds
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
- [x] **T022 · chore · P2**: integrate visual regression testing into ci pipeline
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

- [x] **T023 · chore · P1**: configure chromatic project token
    - **Context:** 4. Storybook Integration - Standards & Process 7. Visual Testing, CI Configuration
    - **Action:**
        1. Create a Chromatic account and project at chromatic.com/start.
        2. Obtain project token from the Chromatic dashboard.
        3. Add token as CHROMATIC_PROJECT_TOKEN in GitHub repository secrets.
        4. Update chromatic.yml workflow to use the token correctly.
    - **Done‑when:**
        1. Chromatic workflow successfully runs in CI without token errors.
        2. Visual regression tests provide feedback on PRs.
    - **Verification:**
        1. Open a PR with a visual change and confirm Chromatic runs and reports the change.
    - **Depends‑on:** [T022]

- [x] **T024 · fix · P1**: update github actions to v4
    - **Context:** CI/CD, Best Practices, Maintenance
    - **Action:**
        1. Update actions/upload-artifact from v3 to v4 in ci.yml workflow.
        2. Update actions/cache from v3 to v4 if present.
        3. Review and update any other outdated GitHub Actions to latest versions.
    - **Done‑when:**
        1. All GitHub Actions references use v4 where available.
        2. build-and-test job succeeds without errors about missing actions.
    - **Verification:**
        1. Run CI workflows and confirm they complete without errors related to actions.
    - **Depends‑on:** none

- [x] **T025 · fix · P1**: fix storybook a11y testing workflow
    - **Context:** 4. Storybook Integration - Standards & Process 6. Accessibility (A11y), CI Configuration
    - **Action:**
        1. Remove `npm install -g @storybook/cli` step from storybook-a11y.yml workflow.
        2. Replace with `npx` usage for running storybook tests.
        3. Update the command to: `npx storybook test --url=file:///path/to/storybook-static`.
    - **Done‑when:**
        1. Storybook a11y workflow runs without errors about missing CLI.
        2. Accessibility tests run correctly against built Storybook.
    - **Verification:**
        1. Run the workflow and verify a11y tests execute successfully.
    - **Depends‑on:** none

- [x] **T026 · fix · P2**: implement e2e test authentication for ci
    - **Context:** 5. Testing Strategy - E2E Tests, CI Configuration
    - **Action:**
        1. Create a mock authentication strategy for Playwright tests in CI.
        2. Update e2e tests to use mock auth when running in CI environment.
        3. Add conditional test execution for tests requiring authenticated state.
        4. Add necessary environment variables to e2e-tests.yml workflow.
    - **Done‑when:**
        1. E2E tests run successfully in CI without authentication errors.
        2. Dashboard tests either run with mock auth or are conditionally skipped in CI.
    - **Verification:**
        1. Run E2E tests in CI and confirm they pass.
    - **Depends‑on:** none
    <!-- Needs reimplementation via T027-T038 -->

- [x] **T027 · feature · P1**: Define Mock Auth Strategy: Cookie, API, Environment Gating
    - **Context:** Establish a clear plan for the cookie-based mock authentication. Define the cookie structure, how it will be generated via a test-only API endpoint, and the mechanism to ensure this is strictly limited to test environments, aligning with security and configuration management principles.
    - **Action:**
        1. Define the exact structure of the mock authentication cookie (name, content like mock user ID/roles, attributes: `HttpOnly`, `Secure` (conditional), `SameSite=Lax`, `Path=/`).
        2. Specify the API endpoint for generating this cookie (e.g., `POST /api/test-auth/login`), including request/response format (e.g., request optional user details, response `Set-Cookie` header and success status).
        3. Define the environment gating mechanism (e.g., require `process.env.NODE_ENV === 'test'` AND/OR `process.env.E2E_MOCK_AUTH_ENABLED === 'true'`).
        4. Document these decisions clearly (e.g., in this task description or a temporary design note).
    - **Done‑when:**
        1. Mock cookie structure and attributes are documented.
        2. Mock auth API endpoint specification (path, method, payload, response) is documented.
        3. Environment gating mechanism is defined and documented.
    - **Verification:**
        1. Review the documented strategy for clarity, completeness, and security implications (especially environment gating).
    - **Depends‑on:** []

- [x] **T028 · feature · P1**: Implement Backend Mock Authentication API Endpoint
    - **Context:** Create the server-side API endpoint responsible for issuing the mock authentication cookie based on the strategy defined in T027. This endpoint must be securely gated for test environments only.
    - **Action:**
        1. Create the API route handler (e.g., `pages/api/test-auth/login.ts`).
        2. Implement the strict environment check at the start of the handler; return 403/404 if conditions aren't met.
        3. Implement logic to generate the mock cookie payload (potentially using a simple structure, or signing if mimicking production closely).
        4. Set the cookie in the response headers using the defined attributes from T027.
        5. Return a success status (e.g., 200 OK).
        6. Add unit tests for this API handler, verifying environment gating, correct cookie setting, and response status.
    - **Done‑when:**
        1. The mock authentication API endpoint is implemented and functional.
        2. The endpoint is correctly gated by the defined environment check.
        3. The endpoint sets the cookie with the specified attributes.
        4. Unit tests cover the endpoint's core logic and security checks.
    - **Verification:**
        1. Run unit tests (`npm test`).
        2. Manually test the endpoint (e.g., using `curl`) in a local server running with the test environment enabled. Verify the `Set-Cookie` header.
        3. Manually test the endpoint in a non-test environment and verify it returns an error/is inaccessible.
    - **Depends‑on:** [T027]

- [x] **T029 · feature · P1**: Implement Playwright Global Setup for Mock Authentication
    - **Context:** To efficiently authenticate all Playwright tests without repeating logic, implement a `globalSetup` script that uses the mock API endpoint (T028) to log in and save the authenticated state (cookies) to a file (`storageState`).
    - **Action:**
        1. Create a `globalSetup.ts` file (e.g., in `e2e/config/globalSetup.ts`).
        2. In this script, use Playwright's `request.newContext()` to make a `POST` request to the mock auth API endpoint (`/api/test-auth/login`).
        3. Verify the API response indicates success.
        4. Extract the necessary cookie details *if needed* (often, the `storageState` captures this automatically if the request context is reused or properly configured).
        5. Save the authenticated browser state (including cookies set by the API response) using `browser.newContext().storageState({ path: 'storageState.json' })`. *Alternatively, make the API request within the context you intend to save.*
        6. Ensure the `globalSetup` script correctly uses the `baseURL` configured in `playwright.config.ts`.
        7. Add error handling for API call failures during setup.
    - **Done‑when:**
        1. `globalSetup.ts` script successfully calls the mock auth API.
        2. The script saves an authenticated state (including the mock cookie) to `storageState.json`.
        3. The script handles potential errors during the API call.
    - **Verification:**
        1. Run the `globalSetup` script directly via Playwright CLI (if possible) or by running a minimal test suite configured to use it.
        2. Verify that `storageState.json` is created and contains the expected cookie information.
    - **Depends‑on:** [T028]

- [ ] **T030 · chore · P1**: Configure Playwright to Use Saved Authentication State
    - **Context:** Configure the main Playwright test projects to use the `storageState.json` file generated by the `globalSetup` script (T029), ensuring tests start in an authenticated state.
    - **Action:**
        1. Modify `playwright.config.ts`.
        2. Define the `globalSetup` path pointing to the script created in T029.
        3. In the `use` configuration for the main test project(s) (e.g., 'chromium'), specify `storageState: 'storageState.json'`.
    - **Done‑when:**
        1. `playwright.config.ts` correctly references the `globalSetup` script.
        2. `playwright.config.ts` configures test projects to load `storageState.json`.
    - **Verification:**
        1. Run a single E2E test that targets an authenticated page (without any UI login steps). Verify it loads successfully without redirecting to login, indicating the state was loaded.
    - **Depends‑on:** [T029]

- [ ] **T031 · refactor · P1**: Refactor E2E Tests to Remove UI Login and Rely on `storageState`
    - **Context:** With `globalSetup` and `storageState` handling authentication (T029, T030), remove redundant and slow UI login steps from all E2E tests.
    - **Action:**
        1. Review all existing E2E test files (`*.spec.ts`).
        2. Remove code blocks related to navigating to login pages, filling forms, and submitting credentials.
        3. Ensure tests now assume an authenticated state from the start and directly navigate to the relevant authenticated pages/features.
        4. Adjust assertions as needed based on the authenticated starting state.
    - **Done‑when:**
        1. All relevant E2E tests have UI/manual login steps removed.
        2. Tests are updated to correctly assume an authenticated state provided by `storageState`.
    - **Verification:**
        1. Review code changes in E2E test files.
        2. Run the affected tests locally to ensure they pass using the loaded `storageState`.
    - **Depends‑on:** [T030]

- [ ] **T032 · test · P1**: Verify Full E2E Suite Locally with Mock Auth Across Browsers
    - **Context:** Thoroughly validate the entire mock authentication flow locally across all supported browsers before integrating into CI.
    - **Action:**
        1. Ensure the local development server can be run with the necessary test environment configuration (from T027) to activate the mock auth endpoint.
        2. Configure Playwright to run tests against all required browsers (e.g., Chromium, Firefox, WebKit).
        3. Execute the *entire* E2E test suite locally (`npm run test:e2e` or equivalent).
        4. Analyze results, ensuring all tests pass consistently across all browsers using the `storageState` authentication.
        5. Debug and fix any failures or inconsistencies.
    - **Done‑when:**
        1. The full E2E test suite passes locally using the `storageState` mock authentication.
        2. Tests pass reliably across all configured browsers.
    - **Verification:**
        1. Successful execution output of the full E2E test suite locally for all browsers.
    - **Depends‑on:** [T031]

- [ ] **T033 · chore · P1**: Configure CI Workflow for E2E Tests with Mock Auth Environment
    - **Context:** Update the CI pipeline to correctly set up the environment for mock authentication, start the application server in test mode, and run the Playwright E2E tests.
    - **Action:**
        1. Edit the relevant CI workflow file (e.g., `.github/workflows/e2e.yml`).
        2. Add steps to install dependencies and build the application if necessary.
        3. Add a step to start the application server *within the CI job*, ensuring the test environment variables (e.g., `NODE_ENV=test`, `E2E_MOCK_AUTH_ENABLED=true`) are set correctly for this process. Use `&` to background the server process if needed.
        4. Add a wait mechanism or health check to ensure the server is ready before tests start.
        5. Add the step to run the Playwright tests (`npx playwright test`), ensuring it targets the correct `baseURL` of the server running in the CI job.
        6. Ensure Playwright browsers are installed in CI.
    - **Done‑when:**
        1. CI workflow includes steps to start the app server with correct test environment variables.
        2. CI workflow includes a step to run Playwright tests against the running server.
        3. Necessary dependencies and browsers are handled in CI.
    - **Verification:**
        1. Review the CI workflow file changes.
        2. Trigger a CI run on a test branch and observe the logs to ensure steps execute in order and the server starts with the correct environment flags.
    - **Depends‑on:** [T032]

- [ ] **T034 · test · P1**: Verify E2E Tests Pass Reliably in CI with Mock Authentication
    - **Context:** Confirm that the entire setup works correctly and reliably within the CI environment.
    - **Action:**
        1. Ensure all preceding task changes are committed and pushed to a branch.
        2. Create a Pull Request to trigger the CI pipeline configured in T033.
        3. Monitor the CI build execution, paying close attention to the E2E test step.
        4. Verify that the E2E test suite runs and passes successfully across all configured browsers in CI.
        5. Analyze and fix any CI-specific failures (e.g., timing issues, environment variable problems, server not ready). Re-run until stable.
    - **Done‑when:**
        1. The CI pipeline completes successfully for the branch/PR.
        2. All E2E tests pass across all configured browsers in the CI environment using the mock authentication.
    - **Verification:**
        1. Green CI check status for the E2E test job on the PR/branch. Review CI logs for confirmation.
    - **Depends‑on:** [T033]

- [ ] **T035 · test · P2**: Add Dedicated E2E Test for Mock Authentication Flow
    - **Context:** Include a specific E2E test that explicitly verifies the mock authentication mechanism itself is working as expected, beyond just relying on it implicitly in other tests.
    - **Action:**
        1. Create a new E2E test file (e.g., `e2e/auth.spec.ts`).
        2. Write a test case that:
            - Assumes the `storageState` is loaded (like other tests).
            - Navigates to a known protected route.
            - Asserts that the page loads correctly (e.g., checks for user-specific elements).
            - Optionally, attempts to navigate to the login page and asserts it redirects *away* (confirming authenticated state).
            - Optionally, clears cookies and asserts navigation to a protected route now fails/redirects to login.
    - **Done‑when:**
        1. A dedicated E2E test file exists verifying the core mock auth flow.
        2. The test passes locally and in CI.
    - **Verification:**
        1. Run the specific test file locally (`npx playwright test e2e/auth.spec.ts`).
        2. Confirm the test passes as part of the full suite in CI (T034).
    - **Depends‑on:** [T031, T034] # Depends on refactored tests and working CI

- [ ] **T036 · chore · P2**: Document Mock Authentication Strategy and Usage
    - **Context:** Ensure the new mock authentication system is clearly documented for maintainability and team understanding, following the documentation philosophy.
    - **Action:**
        1. Create or update a relevant documentation file (e.g., `TESTING.md`, `docs/e2e-testing.md`, or section in `README.md`).
        2. Describe the purpose and high-level approach of the cookie-based mock authentication.
        3. Explain the role of the mock API endpoint, `globalSetup.ts`, and `storageState.json`.
        4. Detail the necessary environment variables (`NODE_ENV`, `E2E_MOCK_AUTH_ENABLED`).
        5. Provide instructions on how to run tests locally that rely on this mechanism.
        6. Add troubleshooting tips for common issues (e.g., state file not found, API endpoint not enabled).
    - **Done‑when:**
        1. Documentation accurately describes the mock auth system, its components, configuration, and usage.
        2. Documentation is reviewed and merged.
    - **Verification:**
        1. Review the documentation for clarity, accuracy, and completeness.
        2. Ask a team member unfamiliar with the implementation to follow the docs.
    - **Depends‑on:** [T034] # Best documented after verified in CI

- [ ] **T037 · chore · P3**: Security Review and Hardening for Mock Auth
    - **Context:** Perform a final review focused on the security aspects of the mock authentication implementation, ensuring it doesn't introduce vulnerabilities.
    - **Action:**
        1. Review the environment gating logic (T028) to ensure it cannot be bypassed in production.
        2. Confirm no sensitive information (like potential mock secrets if used) is hardcoded or logged in CI (T033).
        3. Verify the mock cookie attributes (`HttpOnly`, `Secure`, `SameSite`) are set appropriately (T028).
        4. Ensure the mock endpoint itself doesn't expose unintended application internals.
    - **Done‑when:**
        1. Security aspects of the implementation have been reviewed.
        2. Any identified potential issues have been addressed.
    - **Verification:**
        1. Code review focused specifically on the security actions listed.
        2. Confirmation that CI logs are clean of sensitive data.
    - **Depends‑on:** [T034]

- [ ] **T038 · chore · P3**: Final Cleanup and Mark T026 Complete
    - **Context:** Remove any remaining old code, temporary files, or test artifacts related to previous E2E authentication methods and formally close the original parent task T026.
    - **Action:**
        1. Perform a final search for any obsolete E2E authentication code or configuration missed in T031.
        2. Delete any temporary design notes or test files created during development if not needed.
        3. Locate task T026 in `TODO.md`.
        4. Ensure T026 is marked as complete (`- [x]`).
        5. Add a comment to T026 referencing the implementing tasks (e.g., `<!-- Completed via T027-T038 -->`).
    - **Done‑when:**
        1. Codebase is clean of old E2E auth artifacts.
        2. Task T026 is marked as complete in `TODO.md` with a reference note.
    - **Verification:**
        1. Review `TODO.md` to confirm T026 status and comment.
        2. Perform a code search for remnants of old auth logic.
    - **Depends‑on:** [T037, T036, T035] # Depends on all implementation, testing, docs, and security review being done.

### Clarifications & Assumptions
- [x] **Issue:** Standard testing framework (Jest/Vitest) and E2E framework (Cypress/Playwright) not explicitly chosen in PLAN.md, though mentioned as options.
    - **Context:** 5. Testing Strategy, 7. Technical Decisions & Standards
    - **Blocking?:** no (Formally decided on Jest+RTL for unit/integration tests and Playwright for E2E tests).
- [x] **Issue:** Content of `storybook-integration-notes.md` is not provided.
    - **Context:** 4. Storybook Integration - Standards & Process 2. Configuration
    - **Blocking?:** no (Standard Storybook/Next.js integration patterns have been implemented and are functioning as expected).
- [x] **Issue:** Decision on using Zustand for global state is optional.
    - **Context:** 7. Technical Decisions & Standards - Libraries
    - **Blocking?:** no (Decision made to defer Zustand implementation until a clear need arises during refactoring).
```

# TODO

## API Route Removal

- [x] **T001:** Create feature branch `mvp-individual-focus`

  - **Action:** Create and switch to a new git branch named `mvp-individual-focus` from the main development branch.
  - **Depends On:** None
  - **AC Ref:** Plan Phase 1, Step 1

- [x] **T002:** Delete team-activity API route directory

  - **Action:** Remove the `src/app/api/team-activity/` directory and all its contents. This removes the API endpoint for fetching team activity data.
  - **Depends On:** [T001]
  - **AC Ref:** Plan Phase 1, Step 2

- [x] **T003:** Delete my-org-activity API route directory

  - **Action:** Remove the `src/app/api/my-org-activity/` directory and all its contents. This removes the API endpoint for fetching organization activity data.
  - **Depends On:** [T001]
  - **AC Ref:** Plan Phase 1, Step 2

- [x] **T004:** Delete contributors API route directory

  - **Action:** Remove the `src/app/api/contributors/` directory and all its contents. This removes the API endpoint for fetching contributor data.
  - **Depends On:** [T001]
  - **AC Ref:** Plan Phase 1, Step 2

- [x] **T005:** Remove API tests for deleted endpoints
  - **Action:** Delete `src/__tests__/api/additional-routes.test.ts` if it exists and only tests the deleted endpoints. If it contains tests for other APIs, refactor it to remove only tests for deleted endpoints. Delete any other test files specifically for the deleted API routes.
  - **Depends On:** [T002, T003, T004]
  - **AC Ref:** Plan Phase 1, Step 3

## UI Component Removal

- [x] **T006:** Delete ModeSelector UI component

  - **Action:** Remove the `src/components/ModeSelector.tsx` component. This component is used for switching between individual and team views.
  - **Depends On:** [T001]
  - **AC Ref:** Plan Phase 2, Step 4

- [x] **T007:** Delete OrganizationPicker UI component

  - **Action:** Remove the `src/components/OrganizationPicker.tsx` component. This component is used for selecting organizations.
  - **Depends On:** [T001]
  - **AC Ref:** Plan Phase 2, Step 4

- [ ] **T008:** Delete contributor selection/display UI components

  - **Action:** Remove any UI components specifically for contributor selection or display. Identify these components by searching for files related to "contributor" or "team member" selection/display in the `src/components/` directory.
  - **Depends On:** [T001]
  - **AC Ref:** Plan Phase 2, Step 4

- [ ] **T009:** Refactor dashboard page: Remove organization features

  - **Action:** In `src/app/dashboard/page.tsx`:
    - Remove the `AccountManagementPanel` component if it is only used for GitHub App/org selection
    - Hardcode the `activityMode` to `'my-activity'`
    - Remove state variables and event handlers related to organization or team selection
  - **Depends On:** [T006, T007, T008]
  - **AC Ref:** Plan Phase 2, Step 5

- [ ] **T010:** Refactor FilterControls component

  - **Action:** In `src/components/dashboard/FilterControls.tsx`:
    - Remove organization filter controls
    - Remove any team member filter controls
    - Ensure it only supports filters relevant to individual activity
  - **Depends On:** [T007, T008]
  - **AC Ref:** Plan Phase 2, Step 5

- [ ] **T011:** Refactor SummaryDisplay component
  - **Action:** In `src/components/dashboard/SummaryDisplay.tsx`, remove any conditional rendering logic that displays team or organization-specific data. Ensure it correctly displays summaries based only on individual activity data.
  - **Depends On:** [T009]
  - **AC Ref:** Plan Phase 2, Step 5

## Backend Logic Refactoring

- [ ] **T012:** Refactor GitHub data fetching

  - **Action:** In `src/lib/githubData.ts`:
    - Remove functions solely for organization or team activity (e.g., `fetchOrgActivity`, `fetchTeamActivity`)
    - Simplify remaining functions by removing conditional logic for team/org modes
    - Ensure functions are focused on fetching the individual user's activity
    - Preserve any data fetching logic that's used by both individual and team/org contexts
  - **Depends On:** [T005, T009, T010, T011]
  - **AC Ref:** Plan Phase 3, Step 6

- [ ] **T013:** Preserve authentication in githubAuth.ts

  - **Action:** In `src/lib/auth/githubAuth.ts`:
    - Maintain both OAuth and GitHub App authentication mechanisms
    - Keep `createAppAuth`, `getAllAppInstallations`, and `checkAppInstallation` functions
    - Maintain the current `createAuthenticatedOctokit` function which handles both authentication types
    - Review and ensure all authentication-related functionality works for individual user focus
  - **Depends On:** [T001]
  - **AC Ref:** Plan Phase 3, Step 7

- [ ] **T014:** Verify NextAuth configuration
  - **Action:** In `src/app/api/auth/[...nextauth]/route.ts`:
    - Verify both GitHub App and OAuth configurations are maintained
    - Ensure `installationId` handling in JWT and session callbacks is preserved
    - Confirm existing `ExtendedToken` and `ExtendedSession` types are maintained
  - **Depends On:** [T013]
  - **AC Ref:** Plan Phase 3, Step 8

## Type and Helper Cleanup

- [ ] **T015:** Update API and GitHub types

  - **Action:** Review and update types in `src/types/api.ts` and `src/types/github.ts`:
    - Modify types specific to organizations and teams where needed
    - Preserve types related to GitHub App authentication
    - Ensure remaining types reflect the individual-only focus
  - **Depends On:** [T012]
  - **AC Ref:** Plan Phase 4, Step 9

- [ ] **T016:** Update summary types

  - **Action:** Review and update types in `src/types/summary.ts`:
    - Modify types specific to organizations and teams
    - Ensure remaining types reflect the individual-only focus
  - **Depends On:** [T012]
  - **AC Ref:** Plan Phase 4, Step 9

- [ ] **T017:** Clean up utility functions

  - **Action:** Review other files in `src/lib/` (excluding auth/ and githubData.ts):
    - Remove any helper functions or utilities used solely for team/org features
    - Check for unused imports across the codebase
  - **Depends On:** [T012]
  - **AC Ref:** Plan Phase 4, Step 10

- [ ] **T018:** Verify GitHub App environment variables
  - **Action:** Check `.env.local.example` and ensure environment variables related to GitHub App (`GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY_PKCS8`, `NEXT_PUBLIC_GITHUB_APP_NAME`) are preserved.
  - **Depends On:** [T001]
  - **AC Ref:** Plan Phase 4, Step 10

## Documentation Updates

- [ ] **T019:** Update README.md

  - **Action:** Edit `README.md`:
    - Remove mentions of team/org features but retain GitHub App authentication sections
    - Update feature list to reflect the individual-only MVP
    - Ensure setup instructions are still accurate
  - **Depends On:** [T012, T013, T014]
  - **AC Ref:** Plan Phase 5, Step 11

- [ ] **T020:** Update Authentication Flow diagram

  - **Action:** Locate and update the Authentication Flow diagram in `README.md` (lines 215-256):
    - Focus the diagram on individual user flow
    - Maintain both OAuth and GitHub App authentication paths
    - Remove or adjust steps related to team/org selection
  - **Depends On:** [T019]
  - **AC Ref:** Plan Phase 5, Step 11

- [ ] **T021:** Update BACKLOG.md
  - **Action:** Mark the "Strip this application down to the barebones MVP requirements" task as complete in `BACKLOG.md`.
  - **Depends On:** [T027]
  - **AC Ref:** Plan Phase 5, Step 11

## Testing and Finalization

- [ ] **T022:** Update integration tests

  - **Action:** Review and update integration tests to reflect the simplified application flow:
    - Focus on individual user scenarios
    - Remove tests for team/org features
    - Ensure high test coverage for remaining functionality
  - **Depends On:** [T015, T016, T017]
  - **AC Ref:** Plan Phase 6, Step 12

- [ ] **T023:** Run tests

  - **Action:** Run all tests using `npm run test` and ensure they pass.
  - **Depends On:** [T022]
  - **AC Ref:** Plan Phase 6, Step 12

- [ ] **T024:** Run type checking

  - **Action:** Run type checking using `npm run typecheck`. Fix any reported issues.
  - **Depends On:** [T015, T016]
  - **AC Ref:** Plan Phase 6, Step 13

- [ ] **T025:** Run linting

  - **Action:** Run linting using `npm run lint`. Fix any reported issues.
  - **Depends On:** [T017]
  - **AC Ref:** Plan Phase 6, Step 13

- [ ] **T026:** Perform manual testing

  - **Action:** Manually test the complete application flow:
    - Sign in (using both OAuth and GitHub App if possible)
    - View individual activity
    - Generate summary
    - Verify UI is clean and no remnants of removed features exist
  - **Depends On:** [T023, T024, T025]
  - **AC Ref:** Plan Phase 6, Step 13

- [ ] **T027:** Create pull request
  - **Action:** Create a pull request from the `mvp-individual-focus` branch to the main branch. Include a clear description of the changes, referencing the MVP focus and completed tasks.
  - **Depends On:** [T020, T026]
  - **AC Ref:** Plan Phase 6, Step 14

## [!] CLARIFICATIONS NEEDED / ASSUMPTIONS

- [ ] **Assumption:** The `AccountManagementPanel` component is primarily for GitHub App/organization selection

  - **Context:** Plan Phase 2, Step 5: "Remove `AccountManagementPanel` component if it's only for GitHub App/org selection"

- [ ] **Assumption:** The Authentication Flow diagram in README.md is editable, likely a Mermaid diagram

  - **Context:** Plan Phase 5, Step 11: "Update the Authentication Flow diagram"

- [ ] **Assumption:** Features related to AI analysis (Gemini) should be preserved as they can work for individual activity
  - **Context:** Plan doesn't explicitly mention AI features, but they're part of the core functionality

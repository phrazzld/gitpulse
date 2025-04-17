# T009: Refactor dashboard page: Remove organization features

## Task ID and Title
**T009:** Refactor dashboard page: Remove organization features

## Assessment
This is a simple task that involves removing organization features from the dashboard page. The key actions are:

1. Remove the `AccountManagementPanel` component, which is confirmed to be only used for GitHub App/organization selection
2. The `activityMode` is already hardcoded to `'my-activity'` as noted in line 108 of dashboard/page.tsx
3. Remove state variables and event handlers related to organization or team selection

## Implementation Approach

1. Remove the import and usage of `AccountManagementPanel` from dashboard/page.tsx
2. Verify that `activityMode` is properly hardcoded (already done)
3. Remove or simplify the state variables and handlers related to org/team selection:
   - Remove or simplify `installations` state and related handlers
   - Remove or simplify `currentInstallations` state and related handlers
   - Remove the `switchInstallations` function that's used for org selection
4. Clean up any conditional rendering blocks that depend on these removed features
5. Run type checking and linting to verify changes
6. Update task status in TODO.md

## Dependencies
This tasks depends on T006, T007, and T008, which have already been completed.
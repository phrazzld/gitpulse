```markdown
# TODO

## Setup
- [ ] **Task Title:** Create Dashboard Component Directory
  - **Action:** Create the directory `src/components/dashboard/`. This directory will house the new components extracted from `DashboardPage`.
  - **Depends On:** None
  - **AC Ref:** Plan Section 2.1

## Component Extraction: DashboardHeader
- [ ] **Task Title:** Create `DashboardHeader` Component File and Basic Structure
  - **Action:** Create the file `src/components/dashboard/DashboardHeader.tsx`. Set up a basic React functional component structure within it.
  - **Depends On:** Create Dashboard Component Directory
  - **AC Ref:** Plan Section 2.2
- [ ] **Task Title:** Extract JSX and Styling for `DashboardHeader`
  - **Action:** Cut the JSX representing the header section (app name, terminal indicator, user info, sign-out button) from `src/app/dashboard/page.tsx` and paste it into `DashboardHeader.tsx`. Ensure any associated styles/classes are moved with the JSX.
  - **Depends On:** Create `DashboardHeader` Component File and Basic Structure
  - **AC Ref:** Plan Section 3
- [ ] **Task Title:** Define Props for `DashboardHeader`
  - **Action:** Identify necessary data (e.g., session) and functions (e.g., signOut) needed from the parent. Define a strict `Props` interface in `DashboardHeader.tsx`. Update the component signature and replace direct state/function access with props.
  - **Depends On:** Extract JSX and Styling for `DashboardHeader`
  - **AC Ref:** Plan Section 4

## Component Extraction: ActionButton
- [ ] **Task Title:** Create `ActionButton` Component File and Basic Structure
  - **Action:** Create the file `src/components/dashboard/ActionButton.tsx`. Set up a basic React functional component structure.
  - **Depends On:** Create Dashboard Component Directory
  - **AC Ref:** Plan Section 2.2
- [ ] **Task Title:** Extract JSX and Styling for `ActionButton`
  - **Action:** Cut the JSX for the "Analyze Commits" button, including its loading state logic, from `src/app/dashboard/page.tsx` and paste it into `ActionButton.tsx`. Ensure styles/classes are moved.
  - **Depends On:** Create `ActionButton` Component File and Basic Structure
  - **AC Ref:** Plan Section 3
- [ ] **Task Title:** Define Props for `ActionButton`
  - **Action:** Identify necessary data (e.g., loading state) and functions (e.g., form submission handler) needed from the parent. Define a strict `Props` interface in `ActionButton.tsx`. Update the component signature and replace direct state/function access with props.
  - **Depends On:** Extract JSX and Styling for `ActionButton`
  - **AC Ref:** Plan Section 4

## Component Extraction: AuthenticationStatusBanner
- [ ] **Task Title:** Create `AuthenticationStatusBanner` Component File and Basic Structure
  - **Action:** Create the file `src/components/dashboard/AuthenticationStatusBanner.tsx`. Set up a basic React functional component structure.
  - **Depends On:** Create Dashboard Component Directory
  - **AC Ref:** Plan Section 2.2
- [ ] **Task Title:** Extract JSX and Styling for `AuthenticationStatusBanner`
  - **Action:** Cut the JSX for the banners displaying auth status (OAuth/App), errors, and related actions (Install App, Sign Out, Manage Installation) from `src/app/dashboard/page.tsx` and paste it into `AuthenticationStatusBanner.tsx`. Ensure styles/classes are moved.
  - **Depends On:** Create `AuthenticationStatusBanner` Component File and Basic Structure
  - **AC Ref:** Plan Section 3
- [ ] **Task Title:** Define Props for `AuthenticationStatusBanner`
  - **Action:** Identify necessary data (e.g., error state, authMethod, needsInstallation) and functions (e.g., getGitHubAppInstallUrl, handleAuthError, signOut) needed from the parent. Define a strict `Props` interface in `AuthenticationStatusBanner.tsx`. Update the component signature and replace direct state/function access with props.
  - **Depends On:** Extract JSX and Styling for `AuthenticationStatusBanner`
  - **AC Ref:** Plan Section 4

## Component Extraction: AccountManagementPanel
- [ ] **Task Title:** Create `AccountManagementPanel` Component File and Basic Structure
  - **Action:** Create the file `src/components/dashboard/AccountManagementPanel.tsx`. Set up a basic React functional component structure.
  - **Depends On:** Create Dashboard Component Directory
  - **AC Ref:** Plan Section 2.2
- [ ] **Task Title:** Extract JSX and Styling for `AccountManagementPanel`
  - **Action:** Cut the JSX for the section handling GitHub App account selection (AccountSelector) and management links from `src/app/dashboard/page.tsx` and paste it into `AccountManagementPanel.tsx`. Ensure styles/classes are moved.
  - **Depends On:** Create `AccountManagementPanel` Component File and Basic Structure
  - **AC Ref:** Plan Section 3
- [ ] **Task Title:** Define Props for `AccountManagementPanel`
  - **Action:** Identify necessary data (e.g., authMethod, installations, currentInstallations, loading, session) and functions (e.g., getGitHubAppInstallUrl, getInstallationManagementUrl, switchInstallations) needed from the parent. Define a strict `Props` interface in `AccountManagementPanel.tsx`. Update the component signature and replace direct state/function access with props.
  - **Depends On:** Extract JSX and Styling for `AccountManagementPanel`
  - **AC Ref:** Plan Section 4

## Component Extraction: FilterControls
- [ ] **Task Title:** Create `FilterControls` Component File and Basic Structure
  - **Action:** Create the file `src/components/dashboard/FilterControls.tsx`. Set up a basic React functional component structure.
  - **Depends On:** Create Dashboard Component Directory
  - **AC Ref:** Plan Section 2.2
- [ ] **Task Title:** Extract JSX and Styling for `FilterControls`
  - **Action:** Cut the JSX for the main control area (ModeSelector, DateRangePicker, OrganizationPicker, analysis parameters display) from `src/app/dashboard/page.tsx` and paste it into `FilterControls.tsx`. Ensure styles/classes are moved.
  - **Depends On:** Create `FilterControls` Component File and Basic Structure
  - **AC Ref:** Plan Section 3
- [ ] **Task Title:** Define Props for `FilterControls`
  - **Action:** Identify necessary data (e.g., activityMode, dateRange, activeFilters, installations, loading, session) and functions (e.g., handleModeChange, handleDateRangeChange, handleOrganizationChange) needed from the parent. Define a strict `Props` interface in `FilterControls.tsx`. Update the component signature and replace direct state/function access with props.
  - **Depends On:** Extract JSX and Styling for `FilterControls`
  - **AC Ref:** Plan Section 4

## Component Extraction: RepositoryInfoPanel
- [ ] **Task Title:** Create `RepositoryInfoPanel` Component File and Basic Structure
  - **Action:** Create the file `src/components/dashboard/RepositoryInfoPanel.tsx`. Set up a basic React functional component structure.
  - **Depends On:** Create Dashboard Component Directory
  - **AC Ref:** Plan Section 2.2
- [ ] **Task Title:** Extract JSX and Styling for `RepositoryInfoPanel`
  - **Action:** Cut the JSX for the section displaying repository information (list/summary, toggle button, loading state) from `src/app/dashboard/page.tsx` and paste it into `RepositoryInfoPanel.tsx`. Ensure styles/classes are moved.
  - **Depends On:** Create `RepositoryInfoPanel` Component File and Basic Structure
  - **AC Ref:** Plan Section 3
- [ ] **Task Title:** Define Props for `RepositoryInfoPanel`
  - **Action:** Identify necessary data (e.g., repositories, showRepoList, loading, activeFilters) and functions (e.g., setShowRepoList) needed from the parent. Define a strict `Props` interface in `RepositoryInfoPanel.tsx`. Update the component signature and replace direct state/function access with props.
  - **Depends On:** Extract JSX and Styling for `RepositoryInfoPanel`
  - **AC Ref:** Plan Section 4

## Component Extraction: SummaryDisplay
- [ ] **Task Title:** Create `SummaryDisplay` Component File and Basic Structure
  - **Action:** Create the file `src/components/dashboard/SummaryDisplay.tsx`. Set up a basic React functional component structure.
  - **Depends On:** Create Dashboard Component Directory
  - **AC Ref:** Plan Section 2.2
- [ ] **Task Title:** Extract JSX and Styling for `SummaryDisplay`
  - **Action:** Cut the JSX for the results display area (ActivityFeed, stats, AI summary sections) from `src/app/dashboard/page.tsx` and paste it into `SummaryDisplay.tsx`. Ensure styles/classes are moved.
  - **Depends On:** Create `SummaryDisplay` Component File and Basic Structure
  - **AC Ref:** Plan Section 3
- [ ] **Task Title:** Define Props for `SummaryDisplay`
  - **Action:** Identify necessary data (e.g., summary object containing commits, stats, aiSummary; activityMode, dateRange, activeFilters, installationIds) and functions (e.g., createActivityFetcher) needed from the parent. Define a strict `Props` interface in `SummaryDisplay.tsx`. Update the component signature and replace direct state/function access with props.
  - **Depends On:** Extract JSX and Styling for `SummaryDisplay`
  - **AC Ref:** Plan Section 4

## Parent Component Refactoring
- [ ] **Task Title:** Refactor `DashboardPage` to Use New Components
  - **Action:** Import `DashboardHeader`, `AuthenticationStatusBanner`, `AccountManagementPanel`, `FilterControls`, `RepositoryInfoPanel`, `ActionButton`, and `SummaryDisplay` into `src/app/dashboard/page.tsx`. Replace the original JSX blocks with instances of these new components. Pass all required state variables and functions as props to the respective components. Verify functionality remains identical to the original page.
  - **Depends On:** Define Props for `DashboardHeader`, Define Props for `ActionButton`, Define Props for `AuthenticationStatusBanner`, Define Props for `AccountManagementPanel`, Define Props for `FilterControls`, Define Props for `RepositoryInfoPanel`, Define Props for `SummaryDisplay`
  - **AC Ref:** Plan Section 5

## Testing
- [ ] **Task Title:** Write Unit Tests for `DashboardHeader`
  - **Action:** Create and implement unit tests for `DashboardHeader.tsx` using React Testing Library. Test rendering based on props (session presence/absence) and interaction (sign-out button click).
  - **Depends On:** Define Props for `DashboardHeader`
  - **AC Ref:** Plan Section 6 (Unit Tests)
- [ ] **Task Title:** Write Unit Tests for `ActionButton`
  - **Action:** Create and implement unit tests for `ActionButton.tsx`. Test rendering based on props (loading state, disabled state) and interaction (button click).
  - **Depends On:** Define Props for `ActionButton`
  - **AC Ref:** Plan Section 6 (Unit Tests)
- [ ] **Task Title:** Write Unit Tests for `AuthenticationStatusBanner`
  - **Action:** Create and implement unit tests for `AuthenticationStatusBanner.tsx`. Test rendering based on props (error, authMethod, needsInstallation) and interactions (Install App, Sign Out links/buttons).
  - **Depends On:** Define Props for `AuthenticationStatusBanner`
  - **AC Ref:** Plan Section 6 (Unit Tests)
- [ ] **Task Title:** Write Unit Tests for `AccountManagementPanel`
  - **Action:** Create and implement unit tests for `AccountManagementPanel.tsx`. Test rendering based on props (authMethod, installations presence) and interactions (AccountSelector changes, management links).
  - **Depends On:** Define Props for `AccountManagementPanel`
  - **AC Ref:** Plan Section 6 (Unit Tests)
- [ ] **Task Title:** Write Unit Tests for `FilterControls`
  - **Action:** Create and implement unit tests for `FilterControls.tsx`. Test rendering based on props and interactions within ModeSelector, DateRangePicker, OrganizationPicker.
  - **Depends On:** Define Props for `FilterControls`
  - **AC Ref:** Plan Section 6 (Unit Tests)
- [ ] **Task Title:** Write Unit Tests for `RepositoryInfoPanel`
  - **Action:** Create and implement unit tests for `RepositoryInfoPanel.tsx`. Test rendering based on props (repositories, showRepoList, loading) and interaction (toggle button).
  - **Depends On:** Define Props for `RepositoryInfoPanel`
  - **AC Ref:** Plan Section 6 (Unit Tests)
- [ ] **Task Title:** Write Unit Tests for `SummaryDisplay`
  - **Action:** Create and implement unit tests for `SummaryDisplay.tsx`. Test rendering based on props (summary object presence/absence, content of stats/AI summary) and interactions within ActivityFeed.
  - **Depends On:** Define Props for `SummaryDisplay`
  - **AC Ref:** Plan Section 6 (Unit Tests)
- [ ] **Task Title:** Write Integration Tests for `DashboardPage`
  - **Action:** Create and implement integration tests for `DashboardPage`. Verify correct rendering of all child components and proper prop passing. Test that interactions within child components correctly update the parent state (where applicable, though state logic is mostly deferred).
  - **Depends On:** Refactor `DashboardPage` to Use New Components, Write Unit Tests for `DashboardHeader`, Write Unit Tests for `ActionButton`, Write Unit Tests for `AuthenticationStatusBanner`, Write Unit Tests for `AccountManagementPanel`, Write Unit Tests for `FilterControls`, Write Unit Tests for `RepositoryInfoPanel`, Write Unit Tests for `SummaryDisplay`
  - **AC Ref:** Plan Section 6 (Integration Tests)
- [ ] **Task Title:** Perform Manual Testing
  - **Action:** Manually test the entire `DashboardPage` after refactoring. Verify UI matches the original, all interactions work as expected, loading states appear correctly, and error states are handled gracefully.
  - **Depends On:** Write Integration Tests for `DashboardPage`
  - **AC Ref:** Plan Section 6 (Manual Testing)

## [!] CLARIFICATIONS NEEDED / ASSUMPTIONS
- [ ] **Issue/Assumption:** Assumed Plan Section 6 (Testing Strategy) serves as the primary Acceptance Criteria for testing-related tasks.
  - **Context:** PLAN.md Section 6.
- [ ] **Issue/Assumption:** Assumed Plan Sections 3, 4, and 5 serve as the primary Acceptance Criteria for component extraction and parent refactoring tasks.
  - **Context:** PLAN.md Sections 3, 4, 5.
- [ ] **Issue/Assumption:** Assumed "associated inline styles or CSS classes" means moving styles tightly coupled within the extracted JSX block, not requiring a separate CSS module refactor at this stage.
  - **Context:** PLAN.md Section 3.4.
- [ ] **Issue/Assumption:** The plan defers state management refactoring. This means the `DashboardPage` will still hold significant state and pass many props down (prop drilling), which is accepted per Plan Section 7.4.
  - **Context:** PLAN.md Scope, Section 7.4.
```
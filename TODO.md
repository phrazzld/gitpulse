# TODO

## Create New Component Files
- [x] **Create Dashboard Component Directory:** Create the directory structure for dashboard components
  - **Action:** Create the directory `src/components/dashboard/` to house all the new components to be extracted from DashboardPage.
  - **Depends On:** None
  - **AC Ref:** 2.1

- [x] **Create Basic Component Files:** Create the initial files for all dashboard components
  - **Action:** Create the following component files with basic React functional component structure:
    - `DashboardHeader.tsx`
    - `AuthenticationStatusBanner.tsx`
    - `AccountManagementPanel.tsx`
    - `FilterControls.tsx`
    - `RepositoryInfoPanel.tsx`
    - `ActionButton.tsx`
    - `SummaryDisplay.tsx`
  - **Depends On:** Create Dashboard Component Directory
  - **AC Ref:** 2.2

## Extract DashboardHeader Component
- [x] **Extract JSX for DashboardHeader:** Extract header section from dashboard page
  - **Action:** Identify and cut the header section JSX (containing app name, terminal indicator, user info, sign-out button) from `src/app/dashboard/page.tsx`, and paste it into the `DashboardHeader.tsx` file, ensuring all styles are included.
  - **Depends On:** Create Basic Component Files
  - **AC Ref:** 3.1, 3.2, 3.3

- [x] **Define Props for DashboardHeader:** Create props interface for the header component
  - **Action:** Identify state variables and functions needed by DashboardHeader (e.g., session), define a Props interface, update the component's function signature, and replace direct state access with props.
  - **Depends On:** Extract JSX for DashboardHeader
  - **AC Ref:** 4.1, 4.2, 4.3, 4.4

## Extract AuthenticationStatusBanner Component
- [x] **Extract JSX for AuthenticationStatusBanner:** Extract authentication banners from dashboard page
  - **Action:** Identify and cut the JSX for the authentication status banners (error message, auth method, installation needed warnings) from `src/app/dashboard/page.tsx`, and paste it into `AuthenticationStatusBanner.tsx`, ensuring all styles are included.
  - **Depends On:** Create Basic Component Files
  - **AC Ref:** 3.1, 3.2, 3.3

- [x] **Define Props for AuthenticationStatusBanner:** Create props interface for the auth banner
  - **Action:** Identify state variables and functions needed (error, authMethod, needsInstallation, getGitHubAppInstallUrl, handleAuthError, signOut), define a Props interface, update the component's function signature, and replace direct state access with props.
  - **Depends On:** Extract JSX for AuthenticationStatusBanner
  - **AC Ref:** 4.1, 4.2, 4.3, 4.4

## Extract AccountManagementPanel Component
- [x] **Extract JSX for AccountManagementPanel:** Extract account management section from dashboard page
  - **Action:** Identify and cut the JSX for the GitHub App account selection and management section from `src/app/dashboard/page.tsx`, and paste it into `AccountManagementPanel.tsx`, ensuring all styles are included.
  - **Depends On:** Create Basic Component Files
  - **AC Ref:** 3.1, 3.2, 3.3

- [x] **Define Props for AccountManagementPanel:** Create props interface for the account panel
  - **Action:** Identify state variables and functions needed (authMethod, installations, currentInstallations, loading, getGitHubAppInstallUrl, getInstallationManagementUrl, switchInstallations, session), define a Props interface, update the component's function signature, and replace direct state access with props.
  - **Depends On:** Extract JSX for AccountManagementPanel
  - **AC Ref:** 4.1, 4.2, 4.3, 4.4

## Extract FilterControls Component
- [x] **Extract JSX for FilterControls:** Extract filter controls section from dashboard page
  - **Action:** Identify and cut the JSX for the filter controls (ModeSelector, DateRangePicker, OrganizationPicker, parameters display) from `src/app/dashboard/page.tsx`, and paste it into `FilterControls.tsx`, ensuring all styles are included.
  - **Depends On:** Create Basic Component Files
  - **AC Ref:** 3.1, 3.2, 3.3

- [x] **Define Props for FilterControls:** Create props interface for the filter controls
  - **Action:** Identify state variables and functions needed (activityMode, dateRange, activeFilters, installations, loading, handleModeChange, handleDateRangeChange, handleOrganizationChange, session), define a Props interface, update the component's function signature, and replace direct state access with props.
  - **Depends On:** Extract JSX for FilterControls
  - **AC Ref:** 4.1, 4.2, 4.3, 4.4

## Extract RepositoryInfoPanel Component
- [x] **Extract JSX for RepositoryInfoPanel:** Extract repository info section from dashboard page
  - **Action:** Identify and cut the JSX for the repository information panel (list/summary, toggle button) from `src/app/dashboard/page.tsx`, and paste it into `RepositoryInfoPanel.tsx`, ensuring all styles are included.
  - **Depends On:** Create Basic Component Files
  - **AC Ref:** 3.1, 3.2, 3.3

- [x] **Define Props for RepositoryInfoPanel:** Create props interface for the repo panel
  - **Action:** Identify state variables and functions needed (repositories, showRepoList, loading, activeFilters, setShowRepoList), define a Props interface, update the component's function signature, and replace direct state access with props.
  - **Depends On:** Extract JSX for RepositoryInfoPanel
  - **AC Ref:** 4.1, 4.2, 4.3, 4.4

## Extract ActionButton Component
- [x] **Extract JSX for ActionButton:** Extract analyze button from dashboard page
  - **Action:** Identify and cut the JSX for the "Analyze Commits" button including loading state handling from `src/app/dashboard/page.tsx`, and paste it into `ActionButton.tsx`, ensuring all styles are included.
  - **Depends On:** Create Basic Component Files
  - **AC Ref:** 3.1, 3.2, 3.3

- [x] **Define Props for ActionButton:** Create props interface for the action button
  - **Action:** Identify state variables and functions needed (loading, form submission handler), define a Props interface, update the component's function signature, and replace direct state access with props.
  - **Depends On:** Extract JSX for ActionButton
  - **AC Ref:** 4.1, 4.2, 4.3, 4.4

## Extract SummaryDisplay Component
- [x] **Extract JSX for SummaryDisplay:** Extract results section from dashboard page
  - **Action:** Identify and cut the JSX for the results display area (ActivityFeed, stats, AI summary sections) from `src/app/dashboard/page.tsx`, and paste it into `SummaryDisplay.tsx`, ensuring all styles are included.
  - **Depends On:** Create Basic Component Files
  - **AC Ref:** 3.1, 3.2, 3.3

- [x] **Define Props for SummaryDisplay:** Create props interface for the results display
  - **Action:** Identify state variables and functions needed (summary, activityMode, dateRange, activeFilters, installationIds, createActivityFetcher), define a Props interface, update the component's function signature, and replace direct state access with props.
  - **Depends On:** Extract JSX for SummaryDisplay
  - **AC Ref:** 4.1, 4.2, 4.3, 4.4

## Refactor Dashboard Page
- [x] **Refactor DashboardPage to Use New Components:** Update parent component to use extracted components
  - **Action:** Import all new components into `src/app/dashboard/page.tsx`, replace the original JSX blocks with instances of these components, and pass all required state variables and functions as props to each component.
  - **Depends On:** Define Props for DashboardHeader, Define Props for AuthenticationStatusBanner, Define Props for AccountManagementPanel, Define Props for FilterControls, Define Props for RepositoryInfoPanel, Define Props for ActionButton, Define Props for SummaryDisplay
  - **AC Ref:** 5.1, 5.2, 5.3, 5.4

## Component Testing
- [x] **Set Up Testing Infrastructure:** Initialize Jest and React Testing Library
  - **Action:** Install Jest, React Testing Library, and jest-dom. Create jest.config.js, jest.setup.js, and update package.json with test scripts.
  - **Depends On:** Refactor DashboardPage to Use New Components
  - **AC Ref:** 6.1

- [x] **Create Testing Utilities:** Set up common test helpers and mock data
  - **Action:** Create test-utils.js with renderWithProviders helper and mock data factories for session, repositories, and summary data.
  - **Depends On:** Set Up Testing Infrastructure
  - **AC Ref:** 6.1

- [x] **Test ActionButton Component:** Create tests for ActionButton
  - **Action:** Create tests verifying proper rendering in normal/loading states, disabled state when loading, and correct visual styling.
  - **Depends On:** Create Testing Utilities
  - **AC Ref:** 6.1

- [x] **Test DashboardHeader Component:** Create tests for DashboardHeader
  - **Action:** Create tests verifying proper rendering with/without session, signOut function is called on disconnect, and user info display.
  - **Depends On:** Create Testing Utilities
  - **AC Ref:** 6.1

- [x] **Test AuthenticationStatusBanner Component:** Create tests for AuthenticationStatusBanner
  - **Action:** Create tests verifying error message display, auth method banner rendering, signOut function calls, and installation URL button behavior.
  - **Depends On:** Create Testing Utilities
  - **AC Ref:** 6.1

- [x] **Test RepositoryInfoPanel Component:** Create tests for RepositoryInfoPanel
  - **Action:** Create tests verifying repository list rendering, show/hide toggle functionality, and filtering based on active filters.
  - **Depends On:** Create Testing Utilities
  - **AC Ref:** 6.1

- [x] **Test FilterControls Component:** Create tests for FilterControls
  - **Action:** Create tests verifying rendering with different activity modes, handler functions called with correct parameters, and proper UI display.
  - **Depends On:** Create Testing Utilities
  - **AC Ref:** 6.1

- [x] **Test AccountManagementPanel Component:** Create tests for AccountManagementPanel
  - **Action:** Create tests verifying conditional rendering based on auth method, account list display, and switchInstallations function called correctly.
  - **Depends On:** Create Testing Utilities
  - **AC Ref:** 6.1

- [x] **Test SummaryDisplay Component:** Create tests for SummaryDisplay
  - **Action:** Create tests verifying conditional rendering based on summary presence, activity feed/stats/AI summary sections display, and props passed correctly.
  - **Depends On:** Create Testing Utilities
  - **AC Ref:** 6.1

## Testing
- [x] **Test Individual Components:** Write unit tests for all extracted components
  - **Action:** Create unit tests for each component using React Testing Library, testing proper rendering based on different prop values, correct function calls when interactive elements are clicked, and proper state changes in response to user interactions.
  - **Depends On:** Refactor DashboardPage to Use New Components
  - **AC Ref:** 6.1

- [x] **Test Dashboard Integration:** Test component integration in Dashboard page
  - **Action:** Create integration tests that verify the Dashboard page correctly renders all child components, passes the correct props to them, and that interactions with child components correctly affect the parent state.
  - **Depends On:** Test Individual Components
  - **AC Ref:** 6.2

- [ ] **Perform Manual Testing:** Manually test the complete UI
  - **Action:** Manually verify that all UI elements render as before, all interactions work correctly, and test all error states and loading indicators to ensure they display appropriately.
  - **Depends On:** Test Dashboard Integration
  - **AC Ref:** 6.3

## [!] CLARIFICATIONS NEEDED / ASSUMPTIONS
- [ ] **Issue/Assumption:** Assumed that testing is not a critical path item for UI refactoring
  - **Context:** While testing is important, the plan implies that testing happens after successful component extraction and refactoring. For expediency, the refactoring could be completed and manually verified, with formal tests added afterward.

- [ ] **Issue/Assumption:** No import types for Installation defined in codebase
  - **Context:** The plan requires using Installation types in component props, but there doesn't appear to be a formal type definition. May need to create these types or import from an appropriate location.

- [ ] **Issue/Assumption:** Temporary prop drilling is acceptable
  - **Context:** The plan explicitly states that "increased prop drilling" is expected and accepted as a temporary issue that will be addressed in a future hook extraction task (Plan Section 7.4).
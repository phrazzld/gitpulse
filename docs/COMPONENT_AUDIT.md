# Component Audit

This document catalogs all components in the GitPulse application, their current location, proposed atomic design classification, dependencies, and additional notes. It serves as a guide for the refactoring process to implement atomic design principles.

## Purpose

The component audit helps:
1. Inventory all existing components
2. Classify components according to atomic design principles
3. Plan migration to the new directory structure
4. Identify dependencies and relationships between components
5. Document any special considerations for component refactoring

## Table Structure

| Component Path | Component Name | Current Location | Proposed Atomic Level | Dependencies | Notes |
|---------------|----------------|------------------|------------------------|--------------|-------|
| src/components/ui/AuthLoadingCard.tsx | AuthLoadingCard | ui | Molecule | StatusDisplay | Presentation component for auth loading UI that composes other UI elements. Relies on StatusDisplay component and uses CSS variables for theming. |
| src/components/ui/AuthLoadingScreen.tsx | AuthLoadingScreen | ui | Organism | AuthLoadingCard, CSS | Full-screen authentication loading screen that composes the AuthLoadingCard. Uses CSS for styling and animation. Provides comprehensive props for customization. |
| src/components/ui/LoadMoreButton.tsx | LoadMoreButton | ui | Atom | None | Simple UI button with loading state for pagination. Fully controlled via props with no internal state management. Uses CSS variables for theming. |
| src/components/ui/ModeSelector.tsx | ModeSelector | ui | Molecule | React (useId) | Radio button group for selecting activity modes. Has complex internal keyboard navigation logic, uses React's useId hook, and provides comprehensive props for customization. |
| src/components/ui/StatusDisplay.tsx | StatusDisplay | ui | Atom | None | Simple UI component for displaying loading status with animated elements. Controlled entirely through props with no internal state. |
| src/components/dashboard/AnalysisParameters.tsx | AnalysisParameters | dashboard | Molecule | Dashboard types | Displays analysis parameters in a styled card, showing mode, date range, and organizations. Pure presentation component with no internal state. |
| src/components/dashboard/Header.tsx | Header | dashboard | Organism | next/image, next-auth/react | Dashboard header with branding, user info and sign out button. Contains internal logic for handling sign out. |
| src/components/dashboard/OperationsPanel.tsx | OperationsPanel | dashboard | Organism | ModeSelector, OrganizationPicker, dashboard utils, github auth | Complex panel containing filters, controls, and auth status. Contains multiple sections and conditional rendering logic. Acts as a container for multiple smaller components. Primary focus for refactoring. |
| src/components/dashboard/RepositorySection.tsx | RepositorySection | dashboard | Organism | React (useState), Dashboard types | Section displaying repository information with interactive collapsible list. Contains internal state for toggle functionality and logic for grouping repositories. |
| src/components/dashboard/SummaryDetails.tsx | SummaryDetails | dashboard | Organism | React, Dashboard types | Displays detailed AI-generated analysis with multiple sections (key themes, technical areas, accomplishments, etc.). Pure presentation component with complex layout. |
| src/components/dashboard/SummaryStats.tsx | SummaryStats | dashboard | Molecule | React, Dashboard types | Displays commit activity statistics in a styled grid. Simple presentation component for metrics display. |
| src/components/dashboard/SummaryView.tsx | SummaryView | dashboard | Template | ActivityFeed, SummaryStats, SummaryDetails, dashboard utils/types | High-level container that composes multiple organisms to form a complete dashboard view. Contains logic for fetching activity data and rendering different sections. |
| src/components/dashboard/activityFeed/components/CommitItem.tsx | CommitItem | dashboard/activityFeed/components | Molecule | React (memo), next/image, ActivityFeed types | Displays a single commit item with styling and formatting. Uses React.memo for performance optimization. Pure presentation component. |
| src/components/AccountSelector.tsx | AccountSelector | components | Molecule | React (useState, useEffect), next/image | Dropdown selector component for GitHub accounts. Includes filtering, search functionality, and multi-select capabilities. Contains internal state management. |
| src/components/ActivityFeed.tsx | ActivityFeed | components | Organism | useProgressiveLoading, FixedSizeList, IntersectionObserver, LoadMoreButton, CommitItem | Complex feed component that displays paginated commit history with virtualized scrolling. Uses custom hooks for data loading. Handles various states (loading, error, empty). |
| src/components/AuthError.tsx | AuthError | components | Molecule | React (useState, useEffect), next-auth/react (signOut) | Error display component for authentication failures. Includes countdown timer for auto-sign-out and action buttons. |
| src/components/AuthValidator.tsx | AuthValidator | components | Organism | React (useState, useEffect), next-auth/react, GitHub token validation | Authentication validation wrapper that checks GitHub token validity. Redirects to sign-in when token is expired. Includes a custom hook for on-demand validation. |
| src/components/DashboardLoadingState.tsx | DashboardLoadingState | components | Molecule | None | Loading skeleton UI for the dashboard with animated placeholders. Pure presentation component with no internal state. |
| src/components/DateRangePicker.tsx | DateRangePicker | components | Molecule | React (useState, useCallback, useMemo, useEffect), useDebounceCallback | Date range selection component with preset options and custom date inputs. Contains debounced state management for performance optimization. |
| src/components/FilterPanel.tsx | FilterPanel | components | Organism | React (useState, useEffect, useCallback), next/image, AccountSelector | Complex filter panel with collapsible sections for contributor, organization, and grouping filters. Contains internal state management and API calls to fetch contributors. |
| src/components/GroupedResultsView.tsx | GroupedResultsView | components | Organism | React, next/image | Displays analysis results grouped by different criteria (contributor, repository, etc.). Includes collapsible sections and AI analysis summaries. |
| src/components/IntersectionObserver.tsx | IntersectionObserver | components | Atom | React (useRef, useEffect) | Utility component that detects when elements enter the viewport. Wrapper around browser's IntersectionObserver API. No visual elements, purely functional. |
| src/components/OrganizationPicker.tsx | OrganizationPicker | components | Molecule | React (useState, useEffect, useCallback, useRef), next/image, useDebounceCallback | Organization selection component with search, filtering, and multi-select capabilities. Contains internal state management and debounced updates. |

## Atomic Design Levels

For reference, when completing the audit, components should be classified according to the following levels:

1. **Atoms**: Basic building blocks of matter. Applied to web interfaces, atoms are our HTML tags, such as form labels, inputs, buttons, etc.

2. **Molecules**: Groups of atoms bonded together and the fundamental unit of a compound. These are simple UI components like a form label, input, and button combined to create a form element.

3. **Organisms**: Groups of molecules joined together to form a relatively complex, distinct section of an interface, such as a header with a logo, navigation, and search form.

4. **Templates**: Page-level objects that place components into a layout and articulate the design's underlying content structure. Templates consist mostly of groups of organisms to form a page.

5. **Pages**: Specific instances of templates that show what a UI looks like with real representative content in place.

## Dependencies Column Guidelines

In the Dependencies column, list:
1. External libraries/packages the component depends on
2. Other components it imports and uses
3. Hooks or utilities it relies on

## Notes Column Usage

Use the Notes column to record:
1. Complex rendering logic that might need refactoring
2. Tight coupling concerns
3. State management approach 
4. Performance considerations
5. Accessibility issues
6. Any other special considerations for refactoring

## Completion Process

This document will be completed through the following tasks:
1. ✅ T007 - Inventory all existing components (completed)
2. ✅ T008 - Analyze and classify UI and library components (completed)
3. ✅ T009 - Analyze and classify dashboard components (completed)
4. ✅ T010 - Analyze and classify remaining components (completed)
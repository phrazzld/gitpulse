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
| src/components/ui/AuthLoadingCard.tsx | AuthLoadingCard | ui | | | |
| src/components/ui/AuthLoadingScreen.tsx | AuthLoadingScreen | ui | | | |
| src/components/ui/LoadMoreButton.tsx | LoadMoreButton | ui | | | |
| src/components/ui/ModeSelector.tsx | ModeSelector | ui | | | |
| src/components/ui/StatusDisplay.tsx | StatusDisplay | ui | | | |
| src/components/dashboard/AnalysisParameters.tsx | AnalysisParameters | dashboard | | | |
| src/components/dashboard/Header.tsx | Header | dashboard | | | |
| src/components/dashboard/OperationsPanel.tsx | OperationsPanel | dashboard | | | |
| src/components/dashboard/RepositorySection.tsx | RepositorySection | dashboard | | | |
| src/components/dashboard/SummaryDetails.tsx | SummaryDetails | dashboard | | | |
| src/components/dashboard/SummaryStats.tsx | SummaryStats | dashboard | | | |
| src/components/dashboard/SummaryView.tsx | SummaryView | dashboard | | | |
| src/components/dashboard/activityFeed/components/CommitItem.tsx | CommitItem | dashboard/activityFeed/components | | | |
| src/components/AccountSelector.tsx | AccountSelector | components | | | |
| src/components/ActivityFeed.tsx | ActivityFeed | components | | | |
| src/components/AuthError.tsx | AuthError | components | | | |
| src/components/AuthValidator.tsx | AuthValidator | components | | | |
| src/components/DashboardLoadingState.tsx | DashboardLoadingState | components | | | |
| src/components/DateRangePicker.tsx | DateRangePicker | components | | | |
| src/components/FilterPanel.tsx | FilterPanel | components | | | |
| src/components/GroupedResultsView.tsx | GroupedResultsView | components | | | |
| src/components/IntersectionObserver.tsx | IntersectionObserver | components | | | |
| src/components/OrganizationPicker.tsx | OrganizationPicker | components | | | |

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
2. T008 - Analyze and classify UI and library components
3. T009 - Analyze and classify dashboard components
4. T010 - Analyze and classify remaining components
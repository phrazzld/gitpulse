# Atomic Design Component Inventory

This document provides a comprehensive inventory of all components in the GitPulse codebase, classified according to Atomic Design principles.

## Classification Legend
- **Current Location**: Where the component currently resides in the codebase
- **Atomic Category**: The recommended Atomic Design category (atom, molecule, organism, template)
- **Migration Needed**: Whether the component needs to be moved to align with Atomic Design principles
- **Complexity**: The complexity level of the component (low, medium, high)
- **Dependencies**: Other components this component depends on

## Component Inventory

### Atoms (Basic Building Blocks)

| Component Name | Current Location | Atomic Category | Migration Needed | Complexity | Dependencies |
|----------------|------------------|-----------------|-------------------|------------|--------------|
| Button | /components/atoms/Button.tsx | atom | No | Low | None |
| LoadMoreButton | /components/ui/LoadMoreButton.tsx | atom | Yes | Low | None |
| StatusDisplay | /components/ui/StatusDisplay.tsx | atom | Yes | Low | None |
| ModeSelector | /components/ui/ModeSelector.tsx | atom | Yes | Low | None |

### Molecules (Grouped Elements)

| Component Name | Current Location | Atomic Category | Migration Needed | Complexity | Dependencies |
|----------------|------------------|-----------------|-------------------|------------|--------------|
| TerminalHeader | /components/molecules/TerminalHeader.tsx | molecule | No | Low | None |
| ErrorAlert | /components/molecules/ErrorAlert.tsx | molecule | No | Medium | None |
| AuthStatusBanner | /components/molecules/AuthStatusBanner.tsx | molecule | No | Medium | None |
| DateRangePicker | /components/DateRangePicker.tsx | molecule | Yes | Medium | None |
| AuthLoadingCard | /components/ui/AuthLoadingCard.tsx | molecule | Yes | Low | None |
| AuthError | /components/AuthError.tsx | molecule | Yes | Low | None |
| AuthValidator | /components/AuthValidator.tsx | molecule | Yes | Medium | None |
| CommitItem | /components/dashboard/activityFeed/components/CommitItem.tsx | molecule | Yes | Medium | None |

### Organisms (Complex UI Sections)

| Component Name | Current Location | Atomic Category | Migration Needed | Complexity | Dependencies |
|----------------|------------------|-----------------|-------------------|------------|--------------|
| OperationsPanel | /components/organisms/OperationsPanel.tsx | organism | No | High | TerminalHeader, ErrorAlert, AuthStatusBanner, AccountSelectionPanel, AnalysisFiltersPanel |
| AccountSelectionPanel | /components/organisms/AccountSelectionPanel.tsx | organism | No | Medium | None |
| AnalysisFiltersPanel | /components/organisms/AnalysisFiltersPanel.tsx | organism | No | Medium | ModeSelector |
| RepositorySection | /components/organisms/RepositorySection.tsx | organism | No | Medium | None |
| ActivityFeed | /components/ActivityFeed.tsx | organism | Yes | High | CommitItem |
| GroupedResultsView | /components/GroupedResultsView.tsx | organism | Yes | High | None |
| FilterPanel | /components/FilterPanel.tsx | organism | Yes | Medium | None |
| OrganizationPicker | /components/OrganizationPicker.tsx | organism | Yes | Medium | None |
| AccountSelector | /components/AccountSelector.tsx | organism | Yes | Medium | None |
| DashboardLoadingState | /components/DashboardLoadingState.tsx | organism | Yes | Medium | None |
| IntersectionObserver | /components/IntersectionObserver.tsx | organism | Yes | Low | None |
| SummaryView | /components/dashboard/SummaryView.tsx | organism | Yes | High | SummaryStats, SummaryDetails |
| SummaryStats | /components/dashboard/SummaryStats.tsx | organism | Yes | Medium | None |
| SummaryDetails | /components/dashboard/SummaryDetails.tsx | organism | Yes | High | None |
| AnalysisParameters | /components/dashboard/AnalysisParameters.tsx | organism | Yes | Medium | None |
| Header | /components/dashboard/Header.tsx | organism | Yes | Medium | None |
| AuthLoadingScreen | /components/ui/AuthLoadingScreen.tsx | organism | Yes | Medium | AuthLoadingCard |

### Templates (Page Layouts)

| Component Name | Current Location | Atomic Category | Migration Needed | Complexity | Dependencies |
|----------------|------------------|-----------------|-------------------|------------|--------------|
| App Layout | /app/layout.tsx | template | No | Medium | Various components |
| Dashboard Layout | /app/dashboard/layout.tsx | template | No | Medium | Various components |
| Home Page | /app/page.tsx | template | No | Medium | Various components |
| Dashboard Page | /app/dashboard/page.tsx | template | No | Medium | Various components |

## Migration Summary

- **Total Components**: 28
- **Components Already Correctly Placed**: 8
- **Components Needing Migration**: 20

### Migration Priorities

1. **High Priority** (Core UI Components):
   - Move UI components from `/components/ui` to appropriate atomic folders
   - Move dashboard components to their appropriate categories

2. **Medium Priority** (Dashboard-specific Components):
   - SummaryView and related components
   - ActivityFeed and related components

3. **Low Priority** (Utility Components):
   - IntersectionObserver and similar utility components

## Special Cases and Notes

- **IntersectionObserver**: This is more of a utility component than a UI component. Consider whether it belongs in the Atomic Design structure or should be moved to a utilities folder.
- **Dashboard Components**: Currently, many dashboard-specific components are in a dedicated folder. Consider whether to maintain this domain-specific organization or fully adopt the Atomic Design structure.
- **Next.js Pages**: These serve as templates in the Atomic Design methodology but are structured according to Next.js conventions. No migration needed for these.

## Next Steps

Once this inventory is reviewed and approved, the next step will be to create a detailed migration plan (TASK-022) that outlines the specific changes needed for each component, including:

1. New file paths
2. Import updates
3. Test file moves
4. Story file moves
5. Order of migration to minimize disruption
# Todo Tasks for GitPulse Dashboard

## Dashboard Rendering Fix Plan

- [x] **T201 · Bug · P0: Isolate and verify state management initialization problems**

  - **Action:**
    1. Add explicit debug logs at top of `DashboardContainer.tsx` to verify component mounting
    2. Add explicit debug logs in `useDashboardRepository` to track state access
    3. Create a minimal test component that only renders static content with no state dependencies
    4. Insert test component into dashboard to verify basic rendering works
    5. Check browser console for errors during initial load and component mounting
  - **Done-when:**
    1. Debug logs show exact component mounting sequence
    2. Root cause of state initialization failure is identified
    3. We know exactly where in the component tree rendering stops
  - **Depends-on:** None

- [x] **T202 · Bug · P0: Fix Zustand initialization and state hydration**

  - **Action:**
    1. Create a `withZustand` higher-order component that ensures store initialization
    2. Add isHydrated state flag to store to track when client-side hydration is complete
    3. Ensure dashboard components don't attempt to read state before hydration completes
    4. Update store.ts partialize function to handle null state gracefully
    5. Clear any corrupted localStorage state that might interfere with store initialization
  - **Done-when:**
    1. Store reliably initializes before components try to access it
    2. Components gracefully handle pre-hydration state
    3. Console shows no "Cannot read properties of undefined" errors
  - **Depends-on:** [T201]

- [ ] **T203 · Bug · P0: Create simplified dashboard fallback**

  - **Action:**
    1. Create `SimpleDashboard.tsx` component with minimal static content, no state dependencies
    2. Add conditional rendering in dashboard page to use simplified version during state issues
    3. Implement manual state reset button in the simplified dashboard
    4. Add visible error display for any state initialization errors
    5. Ensure the simplified dashboard is visually similar to the real dashboard
  - **Done-when:**
    1. A fallback dashboard renders without any state dependencies
    2. Users can see content even when state fails to initialize
    3. Error details are visible to help with debugging
    4. Users can trigger manual state reset when needed
  - **Depends-on:** [T201]

- [ ] **T204 · Bug · P0: Fix the component hierarchy to ensure proper rendering flow**

  - **Action:**
    1. Modify `DashboardContainer.tsx` to render a simplified placeholder while loading
    2. Update the dashboard page component to correctly defer to container for state management
    3. Fix client/server component boundaries with explicit "use client" directives
    4. Replace direct Zustand hook usage with prop drilling for critical components
    5. Add explicit state initialization sequence with visual feedback
  - **Done-when:**
    1. Component rendering follows a clear, predictable flow
    2. Loading states are visible during state initialization
    3. Client/server boundaries are properly respected
    4. Critical components receive data through props when necessary
  - **Depends-on:** [T201, T202, T203]

- [ ] **T205 · Bug · P0: Implement CSS fixes to ensure dashboard visibility**

  - **Action:**
    1. Update `src/app/dashboard/layout.tsx` to override any parent container styles
    2. Set explicit z-index, position, and dimensions for dashboard container
    3. Use `!important` on critical CSS properties to prevent style overrides
    4. Add explicit background colors and borders for better debugging
    5. Fix margin/padding issues between parent layout and dashboard
  - **Done-when:**
    1. Dashboard content is visibly rendered regardless of parent container styles
    2. Layout appears correctly with proper spacing and dimensions
    3. No content is hidden due to CSS issues
    4. Visual hierarchy matches the component hierarchy
  - **Depends-on:** [T201, T204]

- [ ] **T206 · Bug · P0: Create state initialization guard in providers**

  - **Action:**
    1. Update `src/app/providers.tsx` to include Zustand initialization checks
    2. Create a `ZustandProvider` component that ensures store is ready
    3. Add client-side only hydration check that shows loading until store is hydrated
    4. Implement global `useHasMounted` hook to detect client-side rendering
    5. Block child rendering until critical preconditions are met
  - **Done-when:**
    1. Components don't render until Zustand is fully initialized
    2. Loading indicator shows during initialization
    3. No "Cannot read properties of undefined" errors in console
    4. Client-side hydration is properly detected and handled
  - **Depends-on:** [T201, T202]

- [ ] **T207 · Bug · P0: Fix direct store access pattern in components**

  - **Action:**
    1. Update all components to use the hooks pattern consistently
    2. Remove direct store access via useStore(state => state[StateSlice.X])
    3. Ensure all hooks provide safe fallback values for missing state
    4. Create dedicated safe selector hooks for critical state properties
    5. Add defensive null checks before any state property access
  - **Done-when:**
    1. No components directly access state slices
    2. All state access is via safe, defensive hooks
    3. Missing or undefined state is gracefully handled
    4. No TypeErrors related to undefined state properties
  - **Depends-on:** [T201, T202, T206]

- [ ] **T208 · Bug · P0: Implement comprehensive error boundaries**
  - **Action:**
    1. Create `DashboardErrorBoundary.tsx` component to catch rendering errors
    2. Add error boundary around each major dashboard section
    3. Implement detailed error logging for boundary catches
    4. Create fallback UI for each boundary to maintain usability
    5. Add "retry" mechanism to reload components after errors
  - **Done-when:**
    1. Errors in one component don't crash the entire dashboard
    2. Error details are logged for debugging
    3. Users see helpful fallback UIs instead of blank screens
    4. Dashboard maintains minimum functionality despite errors
  - **Depends-on:** [T201, T203, T204]

## Bug Fix Tasks

- [x] **T100 · Bug · P0: Add defensive check for repositories in useDashboardRepository useEffect**

  - **Action:**
    1. Open `src/state/hooks/useDashboardRepository.ts`.
    2. Locate the `useEffect` hook responsible for updating the `initialLoad` state.
    3. Modify the condition to check if `repositories` is defined before accessing `repositories.length`. Change `!loading && repositories.length > 0 && initialLoad` to `!loading && repositories && repositories.length > 0 && initialLoad`.
    4. Update the dependency array from `[loading, repositories.length, initialLoad, setInitialLoad]` to `[loading, repositories, initialLoad, setInitialLoad]`.
    5. Ensure code formatting and linting rules pass.
  - **Done-when:**
    1. The `useEffect` condition includes a nullish check for `repositories`.
    2. The dependency array references `repositories` directly instead of `repositories.length`.
    3. Linting and type checking pass.
  - **Depends-on:** None

- [x] **T100a · Bug · P0: Add defensive checks to other Zustand hooks**

  - **Action:**
    1. Identify similar issues in other hooks in `/src/state/hooks.ts`
    2. Add defensive checks for:
       - `useDateRange` (safely handle undefined `dateRange`)
       - `useFilters` (safely handle undefined `activeFilters`)
       - `useUIState` (safely handle undefined UI state properties)
       - `useInstallations` (safely handle undefined installation properties)
       - `usePanelExpansion` (safely handle undefined `expandedPanels`)
    3. Ensure all hooks provide default values when accessing potentially undefined properties
  - **Done-when:**
    1. All hooks include appropriate null/undefined checks
    2. Default values are provided for all potentially undefined properties
    3. Type checking passes for all hooks
  - **Depends-on:** None

- [x] **T100b · Bug · P0: Fix null safety issues in UI components**

  - **Action:**
    1. Fix FilterControls component to add null-safety when accessing `dateRange.since` and `dateRange.until`
    2. Update DateRangePicker component to handle undefined dateRange by providing a safe default
    3. Modify FilterControls to use the safe `since` and `until` values from the useDateRange hook
    4. Update RepositoryInfoPanel to add a defensive check for repositories
    5. Replace all direct references to repositories.length with safeRepositories.length
    6. Fix DashboardSummaryPanel by providing default values for all metrics
    7. Update useActivityMetrics to handle undefined dashboard state
    8. Modify getRepositoryCount to safely handle undefined repositories
    9. Enhance useDashboardRepository with defensive defaults for all properties
  - **Done-when:**
    1. FilterControls component safely accesses dateRange properties
    2. DateRangePicker component handles undefined dateRange gracefully
    3. RepositoryInfoPanel component safely accesses repositories array
    4. DashboardSummaryPanel and activity metrics handle undefined values
    5. useDashboardRepository provides defensive defaults
    6. Type checking and linting pass for all changes
  - **Depends-on:** [T100]

- [x] **T100c · Bug · P0: Fix null safety for action methods in hooks**

  - **Action:**
    1. Add null-safety to action methods in useDashboardRepository with default fallback functions
    2. Update fetchRepositoriesWithCookieHandling to handle missing fetchRepositories function
    3. Add error handling to setupWindowFocusRefresh for robustness
    4. Add defensive checks in DashboardContainer for useDashboardRepository hooks
    5. Add try/catch blocks to useEffect hooks in DashboardContainer
  - **Done-when:**
    1. Action methods in useDashboardRepository have default implementations if undefined
    2. fetchRepositoriesWithCookieHandling safely handles missing fetchRepositories
    3. setupWindowFocusRefresh safely handles errors and missing functions
    4. DashboardContainer has defensive checks for all hooks and methods
    5. Type checking and linting pass for all changes
  - **Depends-on:** [T100, T100a, T100b]

- [x] **T100d · Bug · P0: Fix layout and styling issues**

  - **Action:**
    1. Fix duplicate Header and Footer by removing them from the dashboard layout
    2. Add diagnostic console logs to track state issues and repository loading
    3. Replace Tailwind classes with inline styles for critical UI elements
    4. Add fallback direct fetch mechanism for repositories
    5. Fix container styling to ensure proper colors and layout
  - **Done-when:**
    1. Dashboard loads without duplicate headers and footers
    2. UI styling is restored with proper layout and colors
    3. Diagnostic logs help trace repository loading issues
    4. Repository data can be fetched even when hooks fail
  - **Depends-on:** [T100, T100a, T100b, T100c]

- [x] **T101 · Test · P0: Manually verify dashboard loads without TypeError**

  - **Action:**
    1. Start the application in development mode with `npm run dev`.
    2. Navigate to the dashboard page in the browser.
    3. Check the browser console for errors.
    4. Verify that the dashboard UI loads without errors.
  - **Done-when:**
    1. The dashboard page loads without throwing the `TypeError: Cannot read properties of undefined (reading 'length')`.
    2. No related errors appear in the browser's developer console (including "Cannot read properties of undefined (reading 'since')").
    3. Dashboard UI components render properly with correct styling and layout.
    4. Repository data is displayed correctly when available.
  - **Depends-on:** [T100, T100a, T100b, T100c, T100d]

- [ ] **T102 · Test · P1: Add unit test for useDashboardRepository with undefined repositories**

  - **Action:**
    1. Create or update a test file for `useDashboardRepository.ts`.
    2. Write a test case that simulates the initial undefined state for repositories.
    3. Use mocking to control the state returned by the Zustand store.
    4. Verify the hook doesn't throw errors when repositories is undefined.
  - **Done-when:**
    1. A unit test exists covering the initial render scenario where `repositories` is undefined.
    2. The test passes, confirming no errors occur with undefined repositories.
    3. Test coverage meets project standards for the modified code.
  - **Depends-on:** [T100]

- [ ] **T103 · Test · P1: Add integration test for dashboard loading with incomplete state**

  - **Action:**
    1. Create or update an integration test for the dashboard components.
    2. Set up test environment with mocked Zustand store having undefined repositories initially.
    3. Render the dashboard container/page component.
    4. Assert that the component renders without errors.
  - **Done-when:**
    1. An integration test exists that renders the dashboard with simulated initial state conditions.
    2. The test passes, confirming the component tree handles undefined state gracefully.
  - **Depends-on:** [T100]

- [ ] **T104 · Bug · P0: Complete repository fix and documentation**
  - **Action:**
    1. Review all implemented changes.
    2. Update `BUGFIXPLAN.md` with the fix description and status.
    3. Create a detailed commit message explaining the bug, root cause, and fix.
    4. Run all tests, linting, and type checking to verify quality.
  - **Done-when:**
    1. All tasks T100-T103 are completed.
    2. All tests pass with the changes.
    3. `BUGFIXPLAN.md` is updated to "Fixed" status with proper documentation.
    4. Bug fix is correctly committed to the repository.
  - **Depends-on:** [T100, T101, T102, T103]

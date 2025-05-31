# GitPulse CI Resolution Tasks

## Accessibility Issues

### Color Contrast Fixes

- [x] **Fix color contrast in LoadMoreButton component**
  - Update the electric blue color (`#3b8eea`) in `src/components/ui/LoadMoreButton.tsx` to meet WCAG AA standards (4.5:1 ratio)
  - Test with light text on dark background and dark text on light background
  - Verify contrast using the project's `colorContrast.ts` utility
  - Ensure all text inside buttons meets 4.5:1 contrast ratio minimum

- [x] **Fix color contrast in ModeSelector component**
  - Review and update the following colors in `src/components/ui/ModeSelector.tsx`:
    - `neon-green (#00ff87)` - Updated to `#00994f` which meets WCAG AA 3.51:1 contrast ratio
    - `electric-blue (#3b8eea)` - Updated to `#2563eb` which meets WCAG AA 4.90:1 contrast ratio
  - Selected state indicators now meet 3:1 minimum contrast (using #00994f)
  - Description text now meets 4.5:1 contrast ratio against backgrounds (using #2563eb)
  - Used approved color combinations from `docs/accessibility/APPROVED_COLOR_PAIRINGS.md`

- [x] **Fix color contrast in OperationsPanel component**
  - Updated shadow color from `rgba(0, 255, 135, 0.2)` to `rgba(0, 153, 79, 0.3)` with higher opacity for better visibility
  - Updated TerminalHeader to use `#00994f` (WCAG AA 3.51:1 contrast ratio for large text)
  - Updated ErrorAlert to use consistent neon green color with proper contrast
  - Ensured all components use CSS variable fallbacks with approved colors

- [x] **Fix Button component accessibility issues**
  - Updated variant styles with documented contrast ratios for all states
  - Enhanced focus states with high-visibility focus ring (exceeding 3:1 minimum contrast)
  - Added data attributes for testing hover and focus states
  - Updated color variables with WCAG AA compliant values: darkBlue (#1a4bbd - 7.54:1 with white), electricBlue (#2563eb - 4.90:1 on light backgrounds)
  - Added comprehensive hover state handling with proper contrast maintenance

### ARIA and Accessibility Structure

- [x] **Fix ARIA attributes in interactive components**
  - Improved ARIA role usage in ModeSelector by adding aria-roledescription, aria-orientation
  - Enhanced Button component with better aria-label enforcement and detailed error messages
  - Converted div elements to semantic buttons for better keyboard interaction
  - Implemented useAriaAnnouncer for screen reader announcements when selections change
  - Added proper aria-labelledby and aria-describedby attributes to establish relationships between labels and controls
  - Added appropriate landmark roles (region) to OperationsPanel

- [x] **Implement accessibility hook usage consistently**
  - Created reusable LoadingAnnouncer component for managing aria announcements
  - Added useAriaAnnouncer implementation to DateRangePicker, ErrorAlert, and AuthStatusBanner
  - Implemented keyboard navigation improvements in DateRangePicker using useKeyboardNavigation
  - Added status change announcements for loading, success, and error states
  - Added proper ARIA attributes (aria-pressed) to interactive elements

## Testing Improvements

- [x] **Add Jest accessibility tests for atoms components**
  - Create accessibility tests for Button focusing on color contrast
  - Update LoadMoreButton tests for WCAG compliance
  - Verify test coverage exceeds 90% threshold for atoms
  - Include tests for keyboard navigation and screen reader compatibility

- [x] **Add Jest accessibility tests for molecules components**
  - Add tests for ErrorAlert component accessibility
  - Add tests for TerminalHeader component
  - Add tests for AuthStatusBanner component
  - Increase test coverage to meet 85% threshold

- [x] **Add Jest accessibility tests for organisms components**
  - Create tests for OperationsPanel component
  - Add tests for AccountSelectionPanel component
  - Add tests for AnalysisFiltersPanel component
  - Increase test coverage to meet 80% threshold

## CI Pipeline Fixes

- [x] **Configure Storybook Accessibility testing properly**
  - Update `.storybook/test-runner.js` to better report accessibility failures
  - Add specific rules configuration for color-contrast testing
  - Add comprehensive reporting of specific violations
  - Ensure proper logging of accessibility issues

- [x] **Update color documentation and utilities**
  - Run and fix `npm run generate-color-docs` script
  - Update `docs/accessibility/APPROVED_COLOR_PAIRINGS.md` with corrections
  - Add new approved color combinations for UI components
  - Update contrast calculation thresholds if needed

- [x] **Fix pre-commit accessibility checks**
  - Update the pre-commit hook for detecting staged story files
  - Ensure local checks match CI checks for consistency
  - Add clear error reporting for accessibility violations
  - Add guidance for fixing common contrast issues

## Component Library Improvements

- [x] **Implement consistent color system across atomic design components**
  - Create standardized color tokens in a central location
  - Replace hard-coded colors with token variables
  - Document the color system in storybook
  - Ensure all colors meet WCAG AA standards (at minimum)

- [x] **Add pattern library documentation for accessibility**
  - Create example accessible patterns for common UI components
  - Add accessibility best practices for atomic design
  - Document proper usage of ARIA attributes
  - Create reference implementation for each atomic component type

## CI/Build Improvements

- [x] **Optimize Storybook build performance for pre-commit hooks**
  - ✅ Implemented configuration-based caching system using SHA256 hash
  - ✅ Reduced execution time from >10 minutes to <2 minutes with valid cache
  - ✅ Added build-info.json generation for cache validation
  - ✅ Added 2-minute timeout to prevent infinite hangs
  - ✅ Created comprehensive test suite and documentation

- [x] **Fix pre-commit hook timeout issues**
  - ✅ Solved by implementing smart caching - builds only when config changes
  - ✅ Added timeout handling with clear error messages
  - ✅ Documented emergency skip option (A11Y_SKIP=1) for infrastructure issues
  - ✅ Created STORYBOOK_BUILD_OPTIMIZATION.md documentation

## Documentation Updates

- [x] **Update atomic design documentation with accessibility guidelines**
  - Add accessibility section to `docs/architecture/ATOMIC_DESIGN.md`
  - Update examples with accessible implementations
  - Document color contrast requirements for different component types
  - Add testing guidance for accessibility

- [x] **Create component-specific accessibility documentation**
  - Add accessibility section to component stories
  - Document keyboard navigation patterns
  - Document screen reader behavior
  - Document color contrast requirements

## CI Failure Resolution

- [x] **Fix Button icon accessibility tests**
  - Add aria-label props to icon-only button test renders in `Button.icon-accessibility.test.tsx`
  - Ensure all icon-only button test cases provide accessible names
  - Verify tests pass locally before committing
  - Expected time: 15 minutes

- [x] **Fix Storybook test-runner configuration**
  - Review `.storybook/test-runner.js` configuration
  - Correct the `rules` property format to be an array as expected by axe-core
  - Test locally with `npm run test-storybook`
  - Expected time: 30 minutes

### Phase 1: Critical Test Fixes (CI Blockers)

- [x] **Fix Button accessibility test error message expectation**
  - Update expected error message in `src/components/atoms/__tests__/Button.accessibility.test.tsx`
  - Change from "Icon-only button must have an accessible name" to full message
  - Ensure test passes locally before committing
  - Expected time: 5 minutes

- [x] **Fix OperationsPanel test DOM query ambiguity**
  - Investigate failing test in `src/components/organisms/__tests__/OperationsPanel.test.tsx`
  - Replace ambiguous `/start/i` text selector with more specific query
  - Use getByRole, data-testid, or more specific text matching
  - Verify test passes locally
  - Expected time: 10 minutes

### Phase 2: ModeSelector Accessibility Violations

- [x] **Investigate ModeSelector accessibility violations**
  - Run `npm run check:a11y:all` locally to get detailed violation reports
  - Examine specific axe violations for ModeSelector stories
  - Document findings: types of violations, affected elements, WCAG criteria
  - Expected time: 15 minutes

- [x] **Fix ModeSelector color contrast violations** 
  - Review color usage in ModeSelector component and stories
  - Ensure all text meets 4.5:1 contrast ratio (normal text) or 3:1 (large text)
  - Update any non-compliant colors using approved color tokens
  - Test with colorContrast utility
  - Expected time: 20 minutes

- [x] **Fix ModeSelector ARIA and semantic violations**
  - Add missing ARIA labels, roles, and properties as identified
  - Ensure proper semantic HTML structure (buttons vs divs)
  - Implement proper keyboard navigation and focus management
  - Add aria-describedby relationships where needed
  - Expected time: 25 minutes

- [x] **Verify ModeSelector accessibility fixes**
  - Run accessibility tests locally for all ModeSelector stories
  - Manually test with keyboard navigation and screen reader
  - Ensure no regressions in existing functionality
  - Confirm all violations resolved
  - Expected time: 10 minutes

### Phase 3: Final Verification

- [x] **Run complete CI verification**
  - Execute full test suite locally: `npm test`
  - Run type checking: `npm run typecheck` 
  - Run linting: `npm run lint`
  - Build project: `npm run build`
  - Expected time: 10 minutes

## Critical CI Failures (Current Branch)

### High Priority - Immediate Action Required

- [x] **Fix Storybook test runner compatibility issue**
  - Root cause: Version incompatibility between Storybook 8.6.12 and @storybook/test-runner 0.22.0
  - Error: `TypeError: Cannot read properties of undefined (reading 'storyStore')`
  - Solution: Update @storybook/test-runner to compatible version OR update test-runner.js to use new API
  - Impact: Blocks storybook-a11y CI workflow
  - Expected time: 30 minutes

- [x] **Investigate unit test CI failure**
  - Root cause: Tests pass locally (687/687) but fail in CI environment
  - Possible causes: Node version mismatch, package-lock.json sync, timing issues
  - Impact: Blocks build-and-test CI workflow and coverage reports
  - Expected time: 45 minutes

- [x] **Update .storybook/test-runner.js to use new Storybook 8 API**
  - Replace deprecated getStoryContext usage on line 138
  - Use new Storybook 8.x compatible API methods
  - Backup plan: Temporarily disable getStoryContext calls
  - Expected time: 20 minutes

### Medium Priority - Environment Alignment

- [ ] **Check CI Node.js version matches local environment**
  - Compare GitHub Actions Node.js version with local version
  - Update CI workflow if necessary to match local development
  - Expected time: 15 minutes

- [ ] **Verify package-lock.json is synchronized**
  - Ensure no discrepancies between local and CI package installations
  - Run npm ci locally to verify compatibility
  - Expected time: 10 minutes

### Low Priority - Prevention

- [ ] **Add CI dependency compatibility checks**
  - Add pre-test step to validate dependency versions
  - Create alerting for known incompatible version combinations
  - Expected time: 30 minutes
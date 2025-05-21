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

- [ ] **Fix color contrast in OperationsPanel component**
  - Review color variables used for shadows (`rgba(0, 255, 135, 0.2)`) and adjust opacity
  - Review imported components (TerminalHeader, ErrorAlert, etc.) for accessibility issues
  - Ensure all text including terminal-style headers meets contrast requirements

- [ ] **Fix Button component accessibility issues**
  - Review variant styles in `src/components/atoms/Button.tsx` focusing on hover states
  - Ensure focus states have sufficient contrast (3:1 minimum)
  - Test all button variants (primary, secondary, outline) with accessibility tools
  - Update darkBlue and electricBlue variables to maintain brand identity while meeting contrast requirements

### ARIA and Accessibility Structure

- [ ] **Fix ARIA attributes in interactive components**
  - Review all ARIA role use in ModeSelector for correctness
  - Validate aria-label usage for icon-only buttons
  - Ensure proper keyboard navigation support in ModeSelector and OperationsPanel
  - Test focus management with screen readers

- [ ] **Implement accessibility hook usage consistently**
  - Add useAriaAnnouncer for status changes in interactive components
  - Add keyboard navigation hooks to all relevant components
  - Implement focus trapping for modal and popup components
  - Add state announcements for loading and success states

## Testing Improvements

- [ ] **Add Jest accessibility tests for atoms components**
  - Create accessibility tests for Button focusing on color contrast
  - Update LoadMoreButton tests for WCAG compliance
  - Verify test coverage exceeds 90% threshold for atoms
  - Include tests for keyboard navigation and screen reader compatibility

- [ ] **Add Jest accessibility tests for molecules components**
  - Add tests for ErrorAlert component accessibility
  - Add tests for TerminalHeader component
  - Add tests for AuthStatusBanner component
  - Increase test coverage to meet 85% threshold

- [ ] **Add Jest accessibility tests for organisms components**
  - Create tests for OperationsPanel component
  - Add tests for AccountSelectionPanel component
  - Add tests for AnalysisFiltersPanel component
  - Increase test coverage to meet 80% threshold

## CI Pipeline Fixes

- [ ] **Configure Storybook Accessibility testing properly**
  - Update `.storybook/test-runner.js` to better report accessibility failures
  - Add specific rules configuration for color-contrast testing
  - Add comprehensive reporting of specific violations
  - Ensure proper logging of accessibility issues

- [ ] **Update color documentation and utilities**
  - Run and fix `npm run generate-color-docs` script
  - Update `docs/accessibility/APPROVED_COLOR_PAIRINGS.md` with corrections
  - Add new approved color combinations for UI components
  - Update contrast calculation thresholds if needed

- [ ] **Fix pre-commit accessibility checks**
  - Update the pre-commit hook for detecting staged story files
  - Ensure local checks match CI checks for consistency
  - Add clear error reporting for accessibility violations
  - Add guidance for fixing common contrast issues

## Component Library Improvements

- [ ] **Implement consistent color system across atomic design components**
  - Create standardized color tokens in a central location
  - Replace hard-coded colors with token variables
  - Document the color system in storybook
  - Ensure all colors meet WCAG AA standards (at minimum)

- [ ] **Add pattern library documentation for accessibility**
  - Create example accessible patterns for common UI components
  - Add accessibility best practices for atomic design
  - Document proper usage of ARIA attributes
  - Create reference implementation for each atomic component type

## Documentation Updates

- [ ] **Update atomic design documentation with accessibility guidelines**
  - Add accessibility section to `docs/architecture/ATOMIC_DESIGN.md`
  - Update examples with accessible implementations
  - Document color contrast requirements for different component types
  - Add testing guidance for accessibility

- [ ] **Create component-specific accessibility documentation**
  - Add accessibility section to component stories
  - Document keyboard navigation patterns
  - Document screen reader behavior
  - Document color contrast requirements
# Accessibility Documentation

This directory contains documentation related to accessibility practices, standards, and guidelines for the GitPulse project.

## Contents

- `ACCESSIBILITY_BEST_PRACTICES.md`: Guidelines and best practices for implementing accessible components
- `ACCESSIBILITY_CI_SETUP.md`: Configuration and setup for accessibility CI checks
- `ACCESSIBILITY_GUIDELINES.md`: Implementation patterns and ARIA attribute usage reference
- `ACCESSIBILITY_REPORTING.md`: How to report and document accessibility violations
- `APPROVED_COLOR_PAIRINGS.md`: Validated color combinations that meet WCAG requirements
- `COLOR_CONTRAST_UTILITY.md`: Documentation for the color contrast utility
- `color-pairings.config.json`: Configuration for approved color pairings

## Key Tools

- `src/lib/accessibility/colorContrast.ts`: Utility for validating color contrast
- `src/lib/accessibility/useAriaAnnouncer.ts`: Hook for screen reader announcements
- `src/lib/accessibility/useFocusTrap.ts`: Hook for modal and dialog keyboard trapping
- `src/lib/accessibility/useKeyboardNavigation.ts`: Hook for keyboard navigation
- `src/lib/accessibility/useRovingTabIndex.ts`: Hook for implementing roving tabindex pattern

## Local Testing

See `LOCAL_ACCESSIBILITY_CHECKS.md` for information on how to run local accessibility checks.
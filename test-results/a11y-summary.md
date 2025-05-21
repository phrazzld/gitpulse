# Accessibility Test Summary

## Overview

This report provides a comprehensive overview of accessibility testing results for GitPulse components. The tests are based on WCAG 2.1 AA standards and use axe-core for automated testing.

## Summary

| Metric | Value |
| ------ | ----- |
| Pass Rate | 92.5% |
| Components Tested | 45 |
| Components with Issues | 8 |
| Total Violations | 12 |

### Violations by Impact Level

| Impact | Count | Status | Build Fails? |
| ------ | ----- | ------ | ------------ |
| Critical | 0 | ✅ | Yes |
| Serious | 0 | ✅ | Yes |
| Moderate | 8 | ⚠️ | No |
| Minor | 4 | ℹ️ | No |

### Issues by Rule

| Rule | Impact | Count | Description |
| ---- | ------ | ----- | ----------- |
| color-contrast | ⚠️ Moderate | 5 | Elements must have sufficient color contrast |
| button-name | ⚠️ Moderate | 2 | Buttons must have discernible text |
| image-alt | ⚠️ Moderate | 1 | Images must have alternate text |
| aria-roles | ℹ️ Minor | 2 | ARIA roles must conform to valid values |
| tabindex | ℹ️ Minor | 2 | tabindex should not be greater than zero |

### Components with Issues

| Component | Story | Issues | Highest Impact | Top Rules |
| --------- | ----- | ------ | -------------- | --------- |
| Organisms/AnalysisFiltersPanel | Default | 3 | ⚠️ Moderate | color-contrast (2), aria-roles (1) |
| Molecules/DateRangePicker | Default | 2 | ⚠️ Moderate | button-name (1), tabindex (1) |
| Atoms/Button | Secondary | 2 | ⚠️ Moderate | color-contrast (2) |
| Molecules/TerminalHeader | WithLongText | 2 | ⚠️ Moderate | color-contrast (1), aria-roles (1) |
| Atoms/Icon | Warning | 1 | ℹ️ Minor | image-alt (1) |
| Organisms/AccountSelectionPanel | NoSelection | 1 | ℹ️ Minor | tabindex (1) |
| Molecules/AuthStatusBanner | LoggedOut | 1 | ⚠️ Moderate | button-name (1) |

## 🔍 How to Fix Accessibility Issues

To fix accessibility issues:

1. Run `npm run check:a11y:all` locally to generate detailed reports
2. Use the rule IDs above to locate specific violations in components
3. Check the Storybook Accessibility tab to identify and fix issues
4. Reference the axe-core rule documentation for detailed guidance

### Common Fixes for Top Issues

**color-contrast** (Moderate):
- Elements must have sufficient color contrast ratio of at least 4.5:1 (3:1 for large text)
- Affects 5 instances across 3 components

**button-name** (Moderate):
- Buttons must have discernible text that is accessible to screen readers
- Affects 2 instances across 2 components

**tabindex** (Minor):
- tabindex values greater than 0 interfere with natural keyboard navigation
- Affects 2 instances across 2 components
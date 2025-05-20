# Accessibility Reporting

This document explains how to use GitPulse's enhanced accessibility reporting system to identify, understand, and fix accessibility issues in your components.

## Table of Contents

- [Overview](#overview)
- [CI Workflow Reporting](#ci-workflow-reporting)
- [Local Testing](#local-testing)
- [Understanding Violation Reports](#understanding-violation-reports)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Continuous Improvement](#continuous-improvement)

## Overview

GitPulse implements comprehensive accessibility testing through [axe-core](https://github.com/dequelabs/axe-core) and the Storybook accessibility addon. The reporting system is designed to:

1. Provide detailed, actionable information about accessibility violations
2. Categorize issues by severity (critical, serious, moderate, minor)
3. Identify the specific elements causing violations
4. Reference WCAG criteria and best practices
5. Suggest remediation approaches

## CI Workflow Reporting

Accessibility violations are reported in several ways in the CI workflow:

### GitHub Actions Output

In the GitHub Actions workflow, accessibility violations are reported in several formats:

1. **Summary View**: A high-level breakdown showing violation counts by impact level
2. **Rule-based View**: Groups violations by rule type across all components
3. **Component View**: Shows which components have accessibility issues

### PR Comments

For pull requests, a markdown summary is automatically added as a comment containing:

- Overall pass/fail status
- Summary statistics (component count, violation count, etc.)
- Impact breakdown (critical, serious, moderate, minor)
- Top violation rules with descriptions
- Component-specific violation details
- Remediation guidance

### Artifacts

Detailed results are uploaded as artifacts in the GitHub Action:

- **a11y-summary.md**: Markdown summary suitable for documentation or sharing
- **a11y-results.json**: Complete structured data for all accessibility tests
- **a11y-raw-output.log**: Raw log output for debugging

## Local Testing

You can run accessibility tests locally in several ways:

### Testing All Components

```bash
npm run check:a11y:all
```

This runs accessibility tests on all components in Storybook and provides detailed output.

### Testing Staged Components Only

```bash
npm run check:a11y:staged
```

This runs accessibility tests only on component stories that have been git-staged, making it ideal for pre-commit checks.

### In Storybook UI

The accessibility panel in Storybook provides interactive testing:

1. Run `npm run storybook` to start Storybook
2. Select a component
3. Open the "Accessibility" tab in the addon panel
4. View and filter violations
5. Use the DOM inspector to locate the specific element causing each issue

## Understanding Violation Reports

Accessibility violations are categorized by impact level:

- **Critical**: Major issues that severely impact accessibility for many users
- **Serious**: Significant barriers for certain user groups
- **Moderate**: Issues that may cause difficulties for some users
- **Minor**: Subtle issues that may affect some users in specific situations

Each violation report includes:

- **Rule ID**: The specific accessibility rule that was violated (e.g., `color-contrast`)
- **Description**: A human-readable description of the issue
- **Impact**: The severity level (critical, serious, moderate, minor)
- **Element Details**: Information about the specific DOM element(s) with issues
- **HTML**: The markup of the violating element
- **Selector**: CSS selector to locate the element
- **WCAG Criteria**: Which WCAG success criteria the violation relates to
- **Remediation Guidance**: Suggestions for fixing the issue

## Troubleshooting Common Issues

### Color Contrast

The most common accessibility issue is insufficient color contrast. To fix:

1. Use the built-in color contrast utility:
   ```typescript
   import { checkColorContrast } from '@/lib/accessibility/colorContrast';
   
   // Check if colors meet WCAG AA standards
   const result = checkColorContrast('#foreground', '#background');
   console.log(result.passes); // true/false
   console.log(result.ratio); // numeric contrast ratio
   ```

2. Update to approved color combinations in `docs/APPROVED_COLOR_PAIRINGS.md`

3. For dynamic colors, implement runtime contrast checking

### Missing ARIA Labels

Elements that convey meaning through visuals need text alternatives:

```jsx
// Bad - icon button without accessible name
<Button>
  <IconComponent />
</Button>

// Good - icon button with accessible name
<Button aria-label="Settings">
  <IconComponent />
</Button>
```

### Invalid ARIA Usage

Ensure ARIA attributes are used correctly:

1. Only use ARIA roles that are appropriate for the element
2. Ensure required attributes for each role are provided
3. Don't use conflicting or invalid combinations of ARIA attributes

## Continuous Improvement

To maintain and improve accessibility:

1. **Run Tests Regularly**: Make accessibility testing part of your development workflow
2. **Address Issues Early**: Fix violations as they appear, not in a later cleanup
3. **Document Patterns**: Add accessible patterns to your component documentation
4. **Review Reports**: Regularly review accessibility reports to identify trends

For more information on specific rules and fixes, visit:
- [Deque University](https://dequeuniversity.com/rules/axe/)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Web Accessibility Initiative](https://www.w3.org/WAI/)
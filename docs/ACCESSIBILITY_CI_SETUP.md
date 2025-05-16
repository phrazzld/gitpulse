# Accessibility CI Setup

## Overview

The Storybook accessibility tests are now configured to block pull requests when critical or serious accessibility violations are detected. This ensures that our UI components meet WCAG standards before being merged.

## Configuration

### Storybook Test Runner

The test runner is configured in `.storybook/test-runner.js` to:

1. Inject axe-core into each story
2. Run accessibility checks on all stories  
3. Fail tests when violations are detected (unless explicitly skipped)
4. Support story-specific rule exceptions

### CI Workflow

The GitHub Actions workflow (`.github/workflows/storybook-a11y.yml`) has been updated to:
- Set `SKIP_A11Y_FAILURES: false` to ensure tests fail on violations
- Run `npx test-storybook` to execute accessibility tests

## Usage

### Writing Stories

All Storybook stories will automatically be tested for accessibility violations. No additional configuration is needed for standard testing.

### Skipping Specific Rules

In exceptional cases where a specific accessibility rule must be skipped (e.g., decorative images), you can configure this at the story level:

```typescript
export const MyStory: Story = {
  render: () => <MyComponent />,
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'image-alt',
            enabled: false, // Disable specific rule for this story
          },
        ],
      },
    },
  },
};
```

### Disabling All Tests for a Story

To completely disable accessibility testing for a specific story:

```typescript
export const MyStory: Story = {
  render: () => <MyComponent />,
  parameters: {
    a11y: {
      disable: true,
    },
  },
};
```

## Severity Levels

The test runner detects violations at all severity levels:
- **Critical**: Most severe issues that must be fixed
- **Serious**: Important issues that significantly impact users  
- **Moderate**: Issues that should be addressed
- **Minor**: Small issues that have minimal impact

All violations will cause tests to fail unless explicitly configured otherwise.

## Troubleshooting

If you encounter issues:

1. Check the test output for specific violation details
2. Use the browser's accessibility inspector to diagnose issues
3. Consult the [axe-core documentation](https://www.deque.com/axe/core-documentation/api-documentation/) for rule details
4. Consider if the rule should be skipped (only in rare cases)

## Best Practices

1. Always fix accessibility issues rather than skipping rules
2. If you must skip a rule, document why in a comment
3. Test keyboard navigation and screen reader compatibility
4. Use semantic HTML whenever possible
5. Ensure proper color contrast ratios
6. Provide alternative text for all informative images
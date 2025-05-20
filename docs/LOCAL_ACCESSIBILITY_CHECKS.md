# Local Accessibility Checks

## Overview

GitPulse automatically runs accessibility checks on staged Storybook stories before each commit. This ensures accessibility issues are caught early in the development process, before code reaches CI/CD.

## How It Works

1. **Pre-commit Hook**: When you run `git commit`, Husky triggers accessibility checks
2. **Story Detection**: The system identifies staged `.stories.tsx` files  
3. **Test Execution**: Uses the same `test-storybook` runner as CI
4. **Violation Reporting**: Critical and serious violations block the commit
5. **Developer Feedback**: Clear error messages with actionable fixes

## Quick Start

The accessibility checks run automatically. No setup required if you have already run `npm install`.

### Common Commands

```bash
# Run checks on staged stories (happens automatically on commit)
npm run check:a11y:staged

# Run checks on all stories
npm run check:a11y:all

# Skip checks for emergency commits (use sparingly!)
A11Y_SKIP=1 git commit -m "urgent: hotfix (TODO: fix a11y)"
```

## Fixing Violations

When accessibility violations are found, you'll see output like:

```
❌ Accessibility violations found in staged stories:

  src/components/Button.stories.tsx:
    - CRITICAL: Images must have alternative text (2 instances)
    - SERIOUS: Elements must have sufficient color contrast (1 instance)
```

### Resolution Steps

1. **Debug Interactively**:
   ```bash
   npm run storybook
   # Open the story and check the Accessibility panel
   ```

2. **Common Fixes**:
   - **Missing alt text**: Add `alt=""` for decorative images or meaningful text for informative ones
   - **Color contrast**: Use the color contrast utility or check with browser DevTools
   - **Form labels**: Ensure all inputs have associated labels

3. **Skip Specific Rules** (exceptional cases only):
   ```typescript
   export const MyStory: Story = {
     parameters: {
       a11y: {
         config: {
           rules: [
             { id: 'image-alt', enabled: false } // Document why!
           ]
         }
       }
     }
   };
   ```

## Performance

- **Build Caching**: Storybook is only rebuilt if older than 5 minutes
- **Targeted Checks**: Only staged stories are checked
- **Typical Time**: 2-5 seconds for most commits

## Troubleshooting

### Build Failures

If Storybook fails to build:
```bash
# Build manually to see full error
npm run build-storybook

# Then retry commit
git commit
```

### False Positives

If you believe a violation is incorrect:
1. Verify in browser DevTools accessibility panel
2. Check if it's a known axe-core issue
3. Consider if the rule should be skipped (document why)

### Performance Issues

If checks are slow:
```bash
# Check how many stories are staged
git diff --cached --name-only | grep stories

# Consider committing in smaller batches
```

### Debug Mode

If you're having problems with the pre-commit hook, use debug mode:
```bash
# Run with debug output enabled
DEBUG=1 npm run check:a11y:staged

# Shows detailed information about:
# - Detected story files
# - Path normalization
# - Story matching
# - Command execution
# - Error details
```

### Cross-Platform Issues

If you're experiencing issues on Windows or different OSes:
1. Make sure your Git is configured to use Unix-style line endings
2. Run in debug mode to check path normalization 
3. If a specific story isn't being detected, try comparing the normalized paths

### Server Cleanup Issues

If the server doesn't shut down properly:
1. The script now includes a timeout that will force shutdown after 5 seconds
2. You can check running Node processes with:
   ```bash
   # On Unix-like systems
   ps aux | grep node
   
   # On Windows
   tasklist | findstr node
   ```

## Override Mechanism

For emergency commits when you can't fix violations immediately:

```bash
# Skip with environment variable
A11Y_SKIP=1 git commit -m "urgent: deploy hotfix"

# IMPORTANT: Always create a follow-up task
```

**⚠️ Warning**: Overrides should be rare. Always document why and create a task to fix the issues.

## Configuration

The accessibility checks use the same configuration as CI:
- **Config File**: `.storybook/test-runner.js`
- **Severity Levels**: Critical and serious violations block commits
- **Rule Source**: axe-core WCAG 2.1 Level AA rules

## Best Practices

1. **Fix, Don't Skip**: Always try to fix violations rather than skipping checks
2. **Test Early**: Run `npm run storybook` while developing to catch issues early
3. **Small Commits**: Smaller changesets make violations easier to fix
4. **Document Skips**: If you must skip a rule, always document why
5. **Follow Up**: Create tasks for any skipped checks

## Technical Details

### Architecture

```
git commit
  ↓
.husky/pre-commit
  ↓
scripts/check-a11y-staged-stories.js
  ↓
test-storybook (for staged files only)
  ↓
.storybook/test-runner.js (axe-core)
  ↓
Pass/Fail decision
```

### File Locations

- **Hook**: `.husky/pre-commit`
- **Script**: `scripts/check-a11y-staged-stories.js`
- **Config**: `.storybook/test-runner.js`
- **Tests**: `scripts/__tests__/check-a11y-staged-stories.test.js`

### Environment Variables

- `A11Y_SKIP=1`: Skip accessibility checks (emergency use only)
- `DEBUG=1`: Show detailed output for troubleshooting

## Contributing

To improve the accessibility check system:

1. **Update Script**: Modify `scripts/check-a11y-staged-stories.js`
2. **Test Changes**: Run `npm test scripts/__tests__/check-a11y-staged-stories.test.js`
3. **Update Docs**: Keep this documentation in sync
4. **Test Hook**: Create test commits with known violations

## Related Documentation

- [Accessibility CI Setup](./ACCESSIBILITY_CI_SETUP.md) - CI/CD accessibility configuration
- [Storybook Documentation](./STORYBOOK.md) - General Storybook setup
- [Development Philosophy](./DEVELOPMENT_PHILOSOPHY.md) - Overall development principles
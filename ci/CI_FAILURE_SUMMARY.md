# CI Failure Summary

**Date**: 2025-05-28
**Branch**: feature/atomic-design-storybook
**PR**: #19
**Commit**: Latest push after accessibility documentation enhancements

## Overview

Two CI checks are failing, preventing PR merge:
1. build-and-test (Jest unit tests)
2. storybook-a11y (Storybook accessibility tests)

## Failure Details

### 1. build-and-test Job Failure

**Status**: ❌ Failed
**Duration**: ~2 minutes
**Failed Step**: Run tests

#### Error Details

```
FAIL src/components/atoms/__tests__/Button.icon-accessibility.test.tsx
  Button Component - Icon Accessibility
    Icon-only buttons
      ✕ should have aria-label for icon-only primary button (89 ms)
      ✕ should have aria-label for icon-only secondary button (17 ms)
      ✕ should have aria-label for icon-only danger button (14 ms)
      ✓ should not require aria-label when button has text content (12 ms)

  ● Button Component - Icon Accessibility › Icon-only buttons › should have aria-label for icon-only primary button

    expect(element).toHaveAccessibleName()

    Expected element to have an accessible name, but it does not.
    Icon-only button must have an accessible name. Add aria-label, aria-labelledby, or visible text content.

      18 |     render(<Button icon="github" />);
      19 |     const button = screen.getByRole('button');
    > 20 |     expect(button).toHaveAccessibleName();
         |                    ^
```

**Root Cause**: Button component tests are expecting icon-only buttons to have accessible names (aria-label), but the test cases are not providing aria-label props when rendering icon-only buttons.

**Affected Files**:
- `src/components/atoms/__tests__/Button.icon-accessibility.test.tsx`

### 2. storybook-a11y Job Failure

**Status**: ❌ Failed
**Duration**: ~1 minute
**Failed Step**: Run accessibility tests on Storybook

#### Error Details

```
Running 2 tests using 2 workers

  ✘ [chromium] › src/components/atoms/Button.stories.tsx:6:5 › smoke-test (529ms)

  1) [chromium] › src/components/atoms/Button.stories.tsx:6:5 › smoke-test ─────────────────────

    TypeError: Rules property must be an array

       at .../node_modules/axe-core/lib/core/base/audit.js:147:11
       at node_modules/@storybook/test-runner/dist/test-storybook.js:6:1146
```

**Root Cause**: The Storybook test-runner configuration for axe-playwright is receiving an invalid `rules` configuration. The axe-core library expects the `rules` property to be an array, but it's receiving a different type.

**Affected Files**:
- `.storybook/test-runner.js` (configuration issue)
- Potentially all Storybook story files during a11y testing

## Impact

1. **Development Workflow**: PR cannot be merged until both checks pass
2. **Test Coverage**: Accessibility tests are not running properly in Storybook
3. **Quality Gates**: Pre-merge quality checks are blocked

## Immediate Actions Required

1. Fix Button component test cases to properly test icon-only accessibility
2. Correct the Storybook test-runner configuration for axe-playwright
3. Re-run CI checks to verify fixes

## Related Documentation

- [Button Component Tests](src/components/atoms/__tests__/Button.icon-accessibility.test.tsx)
- [Storybook Test Runner Config](.storybook/test-runner.js)
- [CI Workflow](.github/workflows/ci.yml)
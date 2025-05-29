# CI Resolution Plan

**Branch**: feature/atomic-design-storybook
**Target**: Resolve all CI failures for PR #19

## Resolution Tasks

### Task 1: Fix Button Icon Accessibility Tests

**Priority**: High
**Complexity**: Simple
**Files to Modify**: 
- `src/components/atoms/__tests__/Button.icon-accessibility.test.tsx`

**Root Cause Analysis**:
The test cases are rendering icon-only buttons without providing aria-label props, causing accessibility validation to fail. The tests expect icon-only buttons to have accessible names but don't provide them in the test setup.

**Solution**:
Update test cases to include proper aria-label attributes when testing icon-only buttons.

**Implementation Steps**:
1. Review failing test cases in Button.icon-accessibility.test.tsx
2. Add aria-label props to icon-only button test renders
3. Ensure test assertions match the expected behavior
4. Run tests locally to verify fixes

**Example Fix**:
```tsx
// Before
render(<Button icon="github" />);

// After
render(<Button icon="github" aria-label="GitHub" />);
```

### Task 2: Fix Storybook Test Runner Configuration

**Priority**: High
**Complexity**: Medium
**Files to Modify**:
- `.storybook/test-runner.js`

**Root Cause Analysis**:
The axe-playwright configuration in test-runner.js is passing an invalid `rules` property format. The axe-core library expects `rules` to be an array, but the current configuration is providing a different type.

**Solution**:
Review and correct the test-runner.js configuration to ensure the `rules` property is properly formatted as an array.

**Implementation Steps**:
1. Examine current test-runner.js configuration
2. Identify the malformed rules property
3. Correct the format to match axe-core expectations
4. Test locally with `npm run test-storybook`

**Expected Configuration Pattern**:
```javascript
async preRender(page, context) {
  await injectAxe(page);
},
async postRender(page, context) {
  const results = await checkA11y(page, '#root', {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
    // Ensure rules is an array
    rules: [
      // rule configurations
    ]
  });
}
```

### Task 3: Verification and Testing

**Priority**: High
**Complexity**: Simple

**Steps**:
1. Run unit tests locally: `npm test -- src/components/atoms/__tests__/Button.icon-accessibility.test.tsx`
2. Run Storybook locally: `npm run storybook`
3. Run Storybook tests: `npm run test-storybook`
4. Commit fixes with descriptive messages
5. Push to trigger CI re-run

## Success Criteria

- [ ] All Button icon accessibility tests pass
- [ ] Storybook test-runner executes without configuration errors
- [ ] All CI checks show green status
- [ ] PR is ready for merge

## Rollback Plan

If fixes introduce new issues:
1. Revert commits to last known good state
2. Create isolated test environment
3. Debug issues in isolation
4. Apply targeted fixes

## Timeline

- Task 1: 15 minutes
- Task 2: 30 minutes
- Task 3: 15 minutes
- **Total Estimated Time**: 1 hour

## Dependencies

- No external dependencies
- Fixes can be implemented independently
- Both tasks must pass for PR to be mergeable
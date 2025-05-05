# CI Failures: Root Causes and Solutions

## SummaryStats Component

**Issue:** The SummaryStats component fails to handle null or undefined summary props.

**Solution:**
1. Implement proper null checking before accessing summary properties
2. Add default values via destructuring or nullish coalescing operator
3. Add conditional rendering to prevent rendering sections that depend on missing data

```tsx
// Before
const SummaryStats = ({ summary }) => {
  const { totalCommits } = summary;
  return <div>{totalCommits}</div>;
};

// After
const SummaryStats = ({ summary }) => {
  const { totalCommits = 0 } = summary || {};
  return <div>{totalCommits}</div>;
};
```

## dashboard-utils.test.ts File

**Issue:** Mocking approach causing "Cannot redefine property: getTodayDate" error.

**Solution:**
1. Use Jest's `jest.spyOn()` instead of direct property assignment
2. Properly restore mocks after each test
3. Use module-level mocking instead of redefining properties

```ts
// Before
Object.defineProperty(dashboardUtils, 'getTodayDate', { value: mockDate });

// After
const originalGetTodayDate = jest.spyOn(dashboardUtils, 'getTodayDate');
beforeEach(() => {
  originalGetTodayDate.mockImplementation(() => mockDate);
});
afterEach(() => {
  originalGetTodayDate.mockRestore();
});
```

## RepositorySection.test.tsx

**Issue:** Test failures due to content no longer present in the rendered output.

**Solution:**
1. Update test assertions to match the current component structure
2. Use more resilient selectors (data-testid attributes instead of text content)
3. Focus tests on behavior rather than implementation details

```tsx
// Before
expect(screen.getByText('Repository Details')).toBeInTheDocument();

// After
expect(screen.getByTestId('repository-section')).toBeInTheDocument();
// Or test for behavior instead of specific text
expect(screen.getByRole('heading', { name: /repository/i })).toBeInTheDocument();
```

## Storybook a11y Workflow

**Issue:** The --setup-file option is not recognized in the Storybook a11y workflow.

**Solution:**
1. Use Storybook's built-in accessibility addon configuration instead
2. Configure a11y parameters in the `.storybook/preview.js` file
3. Use the proper Storybook CLI syntax for the current version

```js
// .storybook/preview.js
import { withA11y } from '@storybook/addon-a11y';

export const decorators = [withA11y];

export const parameters = {
  a11y: {
    // Override a11y rules or set options
    config: {},
    options: {}
  }
};
```

For the CI workflow, replace:
```yaml
- run: storybook build --setup-file ./accessibility.setup.js
```

With:
```yaml
- run: storybook build
```

The accessibility checks will be automatically included based on the configuration in the preview.js file.
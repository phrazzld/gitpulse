# Component Testing Guide

This guide explains how to run and write tests for UI components in GitPulse.

## Setup

The project now includes React component testing infrastructure using Jest and React Testing Library.

### Required Dependencies

Install the following dependencies if not already present:

```bash
npm install --save-dev @testing-library/jest-dom identity-obj-proxy jest-environment-jsdom
```

### Running Tests

```bash
# Run all React component tests
npm run test:react

# Run tests in watch mode
npm run test:react:watch

# Run tests with coverage
npm run test:react:coverage

# Run specific test file
npm run test:react src/components/ui/button.test.tsx
```

### Test Configuration

- **jest.config.react.js**: React-specific Jest configuration with jsdom environment
- **src/test/setup.ts**: Test environment setup with mocks for Next.js
- **src/test/test-utils.tsx**: Custom render function with providers

## Writing Tests

### Basic Component Test

```typescript
import { render, screen } from '@/test/test-utils';
import { Button } from './button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### Testing Interactions

```typescript
it('handles click events', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);
  
  fireEvent.click(screen.getByRole('button'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing States

```typescript
it('shows loading state', () => {
  render(<Button disabled>Loading...</Button>);
  expect(screen.getByRole('button')).toBeDisabled();
});
```

## Test Coverage

Current test coverage includes:

### Button Component ✓
- All 6 variants (default, destructive, outline, secondary, ghost, link)
- All 4 sizes (default, sm, lg, icon)
- Disabled and loading states
- Click events and keyboard accessibility
- Custom props and className
- asChild prop functionality
- Icon handling

### LoadMoreButton Component ✓
- Loading and default states
- hasMore conditional rendering
- Custom text props
- Icon transitions
- Click handler behavior
- Accessibility features

## Best Practices

1. **Use Testing Library Queries**: Prefer `getByRole`, `getByText` over test IDs
2. **Test User Behavior**: Focus on how users interact, not implementation details
3. **Test Accessibility**: Ensure components are keyboard navigable and screen reader friendly
4. **Mock External Dependencies**: Use the setup file to mock Next.js router, etc.
5. **Group Related Tests**: Use `describe` blocks for organization

## Adding New Tests

When adding tests for new components:

1. Create `ComponentName.test.tsx` alongside the component
2. Import from `@/test/test-utils` for the custom render
3. Test all variants, states, and interactions
4. Ensure accessibility compliance
5. Run tests to verify they pass

## Debugging Tests

```bash
# Run tests with debugging
node --inspect-brk node_modules/.bin/jest --config jest.config.react.js --runInBand

# Run single test file in debug mode
npm run test:react -- --runInBand --detectOpenHandles ComponentName.test.tsx
```

## CI Integration

Add to your CI pipeline:

```yaml
- name: Run Component Tests
  run: npm run test:react:coverage
```

## Future Improvements

- [ ] Add visual regression testing with Storybook
- [ ] Integrate with GitHub Actions for PR checks
- [ ] Add E2E tests for critical user flows
- [ ] Increase coverage to other components
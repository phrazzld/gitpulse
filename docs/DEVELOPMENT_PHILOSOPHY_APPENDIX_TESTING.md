# Testing Philosophy & Standards

This document formalizes GitPulse's approach to testing, including chosen frameworks, standards, and best practices.

## Testing Stack

### Unit & Component Testing
- **Framework:** Jest
- **UI Testing Library:** React Testing Library
- **Coverage Requirements:**
  - Atoms: ≥ 90%
  - Molecules: ≥ 85%
  - Organisms: ≥ 80%
  - Global: ≥ 80%

### Integration Testing
- **Framework:** Jest
- **UI Testing Library:** React Testing Library
- **Approach:** Test components and hooks in combination, with mocked external dependencies

### End-to-End Testing
- **Framework:** Playwright
- **Focus:** Critical user flows and interactions
- **Browser Coverage:** Chromium, Firefox, WebKit

### Visual Regression Testing
- **Tool:** Chromatic
- **Integration:** Storybook
- **Automation:** GitHub Actions workflow

## Testing Standards

### General Principles
1. **Test-Driven Development** is encouraged for complex features
2. **Tests as Documentation** - Tests should clearly express component behavior and requirements
3. **Isolation** - Test components in isolation with proper mocking
4. **Maintainability** - Tests should be easy to understand and maintain
5. **Speed** - Tests should run efficiently to support rapid development cycle

### Code Organization
- Place tests in `__tests__` directories alongside the code being tested
- Name test files with `.test.ts` or `.test.tsx` extensions
- Group related tests using `describe` blocks
- Use clear test descriptions with `it` or `test` that express behavior

### Mocking Guidelines
- Mock **only** external dependencies (API calls, third-party libraries)
- For component tests, render the actual component with controlled props
- Prefer explicit mocks over automatic mocks
- Document complex mocking setups
- Reset mocks between tests to prevent test pollution

### Component Testing Best Practices
1. Test components against their public API (props, events)
2. Verify rendering output and user interactions
3. Test all meaningful component states
4. Use `@testing-library/user-event` for realistic user interactions
5. Focus on behavior, not implementation details

### E2E Testing Guidelines
1. Cover critical user flows (authentication, core features)
2. Test across supported browsers
3. Include both happy path and error scenarios
4. Ensure tests are resilient to minor UI changes
5. Use explicit waiting and assertions for reliable tests

## CI Integration
- All tests run on pull requests
- Coverage reports generated and verified against thresholds
- E2E tests run on key branches
- Visual regression tests run via Chromatic

## Tooling & Commands
- `npm test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run Playwright E2E tests (to be implemented)
- `npm run chromatic` - Run visual regression tests

## Recommended Extensions
- Jest VSCode extension
- Playwright VSCode extension
- ESLint plugin for testing-library
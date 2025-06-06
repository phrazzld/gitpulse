# Testing Documentation

This directory contains documentation related to testing practices, patterns, and guidelines for the GitPulse project.

## Contents

- `APPROVED_TESTING_PATTERNS.md`: Official testing patterns and best practices
- `AUTHENTICATION_TROUBLESHOOTING.md`: Comprehensive guide for debugging authentication issues in E2E tests
- `auth-debug-quickref.md`: Quick reference for common authentication debugging commands
- `E2E_MOCK_AUTH_STRATEGY.md`: Strategy for mocking authentication in E2E tests
- `MOCKING_POLICY.md`: Guidelines for what should and should not be mocked
- `REACT_HOOKS_TESTING.md`: Patterns and utilities for testing React hooks
- `ROUTER_TESTING.md`: Guidelines for testing components with routing
- `TESTING_GUIDELINES.md`: Overall testing approach and standards

## Key Testing Utilities

- `src/lib/tests/dateMock.ts`: Utilities for safely mocking dates in tests
- `src/lib/tests/axeTest.ts`: Utilities for accessibility testing with jest-axe
- `src/lib/tests/react-test-utils.ts`: Common utilities for React component testing
- `src/lib/tests/typed-mock-utils.ts`: Typed mock utilities for TypeScript friendly mocking
- `src/lib/tests/router-context.tsx`: Next.js router testing context

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test-file.test.ts

# Run tests with coverage
npm test -- --coverage

# Run API tests
npm run test:api
```

## Mocking Strategy

See `MOCKING_POLICY.md` for our approach to mocking. In general:

- Mock only true external dependencies
- Never mock internal modules or collaborators
- Prefer refactoring for testability over extensive mocking
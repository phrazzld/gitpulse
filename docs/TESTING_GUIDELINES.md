# Testing Guidelines

This document outlines the testing practices and guidelines for the GitPulse project.

## Date Mocking

When writing tests that involve date/time functionality, you must use the centralized `dateMock` utility instead of directly manipulating `global.Date` or `Date.now`.

### Why Use dateMock?

1. **Consistency**: Ensures all date mocking follows the same pattern
2. **Maintainability**: Centralized implementation makes it easy to update
3. **Type Safety**: Properly typed mock implementation
4. **Cleanup**: Automatic restoration of original Date functionality

### How to Use dateMock

```typescript
import { createMockDate } from '@/lib/tests/dateMock';

describe('My test suite', () => {
  it('should test date-dependent functionality', () => {
    // Create a mock date
    const { restore } = createMockDate('2023-01-01T00:00:00Z');
    
    // Your test code here
    const result = someFunction(); // This will use the mocked date
    
    // Always restore the original Date
    restore();
  });
});
```

### What is NOT Allowed

The following patterns will trigger an ESLint error:

```typescript
// ❌ Direct assignment to global.Date
global.Date = jest.fn();

// ❌ Direct assignment to Date.now
Date.now = jest.fn(() => 1234567890);

// ❌ Using jest.spyOn on Date
jest.spyOn(global, 'Date');
jest.spyOn(Date, 'now');

// ❌ Using Object.defineProperty on Date
Object.defineProperty(Date, 'now', { value: () => 123 });
```

### ESLint Rule

The `gitpulse/no-direct-date-mock` ESLint rule enforces this practice in all test files. This rule:

- Applies to all files with `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` extensions
- Applies to all files in `__tests__` directories
- Allows date mocking only in the `src/lib/tests/dateMock.ts` file itself
- Provides helpful error messages with usage examples
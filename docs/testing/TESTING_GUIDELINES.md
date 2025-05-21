# Testing Guidelines

This document outlines the testing practices and guidelines for the GitPulse project.

## Date Mocking

When writing tests that involve date/time functionality, you must use the centralized `dateMock` utility instead of directly manipulating `global.Date` or `Date.now`.

### Why Use dateMock?

1. **Consistency**: Ensures all date mocking follows the same pattern across the codebase
2. **Maintainability**: Centralized implementation makes it easy to update and debug
3. **Type Safety**: Properly typed mock implementation that works seamlessly with TypeScript
4. **Cleanup**: Automatic restoration of original Date functionality prevents test pollution
5. **Reliability**: Avoids common pitfalls with date mocking that can cause flaky tests

### How to Use dateMock

#### Basic Usage

```typescript
import { createMockDate } from '@/lib/tests/dateMock';

describe('My test suite', () => {
  it('should test date-dependent functionality', () => {
    // Create a mock date
    const { restore } = createMockDate('2023-01-01T00:00:00Z');
    
    try {
      // Your test code here
      const result = someFunction(); // This will use the mocked date
      expect(result).toBe('2023-01-01');
    } finally {
      // Always restore the original Date
      restore();
    }
  });
});
```

#### Common Usage Patterns

1. **Testing Date Ranges**

```typescript
import { createMockDate } from '@/lib/tests/dateMock';
import { getDefaultDateRange } from '@/lib/dashboard-utils';

it('should return correct date range', () => {
  const { restore } = createMockDate('2023-05-20T12:00:00Z');
  
  try {
    const { startDate, endDate } = getDefaultDateRange();
    expect(startDate).toBe('2023-05-13'); // 7 days ago
    expect(endDate).toBe('2023-05-20');   // today
  } finally {
    restore();
  }
});
```

2. **Testing Time-Sensitive Operations**

```typescript
it('should expire token after 24 hours', () => {
  // Set initial time
  const { restore: restoreInitial } = createMockDate('2023-01-01T00:00:00Z');
  const token = createToken();
  restoreInitial();
  
  // Advance time by 24 hours
  const { restore: restoreExpired } = createMockDate('2023-01-02T00:00:00Z');
  
  try {
    expect(isTokenExpired(token)).toBe(true);
  } finally {
    restoreExpired();
  }
});
```

3. **Testing Multiple Date Scenarios**

```typescript
describe('date formatting', () => {
  const testCases = [
    { input: '2023-01-01T00:00:00Z', expected: '2023-01-01' },
    { input: '2023-12-31T23:59:59Z', expected: '2023-12-31' },
    { input: '2023-06-15T12:30:00Z', expected: '2023-06-15' },
  ];
  
  testCases.forEach(({ input, expected }) => {
    it(`should format ${input} correctly`, () => {
      const { restore } = createMockDate(input);
      
      try {
        expect(getTodayDate()).toBe(expected);
      } finally {
        restore();
      }
    });
  });
});
```

4. **Using with beforeEach/afterEach**

```typescript
describe('time-dependent feature', () => {
  let restore: () => void;
  
  beforeEach(() => {
    // Set consistent time for all tests in this suite
    const mock = createMockDate('2023-01-01T12:00:00Z');
    restore = mock.restore;
  });
  
  afterEach(() => {
    // Ensure cleanup even if test fails
    restore();
  });
  
  it('should use mocked date', () => {
    expect(new Date().toISOString()).toBe('2023-01-01T12:00:00.000Z');
  });
  
  it('should also use mocked date', () => {
    expect(Date.now()).toBe(new Date('2023-01-01T12:00:00Z').getTime());
  });
});
```

### What is NOT Allowed

The following patterns will trigger an ESLint error:

```typescript
// ❌ Direct assignment to global.Date
global.Date = jest.fn();
global.Date = class MockDate extends Date {};

// ❌ Direct assignment to Date.now
Date.now = jest.fn(() => 1234567890);
Date.now = () => mockTimestamp;

// ❌ Using jest.spyOn on Date
jest.spyOn(global, 'Date');
jest.spyOn(Date, 'now');
jest.spyOn(global, 'Date').mockImplementation();

// ❌ Using Object.defineProperty on Date
Object.defineProperty(Date, 'now', { value: () => 123 });
Object.defineProperty(global, 'Date', { value: MockDate });

// ❌ Using external date mocking libraries directly
import MockDate from 'mockdate';
MockDate.set('2023-01-01');

// ❌ Manual prototype manipulation
Date.prototype.getTime = jest.fn();
```

### Common Mistakes to Avoid

1. **Forgetting to restore the Date object**

```typescript
// ❌ BAD: No cleanup
it('test without cleanup', () => {
  const { restore } = createMockDate('2023-01-01');
  // Missing restore() call - will affect other tests!
});

// ✅ GOOD: Proper cleanup
it('test with cleanup', () => {
  const { restore } = createMockDate('2023-01-01');
  try {
    // test code
  } finally {
    restore();
  }
});
```

2. **Multiple mock dates without cleanup**

```typescript
// ❌ BAD: Multiple mocks without proper cleanup
it('test with multiple dates', () => {
  const mock1 = createMockDate('2023-01-01');
  const mock2 = createMockDate('2023-02-01'); // This overrides mock1
  
  // Only mock2.restore() is called, mock1 is leaked
  mock2.restore();
});

// ✅ GOOD: Proper sequential mocking
it('test with multiple dates', () => {
  const mock1 = createMockDate('2023-01-01');
  // Use first mock
  mock1.restore();
  
  const mock2 = createMockDate('2023-02-01');
  // Use second mock
  mock2.restore();
});
```

### ESLint Rule

The `gitpulse/no-direct-date-mock` ESLint rule enforces this practice in all test files. This rule:

- Applies to all files with `.test.ts`, `.test.tsx`, `.spec.ts`, `.spec.tsx` extensions
- Applies to all files in `__tests__` directories
- Allows date mocking only in the `src/lib/tests/dateMock.ts` file itself
- Provides helpful error messages with usage examples
- Catches all common anti-patterns for date mocking
- Ensures consistent date mocking across the entire codebase

### Best Practices

1. **Always use try/finally for cleanup**
   ```typescript
   const { restore } = createMockDate('2023-01-01');
   try {
     // Your test code
   } finally {
     restore();
   }
   ```

2. **Mock at the appropriate level**
   - For single test: Mock within the test
   - For multiple tests: Mock in beforeEach/afterEach
   - For entire suite: Mock at describe level with setup/teardown

3. **Use meaningful dates**
   - Use dates that make sense for your test scenario
   - Avoid edge cases unless specifically testing them
   - Consider timezone implications

4. **Document why specific dates are used**
   ```typescript
   // Mock to a Monday to test week boundary logic
   const { restore } = createMockDate('2023-01-02T00:00:00Z');
   ```

5. **Test with multiple dates when appropriate**
   - Test edge cases like month boundaries, year transitions
   - Test different timezones if relevant
   - Test with past, present, and future dates

### When to Use Date Mocking

1. **Testing date-dependent business logic**
   - Date range calculations
   - Age calculations
   - Time-based feature flags
   - Expiration logic

2. **Testing UI components that display dates**
   - Date pickers
   - Relative time displays (e.g., "3 days ago")
   - Calendar components

3. **Testing API calls with date parameters**
   - Ensuring correct date formatting
   - Testing date range filters
   - Validating timestamp generation

4. **Testing scheduled tasks or time-based events**
   - Cron job execution
   - Reminder notifications
   - Session timeout logic

### Migration Guide

If you have existing tests using direct date mocking, follow these steps to migrate:

1. Import the dateMock utility:
   ```typescript
   import { createMockDate } from '@/lib/tests/dateMock';
   ```

2. Replace direct date mocking:
   ```typescript
   // Before
   global.Date = jest.fn(() => new Date('2023-01-01'));
   Date.now = jest.fn(() => 1672531200000);
   
   // After
   const { restore } = createMockDate('2023-01-01T00:00:00Z');
   ```

3. Add proper cleanup:
   ```typescript
   // Add finally block or afterEach
   finally {
     restore();
   }
   ```

4. Run tests to ensure they still pass

5. Run ESLint to verify compliance:
   ```bash
   npm run lint
   ```
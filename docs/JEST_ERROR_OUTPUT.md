# Jest Error Output Guidelines

This document explains how to get the most out of GitPulse's enhanced Jest error output configuration, which is designed to make test failures more informative and easier to debug.

## Table of Contents

- [Overview](#overview)
- [Enhanced Error Output Features](#enhanced-error-output-features)
- [Custom Matchers](#custom-matchers)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

Testing complex objects and asynchronous operations can lead to cryptic error messages that obscure the root cause of test failures. Our enhanced Jest configuration provides clearer, more detailed error output with better formatting, precise difference highlighting, and custom matchers tailored to common testing patterns in our codebase.

## Enhanced Error Output Features

The following improvements have been made to Jest's error reporting:

### 1. Better Object Formatting

- Objects and arrays are formatted with clear indentation and line breaks
- Complex nested structures are easier to read in error messages
- Primitive values are displayed with appropriate type indicators

### 2. Detailed Diff Visualization

- Differences between expected and actual values are highlighted more clearly
- The first point of difference in complex objects is specifically identified
- Missing or additional properties are clearly indicated

### 3. Custom Console Output Enhancements

- Error messages are post-processed to improve readability
- Key information is separated visually for faster comprehension
- Array and object diffs have improved formatting

## Custom Matchers

The following custom matchers are available for more detailed error reporting:

### `toEqualWithDetail`

Use instead of Jest's built-in `toEqual` when comparing complex objects:

```typescript
// Instead of:
expect(result).toEqual(expectedObject);

// Use:
expect(result).toEqualWithDetail(expectedObject);
```

The error output will include a detailed breakdown of exactly where the objects differ, making it much easier to identify issues.

### `toMatchObjectWithDetail`

Similar to Jest's `toMatchObject` but with improved error reporting for partial object matching:

```typescript
// Instead of:
expect(result).toMatchObject({ status: 'success', count: 5 });

// Use:
expect(result).toMatchObjectWithDetail({ status: 'success', count: 5 });
```

This matcher will provide clear indication of which specific properties failed to match.

## Best Practices

To get the most informative error messages in your tests:

1. **Use Custom Matchers for Complex Objects**
   - Prefer `toEqualWithDetail` over `toEqual` for objects with nested structures
   - Use `toMatchObjectWithDetail` when checking if an object contains certain properties

2. **Write Descriptive Test Names**
   - Clear test descriptions help contextualize error messages
   - Use the describe/it pattern to create a clear hierarchy

3. **Test One Thing per Test**
   - Single-purpose tests make error messages more focused and useful
   - Multiple assertions in one test can obscure which one failed

4. **Include Context in Custom Error Messages**
   - Add meaningful context to assertions: `expect(value).toBe(expected, 'User ID should match after update')`

5. **Test Edge Cases Separately**
   - Have dedicated tests for error conditions, boundary values, and special cases

## Examples

### Comparing Complex Objects

```typescript
test('processes user data correctly', () => {
  const result = processUserData(rawData);
  
  expect(result).toEqualWithDetail({
    id: '123',
    profile: {
      name: 'Test User',
      settings: {
        theme: 'dark',
        notifications: true
      }
    },
    metrics: {
      lastActive: expect.any(String),
      loginCount: 5
    }
  });
});
```

If the test fails, you'll get a detailed error message showing exactly which nested property caused the failure.

### Async/API Test Example

```typescript
test('API returns correct user data', async () => {
  // Setup...
  const response = await fetchUserData(123);
  
  expect(response.status).toBe(200);
  expect(response.data).toMatchObjectWithDetail({
    user: {
      id: 123,
      name: 'Test User',
      isActive: true
    }
  });
});
```

### Using Find First Difference

For debugging in test files or for custom error messages:

```typescript
import { findFirstDifference } from '@/lib/tests/jestHelpers';

test('complex calculation produces expected result', () => {
  const actual = performCalculation();
  const expected = { /* ... */ };
  
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    console.log('First difference:', findFirstDifference(actual, expected));
  }
  
  expect(actual).toEqualWithDetail(expected);
});
```

## Troubleshooting

If you encounter issues with the error output:

1. **Error Output Too Verbose**
   - Use `toMatchObjectWithDetail` instead of `toEqualWithDetail` when you only care about specific properties

2. **Differences Not Highlighted Clearly**
   - Try using `console.log(findFirstDifference(actual, expected))` before your assertion to pinpoint the issue

3. **Custom Matchers Not Available**
   - Ensure your test file is using the correct Jest environment and setup files
   - Check that you're not accidentally overriding Jest's global settings

4. **Objects Appear Truncated in Output**
   - Set larger maxConcurrentWorkers for tests that need to show large object diffs
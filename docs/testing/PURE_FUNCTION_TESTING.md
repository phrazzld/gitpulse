# Pure Function Testing Guide

## Overview

This guide demonstrates how to write comprehensive tests for pure functions without using mocks, spies, or test doubles. Pure function testing is the foundation of our testing strategy, providing fast, reliable, and maintainable tests.

## Core Principles

### 1. No Mocks Required
Pure functions have no external dependencies, so no mocking is needed.

### 2. Input → Output Testing
Test by providing inputs and verifying outputs. That's it.

### 3. Deterministic Behavior
Same input always produces same output, making tests reliable.

### 4. Edge Case Coverage
Test boundary conditions, empty inputs, and error cases.

## Test Structure

### Basic Test Pattern

```typescript
// src/core/github/commits.test.ts
import { filterCommitsByDateRange } from './commits';
import type { CommitData } from '../types';

describe('filterCommitsByDateRange', () => {
  // Create test data factory
  const createCommit = (overrides: Partial<CommitData> = {}): CommitData => ({
    sha: 'abc123',
    message: 'feat: add feature',
    author: 'john.doe',
    date: '2023-06-15T10:00:00Z',
    repository: 'test-repo',
    ...overrides
  });

  it('should filter commits within date range', () => {
    // Arrange
    const commits = [
      createCommit({ sha: '1', date: '2023-06-10T10:00:00Z' }),
      createCommit({ sha: '2', date: '2023-06-15T10:00:00Z' }),
      createCommit({ sha: '3', date: '2023-06-20T10:00:00Z' })
    ];
    const start = new Date('2023-06-12T00:00:00Z');
    const end = new Date('2023-06-18T00:00:00Z');

    // Act
    const result = filterCommitsByDateRange(start, end)(commits);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].sha).toBe('2');
  });
});
```

## Testing Categories

### 1. Happy Path Tests

Test normal, expected usage:

```typescript
describe('calculateSummaryStats', () => {
  it('should calculate correct statistics for normal data', () => {
    const commits = [
      createCommit({ author: 'alice', repository: 'frontend' }),
      createCommit({ author: 'bob', repository: 'frontend' }),
      createCommit({ author: 'alice', repository: 'backend' })
    ];

    const stats = calculateSummaryStats(commits);

    expect(stats.totalCommits).toBe(3);
    expect(stats.uniqueAuthors).toBe(2);
    expect(stats.repositories).toEqual(['frontend', 'backend']);
  });
});
```

### 2. Edge Cases

Test boundary conditions and unusual inputs:

```typescript
describe('Edge Cases', () => {
  it('should handle empty input', () => {
    const result = calculateSummaryStats([]);
    
    expect(result.totalCommits).toBe(0);
    expect(result.uniqueAuthors).toBe(0);
    expect(result.repositories).toEqual([]);
  });

  it('should handle single commit', () => {
    const commits = [createCommit({ author: 'solo' })];
    const result = calculateSummaryStats(commits);
    
    expect(result.totalCommits).toBe(1);
    expect(result.uniqueAuthors).toBe(1);
  });

  it('should handle duplicate data', () => {
    const commits = [
      createCommit({ author: 'alice', repository: 'repo' }),
      createCommit({ author: 'alice', repository: 'repo' })
    ];
    const result = calculateSummaryStats(commits);
    
    expect(result.totalCommits).toBe(2);
    expect(result.uniqueAuthors).toBe(1); // Deduplicated
  });
});
```

### 3. Error Handling

Test invalid inputs and error conditions:

```typescript
describe('Error Handling', () => {
  it('should handle malformed dates gracefully', () => {
    const commits = [
      createCommit({ date: 'invalid-date' }),
      createCommit({ date: '2023-06-15T10:00:00Z' })
    ];
    
    const start = new Date('2023-06-14T00:00:00Z');
    const end = new Date('2023-06-16T00:00:00Z');
    
    const result = filterCommitsByDateRange(start, end)(commits);
    
    // Should filter out invalid dates
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2023-06-15T10:00:00Z');
  });

  it('should handle special characters in strings', () => {
    const commits = [
      createCommit({
        message: 'feat: add emoji support 🚀',
        author: 'user@domain.com'
      })
    ];
    
    const result = extractUniqueAuthors(commits);
    
    expect(result).toContain('user@domain.com');
  });
});
```

## Advanced Testing Patterns

### 1. Property-Based Testing

Test function properties rather than specific outputs:

```typescript
describe('Function Properties', () => {
  it('should not mutate original input', () => {
    const original = [createCommit(), createCommit()];
    const input = [...original];
    
    filterCommitsByDateRange(new Date(), new Date())(input);
    
    expect(input).toEqual(original);
  });

  it('should be deterministic', () => {
    const commits = [createCommit(), createCommit()];
    
    const result1 = calculateSummaryStats(commits);
    const result2 = calculateSummaryStats(commits);
    
    expect(result1).toEqual(result2);
  });

  it('should work with readonly arrays', () => {
    const commits: readonly CommitData[] = [createCommit()];
    
    // Should compile and work with readonly input
    const result = calculateSummaryStats(commits);
    
    expect(result.totalCommits).toBe(1);
  });
});
```

### 2. Compositional Testing

Test function composition and pipelines:

```typescript
describe('Function Composition', () => {
  it('should compose multiple transformations', () => {
    const commits = [
      createCommit({ author: 'alice', date: '2023-06-15T10:00:00Z' }),
      createCommit({ author: 'bob', date: '2023-06-16T10:00:00Z' }),
      createCommit({ author: 'alice', date: '2023-06-20T10:00:00Z' })
    ];
    
    const result = pipe(
      commits,
      filterCommitsByDateRange(
        new Date('2023-06-15T00:00:00Z'), 
        new Date('2023-06-17T00:00:00Z')
      ),
      filterCommitsByAuthors(['alice']),
      calculateSummaryStats
    );
    
    expect(result.totalCommits).toBe(1);
    expect(result.uniqueAuthors).toBe(1);
  });
});
```

### 3. Data-Driven Tests

Use parameterized tests for multiple scenarios:

```typescript
describe('Date Range Validation', () => {
  it.each([
    ['valid range', '2023-01-01', '2023-12-31', true],
    ['end before start', '2023-12-31', '2023-01-01', false],
    ['same date', '2023-06-15', '2023-06-15', false],
    ['future date', '2023-06-15', '2025-01-01', false]
  ])('should handle %s', (scenario, startDate, endDate, expected) => {
    const result = validateDateRange(
      new Date(startDate), 
      new Date(endDate)
    );
    
    expect(result.success).toBe(expected);
  });
});
```

## Test Organization

### File Structure

```
src/core/
├── github/
│   ├── commits.ts
│   └── commits.test.ts
├── summary/
│   ├── generator.ts
│   └── generator.test.ts
├── validation/
│   ├── summary.ts
│   └── summary.test.ts
└── types/
    ├── index.ts
    └── index.test.ts
```

### Test Naming

```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
    
    it('should handle [edge case]', () => {
      // Edge case test
    });
    
    it('should throw when [invalid condition]', () => {
      // Error case test
    });
  });
});
```

## Test Data Management

### 1. Test Factories

Create reusable test data builders:

```typescript
// Test data factory
const createCommit = (overrides: Partial<CommitData> = {}): CommitData => ({
  sha: 'default-sha',
  message: 'default message',
  author: 'default-author',
  date: '2023-06-15T10:00:00Z',
  repository: 'default-repo',
  additions: 10,
  deletions: 5,
  ...overrides
});

// Usage in tests
const commits = [
  createCommit({ author: 'alice', additions: 100 }),
  createCommit({ author: 'bob', deletions: 50 })
];
```

### 2. Test Data Sets

Define reusable test scenarios:

```typescript
const testScenarios = {
  emptyData: [],
  singleCommit: [createCommit()],
  multipleAuthors: [
    createCommit({ author: 'alice' }),
    createCommit({ author: 'bob' })
  ],
  sameAuthor: [
    createCommit({ author: 'alice', sha: '1' }),
    createCommit({ author: 'alice', sha: '2' })
  ]
};
```

## Performance Testing

Test performance characteristics of pure functions:

```typescript
describe('Performance', () => {
  it('should handle large datasets efficiently', () => {
    const largeDataset = Array(10000).fill(null).map((_, i) => 
      createCommit({ sha: `commit-${i}` })
    );
    
    const start = performance.now();
    const result = calculateSummaryStats(largeDataset);
    const duration = performance.now() - start;
    
    expect(result.totalCommits).toBe(10000);
    expect(duration).toBeLessThan(100); // Should be fast
  });
});
```

## Anti-Patterns to Avoid

### ❌ Don't Mock Pure Functions

```typescript
// BAD: Mocking a pure function
jest.mock('../commits', () => ({
  filterCommitsByDateRange: jest.fn()
}));
```

### ❌ Don't Test Implementation Details

```typescript
// BAD: Testing internal implementation
it('should call Array.filter once', () => {
  const spy = jest.spyOn(Array.prototype, 'filter');
  filterCommitsByDateRange(start, end)(commits);
  expect(spy).toHaveBeenCalledTimes(1);
});
```

### ❌ Don't Use Side Effects in Tests

```typescript
// BAD: Side effects in test setup
beforeEach(() => {
  global.console.log = jest.fn(); // Side effect
});
```

## Benefits of Pure Function Testing

1. **Fast Execution**: No I/O or async operations
2. **Reliable Results**: Deterministic, no flaky tests
3. **Easy to Write**: Simple input → output verification
4. **Easy to Debug**: Clear failure points
5. **Refactor-Safe**: Tests verify behavior, not implementation
6. **No Maintenance**: No mock updates needed

## See Also

- [Effect Testing Guide](EFFECT_TESTING.md)
- [Functional Core Architecture](../architecture/FUNCTIONAL_CORE_IMPERATIVE_SHELL.md)
- [Migration Guide](../MIGRATION_GUIDE.md)
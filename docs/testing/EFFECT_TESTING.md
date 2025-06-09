# Effect Pattern Testing Guide

## Overview

Effects in GitPulse represent deferred computations that may perform I/O operations. This guide shows how to test Effect-based code using test data providers instead of mocks, maintaining the functional programming principles while testing complex workflows.

## Effect System Basics

### Effect Types

```typescript
// Basic effect that wraps async computation
type Effect<T> = () => Promise<T>;

// I/O effect with runtime discrimination
type IOEffect<T> = Effect<T> & { _tag: 'IOEffect' };

// Log effect for logging operations
type LogEffect = Effect<void> & { _tag: 'LogEffect' };
```

### Effect Constructors

```typescript
// Create successful effect
const succeed = <T>(value: T): Effect<T> => 
  async () => value;

// Create failing effect
const fail = (error: Error): Effect<never> => 
  async () => { throw error; };

// Create I/O effect
const ioEffect = <T>(computation: () => Promise<T>): IOEffect<T> => {
  const effect = computation as IOEffect<T>;
  effect._tag = 'IOEffect';
  return effect;
};
```

## Testing Strategy

### 1. Test Effect Construction (Not Execution)

Effects should defer execution until called, so test the effect creation separately from execution:

```typescript
describe('createSummaryWorkflow', () => {
  it('should create an effect without executing', () => {
    let executionCount = 0;
    const dataProvider: DataProvider = {
      fetchCommits: () => ioEffect(async () => {
        executionCount++;
        return [];
      })
    };
    
    const effect = createSummaryWorkflow(validRequest, dataProvider);
    
    // Effect created but not executed
    expect(typeof effect).toBe('function');
    expect(executionCount).toBe(0);
  });
});
```

### 2. Test Effect Execution with Test Data Providers

Use test data providers instead of mocks to supply predictable data:

```typescript
describe('Effect Execution', () => {
  // Test data provider - NOT a mock
  const createTestDataProvider = (commits: readonly CommitData[]): DataProvider => ({
    fetchCommits: (repositories, dateRange, branch) => 
      ioEffect(async () => {
        // Simulate filtering by repository
        return commits.filter(c => repositories.includes(c.repository));
      })
  });

  it('should execute workflow and return statistics', async () => {
    const testCommits = [
      createCommit({ repository: 'frontend', author: 'alice' }),
      createCommit({ repository: 'backend', author: 'bob' })
    ];
    
    const dataProvider = createTestDataProvider(testCommits);
    const effect = createSummaryWorkflow(validRequest, dataProvider);
    
    const result = await effect();
    
    expect(result.totalCommits).toBe(2);
    expect(result.uniqueAuthors).toBe(2);
  });
});
```

### 3. Test Error Handling and Recovery

Test error scenarios using error-throwing data providers:

```typescript
describe('Error Handling', () => {
  const createErrorDataProvider = (error: Error): DataProvider => ({
    fetchCommits: () => ioEffect(async () => {
      throw error;
    })
  });

  it('should handle network errors gracefully', async () => {
    const networkError = new Error('Network timeout');
    const dataProvider = createErrorDataProvider(networkError);
    const effect = createSummaryWorkflow(validRequest, dataProvider);
    
    await expect(effect()).rejects.toThrow('Failed to fetch data from GitHub');
  });

  it('should transform validation errors to user-friendly messages', async () => {
    const invalidRequest = { repositories: [] }; // Invalid
    const dataProvider = createTestDataProvider([]);
    const effect = createSummaryWorkflow(invalidRequest, dataProvider);
    
    await expect(effect()).rejects.toThrow('Validation failed');
  });
});
```

## Advanced Testing Patterns

### 1. Test Effect Composition

Test how effects are chained and composed:

```typescript
describe('Effect Composition', () => {
  it('should compose effects in correct order', async () => {
    const executionOrder: string[] = [];
    
    const dataProvider: DataProvider = {
      fetchCommits: () => ioEffect(async () => {
        executionOrder.push('fetch');
        return sampleCommits;
      })
    };
    
    const effect = createSummaryWorkflow(validRequest, dataProvider);
    const result = await effect();
    
    executionOrder.push('calculate');
    
    expect(executionOrder).toEqual(['fetch', 'calculate']);
    expect(result.totalCommits).toBeGreaterThan(0);
  });

  it('should short-circuit on validation errors', async () => {
    let fetchCalled = false;
    
    const dataProvider: DataProvider = {
      fetchCommits: () => ioEffect(async () => {
        fetchCalled = true;
        return [];
      })
    };
    
    const invalidRequest = { repositories: [] };
    const effect = createSummaryWorkflow(invalidRequest, dataProvider);
    
    await expect(effect()).rejects.toThrow();
    expect(fetchCalled).toBe(false); // Should not reach fetch
  });
});
```

### 2. Test Effect Cancellation and Cleanup

Test that effects can be cancelled and cleaned up properly:

```typescript
describe('Effect Cancellation', () => {
  it('should handle effect cancellation', async () => {
    let cleanupCalled = false;
    
    const dataProvider: DataProvider = {
      fetchCommits: () => ioEffect(async () => {
        return new Promise((resolve) => {
          const timeout = setTimeout(() => resolve([]), 1000);
          
          // Cleanup handler
          process.on('beforeExit', () => {
            clearTimeout(timeout);
            cleanupCalled = true;
          });
        });
      })
    };
    
    const effect = createSummaryWorkflow(validRequest, dataProvider);
    
    // Start effect but don't wait for completion
    const promise = effect();
    
    // Simulate cancellation
    process.emit('beforeExit', 0);
    
    expect(cleanupCalled).toBe(true);
  });
});
```

### 3. Test Concurrent Effects

Test multiple effects running in parallel:

```typescript
describe('Concurrent Effects', () => {
  it('should handle concurrent requests', async () => {
    const dataProvider = createTestDataProvider(sampleCommits);
    
    const effects = [
      createSummaryWorkflow(validRequest, dataProvider),
      createSummaryWorkflow(validRequest, dataProvider),
      createSummaryWorkflow(validRequest, dataProvider)
    ];
    
    const results = await Promise.all(effects.map(e => e()));
    
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.totalCommits).toBe(sampleCommits.length);
    });
  });

  it('should handle partial failures in concurrent execution', async () => {
    const successProvider = createTestDataProvider(sampleCommits);
    const errorProvider = createErrorDataProvider(new Error('Test error'));
    
    const effects = [
      createSummaryWorkflow(validRequest, successProvider),
      createSummaryWorkflow(validRequest, errorProvider),
      createSummaryWorkflow(validRequest, successProvider)
    ];
    
    const results = await Promise.allSettled(effects.map(e => e()));
    
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[2].status).toBe('fulfilled');
  });
});
```

## Testing Complex Workflows

### Service-Level Testing

Test complete service workflows with realistic scenarios:

```typescript
describe('Summary Service Workflows', () => {
  it('should handle complete user workflow', async () => {
    // Simulate realistic user data
    const userCommits = [
      createCommit({ 
        author: 'john.doe', 
        repository: 'frontend',
        date: '2023-06-15T10:00:00Z',
        additions: 50,
        deletions: 10
      }),
      createCommit({ 
        author: 'john.doe', 
        repository: 'backend',
        date: '2023-06-16T14:00:00Z',
        additions: 30,
        deletions: 5
      })
    ];
    
    const dataProvider = createTestDataProvider(userCommits);
    const effect = summaryService.generateSummary(
      {
        repositories: ['frontend', 'backend'],
        dateRange: {
          start: new Date('2023-06-15T00:00:00Z'),
          end: new Date('2023-06-20T00:00:00Z')
        },
        users: ['john.doe']
      },
      dataProvider
    );
    
    const result = await effect();
    
    expect(result.totalCommits).toBe(2);
    expect(result.totalAdditions).toBe(80);
    expect(result.totalDeletions).toBe(15);
    expect(result.commitsByAuthor['john.doe']).toBe(2);
  });
});
```

### Integration Testing

Test integration between multiple services:

```typescript
describe('Service Integration', () => {
  it('should integrate validation, fetching, and calculation', async () => {
    const request = {
      repositories: ['test-repo'],
      dateRange: {
        start: new Date('2023-06-15T00:00:00Z'),
        end: new Date('2023-06-20T00:00:00Z')
      }
    };
    
    // Test the complete pipeline
    const validationResult = summaryService.validateRequest(request);
    expect(validationResult.success).toBe(true);
    
    if (validationResult.success) {
      const dataProvider = createTestDataProvider(sampleCommits);
      const effect = summaryService.generateSummary(
        validationResult.data,
        dataProvider
      );
      
      const result = await effect();
      expect(result).toBeDefined();
    }
  });
});
```

## Test Data Providers

### Realistic Data Providers

Create data providers that simulate real API behavior:

```typescript
const createRealisticDataProvider = (): DataProvider => ({
  fetchCommits: (repositories, dateRange, branch) => 
    ioEffect(async () => {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Simulate realistic GitHub API response
      return repositories.flatMap(repo => [
        createCommit({
          repository: repo,
          author: 'team-lead',
          message: 'feat: implement new feature',
          additions: 120,
          deletions: 30,
          date: dateRange.start.toISOString()
        }),
        createCommit({
          repository: repo,
          author: 'developer',
          message: 'fix: resolve critical bug',
          additions: 15,
          deletions: 8,
          date: new Date(dateRange.start.getTime() + 86400000).toISOString()
        })
      ]);
    })
});
```

### Configurable Data Providers

Create parameterized providers for different scenarios:

```typescript
const createConfigurableDataProvider = (config: {
  commitCount?: number;
  authors?: string[];
  repositories?: string[];
  errorRate?: number;
}) => ({
  fetchCommits: () => ioEffect(async () => {
    // Simulate random errors
    if (Math.random() < (config.errorRate || 0)) {
      throw new Error('Simulated API error');
    }
    
    return Array(config.commitCount || 10).fill(null).map((_, i) => 
      createCommit({
        sha: `commit-${i}`,
        author: config.authors?.[i % config.authors.length] || 'default-author',
        repository: config.repositories?.[i % config.repositories.length] || 'default-repo'
      })
    );
  })
});
```

## Benefits of Effect Testing

### 1. No Mocking Complexity
- Test data providers simulate real behavior
- No brittle mock setup and teardown
- Easy to understand test intentions

### 2. Real Integration Testing
- Tests actual effect composition
- Verifies error handling paths
- Catches integration issues

### 3. Maintainable Tests
- Data providers evolve with domain model
- No mock maintenance overhead
- Clear separation of test concerns

## Anti-Patterns to Avoid

### ❌ Don't Mock Internal Effects

```typescript
// BAD: Mocking internal effect functions
jest.mock('../effects/types', () => ({
  ioEffect: jest.fn()
}));
```

### ❌ Don't Test Effect Implementation Details

```typescript
// BAD: Testing internal effect structure
it('should create IOEffect with correct tag', () => {
  const effect = ioEffect(async () => 'test');
  expect(effect._tag).toBe('IOEffect'); // Implementation detail
});
```

### ❌ Don't Mix Effect Testing with Unit Testing

```typescript
// BAD: Testing pure functions inside effect tests
it('should calculate statistics correctly', async () => {
  const effect = createSummaryWorkflow(request, provider);
  const result = await effect();
  
  // This should be in pure function tests
  expect(result.totalCommits).toBe(calculateTotalCommits(commits));
});
```

## Best Practices

1. **Separate Effect Construction from Execution**: Test that effects are created without side effects
2. **Use Test Data Providers**: Simulate real data sources with predictable behavior  
3. **Test Error Scenarios**: Use error-throwing providers to test error handling
4. **Test Effect Composition**: Verify effects chain correctly and short-circuit on errors
5. **Test Realistic Workflows**: Use representative data and realistic scenarios
6. **Keep Tests Focused**: Test one aspect of effect behavior per test

## See Also

- [Pure Function Testing Guide](PURE_FUNCTION_TESTING.md)
- [Functional Core Architecture](../architecture/FUNCTIONAL_CORE_IMPERATIVE_SHELL.md)
- [Migration Guide](../MIGRATION_GUIDE.md)
# Migration Guide: From Mocks to Functional Architecture

## Overview

This guide provides a step-by-step approach for migrating from mock-based testing to a Functional Core / Imperative Shell architecture with pure function testing. The migration can be done incrementally without disrupting existing functionality.

## Migration Strategy

### Phase 1: Foundation (Weeks 1-2)
1. Set up functional utilities
2. Establish Result and Effect type systems
3. Define core domain types

### Phase 2: Extract Business Logic (Weeks 3-6)
1. Identify and extract pure business logic
2. Create comprehensive pure function tests
3. Refactor existing code to use pure functions

### Phase 3: Implement Effect System (Weeks 7-10)
1. Create effect-based services
2. Implement data providers
3. Add service-level tests with test data providers

### Phase 4: Clean Up (Weeks 11-12)
1. Remove old test infrastructure
2. Update documentation
3. Train team on new patterns

## Step-by-Step Migration

### Step 1: Set Up Foundation

#### Create Functional Utilities

```typescript
// src/lib/functional/index.ts
export const pipe = <T>(value: T, ...fns: Array<(x: any) => any>): any =>
  fns.reduce((acc, fn) => fn(acc), value);

export const groupBy = <T>(keyFn: (item: T) => string) => 
  (items: readonly T[]): Record<string, T[]> =>
    items.reduce((groups, item) => {
      const key = keyFn(item);
      return { ...groups, [key]: [...(groups[key] || []), item] };
    }, {} as Record<string, T[]>);

// Add more utilities as needed
```

#### Establish Result Type System

```typescript
// src/lib/result/index.ts
export type Result<T, E> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const success = <T>(data: T): Result<T, never> => 
  ({ success: true, data });

export const failure = <E>(error: E): Result<never, E> => 
  ({ success: false, error });
```

#### Define Core Types

```typescript
// src/core/types/index.ts
export interface CommitData {
  readonly sha: string;
  readonly message: string;
  readonly author: string;
  readonly date: string;
  readonly repository: string;
  readonly additions?: number;
  readonly deletions?: number;
}

// Add other domain types
```

### Step 2: Identify Pure Business Logic

#### Before: Mixed Logic and Side Effects

```typescript
// BEFORE: Logic mixed with I/O
export const useSummary = () => {
  const [summary, setSummary] = useState(null);
  
  const generateSummary = async (repos: string[]) => {
    try {
      // Validation mixed with I/O
      if (repos.length === 0) {
        throw new Error('No repos selected');
      }
      
      // I/O operation
      const response = await fetch('/api/commits', {
        method: 'POST',
        body: JSON.stringify({ repositories: repos })
      });
      const commits = await response.json();
      
      // Business logic mixed with I/O
      let totalCommits = 0;
      let uniqueAuthors = new Set();
      let repoStats = {};
      
      for (const commit of commits) {
        totalCommits++;
        uniqueAuthors.add(commit.author);
        repoStats[commit.repository] = (repoStats[commit.repository] || 0) + 1;
      }
      
      setSummary({
        totalCommits,
        uniqueAuthors: uniqueAuthors.size,
        topRepositories: Object.entries(repoStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      });
    } catch (error) {
      setError(error.message);
    }
  };
  
  return { summary, generateSummary };
};
```

#### After: Separated Pure and Impure Logic

```typescript
// AFTER: Pure business logic extracted
// src/core/summary/generator.ts
export const calculateSummaryStats = (commits: readonly CommitData[]): SummaryStats => {
  const totalCommits = commits.length;
  const uniqueAuthors = extractUniqueAuthors(commits).length;
  const topRepositories = getTopRepositoriesByCommits(commits, 5);
  
  return {
    totalCommits,
    uniqueAuthors,
    topRepositories
  };
};

// src/hooks/useSummary.ts (Imperative shell)
export const useSummary = () => {
  const [summary, setSummary] = useState(null);
  
  const generateSummary = async (repos: string[]) => {
    try {
      // 1. Validate (pure function)
      const validation = validateRepositories(repos);
      if (!validation.success) {
        throw new Error(validation.error);
      }
      
      // 2. Fetch data (I/O)
      const commits = await dataProvider.fetchCommits(repos);
      
      // 3. Calculate (pure function)
      const stats = calculateSummaryStats(commits);
      
      // 4. Update state (side effect)
      setSummary(stats);
    } catch (error) {
      setError(error.message);
    }
  };
  
  return { summary, generateSummary };
};
```

### Step 3: Extract Pure Functions Incrementally

#### Identify Extraction Candidates

Look for code that:
- Performs calculations or transformations
- Has deterministic behavior
- Doesn't depend on external state
- Can be tested with input/output verification

#### Example: Extract Validation Logic

```typescript
// BEFORE: Inline validation
const generateSummary = async (request: any) => {
  if (!request.repositories || request.repositories.length === 0) {
    throw new Error('At least one repository required');
  }
  if (!request.dateRange || !request.dateRange.start) {
    throw new Error('Start date required');
  }
  // ... more validation
};

// AFTER: Pure validation function
// src/core/validation/summary.ts
export const validateSummaryRequest = (
  request: unknown
): Result<SummaryRequest, string[]> => {
  const errors: string[] = [];
  
  if (!request || typeof request !== 'object') {
    return failure(['Request must be an object']);
  }
  
  const req = request as any;
  
  if (!req.repositories || req.repositories.length === 0) {
    errors.push('At least one repository required');
  }
  
  if (!req.dateRange?.start) {
    errors.push('Start date required');
  }
  
  if (errors.length > 0) {
    return failure(errors);
  }
  
  return success({
    repositories: req.repositories,
    dateRange: req.dateRange
  });
};
```

### Step 4: Write Pure Function Tests

#### Replace Mock-Based Tests

```typescript
// BEFORE: Mock-based test
describe('useSummary', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });
  
  it('should generate summary', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve([
        { author: 'alice', repository: 'repo1' },
        { author: 'bob', repository: 'repo2' }
      ])
    });
    
    const { result } = renderHook(() => useSummary());
    await act(async () => {
      await result.current.generateSummary(['repo1', 'repo2']);
    });
    
    expect(result.current.summary.totalCommits).toBe(2);
  });
});

// AFTER: Pure function test
describe('calculateSummaryStats', () => {
  it('should calculate correct statistics', () => {
    const commits = [
      createCommit({ author: 'alice', repository: 'repo1' }),
      createCommit({ author: 'bob', repository: 'repo2' })
    ];
    
    const stats = calculateSummaryStats(commits);
    
    expect(stats.totalCommits).toBe(2);
    expect(stats.uniqueAuthors).toBe(2);
  });
});
```

### Step 5: Implement Effect System

#### Create Data Providers

```typescript
// src/services/providers/github.ts
export interface DataProvider {
  fetchCommits(
    repositories: readonly string[],
    dateRange: DateRange
  ): IOEffect<readonly CommitData[]>;
}

export const createGitHubDataProvider = (config: GitHubConfig): DataProvider => ({
  fetchCommits: (repositories, dateRange) => 
    ioEffect(async () => {
      // Actual GitHub API calls
      const response = await fetch('/api/github/commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositories, dateRange })
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      return response.json();
    })
});
```

#### Create Service Layer

```typescript
// src/services/workflows/summary.ts
export const createSummaryWorkflow = (
  request: unknown,
  dataProvider: DataProvider
): Effect<SummaryStats> => {
  // 1. Validate
  const validation = validateSummaryRequest(request);
  if (!validation.success) {
    return fail(new ValidationError(validation.error));
  }
  
  // 2. Create effect pipeline
  const fetchEffect = dataProvider.fetchCommits(
    validation.data.repositories,
    validation.data.dateRange
  );
  
  // 3. Transform and calculate
  return pipe(
    fetchEffect,
    mapEffect(calculateSummaryStats)
  );
};
```

### Step 6: Add Service Tests with Test Data Providers

```typescript
// src/services/workflows/summary.test.ts
describe('Summary Workflow', () => {
  const createTestDataProvider = (commits: readonly CommitData[]): DataProvider => ({
    fetchCommits: () => ioEffect(async () => commits)
  });
  
  it('should generate summary from commits', async () => {
    const testCommits = [
      createCommit({ author: 'alice' }),
      createCommit({ author: 'bob' })
    ];
    
    const dataProvider = createTestDataProvider(testCommits);
    const effect = createSummaryWorkflow(validRequest, dataProvider);
    
    const result = await effect();
    
    expect(result.totalCommits).toBe(2);
    expect(result.uniqueAuthors).toBe(2);
  });
});
```

## Common Migration Challenges

### Challenge 1: Breaking Dependencies

**Problem**: Existing code has tight coupling between logic and I/O.

**Solution**: Use dependency injection to break dependencies gradually.

```typescript
// Before: Tight coupling
const calculateStats = async () => {
  const data = await fetch('/api/data');
  return processData(data);
};

// After: Dependency injection
const calculateStats = async (dataProvider: DataProvider) => {
  const data = await dataProvider.fetchData();
  return processData(data);
};
```

### Challenge 2: Large Test Suites

**Problem**: Hundreds of mock-based tests need migration.

**Solution**: Migrate incrementally, keeping old tests until new ones are complete.

```typescript
// Keep old tests temporarily
describe('Legacy useSummary tests', () => {
  // Old mock-based tests
});

// Add new pure function tests
describe('Summary core functions', () => {
  // New pure function tests
});

// Gradually replace legacy tests
```

### Challenge 3: Team Resistance

**Problem**: Team is comfortable with existing mocking patterns.

**Solution**: 
1. Start with small, isolated modules
2. Demonstrate benefits with concrete examples
3. Provide training sessions
4. Create clear documentation and examples

### Challenge 4: Performance Concerns

**Problem**: Worry that pure functions will be slower.

**Solution**: Measure and demonstrate that pure functions are often faster:

```typescript
// Performance comparison test
describe('Performance comparison', () => {
  it('should be faster than mock-based approach', () => {
    const largeDataset = createLargeDataset(10000);
    
    const start = performance.now();
    const result = calculateSummaryStats(largeDataset);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50); // Very fast
    expect(result.totalCommits).toBe(10000);
  });
});
```

## Migration Checklist

### Phase 1: Foundation
- [ ] Create `src/lib/functional/` utilities
- [ ] Implement `src/lib/result/` type system
- [ ] Set up `src/core/types/` domain types
- [ ] Write tests for foundation components

### Phase 2: Business Logic Extraction
- [ ] Identify pure business logic candidates
- [ ] Create `src/core/` modules for pure functions
- [ ] Extract validation logic
- [ ] Extract calculation and transformation logic
- [ ] Write comprehensive pure function tests

### Phase 3: Effect System
- [ ] Create `src/services/effects/` type system
- [ ] Implement data provider interfaces
- [ ] Create service workflows
- [ ] Add service tests with test data providers

### Phase 4: Integration
- [ ] Update imperative shell to use pure functions
- [ ] Replace direct API calls with data providers
- [ ] Update React hooks to use service layer
- [ ] Test end-to-end integration

### Phase 5: Cleanup
- [ ] Remove old mock-based tests
- [ ] Delete test helper utilities
- [ ] Update documentation
- [ ] Train team on new patterns

## Success Metrics

Track these metrics to measure migration success:

1. **Test Reliability**: Reduce flaky test percentage
2. **Test Speed**: Measure test execution time improvement
3. **Code Coverage**: Maintain or improve coverage without mocks
4. **Development Velocity**: Track feature development speed
5. **Bug Rates**: Monitor production bug rates
6. **Developer Satisfaction**: Survey team satisfaction with testing

## Conclusion

Migrating from mock-based testing to functional architecture is a significant but worthwhile investment. The benefits include:

- **Faster, more reliable tests**
- **Easier code maintenance and refactoring**
- **Clearer separation of concerns**
- **Reduced coupling and improved modularity**
- **Better code quality and fewer bugs**

Take the migration incrementally, celebrate small wins, and maintain focus on the long-term benefits of this architectural approach.

## See Also

- [Functional Core / Imperative Shell Architecture](architecture/FUNCTIONAL_CORE_IMPERATIVE_SHELL.md)
- [Pure Function Testing Guide](testing/PURE_FUNCTION_TESTING.md)
- [Effect Testing Guide](testing/EFFECT_TESTING.md)
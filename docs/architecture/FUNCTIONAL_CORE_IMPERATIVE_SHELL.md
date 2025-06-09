# Functional Core / Imperative Shell Architecture

## Overview

GitPulse follows the **Functional Core / Imperative Shell** architectural pattern to achieve maximum testability, reliability, and maintainability. This pattern separates pure business logic (functional core) from side effects (imperative shell).

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPERATIVE SHELL                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │   API Routes    │  │  React Hooks    │  │  Data Providers │
│  │   (Next.js)     │  │   (useState,    │  │   (GitHub API) │
│  │                 │  │   useEffect)    │  │                │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FUNCTIONAL CORE                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │  Pure Functions │  │   Validation    │  │  Business Logic │
│  │  (src/core/)    │  │   (Result<T,E>) │  │  (Effect<T>)   │
│  │                 │  │                 │  │                │
│  └─────────────────┘  └─────────────────┘  └─────────────── │
└─────────────────────────────────────────────────────────────┘
```

## Functional Core

The functional core contains all business logic as **pure functions** with no side effects:

### Location: `src/core/`

- **`src/core/github/commits.ts`** - Pure commit data transformations
- **`src/core/summary/generator.ts`** - Statistical calculations and aggregations  
- **`src/core/validation/summary.ts`** - Input validation with typed errors
- **`src/core/types/index.ts`** - Domain type definitions

### Characteristics

1. **Pure Functions**: Given the same input, always return the same output
2. **No Side Effects**: No I/O, logging, or state mutations
3. **Immutable Data**: All data structures are readonly
4. **Composable**: Functions can be easily combined using functional utilities
5. **100% Testable**: No mocks needed - just input → output verification

### Example: Pure Commit Filtering

```typescript
// Pure function - no side effects
export const filterCommitsByDateRange = 
  (start: Date, end: Date) => 
  (commits: readonly CommitData[]): CommitData[] =>
    commits.filter(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= start && commitDate <= end;
    });

// Composable with other pure functions
export const analyzeCommits = (
  commits: readonly CommitData[],
  dateRange?: DateRange,
  authors?: readonly string[]
): SummaryStats => {
  return pipe(
    commits,
    applyCommitFilters(dateRange, authors),
    calculateSummaryStats
  );
};
```

## Imperative Shell

The imperative shell handles all side effects and coordinates the functional core:

### Location: `src/app/`, `src/hooks/`, `src/services/providers/`

- **API Routes** (`src/app/api/`) - HTTP request/response handling
- **React Hooks** (`src/hooks/`) - State management and React integration  
- **Data Providers** (`src/services/providers/`) - External API calls
- **Effect Orchestration** (`src/services/workflows/`) - Side effect coordination

### Characteristics

1. **Thin Layer**: Minimal logic, mostly coordination
2. **Side Effect Management**: I/O, logging, state mutations
3. **Dependency Injection**: Provides pure functions with data
4. **Error Handling**: Translates between domain and framework errors

### Example: Imperative Shell Coordination

```typescript
// Imperative shell - coordinates pure functions with I/O
export function useSummary(props: UseSummaryProps): UseSummaryResult {
  const [summary, setSummary] = useState<CommitSummary | null>(null);
  
  const generateSummary = useCallback(async () => {
    try {
      // 1. Validate input (pure function)
      const validation = validateSummaryRequest(props);
      if (!validation.success) {
        throw new Error(validation.error.join(', '));
      }

      // 2. Fetch data (side effect)
      const commits = await dataProvider.fetchCommits(
        validation.data.repositories,
        validation.data.dateRange
      );

      // 3. Process data (pure function)
      const stats = calculateSummaryStats(commits);

      // 4. Update state (side effect)
      setSummary(transformStatsToSummary(stats));
    } catch (error) {
      // Error handling (side effect)
      setError(transformDashboardError(error).message);
    }
  }, [props]);

  return { summary, generateSummary };
}
```

## Benefits

### Testability
- **Pure functions**: Test with simple input → output assertions
- **No mocking needed**: All business logic is pure and deterministic
- **Fast tests**: No I/O or async operations in core business logic

### Reliability  
- **Predictable behavior**: Pure functions have no hidden dependencies
- **Easy debugging**: Clear separation between logic and side effects
- **Error isolation**: Errors in I/O don't affect business logic

### Maintainability
- **Composable logic**: Pure functions can be easily combined
- **Clear boundaries**: Obvious separation between what and how
- **Refactor-friendly**: Pure functions can be moved without breaking dependencies

## Implementation Guidelines

### DO: Functional Core
```typescript
// ✅ Pure function with immutable inputs/outputs
export const calculateTotalCommits = (commits: readonly CommitData[]): number =>
  commits.length;

// ✅ Composed from other pure functions  
export const generateWeeklyStats = (commits: readonly CommitData[]) =>
  pipe(
    commits,
    groupCommitsByDate,
    Object.entries,
    entries => entries.map(([date, dayCommits]) => ({
      date,
      count: dayCommits.length
    }))
  );
```

### DON'T: Side Effects in Core
```typescript
// ❌ Side effect (logging) in pure function
export const calculateTotalCommits = (commits: readonly CommitData[]): number => {
  console.log('Calculating total commits'); // Side effect!
  return commits.length;
};

// ❌ Mutation of input data
export const sortCommits = (commits: CommitData[]): CommitData[] => {
  commits.sort((a, b) => a.date.localeCompare(b.date)); // Mutation!
  return commits;
};
```

### DO: Imperative Shell
```typescript
// ✅ Coordinate pure functions with I/O
export const summaryService = {
  generateSummary: async (request: SummaryRequest): Promise<SummaryStats> => {
    // 1. Validate (pure)
    const validation = validateSummaryRequest(request);
    if (!validation.success) throw new ValidationError(validation.error);
    
    // 2. Fetch (I/O)
    const commits = await githubProvider.fetchCommits(validation.data);
    
    // 3. Calculate (pure)  
    return calculateSummaryStats(commits);
  }
};
```

### DON'T: Business Logic in Shell
```typescript
// ❌ Business logic mixed with I/O
export const summaryService = {
  generateSummary: async (request: SummaryRequest): Promise<SummaryStats> => {
    const commits = await githubProvider.fetchCommits(request);
    
    // Business logic in shell - should be in core!
    let totalCommits = 0;
    let uniqueAuthors = new Set();
    for (const commit of commits) {
      totalCommits++;
      uniqueAuthors.add(commit.author);
    }
    
    return { totalCommits, uniqueAuthors: uniqueAuthors.size };
  }
};
```

## Migration Strategy

1. **Identify Pure Logic**: Find business logic that doesn't require I/O
2. **Extract to Core**: Move pure logic to `src/core/` modules
3. **Add Types**: Define clear input/output types with readonly properties
4. **Test Thoroughly**: Write comprehensive pure function tests
5. **Update Shell**: Modify imperative shell to use pure functions
6. **Remove Mocks**: Replace mocked tests with pure function tests

## See Also

- [Pure Function Testing Guide](../testing/PURE_FUNCTION_TESTING.md)
- [Effect Pattern Documentation](../testing/EFFECT_TESTING.md)
- [Migration Guide](../MIGRATION_GUIDE.md)
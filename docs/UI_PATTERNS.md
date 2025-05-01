# UI Patterns: Presentation/Logic Separation

This document outlines the standard approach for separating presentation from logic in GitPulse's component architecture. Following this pattern is essential for creating maintainable, testable, and scalable UI components.

## Table of Contents

- [Core Principle](#core-principle)
- [Presentation Components](#presentation-components)
- [Logic Hooks](#logic-hooks)
- [Implementation Pattern](#implementation-pattern)
- [Benefits](#benefits)
- [Testing Strategies](#testing-strategies)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Core Principle

The central principle of our UI architecture is **strict separation of concerns** between:

1. **Presentation**: Components responsible for rendering UI elements based on props
2. **Logic**: Custom hooks responsible for state management, data fetching, and business logic

This separation aligns with the "Separation of Concerns" and "Dependency Inversion" principles outlined in our Development Philosophy.

## Presentation Components

### Characteristics

- **Pure Rendering**: Focus exclusively on rendering UI based on props
- **No State**: Minimize or eliminate internal state (except UI-specific state like hover effects)
- **No Side Effects**: Avoid direct API calls, localStorage access, etc.
- **Props-Driven**: All data and behaviors come through props
- **Typed Interface**: Clearly defined prop interfaces with comprehensive TypeScript types

### Example Structure

```tsx
// Presentation component example

interface SummaryViewProps {
  commits: Commit[];
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
  timeRange: DateRange;
}

/**
 * Displays a summary of commit activity
 */
export function SummaryView({
  commits,
  isLoading,
  error,
  onRefresh,
  timeRange
}: SummaryViewProps): JSX.Element {
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorState error={error} onRetry={onRefresh} />;
  }
  
  if (commits.length === 0) {
    return <EmptyState timeRange={timeRange} />;
  }
  
  return (
    <div className="summary-container">
      <SummaryHeader 
        totalCommits={commits.length} 
        timeRange={timeRange} 
        onRefresh={onRefresh} 
      />
      <CommitList commits={commits} />
    </div>
  );
}
```

## Logic Hooks

### Characteristics

- **State Management**: Maintain and update component state
- **Data Fetching**: Handle API calls and loading/error states
- **Business Logic**: Implement domain-specific logic and data transformations
- **Side Effects**: Manage all side effects (API, localStorage, etc.)
- **Return Interface**: Provide data and callbacks for components to consume

### Example Structure

```tsx
// Logic hook example

interface UseSummaryOptions {
  teamId?: string;
  timeRange: DateRange;
}

interface UseSummaryResult {
  commits: Commit[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook for managing commit summary data and state
 */
export function useSummary({ 
  teamId, 
  timeRange 
}: UseSummaryOptions): UseSummaryResult {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchCommits = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API call with error handling
      const data = await api.getCommits({
        teamId,
        startDate: timeRange.start,
        endDate: timeRange.end
      });
      
      // Data transformation if needed
      const processedData = processCommitData(data);
      
      setCommits(processedData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [teamId, timeRange]);
  
  // Side effect to fetch data
  useEffect(() => {
    fetchCommits();
  }, [fetchCommits]);
  
  return {
    commits,
    isLoading,
    error,
    refresh: fetchCommits
  };
}
```

## Implementation Pattern

The standard pattern for implementing a feature involves three files:

1. **Presentation Component** (`ComponentName.tsx`): Pure UI component receiving all data via props
2. **Logic Hook** (`useComponentNameData.ts`): Custom hook managing state and business logic
3. **Container Component** (`ComponentNameContainer.tsx`): Connects the hook to the presentation component

### Container Component Example

```tsx
// Container component example

/**
 * Container component that connects the data hook to the presentation component
 */
export function SummaryViewContainer({ 
  teamId, 
  timeRange 
}: SummaryViewContainerProps): JSX.Element {
  // Use the logic hook to get data and callbacks
  const { commits, isLoading, error, refresh } = useSummary({
    teamId,
    timeRange
  });
  
  // Pass everything to the presentation component
  return (
    <SummaryView
      commits={commits}
      isLoading={isLoading}
      error={error}
      onRefresh={refresh}
      timeRange={timeRange}
    />
  );
}
```

## Benefits

This separation provides several key benefits:

1. **Improved Testability**:
   - Presentation components can be tested in isolation with mocked props
   - Logic hooks can be tested independently from rendering concerns
   - No need to mock internal component collaborators

2. **Enhanced Maintainability**:
   - Changes to logic don't affect presentation and vice versa
   - Single responsibility for each file
   - Easier to understand and reason about

3. **Better Reusability**:
   - Presentation components can be reused with different data sources
   - Logic hooks can be reused with different UI representations

4. **Simplified Development**:
   - Clear separation creates natural division of labor
   - Parallelized development of UI and logic
   - More focused debugging

## Testing Strategies

### Testing Presentation Components

- Focus on rendering correctly based on different prop combinations
- Test component rendering for all states: loading, error, empty, with data
- Test user interactions and callback invocations
- No need to mock API calls or other external dependencies

```tsx
// Presentation component test example
describe('SummaryView', () => {
  it('shows loading state when isLoading is true', () => {
    render(
      <SummaryView
        commits={[]}
        isLoading={true}
        error={null}
        onRefresh={jest.fn()}
        timeRange={{ start: new Date(), end: new Date() }}
      />
    );
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });
  
  it('calls onRefresh when refresh button is clicked', () => {
    const onRefreshMock = jest.fn();
    render(
      <SummaryView
        commits={sampleCommits}
        isLoading={false}
        error={null}
        onRefresh={onRefreshMock}
        timeRange={{ start: new Date(), end: new Date() }}
      />
    );
    
    fireEvent.click(screen.getByText('Refresh'));
    expect(onRefreshMock).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Logic Hooks

- Test state updates in response to function calls
- Mock API calls and external dependencies
- Test error handling and edge cases
- Use `renderHook` from `@testing-library/react-hooks`

```tsx
// Logic hook test example
describe('useSummary', () => {
  beforeEach(() => {
    // Mock API
    jest.spyOn(api, 'getCommits').mockImplementation(async () => sampleCommits);
  });
  
  it('returns loading state while fetching data', async () => {
    // Mock slow API response
    jest.spyOn(api, 'getCommits').mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(sampleCommits), 100))
    );
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useSummary({ 
        timeRange: { start: new Date(), end: new Date() }
      })
    );
    
    expect(result.current.isLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.isLoading).toBe(false);
  });
  
  it('handles API errors correctly', async () => {
    const testError = new Error('API Error');
    jest.spyOn(api, 'getCommits').mockRejectedValue(testError);
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useSummary({ 
        timeRange: { start: new Date(), end: new Date() }
      })
    );
    
    await waitForNextUpdate();
    expect(result.current.error).toEqual(testError);
  });
});
```

## Examples

### Complete Feature Implementation Example

Here's a simplified but complete implementation of a feature following this pattern:

#### 1. Presentation Component (`CommitList.tsx`)

```tsx
interface CommitListProps {
  commits: Commit[];
  onSelectCommit?: (commitId: string) => void;
  isCompact?: boolean;
}

export function CommitList({ 
  commits, 
  onSelectCommit, 
  isCompact = false 
}: CommitListProps): JSX.Element {
  if (commits.length === 0) {
    return <div>No commits found.</div>;
  }
  
  return (
    <ul className={`commit-list ${isCompact ? 'compact' : ''}`}>
      {commits.map(commit => (
        <li key={commit.id} onClick={() => onSelectCommit?.(commit.id)}>
          <span className="commit-hash">{commit.hash.substring(0, 7)}</span>
          <span className="commit-message">{commit.message}</span>
          <span className="commit-author">{commit.author.name}</span>
          {!isCompact && (
            <span className="commit-date">
              {formatDate(commit.date)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
```

#### 2. Logic Hook (`useCommitList.ts`)

```tsx
interface UseCommitListOptions {
  repositoryId: string;
  branchName?: string;
  limit?: number;
}

interface UseCommitListResult {
  commits: Commit[];
  isLoading: boolean;
  error: Error | null;
  loadMore: () => void;
  selectCommit: (commitId: string) => void;
}

export function useCommitList({ 
  repositoryId, 
  branchName = 'main', 
  limit = 20 
}: UseCommitListOptions): UseCommitListResult {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  
  const fetchCommits = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const currentPage = reset ? 1 : page;
      const data = await api.getRepositoryCommits({
        repositoryId,
        branch: branchName,
        page: currentPage,
        limit
      });
      
      setCommits(prev => (reset ? data : [...prev, ...data]));
      setPage(reset ? 1 : page + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch commits'));
    } finally {
      setIsLoading(false);
    }
  }, [repositoryId, branchName, page, limit]);
  
  const selectCommit = useCallback((commitId: string) => {
    // Additional logic like navigating to commit detail or showing a modal
    console.log(`Selected commit: ${commitId}`);
    // router.push(`/repository/${repositoryId}/commit/${commitId}`);
  }, [repositoryId]);
  
  useEffect(() => {
    fetchCommits(true);
  }, [repositoryId, branchName]);
  
  return {
    commits,
    isLoading,
    error,
    loadMore: () => fetchCommits(false),
    selectCommit
  };
}
```

#### 3. Container Component (`CommitListContainer.tsx`)

```tsx
interface CommitListContainerProps {
  repositoryId: string;
  branchName?: string;
  isCompact?: boolean;
}

export function CommitListContainer({
  repositoryId,
  branchName,
  isCompact
}: CommitListContainerProps): JSX.Element {
  const { 
    commits, 
    isLoading, 
    error, 
    loadMore, 
    selectCommit 
  } = useCommitList({
    repositoryId,
    branchName
  });
  
  if (isLoading && commits.length === 0) {
    return <LoadingSpinner />;
  }
  
  if (error && commits.length === 0) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <div>
      <CommitList 
        commits={commits} 
        onSelectCommit={selectCommit}
        isCompact={isCompact}
      />
      
      {isLoading && <LoadingIndicator />}
      
      {!isLoading && commits.length > 0 && (
        <LoadMoreButton onClick={loadMore} />
      )}
    </div>
  );
}
```

## Best Practices

1. **Component Naming Conventions**:
   - Presentation components: `ComponentName.tsx`
   - Logic hooks: `useComponentNameData.ts` or `useFeatureName.ts`
   - Container components: `ComponentNameContainer.tsx`

2. **Interface Definitions**:
   - Define clear prop interfaces for components
   - Define options and result interfaces for hooks
   - Use discriminated unions for representing different states

3. **Error Handling**:
   - Hooks should handle and expose errors
   - Presentation components should have designated error states
   - Consider standardized error handling patterns

4. **State Management Hierarchy**:
   - Local state: Use React's `useState` in hooks
   - Shared state: Consider React Context or state management libraries
   - Global state: Use a centralized store like Redux/Zustand only when necessary

5. **Progressive Loading**:
   - Implement pagination, infinite scrolling, etc. in logic hooks
   - Keep presentation components agnostic of loading mechanisms
   - Expose simple load/loadMore functions to components

6. **Testing Priority**:
   - Highest test coverage for logic hooks (core business logic)
   - Comprehensive testing of UI states in presentation components
   - Integration tests for container components

7. **Avoid These Anti-Patterns**:
   - API calls or side effects in presentation components
   - Business logic in presentation components
   - UI rendering logic in hooks
   - Deep component nesting without proper prop drilling solutions
   - Tight coupling between hooks and specific components

## Real-World Examples from GitPulse

Here are some concrete examples from our codebase that demonstrate the presentation/logic separation pattern:

### Example 1: Dashboard Implementation

Our dashboard shows the presentation/logic separation in action:

#### Logic Hook: `useSummary.ts`

```typescript
// src/hooks/dashboard/useSummary.ts
export function useSummary({
  dateRange,
  activityMode,
  organizations,
  repositories,
  contributors,
  installationIds
}: SummaryParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  
  // Fetch data logic
  const generateSummary = useCallback(async () => {
    if (!session?.accessToken && !installationIds.length) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      // API call and data processing logic
      const response = await fetch(`/api/summary?${new URLSearchParams(params).toString()}`);
      
      // Error handling logic
      if (!response.ok) {
        // Handle different error conditions
      }
      
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, activityMode, organizations, repositories, contributors, installationIds]);
  
  return {
    loading,
    error,
    summary,
    generateSummary
  };
}
```

#### Presentation Component: `SummaryView.tsx`

```typescript
// src/components/dashboard/SummaryView.tsx
export interface SummaryViewProps {
  summary: Summary | null;
  activityMode: ActivityMode;
  dateRange: DateRange;
  activeFilters: FilterState;
  installationIds: readonly number[];
  loading: boolean;
}

export default function SummaryView({
  summary,
  activityMode,
  dateRange,
  activeFilters,
  installationIds,
  loading
}: SummaryViewProps) {
  // Pure rendering logic - no API calls or complex state management
  return (
    <div className="border rounded-lg p-6">
      {loading && <LoadingIndicator />}
      {summary && (
        <div>
          <SummaryStats stats={summary.stats} />
          <SummaryDetails details={summary.details} />
        </div>
      )}
    </div>
  );
}
```

### Example 2: Atomic Component - ModeSelector

Even our atomic components follow this separation pattern. The `ModeSelector` component focuses purely on presentation:

```typescript
// src/components/ui/ModeSelector.tsx
export interface ModeSelectorProps {
  selectedMode: ActivityMode;
  onChange: (mode: ActivityMode) => void;
  disabled?: boolean;
  // Other UI-specific props
}

export default function ModeSelector({ 
  selectedMode,
  onChange,
  disabled = false,
  // Other props with defaults
}: ModeSelectorProps) {
  // Only minimal UI state using hooks
  const headerId = useId();
  
  // UI event handler - no business logic
  const handleModeChange = (mode: ActivityMode) => {
    if (!disabled) {
      onChange(mode);
    }
  };

  // Pure rendering logic
  return (
    <div className="rounded-lg border">
      {/* Component UI rendering */}
    </div>
  );
}
```

### Example 3: Protected Routes Pattern

Our authentication flow demonstrates this pattern with `useProtectedRoute`:

```typescript
// src/hooks/useProtectedRoute.ts
export function useProtectedRoute(options: UseProtectedRouteOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  // Authentication logic and redirection
  useEffect(() => {
    if (status === 'loading') return;
    
    const timer = setTimeout(() => {
      if ((redirectIfFound && status === 'authenticated') ||
          (!redirectIfFound && status === 'unauthenticated')) {
        router.replace(redirectTo);
      } else {
        setIsLoading(false);
      }
    }, loadingDelay);
    
    return () => clearTimeout(timer);
  }, [status, router, redirectIfFound, redirectTo, loadingDelay]);
  
  return {
    isLoading: isLoading || status === 'loading',
    isAuthenticated: status === 'authenticated',
    session,
    status
  };
}
```

This hook is then used in components that need authentication, keeping the authentication logic separate from rendering.

By following these patterns consistently, we create a codebase that is easier to maintain, test, and evolve over time, while preserving clear separation of concerns.
# Mocking Policy

This document outlines GitPulse's official policy on mocking in tests, including what should and should not be mocked, along with practical examples of correct and incorrect approaches.

## Table of Contents

1. [Core Principle: Mock ONLY True External System Boundaries](#core-principle-mock-only-true-external-system-boundaries)
2. [What Are External System Boundaries?](#what-are-external-system-boundaries)
3. [What NOT to Mock](#what-not-to-mock)
4. [Correct Mocking Patterns](#correct-mocking-patterns)
5. [Incorrect Mocking Patterns](#incorrect-mocking-patterns)
6. [Refactoring for Testability](#refactoring-for-testability)
7. [Real-world Examples](#real-world-examples)
8. [Related Documentation](#related-documentation)

## Core Principle: Mock ONLY True External System Boundaries

The foundation of our mocking policy is this principle:

> **Mock ONLY True External System Boundaries. NEVER mock internal collaborators.**

This principle is fundamental to our testing approach for several critical reasons:

1. **Tests Remain Valid Through Refactoring**: When you only mock external boundaries, you can refactor internal code without breaking tests.

2. **Tests Verify Actual Behavior**: Mocking internal code means you're not testing how your components truly interact.

3. **Cleaner Design**: Following this principle naturally pushes you toward better software design with cleaner interfaces and dependency injection.

4. **Avoid Test-Implementation Coupling**: Tests should verify behavior, not implementation details. Mocking internal modules creates a tight coupling between tests and implementation.

## What Are External System Boundaries?

External system boundaries are interfaces to systems outside your application's control. These include:

| External Boundary | Examples | Why It's External |
|------------------|----------|-------------------|
| Network Calls | API requests, webhooks | Unpredictable, dependent on external services |
| Filesystem | File reading/writing, paths | OS-dependent, may not exist in test environments |
| Databases | SQL queries, NoSQL operations | Requires setup, separate system |
| Time | Date.now(), new Date() | Non-deterministic, changes between test runs |
| Random Values | Math.random(), UUIDs | Non-deterministic |
| Environment | process.env, window dimensions | Varies between environments |
| Authentication | OAuth, auth tokens | Requires external services |
| Browser APIs | localStorage, navigator | Browser-dependent, may not exist in test environment |

## What NOT to Mock

### 1. Internal Modules and Components

**NEVER mock internal modules, components, or utilities from your own codebase.** If you find yourself needing to mock these, it's a sign that your code needs refactoring for better testability.

### 2. Pure Functions

Pure functions (those that always return the same output for the same input and have no side effects) should never be mocked. Test them directly.

### 3. React Components in Component Tests

Don't mock child components in React component tests. Testing a parent with mocked children doesn't verify the integration between them.

### 4. Implementation Details

Don't mock implementation details or internal methods. Test the public API of modules, not their internal workings.

## Correct Mocking Patterns

### External API Calls

Use our FetchContext for dependency injection:

```typescript
// Component:
function UserProfile() {
  const fetch = useFetch(); // From context
  
  useEffect(() => {
    fetch('/api/user').then(/* ... */);
  }, [fetch]);
  
  // ...
}

// Test:
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: jest.fn().mockResolvedValue({ name: 'Test User' })
});

render(
  <FetchProvider fetchImplementation={mockFetch}>
    <UserProfile />
  </FetchProvider>
);
```

Or use our specialized network testing utilities:

```typescript
import { setupFetchMocks } from '@/lib/tests/network-test-utils';

it('loads user data', async () => {
  const fetchMocks = setupFetchMocks();
  fetchMocks.mockSuccess({ name: 'Test User' });
  
  render(<UserProfile />);
  
  await screen.findByText('Test User');
  fetchMocks.expectFetchCalls([['/api/user']]);
  fetchMocks.restore();
});
```

### Dates and Time

Use our dedicated `dateMock` utility:

```typescript
import { createMockDate } from '@/lib/tests/dateMock';

it('shows correct date format', () => {
  const { restore } = createMockDate('2025-05-01T12:00:00Z');
  
  try {
    render(<DateDisplay />);
    expect(screen.getByText('May 1, 2025')).toBeInTheDocument();
  } finally {
    restore(); // Important: always restore
  }
});
```

### Authentication

```typescript
import { mockNextAuthSession } from '@/lib/tests/react-test-utils';

const { session, useSession, resetMocks } = mockNextAuthSession({
  data: {
    user: { name: 'Test User', email: 'test@example.com' },
    expires: '2025-12-31'
  },
  status: 'authenticated'
});

// Test authenticated component
render(<AuthenticatedComponent />);

// Always clean up
resetMocks();
```

### Dependency Injection for Services

```typescript
// API handler with explicit dependencies:
function createApiHandler(deps) {
  return async function handler(req, res) {
    const data = await deps.dataService.fetchData();
    return res.json(data);
  };
}

// Test:
const mockDataService = {
  fetchData: jest.fn().mockResolvedValue({ result: 'success' })
};

const handler = createApiHandler({ dataService: mockDataService });
const result = await handler(mockRequest, mockResponse);

expect(mockDataService.fetchData).toHaveBeenCalled();
expect(mockResponse.json).toHaveBeenCalledWith({ result: 'success' });
```

## Incorrect Mocking Patterns

Here are examples of incorrect mocking patterns that should be avoided:

### ❌ Mocking Internal Modules

```typescript
// INCORRECT: Mocking internal utilities
jest.mock('@/utils/formatDate', () => ({
  formatDate: () => '2025-05-01'
}));

// INCORRECT: Mocking internal components
jest.mock('@/components/Button', () => () => <div>Mocked Button</div>);
```

### ❌ Modifying Global Objects Directly

```typescript
// INCORRECT: Direct manipulation of globals
global.Date = class MockDate {
  constructor() {
    return new Date('2025-05-01');
  }
  static now() {
    return new Date('2025-05-01').getTime();
  }
};

// INCORRECT: Direct manipulation of fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'test' })
});
```

### ❌ Mocking Implementation Details

```typescript
// INCORRECT: Mocking private methods
jest.spyOn(component, '_handleChange').mockImplementation(() => {});

// INCORRECT: Testing internals
expect(component.state.value).toBe('test');
```

### ❌ Shallow Rendering with Mocked Children

```typescript
// INCORRECT: Using shallow rendering to avoid testing child components
const wrapper = shallow(<ParentComponent />);
expect(wrapper.find('ChildComponent')).toExist();
```

## Refactoring for Testability

If you feel the need to mock internal modules, it's a sign your code needs refactoring. Here are patterns to improve testability:

### 1. Dependency Injection

```typescript
// Before - hard to test
function DataComponent() {
  const data = fetchDataFromAPI(); // direct dependency
  return <div>{data}</div>;
}

// After - testable
function DataComponent({ dataService }) {
  const data = dataService.fetchData(); // injected dependency
  return <div>{data}</div>;
}

// Test
const mockDataService = { fetchData: () => 'test data' };
render(<DataComponent dataService={mockDataService} />);
```

### 2. Context Providers

```typescript
// Create a context for the dependency
const DataContext = createContext(null);

// Provider component
function DataProvider({ children, dataService }) {
  return (
    <DataContext.Provider value={dataService}>
      {children}
    </DataContext.Provider>
  );
}

// Consumer component
function DataConsumer() {
  const dataService = useContext(DataContext);
  // use dataService...
}

// Test
const mockDataService = { /* ... */ };
render(
  <DataProvider dataService={mockDataService}>
    <DataConsumer />
  </DataProvider>
);
```

### 3. Extract Pure Functions

```typescript
// Before - mixed concerns
function Component() {
  function calculateTotal(items) {
    // Complex calculation logic
  }
  
  const handleSubmit = async () => {
    const total = calculateTotal(items);
    await saveToAPI(total);
  };
}

// After - separated concerns
// utils.ts - can be tested directly, no mocking needed
export function calculateTotal(items) {
  // Complex calculation logic
}

// Component.tsx
import { calculateTotal } from './utils';

function Component({ apiService }) {
  const handleSubmit = async () => {
    const total = calculateTotal(items);
    await apiService.save(total); // mockable external dependency
  };
}
```

### 4. Factory Functions

```typescript
// Create handlers/services with explicit dependencies
export function createHandlers(deps) {
  return {
    handleUserData: (userData) => {
      const formatted = deps.formatter.format(userData);
      return deps.storage.save(formatted);
    }
  };
}

// Test
const mockDeps = {
  formatter: { format: jest.fn(data => data) },
  storage: { save: jest.fn().mockResolvedValue(true) }
};

const handlers = createHandlers(mockDeps);
await handlers.handleUserData({ name: 'Test' });

expect(mockDeps.formatter.format).toHaveBeenCalledWith({ name: 'Test' });
expect(mockDeps.storage.save).toHaveBeenCalled();
```

## Real-world Examples

### API Handler Testing

Here's a real example from our codebase showing how to test an API handler without mocking internals:

```typescript
// src/app/api/summary/handlers.ts
export function createSummaryHandlers(deps: SummaryHandlerDependencies) {
  return {
    filterRepositoriesByOrgAndRepoNames: (
      repositories: Repository[], 
      organizations?: string[], 
      repoNames?: string[]
    ) => {
      // Implementation...
    },
    
    // Other methods...
  };
}

// src/app/api/summary/__tests__/handlers.test.ts
describe('Summary API Handlers', () => {
  let mockDeps: SummaryHandlerDependencies;
  let handlers: ReturnType<typeof createSummaryHandlers>;

  beforeEach(() => {
    mockDeps = {
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      githubService: {
        fetchAllRepositories: jest.fn().mockResolvedValue([]),
        fetchCommitsForRepositories: jest.fn().mockResolvedValue([])
      },
      // Other dependencies...
    };
    
    handlers = createSummaryHandlers(mockDeps);
  });
  
  it('should filter repositories correctly', () => {
    const mockRepositories = [
      { id: 1, full_name: 'org1/repo1', owner: { login: 'org1' }, private: false, html_url: '', description: null },
      { id: 2, full_name: 'org2/repo2', owner: { login: 'org2' }, private: false, html_url: '', description: null }
    ];
    
    const result = handlers.filterRepositoriesByOrgAndRepoNames(mockRepositories, ['org1']);
    
    expect(result).toHaveLength(1);
    expect(result[0].full_name).toBe('org1/repo1');
  });
});
```

### Hook Testing with Context

Here's a real example of testing a hook that uses external fetch calls:

```typescript
// src/hooks/dashboard/useRepositories.ts
export function useRepositories() {
  const fetch = useFetch(); // From FetchContext
  
  const fetchRepositories = useCallback(async () => {
    // Implementation using fetch...
  }, [fetch]);
  
  // Rest of hook...
}

// src/hooks/dashboard/__tests__/useRepositories.test.ts
describe('useRepositories', () => {
  const mockFetch = jest.fn();
  
  const createWrapper = () => {
    const FetchProviderWrapper = ({ children }) => (
      <FetchProvider fetchImplementation={mockFetch}>
        {children}
      </FetchProvider>
    );
    return FetchProviderWrapper;
  };
  
  it('should fetch repositories and update state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ repositories: mockRepositories })
    });
    
    const { result } = renderHook(() => useRepositories(), {
      wrapper: createWrapper()
    });
    
    // Test hook behavior...
  });
});
```

## Related Documentation

For more information about testing in GitPulse, refer to:

- [Approved Testing Patterns](./APPROVED_TESTING_PATTERNS.md) - Comprehensive guide to testing patterns
- [Development Philosophy: Testing Appendix](./DEVELOPMENT_PHILOSOPHY_APPENDIX_TESTING.md) - Testing philosophy and standards
- [Testing Guidelines](./TESTING_GUIDELINES.md) - General testing guidelines including date mocking
- [E2E Mock Auth Strategy](./E2E_MOCK_AUTH_STRATEGY.md) - Authentication mocking for E2E tests
# T016 Plan: Update Unit Tests for Refactored Dashboard Components and State

## Overview

This plan details a comprehensive testing approach for updating the unit tests for the refactored dashboard components and state management. We'll adopt a hybrid testing strategy that respects the project's "no mocking internal collaborators" philosophy while ensuring effective test coverage.

## Testing Strategy

We will implement a **Hybrid Testing Strategy** that:

1. Tests state management logic directly with real Zustand stores
2. Tests pure UI components with standard props-based approach
3. Tests stateful components that use Zustand hooks with real store instances
4. Maintains or exceeds coverage targets (≥85% overall, ≥95% for core state/layout logic)

## Implementation Plan

### 1. Update Tests for `dashboardSlice` (from T001)

Create or update tests for the consolidated state management:

```typescript
// src/state/slices/__tests__/dashboardSlice.test.ts

import { create } from 'zustand';
import { createDashboardSlice } from '@/state/slices/dashboardSlice';
import { initialDashboardState } from '@/state/slices/dashboardSlice';

describe('dashboardSlice', () => {
  // Setup test store instance
  const useTestStore = create((set, get) => ({
    ...createDashboardSlice(set, get)
  }));

  beforeEach(() => {
    // Reset to initial state before each test
    useTestStore.setState(initialDashboardState);
  });

  // Tests for repository data fetching
  describe('repository operations', () => {
    test('should handle repository fetch success', () => {
      const mockRepositories = [{ id: 1, name: 'test-repo' }];
      
      // Call the action directly
      useTestStore.getState().handleRepositoryFetchSuccess(
        mockRepositories,
        'github_app',
        123,
        [123],
        [{ id: 123, account: { id: 456 } }]
      );
      
      // Assert state changes
      expect(useTestStore.getState().repositories).toEqual(mockRepositories);
      expect(useTestStore.getState().authMethod).toBe('github_app');
    });
    
    // Additional tests for other actions, error handling, etc.
  });

  // Tests for date range operations
  describe('date range operations', () => {
    test('should update date range', () => {
      const newDateRange = { 
        from: new Date('2023-01-01'), 
        to: new Date('2023-01-31') 
      };
      
      useTestStore.getState().setDateRange(newDateRange);
      
      expect(useTestStore.getState().dateRange).toEqual(newDateRange);
    });
  });
  
  // Additional tests for other slice functionality
});
```

### 2. Update/Add Tests for `DashboardGridContainer` (from T002)

Update existing tests to ensure the responsive grid layout is properly tested:

```typescript
// src/components/dashboard/layout/__tests__/DashboardGridContainer.test.tsx

import { render, screen } from '@testing-library/react';
import { DashboardGridContainer } from '@/components/dashboard/layout/DashboardGridContainer';

describe('DashboardGridContainer', () => {
  test('renders children correctly', () => {
    render(
      <DashboardGridContainer>
        <div data-testid="child">Test Child</div>
      </DashboardGridContainer>
    );
    
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
  
  test('applies correct default grid classes', () => {
    const { container } = render(
      <DashboardGridContainer>
        <div>Child</div>
      </DashboardGridContainer>
    );
    
    const gridElement = container.firstChild;
    expect(gridElement).toHaveClass('grid');
    expect(gridElement).toHaveClass('w-full');
    expect(gridElement).toHaveClass('grid-cols-12');
    expect(gridElement).toHaveClass('gap-md');
  });
  
  test('applies custom column count', () => {
    const { container } = render(
      <DashboardGridContainer columns={24}>
        <div>Child</div>
      </DashboardGridContainer>
    );
    
    expect(container.firstChild).toHaveClass('grid-cols-24');
  });
  
  test('applies custom gap size', () => {
    const { container } = render(
      <DashboardGridContainer gap="lg">
        <div>Child</div>
      </DashboardGridContainer>
    );
    
    expect(container.firstChild).toHaveClass('gap-lg');
  });
  
  test('merges custom className', () => {
    const { container } = render(
      <DashboardGridContainer className="custom-class">
        <div>Child</div>
      </DashboardGridContainer>
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.firstChild).toHaveClass('grid');
  });
});
```

### 3. Create Test Helper for Zustand Integration

Create a reusable test utility for components that use Zustand hooks:

```typescript
// src/__tests__/test-helpers/zustandTestHelpers.tsx

import { ReactNode } from 'react';
import { create } from 'zustand';
import { createDashboardSlice } from '@/state/slices/dashboardSlice';
import { initialDashboardState } from '@/state/slices/dashboardSlice';

// Create a test store
export const useTestStore = create((set, get) => ({
  ...createDashboardSlice(set, get)
}));

// Store reset function for beforeEach blocks
export const resetTestStore = () => {
  useTestStore.setState(initialDashboardState);
};

// Helper function to set specific state values
export const setTestStoreState = (partialState: Partial<DashboardState>) => {
  useTestStore.setState({
    ...useTestStore.getState(),
    ...partialState
  });
};

// Provider wrapper for testing components
export const ZustandTestProvider = ({ children }: { children: ReactNode }) => {
  // Mock the useUIState, useDateRange, etc. hooks to use our test store
  // This is implementation-specific and will depend on how hooks are defined in the project
  return children;
};
```

### 4. Update Tests for Components Using Zustand Hooks

For components like `FilterControls` that now use Zustand hooks instead of props:

```typescript
// src/components/dashboard/__tests__/FilterControls.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import FilterControls from '@/components/dashboard/FilterControls';
import { 
  ZustandTestProvider, 
  resetTestStore, 
  setTestStoreState 
} from '@/__tests__/test-helpers/zustandTestHelpers';

describe('FilterControls', () => {
  beforeEach(() => {
    resetTestStore();
  });
  
  test('renders date range values from store', () => {
    const testDateRange = {
      from: new Date('2023-01-01'),
      to: new Date('2023-01-31')
    };
    
    setTestStoreState({ dateRange: testDateRange });
    
    render(
      <FilterControls 
        activityMode="my-activity" 
        session={null} 
      />, 
      { wrapper: ZustandTestProvider }
    );
    
    expect(screen.getByText(/Jan 1, 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Jan 31, 2023/)).toBeInTheDocument();
  });
  
  test('updates date range in store when changed', () => {
    render(
      <FilterControls 
        activityMode="my-activity" 
        session={null} 
      />, 
      { wrapper: ZustandTestProvider }
    );
    
    // Simulate user changing date range
    fireEvent.click(screen.getByText('Last 7 days'));
    
    // Verify store state was updated
    const storeState = useTestStore.getState();
    expect(storeState.dateRange).toBeDefined();
    expect(storeState.dateRange.from).toBeInstanceOf(Date);
    expect(storeState.dateRange.to).toBeInstanceOf(Date);
  });
});
```

### 5. Update Tests for `RepositoryInfoPanel`

```typescript
// src/components/dashboard/__tests__/RepositoryInfoPanel.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import RepositoryInfoPanel from '@/components/dashboard/RepositoryInfoPanel';
import { 
  ZustandTestProvider, 
  resetTestStore, 
  setTestStoreState 
} from '@/__tests__/test-helpers/zustandTestHelpers';

describe('RepositoryInfoPanel', () => {
  beforeEach(() => {
    resetTestStore();
  });
  
  test('displays repository count from store', () => {
    const mockRepositories = [
      { id: 1, full_name: 'test/repo1' },
      { id: 2, full_name: 'test/repo2' }
    ];
    
    setTestStoreState({ repositories: mockRepositories });
    
    render(<RepositoryInfoPanel />, { wrapper: ZustandTestProvider });
    
    expect(screen.getByText('REPOSITORIES DETECTED: 2')).toBeInTheDocument();
    expect(screen.getByText('test/repo1')).toBeInTheDocument();
    expect(screen.getByText('test/repo2')).toBeInTheDocument();
  });
  
  test('toggles repository list visibility', () => {
    const mockRepositories = [{ id: 1, full_name: 'test/repo1' }];
    setTestStoreState({ repositories: mockRepositories });
    
    render(<RepositoryInfoPanel />, { wrapper: ZustandTestProvider });
    
    // Verify list is visible initially
    expect(screen.getByText('test/repo1')).toBeInTheDocument();
    
    // Click the toggle button
    fireEvent.click(screen.getByText('HIDE LIST'));
    
    // Verify list is hidden
    expect(screen.queryByText('test/repo1')).not.toBeInTheDocument();
    
    // Toggle list again
    fireEvent.click(screen.getByText('SHOW LIST'));
    
    // Verify list is visible again
    expect(screen.getByText('test/repo1')).toBeInTheDocument();
  });
});
```

### 6. Update Tests for Other Refactored Components

Apply the same approach to update tests for:
- DashboardSummaryPanel
- ActivityOverviewPanel
- ActivityFeedPanel
- AuthenticationStatusBanner
- ActionButton

Each test should:
1. Use the Zustand test helpers to provide a controlled store state
2. Test the component's rendering based on that store state
3. Test interactions that update the store state
4. Verify the component responds correctly to store state changes

## Coverage and Quality Metrics

- Add coverage thresholds to `jest.config.js`:

```javascript
module.exports = {
  // ... existing config ...
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85, 
      lines: 85,
      statements: 85
    },
    "./src/state/slices/": {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    },
    "./src/components/dashboard/layout/": {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

## Execution Plan

1. Create/update Zustand test helpers first
2. Update dashboardSlice tests
3. Update DashboardGridContainer tests
4. Update tests for components in this order:
   - FilterControls
   - RepositoryInfoPanel
   - DashboardSummaryPanel
   - ActivityOverviewPanel
   - ActivityFeedPanel
   - AuthenticationStatusBanner
   - ActionButton
5. Run tests with coverage to identify any gaps
6. Add additional tests as needed to meet coverage targets

## Success Criteria

- All unit tests pass
- Coverage meets or exceeds targets (≥85% overall, ≥95% core logic)
- No mocking of internal collaborators
- Tests verify component behavior after refactoring
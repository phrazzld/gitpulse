# State Management with Zustand

## Overview

GitPulse uses [Zustand](https://github.com/pmndrs/zustand) for state management. Zustand is a small, fast, and scalable state management solution that uses simplified flux principles. It provides a minimal API that avoids the complexity of many state management libraries while still providing powerful features like middleware.

## Why Zustand?

- **Simplicity**: Simple API with minimal boilerplate
- **Performance**: Optimized re-renders using shallow comparisons
- **TypeScript Support**: Excellent type inference and compile-time safety
- **Middleware**: Built-in support for middleware like persistence and devtools
- **Flexible**: Works with both class and functional components
- **Modular**: Supports slice pattern for organizing state logically
- **No Context Providers**: No need to wrap components in providers
- **Small Size**: Minimal bundle impact (less than 1KB)

## Project Structure

Our state management code is organized as follows:

```
/src/state/
├── hooks.ts          # Custom hooks for accessing state
├── store.ts          # Main store configuration
├── types.ts          # Type definitions
└── slices/           # Store slices
    ├── authSlice.ts       # Authentication state
    ├── dashboardSlice.ts  # Dashboard UI and data state
    └── settingsSlice.ts   # User preferences
```

## Store Structure

The store is organized into logical slices:

- **Dashboard**: UI state and data for the dashboard
- **Auth**: Authentication state and user information
- **Settings**: User preferences and application settings

## Usage Guidelines

### Accessing State

Use the provided hooks from `src/state/hooks.ts` to access state:

```tsx
import { useDashboardState, useRepositories, useSummary } from "@/state/hooks";

function MyComponent() {
  // Access the entire dashboard slice
  const dashboard = useDashboardState();

  // Or use specialized hooks for specific needs
  const { repositories, loading } = useRepositories();
  const { summary } = useSummary();

  // ...
}
```

### Updating State

Each slice provides actions for updating state:

```tsx
import { useStore } from "@/state/store";

function MyComponent() {
  // Access actions directly from store
  const setRepositories = useStore((state) => state.dashboard.setRepositories);

  // Or use the provided hook that includes the action
  const { updateRepositories } = useRepositories();

  const handleFetch = async () => {
    const data = await fetchData();
    updateRepositories(data);
  };

  // ...
}
```

### Persisted State

Some parts of the state are automatically persisted to localStorage:

- User preferences (theme, language)
- Dashboard UI settings (expanded panels, active filters)
- Non-sensitive auth state (user name, image)

Sensitive information is never persisted client-side.

## Handling Repository Fetch

The `handleRepositoryFetchSuccess` action is provided to update multiple related states in a single atomic update:

```tsx
const { handleRepositoryFetchSuccess } = useStore((state) => state.dashboard);

// Example usage
const fetchData = async () => {
  const response = await fetch("/api/repos");
  const data = await response.json();

  // Update multiple states atomically
  handleRepositoryFetchSuccess(
    data.repositories,
    data.authMethod,
    data.installationId,
    data.installationIds,
    data.installations,
    data.currentInstallation,
    data.currentInstallations,
    false, // needsInstallation
  );
};
```

## Best Practices

1. **Use Selectors**: Always use selectors to access only the state you need
2. **Atomic Updates**: Use actions that update related state atomically
3. **Dedicated Hooks**: Use the provided hooks for accessing state instead of direct store access
4. **Memoize Callbacks**: Memoize callbacks that use state or actions with `useCallback`
5. **Keep State Minimal**: Only store essential application state in Zustand
6. **Local Component State**: Use React's `useState` for component-specific state
7. **Immutable Updates**: Never directly mutate state objects

## Migration from useState

When migrating from multiple `useState` hooks to Zustand:

1. Identify related state that should be updated together
2. Move this state to the appropriate slice
3. Replace individual `useState` with the appropriate hook
4. Update dependency arrays in effects and callbacks

## Example

Before (with useState):

```tsx
const [repositories, setRepositories] = useState<Repository[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// Multiple state updates that should be atomic
const handleSuccess = (data) => {
  setRepositories(data.repositories);
  setAuthMethod(data.authMethod);
  setInstallationIds(data.installationIds);
  // ...more updates
};
```

After (with Zustand):

```tsx
// Access state and actions through hooks
const { repositories, loading, error } = useRepositories();
const { handleRepositoryFetchSuccess } = useStore((state) => state.dashboard);

// Single atomic update
const handleSuccess = (data) => {
  handleRepositoryFetchSuccess(
    data.repositories,
    data.authMethod,
    data.installationId,
    data.installationIds,
    data.installations,
    data.currentInstallation,
    data.currentInstallations,
  );
};
```

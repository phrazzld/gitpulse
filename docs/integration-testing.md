# Integration Testing in GitPulse

This guide outlines our approach to integration testing in the GitPulse application, with a focus on testing real components working together rather than mocking internal implementations.

## Core Principles

1. **Test Real Component Interactions**: Integration tests should test how real components interact, not mock implementations.
2. **Mock Only External Boundaries**: Only mock external systems (APIs, browser APIs, localStorage) but use real internal components.
3. **Focused Test Scenarios**: Each test should focus on a specific integration scenario.
4. **Maintainable Tests**: Tests should be robust and not break with minor implementation changes.

## ImprovedDashboardTestWrapper

We use a specialized test wrapper called `ImprovedDashboardTestWrapper` that provides:

- Session context with mock session data
- Control over fetch behavior to mock API responses
- Mocking of browser APIs like localStorage, ResizeObserver, matchMedia
- Optional content overrides for specific test scenarios

This wrapper is designed to minimize mocking internal components while providing a controlled environment for testing.

```tsx
import { ImprovedDashboardTestWrapper } from "./ImprovedDashboardTestWrapper";

render(
  <ImprovedDashboardTestWrapper mockFetch={mockFetchFn}>
    <ComponentUnderTest />
  </ImprovedDashboardTestWrapper>,
);
```

### Example Usage

```tsx
// Mock fetch implementation for repositories
const mockFetchFn = jest.fn().mockImplementation((url: string) => {
  if (url.includes("/api/repos")) {
    return Promise.resolve(
      createApiResponse({
        repositories: mockRepositories,
        authMethod: "github_app",
        installations: [mockInstallation],
        currentInstallations: [mockInstallation],
      }),
    );
  }
  return Promise.reject(new Error(`Unhandled route: ${url}`));
});

// Helper for creating API responses
const createApiResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
};

// Render with the wrapper
render(<ImprovedDashboardTestWrapper mockFetch={mockFetchFn} />);

// Test assertions on the rendered output
await waitFor(() => {
  expect(screen.getByText(/COMMIT ANALYSIS MODULE/i)).toBeInTheDocument();
});
```

## Types of Integration Tests

1. **Dashboard Integration Tests**: Test the main dashboard functionality with real components.
2. **Layout Integration Tests**: Test responsive layout behavior across different viewport sizes.
3. **Error Handling Integration Tests**: Test how errors propagate through the UI.
4. **Component Integration Tests**: Test how related components work together.

### Dashboard Integration Example

```tsx
it("should render the dashboard with loaded repository data", async () => {
  // Mock fetch implementation for repositories
  const mockFetchFn = jest.fn().mockImplementation((url: string) => {
    if (url.includes("/api/repos")) {
      return Promise.resolve(
        createApiResponse({
          repositories: mockRepositories,
          authMethod: "github_app",
          installations: [mockInstallation],
          currentInstallations: [mockInstallation],
        }),
      );
    }
    return Promise.reject(new Error(`Unhandled route: ${url}`));
  });

  render(<ImprovedDashboardTestWrapper mockFetch={mockFetchFn} />);

  // Initially shows loading state
  expect(document.querySelector(".animate-pulse")).toBeInTheDocument();

  // After loading, verify dashboard container is present
  await waitFor(() => {
    expect(screen.getByTestId("dashboard-container")).toBeInTheDocument();
  });

  // Verify critical dashboard components rendered
  expect(screen.getByText(/COMMIT ANALYSIS MODULE/i)).toBeInTheDocument();
});
```

### Error Handling Example

```tsx
it("should display authentication error when GitHub authentication fails", async () => {
  // Define error creation utilities
  const createErrorResponse = (errorType: string) => {
    switch (errorType) {
      case "auth":
        return {
          ok: false,
          status: 403,
          json: jest.fn().mockResolvedValue({
            error: "GitHub authentication failed",
            code: "GITHUB_AUTH_ERROR",
            details: "GitHub authentication failed",
          }),
        };
      // other error types...
    }
  };

  // Mock fetch to return authentication error
  const mockFetchFn = jest.fn().mockImplementation((url: string) => {
    if (url.includes("/api/repos")) {
      return Promise.resolve(createErrorResponse("auth"));
    }
    return Promise.reject(new Error(`Unhandled route: ${url}`));
  });

  render(<ImprovedDashboardTestWrapper mockFetch={mockFetchFn} />);

  // After loading completes, should display error
  await waitFor(() => {
    const errorElements = screen.getAllByText(/github authentication failed/i, {
      exact: false,
    });
    expect(errorElements.length).toBeGreaterThan(0);
  });
});
```

### Layout Testing Example

```tsx
it("should handle mobile-first responsive layout", () => {
  // Create a simple test component that demonstrates responsive layout
  const ResponsiveComponent = () => (
    <div className="flex flex-col md:flex-row">
      <div className="w-full md:w-1/4" data-testid="sidebar">
        Sidebar
      </div>
      <div className="w-full md:w-3/4" data-testid="content">
        Content
      </div>
    </div>
  );

  render(<ResponsiveComponent />);

  // Test responsive classes
  const sidebar = screen.getByTestId("sidebar");
  expect(sidebar).toHaveClass("w-full");
  expect(sidebar).toHaveClass("md:w-1/4");
});
```

## Best Practices

- **Focus on User Flows**: Test from the user's perspective, following typical user flows.
- **Use Real Selectors**: Test using text content and ARIA roles rather than test IDs where possible.
- **Minimize Boilerplate**: Use helpers to reduce test boilerplate.
- **Only Mock What's Necessary**: Only mock external dependencies, not internal implementations.

## Mocking Guidelines

### What to Mock

- External APIs (GitHub API, authentication services)
- Browser APIs (localStorage, ResizeObserver)
- Time-based functions (setTimeout, setInterval)
- Environment variables
- Next.js specific features (router, navigation)

### What NOT to Mock

- Internal React components
- Context providers
- State management
- Event handlers
- Internal utility functions

## Test Coverage Expectations

Integration tests should verify:

1. Components render correctly together
2. Data flows correctly between components
3. UI updates in response to user interactions
4. Error states are properly displayed
5. Layout responds to viewport changes

## Troubleshooting Common Issues

- **Test Timeouts**: Use appropriate waitFor timeouts for async operations.
- **Missing UI Elements**: Check for proper loading state handling.
- **Act Warnings**: Ensure all state updates are wrapped in act() or waitFor().
- **Mock Failures**: Verify mock implementations match expected interfaces.

By following these guidelines, our integration tests provide high confidence in the application's behavior while remaining maintainable and focused on real user flows.

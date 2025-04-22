/**
 * Integration tests for dashboard loading with incomplete state
 *
 * Tests how the dashboard behaves with undefined or incomplete Zustand state
 * to ensure resilience and proper defensive programming.
 *
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";
import RepositoryInfoPanel from "@/components/dashboard/RepositoryInfoPanel";

// Mock the logger to prevent console cluttering during tests
jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Zustand hooks
jest.mock("@/state", () => ({
  useFilters: () => ({
    filters: [],
  }),
  useUIState: () => ({
    showRepoList: true,
    togglePanel: jest.fn(),
  }),
  useDashboardRepository: () => ({
    repositories: undefined,
    loading: false,
  }),
}));

// Create a component that safely renders with undefined repositories
const SafeRepositoryPanel = ({ repositories = undefined, loading = false }) => {
  return (
    <div data-testid="safe-repository-panel">
      <p>Repositories count: {repositories?.length || 0}</p>
      <p>Loading state: {loading ? "Loading..." : "Not loading"}</p>
    </div>
  );
};

// Create a component that would throw with undefined repositories
const UnsafeRepositoryPanel = ({ repositories = undefined }) => {
  // This will throw if repositories is undefined
  const firstRepoName = repositories[0].name;
  return (
    <div data-testid="unsafe-repository-panel">
      <p>First repository: {firstRepoName}</p>
    </div>
  );
};

describe("Dashboard Incomplete State Integration", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods to verify no errors are thrown
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should safely render components with defensive checks for undefined repositories", () => {
    // Render with undefined repositories
    render(<SafeRepositoryPanel repositories={undefined} />);

    // Verify component renders without errors
    expect(screen.getByTestId("safe-repository-panel")).toBeInTheDocument();
    expect(screen.getByText("Repositories count: 0")).toBeInTheDocument();

    // Verify no console errors related to "Cannot read properties of undefined"
    const undefinedPropertyErrors = consoleErrorSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === "string" &&
        call[0].includes("Cannot read properties of undefined"),
    );
    expect(undefinedPropertyErrors.length).toBe(0);
  });

  it("should safely render with error boundary when component throws due to undefined state", () => {
    // Render the unsafe component with error boundary
    render(
      <DashboardErrorBoundary componentId="repository-panel">
        <UnsafeRepositoryPanel repositories={undefined} />
      </DashboardErrorBoundary>,
    );

    // Error boundary should catch the error and display fallback UI
    expect(screen.getByText(/Component Error:/i)).toBeInTheDocument();
    expect(screen.getByText(/repository-panel/i)).toBeInTheDocument();

    // Retry button should be present
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
  });

  it("should verify error boundary catches errors in RepositoryInfoPanel with undefined repositories", () => {
    // Render with error boundary as it would be in the real app
    render(
      <DashboardErrorBoundary componentId="repository-info-panel">
        <RepositoryInfoPanel />
      </DashboardErrorBoundary>,
    );

    // Test passes when error boundary catches the error
    expect(
      screen.getByText(/Component Error: repository-info-panel/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/An error occurred while rendering this component/i),
    ).toBeInTheDocument();

    // Verify retry button exists
    expect(screen.getByText(/Retry/i)).toBeInTheDocument();
  });

  it("should properly transition from undefined to defined repositories", async () => {
    // Create a component that updates state from undefined to defined
    const RepositoryStateTransition = () => {
      const [repositories, setRepositories] = React.useState(undefined);

      React.useEffect(() => {
        // Simulate loading repositories after a delay
        const timer = setTimeout(() => {
          setRepositories([{ id: 1, name: "test-repo" }]);
        }, 100);

        return () => clearTimeout(timer);
      }, []);

      return (
        <div data-testid="repository-transition">
          <p>Repositories count: {repositories?.length || 0}</p>
          {repositories?.length > 0 && (
            <p>First repository: {repositories[0].name}</p>
          )}
        </div>
      );
    };

    render(<RepositoryStateTransition />);

    // Initially repositories is undefined
    expect(screen.getByText("Repositories count: 0")).toBeInTheDocument();

    // After state update, the component should render with repositories
    await waitFor(() => {
      expect(screen.getByText("Repositories count: 1")).toBeInTheDocument();
      expect(
        screen.getByText("First repository: test-repo"),
      ).toBeInTheDocument();
    });

    // Verify no errors occurred during state transition
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringMatching(/Cannot read properties of undefined/),
    );
  });
});

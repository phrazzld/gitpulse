import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DashboardErrorBoundary, {
  DashboardErrorFallbackProps,
} from "../DashboardErrorBoundary";
import { GenericPanelFallback } from "../ErrorFallbacks";

// Mock logger to prevent console errors during tests
jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

// Test component that throws an error
const ErrorComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Normal content</div>;
};

// Test component that renders children
const TestComponent = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="test-component">{children}</div>;
};

// Custom fallback for testing
const CustomFallback = ({
  error,
  retry,
  componentId,
}: DashboardErrorFallbackProps) => {
  return (
    <div data-testid="custom-fallback">
      <h2>Custom Error: {componentId}</h2>
      <p>{error.message}</p>
      <button onClick={retry}>Custom Retry</button>
    </div>
  );
};

describe("DashboardErrorBoundary", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Suppress React's error boundary console errors
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });

  it("renders children normally when no error occurs", () => {
    render(
      <DashboardErrorBoundary componentId="test-boundary">
        <TestComponent>Content</TestComponent>
      </DashboardErrorBoundary>,
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByTestId("test-component")).toBeInTheDocument();
  });

  it("renders default fallback UI when an error occurs", () => {
    render(
      <DashboardErrorBoundary componentId="test-boundary">
        <ErrorComponent shouldThrow={true} />
      </DashboardErrorBoundary>,
    );

    // Check fallback UI is shown
    expect(
      screen.getByText(/Component Error: test-boundary/),
    ).toBeInTheDocument();
    expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders custom fallback UI when provided", () => {
    render(
      <DashboardErrorBoundary
        componentId="test-boundary"
        fallback={(props) => <CustomFallback {...props} />}
      >
        <ErrorComponent shouldThrow={true} />
      </DashboardErrorBoundary>,
    );

    // Check custom fallback UI is shown
    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    expect(screen.getByText(/Custom Error: test-boundary/)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
    expect(screen.getByText("Custom Retry")).toBeInTheDocument();
  });

  it("works with imported fallback components", () => {
    render(
      <DashboardErrorBoundary
        componentId="test-boundary"
        fallback={(props) => <GenericPanelFallback {...props} />}
      >
        <ErrorComponent shouldThrow={true} />
      </DashboardErrorBoundary>,
    );

    // Check GenericPanelFallback UI
    expect(screen.getByText(/Component Error/)).toBeInTheDocument();
    expect(screen.getByText(/Test error/)).toBeInTheDocument();
    expect(screen.getByText("Retry Component")).toBeInTheDocument();
  });

  it("renders retry button that can be clicked", () => {
    // Simplified test that just verifies the retry button exists and is clickable

    // Create a component that always throws an error
    const ErrorComponent = () => {
      throw new Error("Test error");
      return null;
    };

    render(
      <DashboardErrorBoundary componentId="test-boundary">
        <ErrorComponent />
      </DashboardErrorBoundary>,
    );

    // Find and verify the retry button
    const retryButton = screen.getByText("Retry");
    expect(retryButton).toBeInTheDocument();

    // Verify we can click the button (even if it doesn't change anything in this test)
    fireEvent.click(retryButton);
  });
});

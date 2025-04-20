import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardSummaryPanel from "../DashboardSummaryPanel";

describe("DashboardSummaryPanel", () => {
  test("renders with default values when no props provided", () => {
    render(<DashboardSummaryPanel />);

    // Check if the title is rendered
    expect(screen.getByText("ACTIVITY METRICS")).toBeInTheDocument();

    // Check if all metrics are rendered with default values
    expect(screen.getByText("COMMIT COUNT")).toBeInTheDocument();
    expect(screen.getByText("REPOSITORIES")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE DAYS")).toBeInTheDocument();

    // All default values should be 0
    const values = screen.getAllByText("0");
    expect(values).toHaveLength(3); // One for each metric
  });

  test("renders with provided values", () => {
    const props = {
      commits: 123,
      repositories: 45,
      activeDays: 67,
    };

    render(<DashboardSummaryPanel {...props} />);

    // Check if the values are correctly rendered
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument();
  });

  test("renders loading state correctly", () => {
    render(<DashboardSummaryPanel isLoading={true} />);

    // Check if the loading indicator is shown
    expect(screen.getByText("PROCESSING")).toBeInTheDocument();

    // Loading state should have pulsing elements instead of values
    // Testing the presence of these elements is implementation-specific,
    // but we can test that the values are not displayed
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  test("renders error state correctly", () => {
    const errorMessage = "Failed to load metrics";

    render(<DashboardSummaryPanel error={errorMessage} />);

    // Check if the error message is displayed
    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Error state should not display the metrics
    expect(screen.queryByText("COMMIT COUNT")).not.toBeInTheDocument();
  });

  test("formats large numbers with commas", () => {
    render(<DashboardSummaryPanel commits={1234567} />);

    // Check if the number is formatted with commas
    expect(screen.getByText("1,234,567")).toBeInTheDocument();
  });
});

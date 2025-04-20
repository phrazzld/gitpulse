import React from "react";
import { render, screen } from "@testing-library/react";
import FilterControls from "../FilterControls";

// Mock DateRangePicker component
jest.mock("@/components/DateRangePicker", () => ({
  __esModule: true,
  default: ({ dateRange, onChange }: any) => (
    <div data-testid="date-range-picker">
      <span>
        Date Range: {dateRange.since} to {dateRange.until}
      </span>
    </div>
  ),
}));

describe("FilterControls", () => {
  const defaultProps = {
    activityMode: "my-activity" as const,
    dateRange: { since: "2023-01-01", until: "2023-01-31" },
    activeFilters: { repositories: [] },
    installations: [],
    loading: false,
    handleDateRangeChange: jest.fn(),
    session: null,
  };

  test("renders filter title and sections correctly", () => {
    render(<FilterControls {...defaultProps} />);

    // Check if the title is rendered
    expect(screen.getByText("ANALYSIS FILTERS")).toBeInTheDocument();
    expect(screen.getByText("CONFIGURE PARAMETERS")).toBeInTheDocument();
  });

  test("renders activity mode section", () => {
    render(<FilterControls {...defaultProps} />);

    // Check if activity mode section is rendered
    expect(screen.getByText("ACTIVITY MODE")).toBeInTheDocument();
    expect(screen.getAllByText("MY ACTIVITY")[0]).toBeInTheDocument();
    expect(
      screen.getByText("View your commits across all repositories"),
    ).toBeInTheDocument();
  });

  test("renders date range picker with correct props", () => {
    render(<FilterControls {...defaultProps} />);

    // Check if date range picker is rendered
    const dateRangePicker = screen.getByTestId("date-range-picker");
    expect(dateRangePicker).toBeInTheDocument();

    // Check if date range is displayed
    expect(
      screen.getByText("Date Range: 2023-01-01 to 2023-01-31"),
    ).toBeInTheDocument();
  });

  test("renders analysis parameters section", () => {
    render(<FilterControls {...defaultProps} />);

    // Check if analysis parameters section is rendered
    expect(screen.getByText("ANALYSIS PARAMETERS")).toBeInTheDocument();
    expect(screen.getByText("MODE")).toBeInTheDocument();
    expect(screen.getByText("DATE RANGE")).toBeInTheDocument();

    // Check if values are displayed using getAllByText for items that might appear multiple times
    const modeValues = screen.getAllByText("MY ACTIVITY");
    expect(modeValues.length).toBeGreaterThan(0);
    expect(screen.getByText("2023-01-01 to 2023-01-31")).toBeInTheDocument();
  });

  test("renders loading state correctly", () => {
    render(<FilterControls {...defaultProps} loading={true} />);

    // Date range picker should be disabled while loading
    const dateRangePicker = screen.getByTestId("date-range-picker");
    expect(dateRangePicker).toBeInTheDocument();
  });

  test("renders with active filters", () => {
    render(
      <FilterControls
        {...defaultProps}
        activeFilters={{ repositories: ["repo1", "repo2"] }}
      />,
    );

    // Analysis parameters should still be shown
    expect(screen.getByText("ANALYSIS PARAMETERS")).toBeInTheDocument();
  });

  test("renders with installations", () => {
    const installations = [
      {
        id: 1,
        account: { login: "owner1", avatarUrl: "" },
        appSlug: "test-app",
        appId: 123,
        repositorySelection: "all",
        targetType: "User",
      },
      {
        id: 2,
        account: { login: "owner2", avatarUrl: "" },
        appSlug: "test-app",
        appId: 123,
        repositorySelection: "all",
        targetType: "User",
      },
    ];

    render(<FilterControls {...defaultProps} installations={installations} />);

    // Activity mode should still be shown
    expect(screen.getByText("ACTIVITY MODE")).toBeInTheDocument();
  });

  test("renders with session information", () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.png",
      },
      expires: "2023-01-01T00:00:00.000Z",
    };

    render(<FilterControls {...defaultProps} session={mockSession} />);

    // Analysis parameters should still be shown
    expect(screen.getByText("ANALYSIS PARAMETERS")).toBeInTheDocument();
  });
});

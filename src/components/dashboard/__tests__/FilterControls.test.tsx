import React from "react";
import { render, screen } from "@testing-library/react";
import FilterControls from "../FilterControls";

// Mock the state hooks
jest.mock("@/state", () => ({
  useUIState: () => ({
    error: null,
    showRepoList: true,
    expandedPanels: [],
    setShowRepoList: jest.fn(),
    togglePanel: jest.fn(),
    loading: false,
  }),
  useDashboardRepository: () => ({
    repositories: [],
    loading: false,
    initialLoad: false,
  }),
  useDateRange: () => ({
    dateRange: { since: "2023-01-01", until: "2023-01-31" },
    setDateRange: jest.fn(),
    updateDateRange: jest.fn(),
  }),
  useFilters: () => ({
    filters: { repositories: [] },
    activeFilters: { repositories: [] },
    setActiveFilters: jest.fn(),
    updateFilters: jest.fn(),
  }),
  useInstallations: () => ({
    installations: [],
    loading: false,
    installationsLoading: false,
  }),
}));

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
  test("renders filter title and sections", () => {
    render(<FilterControls activityMode="my-activity" session={null} />);

    // Check if the title is rendered
    expect(screen.getByText("ANALYSIS FILTERS")).toBeInTheDocument();
    expect(screen.getByText("CONFIGURE PARAMETERS")).toBeInTheDocument();
  });

  test("renders activity mode section", () => {
    render(<FilterControls activityMode="my-activity" session={null} />);

    // Check if activity mode section is rendered
    expect(screen.getByText("ACTIVITY MODE")).toBeInTheDocument();
    expect(screen.getAllByText("MY ACTIVITY")[0]).toBeInTheDocument();
  });
});

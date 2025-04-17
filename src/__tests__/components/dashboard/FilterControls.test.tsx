import React from "react";
import { render, screen, it } from "../../../__tests__/test-utils";
import FilterControls from "@/components/dashboard/FilterControls";
import {
  mockSession,
  mockDateRange,
  mockActiveFilters,
} from "../../../__tests__/test-utils";
import { Installation } from "@/types/github";

jest.mock("@/components/DateRangePicker", () => {
  return {
    __esModule: true,
    default: ({
      dateRange,
      onChange,
    }: import("@/types/testing").DateRangePickerProps) => (
      <div data-testid="date-range-picker">
        <span>
          Date range: {dateRange.since} to {dateRange.until}
        </span>
        <button
          onClick={() => onChange({ since: "2025-01-01", until: "2025-01-31" })}
        >
          Change Date
        </button>
      </div>
    ),
  };
});

// OrganizationPicker component removed for individual-only focus

describe("FilterControls", () => {
  const mockInstallations: Installation[] = [
    {
      id: 1,
      account: {
        login: "org1",
        type: "Organization",
        avatarUrl: "https://example.com/avatar1.jpg",
      },
      appSlug: "test-app",
      appId: 123,
      repositorySelection: "all",
      targetType: "Organization",
    },
    {
      id: 2,
      account: {
        login: "org2",
        type: "Organization",
        avatarUrl: "https://example.com/avatar2.jpg",
      },
      appSlug: "test-app",
      appId: 123,
      repositorySelection: "all",
      targetType: "Organization",
    },
  ];

  const mockHandleDateRangeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with my-activity mode correctly", () => {
    render(
      <FilterControls
        activityMode="my-activity"
        dateRange={mockDateRange}
        activeFilters={mockActiveFilters}
        installations={mockInstallations}
        loading={false}
        handleDateRangeChange={mockHandleDateRangeChange}
        session={mockSession}
      />,
    );

    // Should display MY ACTIVITY mode (use query to handle multiple elements with same text)
    expect(screen.queryAllByText("MY ACTIVITY").length).toBeGreaterThan(0);

    // Should display date range picker
    expect(screen.getByTestId("date-range-picker")).toBeInTheDocument();
    expect(
      screen.getByText(
        `Date range: ${mockDateRange.since} to ${mockDateRange.until}`,
      ),
    ).toBeInTheDocument();

    // Organization picker has been removed from the application
  });

  // Test for team-activity mode removed as it's no longer supported

  it("calls handleDateRangeChange when date range is changed", () => {
    render(
      <FilterControls
        activityMode="my-activity"
        dateRange={mockDateRange}
        activeFilters={mockActiveFilters}
        installations={mockInstallations}
        loading={false}
        handleDateRangeChange={mockHandleDateRangeChange}
        session={mockSession}
      />,
    );

    // Click date change button
    fireEvent.click(screen.getByText("Change Date"));

    // Should call handleDateRangeChange with new date range
    expect(mockHandleDateRangeChange).toHaveBeenCalledTimes(1);
    expect(mockHandleDateRangeChange).toHaveBeenCalledWith({
      since: "2025-01-01",
      until: "2025-01-31",
    });
  });

  // Test for OrganizationPicker removed as component has been deleted

  it("displays parameters panel with correct information", () => {
    render(
      <FilterControls
        activityMode="my-activity"
        dateRange={mockDateRange}
        activeFilters={mockActiveFilters}
        installations={mockInstallations}
        loading={false}
        handleDateRangeChange={mockHandleDateRangeChange}
        session={mockSession}
      />,
    );

    // Should display analysis parameters section
    expect(screen.getByText("ANALYSIS PARAMETERS")).toBeInTheDocument();

    // Should display mode (use query to handle multiple elements with same text)
    expect(screen.queryAllByText("MY ACTIVITY").length).toBeGreaterThan(0);

    // Should display date range
    expect(
      screen.getByText(`${mockDateRange.since} to ${mockDateRange.until}`),
    ).toBeInTheDocument();

    // No organizations display as it's been removed
  });
});

// Need to add this import and reference to make the fireEvent work
import { fireEvent } from "@testing-library/react";

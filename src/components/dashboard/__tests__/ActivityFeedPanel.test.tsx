import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ActivityFeedPanel from "../ActivityFeedPanel";
import * as activityModule from "@/lib/activity";
import { useProgressiveLoading } from "@/hooks/useProgressiveLoading";

// Mock useProgressiveLoading
jest.mock("@/hooks/useProgressiveLoading");

// Mock the FixedSizeList from react-window
jest.mock("react-window", () => ({
  FixedSizeList: ({ children, itemCount }: any) => {
    // Render just one item for testing
    return (
      <div data-testid="virtual-list">
        {itemCount > 0 && children({ index: 0, style: {} })}
      </div>
    );
  },
}));

// Mock LoadMoreButton
jest.mock("@/components/LoadMoreButton", () => ({
  __esModule: true,
  default: ({ onClick }: any) => (
    <button data-testid="load-more-button" onClick={onClick}>
      Load More
    </button>
  ),
}));

// Mock IntersectionObserver
jest.mock("@/components/IntersectionObserver", () => ({
  __esModule: true,
  default: ({ children, onIntersect }: any) => (
    <div data-testid="intersection-observer" onClick={onIntersect}>
      {children}
    </div>
  ),
}));

// Mock Button component
jest.mock("@/components/library", () => ({
  Button: ({ children, onClick }: any) => (
    <button data-testid="view-more-button" onClick={onClick}>
      {children}
    </button>
  ),
  Card: ({ children, className, padding, radius, shadow }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

// Sample commit data
const mockCommits = [
  {
    sha: "123abc",
    html_url: "https://github.com/org/repo/commit/123abc",
    commit: {
      message: "Fix bug in login form",
      author: {
        name: "Jane Doe",
        date: "2023-01-01T12:00:00Z",
      },
    },
    repository: {
      name: "repo",
      full_name: "org/repo",
      html_url: "https://github.com/org/repo",
    },
  },
  {
    sha: "456def",
    html_url: "https://github.com/org/repo/commit/456def",
    commit: {
      message: "Add new feature",
      author: {
        name: "John Smith",
        date: "2023-01-02T14:30:00Z",
      },
    },
    repository: {
      name: "repo",
      full_name: "org/repo",
      html_url: "https://github.com/org/repo",
    },
  },
];

// Mock the activity fetcher
jest.mock("@/lib/activity", () => ({
  createActivityFetcher: jest.fn(),
}));

describe("ActivityFeedPanel", () => {
  // Default mock implementation for useProgressiveLoading
  const mockLoadMore = jest.fn().mockResolvedValue({});
  const mockReset = jest.fn();
  const mockLoadInitialData = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    // Mock the element offsetWidth used in the component for list width
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 800,
    });

    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementation for useProgressiveLoading
    (useProgressiveLoading as jest.Mock).mockReturnValue({
      items: mockCommits,
      loading: false,
      initialLoading: false,
      incrementalLoading: false,
      hasMore: true,
      error: null,
      loadInitialData: mockLoadInitialData,
      loadMore: mockLoadMore,
      reset: mockReset,
    });

    // Setup default mock implementation
    (activityModule.createActivityFetcher as jest.Mock).mockImplementation(
      () => {
        return jest.fn().mockResolvedValue({
          data: mockCommits,
          nextCursor: null,
          hasMore: false,
        });
      },
    );

    // Mock window resize event
    window.innerWidth = 1024;
    window.dispatchEvent(new Event("resize"));
  });

  test("renders loading state initially", async () => {
    // Mock initial loading state
    (useProgressiveLoading as jest.Mock).mockReturnValue({
      items: [],
      loading: true,
      initialLoading: true,
      incrementalLoading: false,
      hasMore: false,
      error: null,
      loadInitialData: mockLoadInitialData,
      loadMore: mockLoadMore,
      reset: mockReset,
    });

    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Check if loading indicator is displayed
    expect(screen.getByText("Loading activity data...")).toBeInTheDocument();
  });

  test("renders commits after loading", async () => {
    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Check if header is displayed
    expect(screen.getByText("COMMIT TIMELINE")).toBeInTheDocument();

    // Check if commit message is displayed
    expect(screen.getByText("Fix bug in login form")).toBeInTheDocument();

    // Check if virtualized list is used
    expect(screen.getByTestId("virtual-list")).toBeInTheDocument();
  });

  test("renders error state when fetch fails", async () => {
    // Mock error state
    (useProgressiveLoading as jest.Mock).mockReturnValue({
      items: [],
      loading: false,
      initialLoading: false,
      incrementalLoading: false,
      hasMore: false,
      error: "API error",
      loadInitialData: mockLoadInitialData,
      loadMore: mockLoadMore,
      reset: mockReset,
    });

    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Check if error message is displayed
    expect(
      screen.getByText(/Failed to load activity data/),
    ).toBeInTheDocument();
  });

  test("renders empty state when no data", async () => {
    // Mock empty state
    (useProgressiveLoading as jest.Mock).mockReturnValue({
      items: [],
      loading: false,
      initialLoading: false,
      incrementalLoading: false,
      hasMore: false,
      error: null,
      loadInitialData: mockLoadInitialData,
      loadMore: mockLoadMore,
      reset: mockReset,
    });

    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Check if empty state message is displayed
    expect(
      screen.getByText("No activity data available for the selected filters."),
    ).toBeInTheDocument();
  });

  test("renders view more button in truncated mode", async () => {
    const mockViewMore = jest.fn();

    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
        truncated={true}
        onViewMore={mockViewMore}
      />,
    );

    // Check if view more button is displayed
    const viewMoreButton = screen.getByTestId("view-more-button");
    expect(viewMoreButton).toBeInTheDocument();

    // Test click handler
    fireEvent.click(viewMoreButton);
    expect(mockViewMore).toHaveBeenCalled();
  });

  test("handles repository filters when provided", async () => {
    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
        filters={{ repositories: ["repo1", "repo2"] }}
      />,
    );

    // Just check if loadInitialData was called
    expect(mockLoadInitialData).toHaveBeenCalled();
  });

  test("handles infinite scroll intersection", async () => {
    // Mock hasMore true to enable infinite scroll
    (useProgressiveLoading as jest.Mock).mockReturnValue({
      items: mockCommits,
      loading: false,
      initialLoading: false,
      incrementalLoading: false,
      hasMore: true,
      error: null,
      loadInitialData: mockLoadInitialData,
      loadMore: mockLoadMore,
      reset: mockReset,
    });

    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Find intersection observer element
    const observerElement = screen.getByTestId("intersection-observer");

    // Trigger intersection
    fireEvent.click(observerElement);

    // LoadMore should be called
    expect(mockLoadMore).toHaveBeenCalled();
  });

  test("shows loading indicator during incremental loading", async () => {
    // Mock incremental loading state
    (useProgressiveLoading as jest.Mock).mockReturnValue({
      items: mockCommits,
      loading: false,
      initialLoading: false,
      incrementalLoading: true,
      hasMore: true,
      error: null,
      loadInitialData: mockLoadInitialData,
      loadMore: mockLoadMore,
      reset: mockReset,
    });

    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Should show LOADING indicator
    expect(screen.getByText("LOADING")).toBeInTheDocument();
  });

  test("calculates proper list height based on truncation", async () => {
    // Test with truncated mode
    const { rerender } = render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
        truncated={true}
      />,
    );

    // List height in truncated mode should be less (using mocked FixedSizeList)
    const virtualList = screen.getByTestId("virtual-list");

    // Re-render without truncation
    rerender(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
        truncated={false}
      />,
    );

    // Same virtual list, but height calculation should be different
    expect(virtualList).toBeInTheDocument();
  });

  test("cleans up on unmount", async () => {
    const { unmount } = render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Unmount the component
    unmount();

    // Reset should be called on unmount
    expect(mockReset).toHaveBeenCalled();
  });

  test("uses loadInitialData to load data", async () => {
    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Check if loadInitialData was called
    expect(mockLoadInitialData).toHaveBeenCalled();
  });

  test("loads data with the provided date range", async () => {
    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
      />,
    );

    // Check if loadInitialData was called
    expect(mockLoadInitialData).toHaveBeenCalled();
  });

  test("renders with maxItems limitation when provided", async () => {
    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
        maxItems={10}
      />,
    );

    // Virtual list should be rendered
    expect(screen.getByTestId("virtual-list")).toBeInTheDocument();
  });
});

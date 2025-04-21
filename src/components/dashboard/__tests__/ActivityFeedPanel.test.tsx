import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ActivityFeedPanel from "../ActivityFeedPanel";
import { useActivityData } from "@/hooks/useActivityData";

// Mock activity feed components and hooks
jest.mock("../activityFeed", () => ({
  ActivityFeedHeader: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="activity-feed-header">
      <span>COMMIT TIMELINE</span>
      {isLoading && <span>LOADING</span>}
    </div>
  ),
  ActivityFeedContent: ({
    commits,
    error,
    loading,
    initialLoading,
    propsLoading,
  }: any) => {
    if ((initialLoading || propsLoading) && commits.length === 0) {
      return <div>Loading activity data...</div>;
    }

    if (error) {
      return <div>Failed to load activity data: {error}</div>;
    }

    if (!loading && commits.length === 0) {
      return <div>No activity data available for the selected filters.</div>;
    }

    return (
      <div data-testid="activity-feed-content">
        <div data-testid="virtual-list">
          {commits.length > 0 && <div>{commits[0].commit.message}</div>}
        </div>
      </div>
    );
  },
  useActivityFeedLayout: jest.fn().mockReturnValue({
    listContainerRef: { current: null },
    listWidth: 800,
    newItemsCount: 0,
    canTriggerInfiniteScroll: true,
    handleIntersect: jest.fn(),
  }),
}));

// Mock IntersectionObserver component
jest.mock("@/components/IntersectionObserver", () => ({
  __esModule: true,
  default: ({ children, onIntersect }: any) => (
    <div data-testid="intersection-observer" onClick={onIntersect}>
      {children}
    </div>
  ),
}));

// Mock library components
jest.mock("@/components/library", () => ({
  Button: ({ children, onClick }: any) => (
    <button data-testid="view-more-button" onClick={onClick}>
      {children}
    </button>
  ),
  Card: ({ children, className }: any) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

// Mock useActivityData hook
jest.mock("@/hooks/useActivityData");

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

describe("ActivityFeedPanel", () => {
  // Default mock implementation for useActivityData
  const mockLoadMore = jest.fn().mockResolvedValue({});
  const mockReset = jest.fn();
  const mockLoadInitialData = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementation for useActivityData
    (useActivityData as jest.Mock).mockReturnValue({
      commits: mockCommits,
      loading: false,
      initialLoading: false,
      incrementalLoading: false,
      hasMore: true,
      error: null,
      loadInitialData: mockLoadInitialData,
      loadMore: mockLoadMore,
      reset: mockReset,
    });
  });

  test("renders loading state initially", async () => {
    // Mock initial loading state
    (useActivityData as jest.Mock).mockReturnValue({
      commits: [],
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
  });

  test("renders error state when fetch fails", async () => {
    // Mock error state
    (useActivityData as jest.Mock).mockReturnValue({
      commits: [],
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
    (useActivityData as jest.Mock).mockReturnValue({
      commits: [],
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

  test("shows loading indicator during incremental loading", async () => {
    // Mock incremental loading state
    (useActivityData as jest.Mock).mockReturnValue({
      commits: mockCommits,
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

  test("passes filters and installation IDs correctly", async () => {
    render(
      <ActivityFeedPanel
        dateRange={{ since: "2023-01-01", until: "2023-01-31" }}
        filters={{ repositories: ["repo1", "repo2"] }}
        installationIds={[123, 456]}
        mode="my-activity"
      />,
    );

    // Check that useActivityData was called with the correct parameters
    expect(useActivityData).toHaveBeenCalledWith(
      {
        dateRange: { since: "2023-01-01", until: "2023-01-31" },
        filters: { repositories: ["repo1", "repo2"] },
        installationIds: [123, 456],
        mode: "my-activity",
      },
      expect.anything(),
    );
  });
});

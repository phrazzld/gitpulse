import { renderHook, act, waitFor } from "@testing-library/react";
import { useActivityData } from "../useActivityData";
import * as activityModule from "@/lib/activity";

// Mock the createActivityFetcher function
jest.mock("@/lib/activity", () => ({
  createActivityFetcher: jest.fn(),
}));

// Sample mock data
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
];

describe("useActivityData", () => {
  // Mock implementation for createActivityFetcher
  const mockFetcherFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementation
    mockFetcherFn.mockResolvedValue({
      data: mockCommits,
      nextCursor: null,
      hasMore: false,
    });

    (activityModule.createActivityFetcher as jest.Mock).mockImplementation(
      () => mockFetcherFn,
    );
  });

  it("should load initial data on mount", async () => {
    const { result } = renderHook(() =>
      useActivityData({
        dateRange: { since: "2023-01-01", until: "2023-01-31" },
      }),
    );

    // Initial state before data load
    expect(result.current.loading).toBe(true);
    expect(result.current.initialLoading).toBe(true);
    expect(result.current.commits).toEqual([]);

    // Wait for loading state to change
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    // After data load
    expect(result.current.loading).toBe(false);
    expect(result.current.commits).toEqual(mockCommits);
    expect(mockFetcherFn).toHaveBeenCalled();
  });

  it("should handle load more correctly", async () => {
    // Mock data for first and second page
    const firstPageData = {
      data: [mockCommits[0]],
      nextCursor: "next-cursor",
      hasMore: true,
    };

    const secondPageData = {
      data: [
        {
          ...mockCommits[0],
          sha: "456def",
          commit: {
            ...mockCommits[0].commit,
            message: "Another commit",
          },
        },
      ],
      nextCursor: null,
      hasMore: false,
    };

    // Setup mock implementation for pagination
    mockFetcherFn
      .mockResolvedValueOnce(firstPageData)
      .mockResolvedValueOnce(secondPageData);

    const { result } = renderHook(() =>
      useActivityData({
        dateRange: { since: "2023-01-01", until: "2023-01-31" },
      }),
    );

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    // Verify first page loaded
    expect(result.current.commits).toEqual(firstPageData.data);
    expect(result.current.hasMore).toBe(true);

    // Load next page
    await act(async () => {
      await result.current.loadMore();
    });

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.incrementalLoading).toBe(false);
    });

    // After next page loaded
    expect(result.current.loading).toBe(false);
    expect(result.current.commits).toEqual([
      ...firstPageData.data,
      ...secondPageData.data,
    ]);
    expect(result.current.hasMore).toBe(false);
  });

  it("should handle error states correctly", async () => {
    // Mock an error response
    const errorMessage = "API error occurred";
    mockFetcherFn.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() =>
      useActivityData({
        dateRange: { since: "2023-01-01", until: "2023-01-31" },
      }),
    );

    // Wait for error to be processed
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    // Verify error state
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.commits).toEqual([]);
  });

  it("should reset state when dependencies change", async () => {
    const { result, rerender } = renderHook((props) => useActivityData(props), {
      initialProps: {
        dateRange: { since: "2023-01-01", until: "2023-01-31" },
      },
    });

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    // Verify initial data loaded
    expect(result.current.commits).toEqual(mockCommits);

    // Change date range
    rerender({
      dateRange: { since: "2023-02-01", until: "2023-02-28" },
    });

    // Should trigger new loading state
    expect(result.current.initialLoading).toBe(true);

    // Wait for new data load
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    // Mock function should be called again with new params
    expect(mockFetcherFn).toHaveBeenCalledTimes(2);
  });

  it("should apply correct filters to API request", async () => {
    const { result } = renderHook(() =>
      useActivityData({
        dateRange: { since: "2023-01-01", until: "2023-01-31" },
        filters: { repositories: ["repo1", "repo2"] },
        installationIds: [123, 456],
        mode: "my-activity",
      }),
    );

    // Wait for data loading to complete
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    // Check that createActivityFetcher was called with correct parameters
    expect(activityModule.createActivityFetcher).toHaveBeenCalledWith(
      "/api/my-activity",
      expect.objectContaining({
        since: "2023-01-01",
        until: "2023-01-31",
        repositories: "repo1,repo2",
        installation_ids: "123,456",
      }),
    );
  });

  it("should reset data when calling reset method", async () => {
    const { result } = renderHook(() =>
      useActivityData({
        dateRange: { since: "2023-01-01", until: "2023-01-31" },
      }),
    );

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.initialLoading).toBe(false);
    });

    // Verify initial data loaded
    expect(result.current.commits).toEqual(mockCommits);

    // Call reset
    act(() => {
      result.current.reset();
    });

    // State should be reset
    expect(result.current.commits).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);
  });
});

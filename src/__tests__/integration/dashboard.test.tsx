import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import {
  mockSession,
  mockInstallation,
  mockRepositories,
  mockSummary,
  mockDateRange,
  mockActiveFilters,
} from "../test-utils";

// Mock the auth library
jest.mock("@/lib/auth/githubAuth", () => ({
  createAuthenticatedOctokit: jest.fn(),
  getInstallationManagementUrl: jest
    .fn()
    .mockReturnValue("https://github.com/settings/installations/123"),
  getAllAppInstallations: jest.fn().mockResolvedValue([]),
  checkAppInstallation: jest.fn().mockResolvedValue(123),
}));

// Mock the github data library
jest.mock("@/lib/githubData", () => ({
  fetchRepositories: jest.fn(),
  fetchAppRepositories: jest.fn(),
  fetchAllRepositories: jest.fn(),
  fetchRepositoryCommitsWithOctokit: jest.fn(),
  fetchRepositoryCommits: jest.fn(),
  fetchCommitsForRepositoriesWithOctokit: jest.fn(),
  fetchCommitsForRepositories: jest.fn(),
}));

// Mock the activity library
jest.mock("@/lib/activity", () => ({
  createActivityFetcher: jest.fn().mockReturnValue(() =>
    Promise.resolve({
      data: [],
      hasMore: false,
    }),
  ),
}));

// Mock localStorageCache
jest.mock("@/lib/localStorageCache", () => ({
  setCacheItem: jest.fn(),
  getCacheItem: jest.fn(),
  getStaleItem: jest.fn().mockReturnValue({ data: null, isStale: true }),
  ClientCacheTTL: { LONG: 3600000 },
}));

// Import Dashboard after mocking dependencies
import Dashboard from "@/app/dashboard/page";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: mockSession,
    status: "authenticated",
  })),
  signOut: jest.fn(),
}));

// Mock next navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock child components to verify props passing and integration
const mockComponentProps: Record<
  string,
  import("@/types/testing").MockComponentProps
> = {};

// Mock AuthenticationStatusBanner
jest.mock("@/components/dashboard/AuthenticationStatusBanner", () => {
  return function MockAuthenticationStatusBanner(
    props: import("@/types/testing").MockComponentProps,
  ) {
    mockComponentProps.AuthenticationStatusBanner = props;
    return (
      <div data-testid="auth-banner">
        {props.error && <div data-testid="error-message">{props.error}</div>}
        {props.needsInstallation && (
          <div data-testid="needs-installation">Installation needed</div>
        )}
      </div>
    );
  };
});

// Mock AccountManagementPanel
jest.mock("@/components/dashboard/AccountManagementPanel", () => {
  return function MockAccountManagementPanel(
    props: import("@/types/testing").MockComponentProps,
  ) {
    mockComponentProps.AccountManagementPanel = props;
    return (
      <div data-testid="account-panel">
        <button
          data-testid="switch-installation-btn"
          onClick={() =>
            props.switchInstallations && props.switchInstallations()
          }
        >
          Switch Installation
        </button>
      </div>
    );
  };
});

// Mock FilterControls (updated for individual-focused MVP)
jest.mock("@/components/dashboard/FilterControls", () => {
  return function MockFilterControls(
    props: import("@/types/testing").MockComponentProps,
  ) {
    mockComponentProps.FilterControls = props;
    return (
      <div data-testid="filter-controls">
        <button
          data-testid="change-date-btn"
          onClick={() =>
            props.handleDateRangeChange &&
            props.handleDateRangeChange({
              since: "2025-02-01",
              until: "2025-02-28",
            })
          }
        >
          Change Date
        </button>
      </div>
    );
  };
});

// Mock RepositoryInfoPanel
jest.mock("@/components/dashboard/RepositoryInfoPanel", () => {
  return function MockRepositoryInfoPanel(
    props: import("@/types/testing").MockComponentProps,
  ) {
    mockComponentProps.RepositoryInfoPanel = props;
    return (
      <div data-testid="repo-panel">
        <span data-testid="repo-count">{props.repositories?.length || 0}</span>
        <button
          data-testid="toggle-repo-list"
          onClick={() =>
            props.setShowRepoList && props.setShowRepoList(!props.showRepoList)
          }
        >
          Toggle Repo List
        </button>
      </div>
    );
  };
});

// Mock ActionButton
jest.mock("@/components/dashboard/ActionButton", () => {
  return function MockActionButton(
    props: import("@/types/testing").MockComponentProps,
  ) {
    mockComponentProps.ActionButton = props;
    return (
      <button data-testid="action-button" disabled={props.loading}>
        {props.loading ? "Loading..." : "Analyze"}
      </button>
    );
  };
});

// Mock SummaryDisplay
jest.mock("@/components/dashboard/SummaryDisplay", () => {
  return function MockSummaryDisplay(
    props: import("@/types/testing").MockComponentProps,
  ) {
    mockComponentProps.SummaryDisplay = props;
    return props.summary ? (
      <div data-testid="summary-display">
        <span data-testid="summary-user">{props.summary.user}</span>
        <span data-testid="activity-mode">{props.activityMode}</span>
      </div>
    ) : null;
  };
});

// Mock DashboardLoadingState
jest.mock("@/components/DashboardLoadingState", () => {
  return function MockDashboardLoadingState() {
    return <div data-testid="loading-state">Loading...</div>;
  };
});

// Mock Header
jest.mock("@/components/dashboard/DashboardHeader", () => {
  return function MockDashboardHeader(
    props: import("@/types/testing").MockComponentProps,
  ) {
    mockComponentProps.DashboardHeader = props;
    return <div data-testid="dashboard-header" />;
  };
});

// Mock fetch for API responses
const mockFetchResponse = (
  response: import("@/types/testing").MockResponseData,
) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(response),
  });
};

describe("Dashboard Integration", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Mock fetch implementation
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes("/api/repos")) {
        return mockFetchResponse({
          repositories: mockRepositories,
          authMethod: "github_app",
          installations: [mockInstallation],
          currentInstallations: [mockInstallation],
        });
      }

      if (url.includes("/api/summary")) {
        return mockFetchResponse(mockSummary);
      }

      return Promise.reject(new Error(`Unhandled route: ${url}`));
    });

    // Clear all mock data between tests
    jest.clearAllMocks();
    mockComponentProps.AuthenticationStatusBanner =
      {} as import("@/types/testing").MockComponentProps;
    mockComponentProps.AccountManagementPanel =
      {} as import("@/types/testing").MockComponentProps;
    mockComponentProps.FilterControls =
      {} as import("@/types/testing").MockComponentProps;
    mockComponentProps.RepositoryInfoPanel =
      {} as import("@/types/testing").MockComponentProps;
    mockComponentProps.ActionButton =
      {} as import("@/types/testing").MockComponentProps;
    mockComponentProps.SummaryDisplay =
      {} as import("@/types/testing").MockComponentProps;
    mockComponentProps.DashboardHeader =
      {} as import("@/types/testing").MockComponentProps;

    // Reset localStorage
    mockLocalStorage.clear();
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
  });

  it("renders loading state initially and then dashboard components", async () => {
    render(<Dashboard />);

    // Should show loading state initially
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();

    // After data loads, should render dashboard components
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
      expect(screen.getByTestId("filter-controls")).toBeInTheDocument();
      expect(screen.getByTestId("repo-panel")).toBeInTheDocument();
      expect(screen.getByTestId("action-button")).toBeInTheDocument();
    });

    // Verify API was called to fetch repos
    expect(global.fetch).toHaveBeenCalledWith("/api/repos");
  });

  it("passes correct props to child components", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-header")).toBeInTheDocument();
    });

    // Verify DashboardHeader received session
    expect(mockComponentProps.DashboardHeader).toBeDefined();
    expect(mockComponentProps.DashboardHeader.session).toEqual(mockSession);

    // Verify FilterControls received correct props
    expect(mockComponentProps.FilterControls).toBeDefined();
    expect(mockComponentProps.FilterControls.activityMode).toBe("my-activity");
    // handleModeChange removed in individual-focused MVP
    expect(
      mockComponentProps.FilterControls.handleDateRangeChange,
    ).toBeDefined();

    // Verify RepositoryInfoPanel received repositories
    expect(mockComponentProps.RepositoryInfoPanel).toBeDefined();
    expect(mockComponentProps.RepositoryInfoPanel.repositories).toEqual(
      mockRepositories,
    );
  });

  /**
   * Note: In the individual-focused MVP, only "my-activity" mode is supported.
   * The "team-activity" mode has been completely removed, so we no longer
   * test for mode changes.
   */

  it("updates state when date range is changed", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("filter-controls")).toBeInTheDocument();
    });

    // Initial date range
    const initialDateRange = mockComponentProps.FilterControls.dateRange;

    // Change date range
    fireEvent.click(screen.getByTestId("change-date-btn"));

    // Verify date range was updated
    await waitFor(() => {
      expect(mockComponentProps.FilterControls.dateRange).not.toEqual(
        initialDateRange,
      );
      expect(mockComponentProps.FilterControls.dateRange).toEqual({
        since: "2025-02-01",
        until: "2025-02-28",
      });
    });
  });

  /**
   * Note: In the individual-focused MVP, organization filtering has been completely
   * removed. Only repository filtering is supported, so we no longer test for
   * organization filter changes.
   */

  it("toggles repository list visibility", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("repo-panel")).toBeInTheDocument();
    });

    // Initial state
    const initialShowRepoList =
      mockComponentProps.RepositoryInfoPanel.showRepoList;

    // Toggle repository list
    fireEvent.click(screen.getByTestId("toggle-repo-list"));

    // Verify showRepoList was toggled
    await waitFor(() => {
      expect(mockComponentProps.RepositoryInfoPanel.showRepoList).toBe(
        !initialShowRepoList,
      );
    });
  });

  it("handles form submission and displays summary", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("action-button")).toBeInTheDocument();
    });

    // Submit form
    fireEvent.click(screen.getByTestId("action-button"));

    // Verify loading state during submission
    await waitFor(() => {
      expect(mockComponentProps.ActionButton.loading).toBe(true);
    });

    // After loading completes, summary should be displayed
    await waitFor(() => {
      expect(mockComponentProps.SummaryDisplay).toBeDefined();
      expect(mockComponentProps.SummaryDisplay.summary).toEqual(mockSummary);
    });

    // Verify form makes API call with correct params
    const lastFetchCall = (global.fetch as jest.Mock).mock.calls.find((call) =>
      call[0].includes("/api/summary"),
    );
    expect(lastFetchCall).toBeDefined();

    // Verify summary is displayed
    expect(screen.getByTestId("summary-display")).toBeInTheDocument();
    expect(screen.getByTestId("summary-user")).toHaveTextContent("Test User");
  });

  // it('should handle API errors when loading repositories', async () => { // SKIP-REASON: Error handling tests have been moved to error-handling.test.tsx for better isolation
  //   // Test code here would simulate API errors during repository loading
  // });

  // it('should handle API errors during summary generation', async () => { // SKIP-REASON: Mocking complex error states causes act() warnings with React 19
  //   // Test code here would simulate API errors during summary generation
  // });
});

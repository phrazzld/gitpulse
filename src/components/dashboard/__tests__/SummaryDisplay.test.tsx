import React from "react";
import { render, screen } from "@testing-library/react";
import SummaryDisplay from "../SummaryDisplay";
import { CommitSummary } from "@/types/summary";

// Mock ActivityFeedPanel component
jest.mock("@/components/dashboard/ActivityFeedPanel", () => ({
  __esModule: true,
  default: ({
    dateRange,
    filters,
    installationIds,
    mode,
    maxItems,
    showRepository,
  }: any) => (
    <div data-testid="activity-feed">
      <div data-testid="activity-feed-props">
        {JSON.stringify({ maxItems, showRepository, mode })}
      </div>
      <div>Activity Feed Mock</div>
    </div>
  ),
}));

// Mock activity fetcher
jest.mock("@/lib/activity", () => ({
  createActivityFetcher: jest.fn().mockImplementation(() => {
    return jest.fn().mockResolvedValue({
      data: [],
      nextCursor: null,
      hasMore: false,
    });
  }),
}));

describe("SummaryDisplay", () => {
  // Mock summary data
  const mockSummary: CommitSummary = {
    user: "testuser",
    commits: [
      {
        sha: "123abc",
        html_url: "https://github.com/org/repo/commit/123abc",
        commit: {
          message: "Test commit",
          author: {
            name: "Test User",
            date: "2023-01-01T12:00:00Z",
          },
        },
      },
    ],
    stats: {
      totalCommits: 42,
      repositories: ["repo1", "repo2", "repo3"],
      dates: ["2023-01-01", "2023-01-02", "2023-01-03"],
    },
    aiSummary: {
      keyThemes: ["Theme 1", "Theme 2"],
      technicalAreas: [
        { name: "Area 1", count: 10 },
        { name: "Area 2", count: 20 },
      ],
      accomplishments: ["Accomplishment 1", "Accomplishment 2"],
      commitsByType: [
        { type: "feature", count: 20, description: "New features" },
        { type: "fix", count: 15, description: "Bug fixes" },
      ],
      timelineHighlights: [
        { date: "2023-01-01", description: "Started project" },
        { date: "2023-01-03", description: "Completed feature" },
      ],
      overallSummary: "Overall summary text",
    },
  };

  const defaultProps = {
    summary: mockSummary,
    activityMode: "my-activity" as const,
    dateRange: { since: "2023-01-01", until: "2023-01-31" },
    activeFilters: { repositories: [] },
    installationIds: [],
  };

  test("renders nothing when summary is null", () => {
    const { container } = render(
      <SummaryDisplay {...defaultProps} summary={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders complete summary with AI insights", () => {
    render(<SummaryDisplay {...defaultProps} />);

    // Header
    expect(screen.getByText(/COMMIT ANALYSIS: TESTUSER/)).toBeInTheDocument();
    expect(screen.getByText("ANALYSIS COMPLETE")).toBeInTheDocument();

    // Metrics
    expect(screen.getByText("METRICS OVERVIEW")).toBeInTheDocument();
    expect(screen.getByText("COMMIT COUNT")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("REPOSITORIES")).toBeInTheDocument();
    // Check for counts using getAllByText for numeric values that might appear multiple times
    const repoCountElements = screen.getAllByText("3");
    expect(repoCountElements.length).toBeGreaterThan(0);
    expect(screen.getByText("ACTIVE DAYS")).toBeInTheDocument();

    // AI Insights
    expect(screen.getByText("IDENTIFIED PATTERNS")).toBeInTheDocument();
    expect(screen.getByText("Theme 1")).toBeInTheDocument();
    expect(screen.getByText("Theme 2")).toBeInTheDocument();

    expect(screen.getByText("TECHNICAL FOCUS AREAS")).toBeInTheDocument();
    expect(screen.getByText("Area 1")).toBeInTheDocument();
    expect(screen.getByText("Area 2")).toBeInTheDocument();

    expect(screen.getByText("KEY ACHIEVEMENTS")).toBeInTheDocument();
    expect(screen.getByText("Accomplishment 1")).toBeInTheDocument();
    expect(screen.getByText("Accomplishment 2")).toBeInTheDocument();

    expect(screen.getByText("COMMIT CLASSIFICATION")).toBeInTheDocument();
    expect(screen.getByText("feature")).toBeInTheDocument();
    expect(screen.getByText("fix")).toBeInTheDocument();

    expect(screen.getByText("TEMPORAL ANALYSIS")).toBeInTheDocument();
    expect(screen.getByText("Started project")).toBeInTheDocument();
    expect(screen.getByText("Completed feature")).toBeInTheDocument();

    expect(screen.getByText("COMPREHENSIVE ANALYSIS")).toBeInTheDocument();
    expect(screen.getByText("Overall summary text")).toBeInTheDocument();

    // Activity Feed
    expect(screen.getByText("COMMIT ACTIVITY")).toBeInTheDocument();
    expect(screen.getByTestId("activity-feed")).toBeInTheDocument();
  });

  test("renders with custom filters", () => {
    render(
      <SummaryDisplay
        {...defaultProps}
        activeFilters={{ repositories: ["repo1", "repo2"] }}
      />,
    );

    // Should still render the summary
    expect(screen.getByText(/COMMIT ANALYSIS: TESTUSER/)).toBeInTheDocument();

    // Activity feed should be configured correctly
    const activityFeedProps = screen.getByTestId("activity-feed-props");
    expect(activityFeedProps.textContent).toContain('"showRepository":true');
  });

  test("renders with installation IDs", () => {
    render(<SummaryDisplay {...defaultProps} installationIds={[123, 456]} />);

    // Should still render the summary
    expect(screen.getByText(/COMMIT ANALYSIS: TESTUSER/)).toBeInTheDocument();
  });
});
